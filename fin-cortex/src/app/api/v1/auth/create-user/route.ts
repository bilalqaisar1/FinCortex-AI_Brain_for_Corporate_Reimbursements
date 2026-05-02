
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Initialize Supabase Admin client for privileged operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(request: Request) {
    try {
        // 1. Authenticate the Caller (Manager)
        const headersList = await headers()
        const authHeader = headersList.get('Authorization')

        if (!authHeader) {
            return NextResponse.json(
                { detail: 'Unauthorized: Missing Authorization header' },
                { status: 401 }
            )
        }

        // Create a temporary client to verify the caller's session
        const supabaseCaller = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        // Get the user from the token
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: caller }, error: userError } = await supabaseCaller.auth.getUser(token)

        if (userError || !caller) {
            return NextResponse.json(
                { detail: 'Unauthorized: Invalid token' },
                { status: 401 }
            )
        }

        // Verify the caller is a Manager
        // We use supabaseAdmin to query the 'managers' table with the caller ID
        const { data: managerProfile, error: managerError } = await supabaseAdmin
            .from('managers')
            .select('manager_id, manager_company_id, manager_admin_id')
            .eq('manager_id', caller.id) // Assuming manager_id maps to auth user id
            .single()

        const managerCompanyId = managerProfile?.manager_company_id || null
        const managerAdminId = managerProfile?.manager_admin_id || null

        if (managerError || !managerProfile) {
            return NextResponse.json(
                { detail: 'Forbidden: Only authenticated managers can perform this action' },
                { status: 403 }
            )
        }

        // 2. Parse & Validate Input
        const body = await request.json()
        const {
            email,
            password,
            full_name,
            employee_code,
            phone_number,
            department_id,
            user_reimbursment_limit,
            role_id,
            manager_id,
            status
        } = body

        // --- VALIDATION START ---

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email || !emailRegex.test(email) || email.length > 255) {
            return NextResponse.json({ detail: 'Invalid email address' }, { status: 400 })
        }

        // Password Validation
        // Min 8 chars, at least 1 letter and 1 number
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/
        if (!password || !passwordRegex.test(password)) {
            return NextResponse.json({ detail: 'Password must be at least 8 characters and contain both letters and numbers' }, { status: 400 })
        }

        // Full Name Validation
        if (!full_name || full_name.trim().length < 2 || full_name.length > 255) {
            return NextResponse.json({ detail: 'Full name must be between 2 and 255 characters' }, { status: 400 })
        }
        // Basic sanitization (remove potential script tags)
        const sanitizedFullName = full_name.trim().replace(/[<>]/g, '')

        // Employee Code Validation (Alphanumeric + hyphens, 3-50 chars)
        const employeeCodeRegex = /^[a-zA-Z0-9-]{3,50}$/
        if (!employee_code || !employeeCodeRegex.test(employee_code)) {
            return NextResponse.json({ detail: 'Employee code must be 3-50 alphanumeric characters' }, { status: 400 })
        }

        // Reimbursement Limit Validation
        const parsedLimit = parseFloat(user_reimbursment_limit)
        if (isNaN(parsedLimit) || parsedLimit < 0) {
            return NextResponse.json({ detail: 'Reimbursement limit must be a valid positive number' }, { status: 400 })
        }

        // Role Validation: Manager can ONLY create 'User' (Employee)
        // Verify 'User' role ID matches the input
        const { data: userRoleData, error: roleError } = await supabaseAdmin
            .from('roles')
            .select('role_id')
            .ilike('role_name', 'user')
            .single()

        const targetRoleId = userRoleData?.role_id

        if (!targetRoleId) {
            console.error('Configuration Error: "User" role not found for validation')
            // Proceed with caution or fail? Better to fail safe.
            return NextResponse.json({ detail: 'System configuration error: User role definition missing' }, { status: 500 })
        }

        // Check if role_id is provided and valid, or force it
        // We will strictly FORCE the role to be the User role, ignoring whatever ID might have been sent if it differs
        // Or we can validte. Validation is better feedback.
        if (role_id && parseInt(role_id) !== targetRoleId) {
            return NextResponse.json({ detail: 'Forbidden: Managers can only create "User" (Employee) accounts' }, { status: 403 })
        }
        const finalRoleId = targetRoleId

        // Manager ID Validation
        // Ensure the manager_id passed matches the authenticated caller
        if (manager_id && manager_id !== caller.id) {
            return NextResponse.json({ detail: 'Forbidden: You cannot create users for other managers' }, { status: 403 })
        }
        const finalManagerId = caller.id

        // --- VALIDATION END ---

        // 3. Create User in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto-confirm for manager-created users
            user_metadata: {
                full_name: sanitizedFullName,
                role: 'user'
            }
        })

        if (authError) {
            console.error('Auth creation error:', authError)
            return NextResponse.json(
                { detail: authError.message },
                { status: 400 }
            )
        }

        const userId = authData.user?.id

        if (!userId) {
            return NextResponse.json(
                { detail: 'Failed to retrieve User ID after creation' },
                { status: 500 }
            )
        }

        // 4. Create Profile in public.users
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .insert({
                user_id: userId,
                manager_id: finalManagerId,
                // admin_id is a self-referencing FK to users(user_id).
                // The manager's admin_id may not exist in the users table,
                // so we leave it null to avoid FK constraint violations.
                admin_id: null,
                department_id: department_id || null,
                full_name: sanitizedFullName,
                employee_code: employee_code,
                email: email,
                password_hash: 'managed_by_auth',
                phone_number: phone_number || null,
                user_reimbursment_limit: parsedLimit,
                role_id: finalRoleId,
                status: status || 'active'
            })

        if (dbError) {
            console.error('Database insert error:', dbError)
            // Rollback: Delete the auth user if DB insert fails
            await supabaseAdmin.auth.admin.deleteUser(userId)

            return NextResponse.json(
                { detail: `Database error: ${dbError.message}` },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            user: {
                id: userId,
                email: email,
                full_name: sanitizedFullName,
                role: 'user'
            }
        })

    } catch (error: any) {
        console.error('Create user error:', error)
        return NextResponse.json(
            { detail: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
