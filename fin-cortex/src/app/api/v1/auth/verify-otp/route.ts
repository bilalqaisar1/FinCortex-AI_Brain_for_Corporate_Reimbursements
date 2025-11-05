export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, token } = body || {}

    if (!email || !token) {
      return NextResponse.json({ detail: 'Missing required fields' }, { status: 400 })
    }

    // Verify OTP
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 })
    }

    // After successful verification, create user profile if not exists
    const authedUser = data?.user
    const userId = authedUser?.id

    if (userId) {
      // Check if profile exists
      const { data: existingUser, error: existingErr } = await supabaseAdmin
        .from('users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!existingErr && !existingUser) {
        const full_name = (authedUser.user_metadata?.full_name as string) || null
        const employee_code = (authedUser.user_metadata?.employee_code as string) || null
        const phone_number = (authedUser.user_metadata?.phone_number as string) || null

        // Only insert when we have required fields captured during signup
        if (full_name && employee_code) {
          await supabaseAdmin
            .from('users')
            .insert({
              user_id: userId,
              email,
              full_name,
              employee_code,
              phone_number,
              status: 'active',
            })
        }
      }
    }

    return NextResponse.json({ message: 'OTP verified', user: data?.user || null, access_token: data?.session?.access_token || null })
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || 'Unexpected error' }, { status: 500 })
  }
}


