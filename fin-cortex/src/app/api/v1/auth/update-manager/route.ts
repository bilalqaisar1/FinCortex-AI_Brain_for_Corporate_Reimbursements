
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

export async function PATCH(request: Request) {
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

        // Verify the caller is an Admin
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

        // 2. Parse & Validate Input
        const body = await request.json()
        const {
            manager_id,
            full_name,
            phone_number,
            department_id,
            status
        } = body

        if (!manager_id) {
            return NextResponse.json({ detail: 'Manager ID is required' }, { status: 400 })
        }

        // 3. Update Manager Profile in public.managers
        const updateData: any = {}
        if (full_name !== undefined) updateData.full_name = full_name
        if (phone_number !== undefined) updateData.phone_number = phone_number
        if (department_id !== undefined) updateData.manager_department_id = department_id
        if (status !== undefined) updateData.status = status

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ detail: 'No update data provided' }, { status: 400 })
        }

        const { data: updatedRows, error: dbError } = await supabaseAdmin
            .from('managers')
            .update(updateData)
            .eq('manager_id', manager_id)
            .eq('manager_admin_id', caller.id) // Ensure admin owns this manager record
            .select()

        if (dbError) {
            console.error('Database update error:', dbError)
            return NextResponse.json({ detail: `Database error: ${dbError.message}` }, { status: 400 })
        }

        if (!updatedRows || updatedRows.length === 0) {
            console.error('No rows updated — manager_id or admin ownership mismatch', { manager_id, admin_id: caller.id })
            return NextResponse.json({ detail: 'Manager not found or you do not have permission to update this manager' }, { status: 404 })
        }

        console.log(`✅ Manager updated: ${manager_id}`, updateData)

        // 4. Update Auth Metadata if full name changed
        if (full_name) {
            await supabaseAdmin.auth.admin.updateUserById(manager_id, {
                user_metadata: { full_name: full_name }
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Manager updated successfully'
        })

    } catch (error: any) {
        return NextResponse.json({ detail: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
