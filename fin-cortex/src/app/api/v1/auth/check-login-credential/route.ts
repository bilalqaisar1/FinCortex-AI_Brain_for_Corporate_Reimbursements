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

        // Check if password verification failed
        if (!data.password) {
            console.log(`🔐 [Check Credentials] RPC hash check failed for ${email}. Trying Supabase Auth fallback...`);

            // Fallback: Attempt standard Supabase Auth sign-in
            // This handles users created via Auth Admin API who don't have hashes in the custom table
            const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
                email,
                password
            });

            if (authError || !authData.user) {
                console.error(`❌ [Check Credentials] Both RPC and Auth fallback failed for ${email}:`, authError?.message);
                return NextResponse.json(
                    { detail: 'Invalid credentials' },
                    { status: 401 }
                )
            }

            console.log(`✅ [Check Credentials] Auth fallback successful for: ${email}`);

            // If it's a 'user' role, we still might need to check the employee code
            // But we already have the role from the initial RPC check (which finds the user even if password check fails)
            if (data.role === 'user' && employee_code) {
                // The logic in LoginPage handles the employee_code check based on RPC response
                // We just return the Auth success data
            }

            return NextResponse.json({
                success: true,
                data: {
                    useruuid: authData.user.id,
                    role: data.role, // Use role found by RPC
                    name: authData.user.user_metadata?.full_name || data.name,
                    password: true, // Mark as verified
                    employee_code: data.employee_code // Use employee_code status from RPC
                }
            })
        }

        console.log(`✅ [Check Credentials] Successful RPC login for: ${email}`);

        // Return the RPC response
        return NextResponse.json({
            success: true,
            data: {
                useruuid: data.useruuid || null,
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

