export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password, employee_code } = body || {}

        if (!email || !password) {
            return NextResponse.json(
                { detail: 'Email and password are required' },
                { status: 400 }
            )
        }

        console.log(`🔐 [Check Credentials] Verifying user: ${email}`);

        // Call the RPC function to check credentials
        const { data, error } = await supabaseAdmin.rpc('check_user_credentials', {
            p_email: email,
            p_password: password,
            p_employee_code: employee_code || null
        })

        console.log('📊 [Check Credentials] RPC Output:', JSON.stringify(data, null, 2));

        if (error) {
            console.error('RPC error:', error)
            return NextResponse.json(
                { detail: 'Failed to verify credentials', error: error.message },
                { status: 500 }
            )
        }

        // Return the RPC response
        // Response format: { id: boolean, role: string|null, name: string|null, password: boolean, employee_code?: boolean }
        return NextResponse.json({
            success: true,
            data: {
                id: data.id,
                role: data.role,
                name: data.name,
                password: data.password,
                employee_code: data.employee_code
            }
        })
    } catch (error: any) {
        console.error('Check login credential error:', error)
        return NextResponse.json(
            { detail: error?.message || 'Failed to check credentials' },
            { status: 500 }
        )
    }
}
