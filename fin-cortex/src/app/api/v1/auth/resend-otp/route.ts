export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body || {}

    if (!email) {
      return NextResponse.json({ detail: 'Missing email' }, { status: 400 })
    }

    // Resend OTP via admin: generate a new email OTP for the user
    const { error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email,
    })

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'OTP resent' })
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || 'Unexpected error' }, { status: 500 })
  }
}


