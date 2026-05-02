
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Initialize Supabase Admin client
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
        // 1. Authenticate the Caller (Admin)
        const headersList = await headers()
        const authHeader = headersList.get('Authorization')

        if (!authHeader) {
            return NextResponse.json(
                { detail: 'Unauthorized: Missing Authorization header' },
                { status: 401 }
            )
        }

        const supabaseCaller = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const token = authHeader.replace('Bearer ', '')
        const { data: { user: caller }, error: userError } = await supabaseCaller.auth.getUser(token)

        if (userError || !caller) {
            return NextResponse.json(
                { detail: 'Unauthorized: Invalid token' },
                { status: 401 }
            )
        }

        // Verify the caller is an Admin and get their company_id
        const { data: adminProfile, error: adminError } = await supabaseAdmin
            .from('admins')
            .select('admin_id')
            .eq('admin_id', caller.id)
            .single()

        if (adminError || !adminProfile) {
            return NextResponse.json(
                { detail: 'Forbidden: Only authenticated admins can perform this action' },
                { status: 403 }
            )
        }

        // Fetch company_id for this admin
        const { data: companyData, error: companyError } = await supabaseAdmin
            .from('companies')
            .select('company_id')
            .eq('admin_id', caller.id)
            .single()

        const managerCompanyId = companyData?.company_id || null

        // 2. Parse & Validate Input
        const body = await request.json()
        const {
            email,
            password,
            full_name,
            employee_code,
            phone_number,
            department_id,
            status
        } = body

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email || !emailRegex.test(email)) {
            return NextResponse.json({ detail: 'Invalid email address' }, { status: 400 })
        }

        // Full Name Validation
        if (!full_name || full_name.trim().length < 2) {
            return NextResponse.json({ detail: 'Full name must be at least 2 characters' }, { status: 400 })
        }

        // Password Validation
        // Min 8 chars, at least 1 letter and 1 number
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/
        if (!password || !passwordRegex.test(password)) {
            return NextResponse.json({ detail: 'Password must be at least 8 characters and contain both letters and numbers' }, { status: 400 })
        }

        // 3. Create Manager in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: full_name,
                role: 'manager'
            }
        })

        if (authError) {
            return NextResponse.json({ detail: authError.message }, { status: 400 })
        }

        const managerId = authData.user?.id

        if (!managerId) {
            return NextResponse.json({ detail: 'Failed to retrieve Manager ID' }, { status: 500 })
        }

        // 4. Create Profile in public.managers
        const { error: dbError } = await supabaseAdmin
            .from('managers')
            .insert({
                manager_id: managerId,
                manager_admin_id: caller.id, // Link to the admin who created this manager
                manager_company_id: managerCompanyId, // Link to company
                full_name: full_name,
                email: email,
                password_hash: 'legacy_auth_handled_by_supabase', // Required field
                phone_number: phone_number || null,
                manager_department_id: department_id || null, // Note the different field name from users table
                role_id: 5, // Manager role ID
            })

        if (dbError) {
            console.error('Database insert error:', dbError)
            await supabaseAdmin.auth.admin.deleteUser(managerId)
            return NextResponse.json({ detail: `Database error: ${dbError.message}` }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            message: 'Manager created successfully',
            manager: {
                id: managerId,
                email: email,
                full_name: full_name,
                role: 'manager'
            }
        })

    } catch (error: any) {
        return NextResponse.json({ detail: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
