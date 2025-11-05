export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, full_name, employee_code, phone_number } = body || {}

    if (!email || !password || !full_name || !employee_code) {
      return NextResponse.json({ detail: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          employee_code,
          phone_number: phone_number || null,
        },
        // For email OTP flows, your Supabase project should be configured to send OTP for signup
        // emailRedirectTo can be added if using magic links instead of OTP
      },
    })

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Signup initiated. Check your email for the verification code.', user_id: data.user?.id || null })
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || 'Unexpected error' }, { status: 500 })
  }
}


