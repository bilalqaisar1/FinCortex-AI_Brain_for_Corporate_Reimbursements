
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
        // 1. Authenticate the Manager
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

        // Verify Manager Role
        const { data: managerProfile, error: managerError } = await supabaseAdmin
            .from('managers')
            .select('manager_id')
            .eq('manager_id', caller.id)
            .single()

        if (managerError || !managerProfile) {
            return NextResponse.json(
                { detail: 'Forbidden: Only managers can perform this action' },
                { status: 403 }
            )
        }

        // 2. Parse Input
        const body = await request.json()
        const { user_id, status } = body

        if (!user_id || !status) {
            return NextResponse.json(
                { detail: 'Missing required fields: user_id, status' },
                { status: 400 }
            )
        }

        const validStatuses = ['active', 'inactive', 'suspended']
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { detail: 'Invalid status. Must be: active, inactive, or suspended' },
                { status: 400 }
            )
        }

        // 3. Update User Status in Database
        // Ensure the user belongs to this manager? 
        // Strict security: yes.
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({ status: status })
            .eq('user_id', user_id)
            .eq('manager_id', caller.id) // Security Check: Must belong to caller
            .select()

        if (updateError) {
            return NextResponse.json(
                { detail: `Update failed: ${updateError.message}` },
                { status: 500 }
            )
        }

        // Also update Supabase Auth user if "banning" logic is needed (optional)
        // e.g., using admin.updateUserById({ ban_duration: ... })
        // For now, database status sync is enough as per request.

        return NextResponse.json({
            success: true,
            message: 'User status updated successfully',
            data: { user_id, status }
        })

    } catch (error: any) {
        console.error('Update status error:', error)
        return NextResponse.json(
            { detail: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
