export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { syncUserProfile } from '@/app/api/v1/auth/_utils/syncUserProfile'

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
      try {
        await syncUserProfile(userId, {
          email,
          phone_number: (authedUser.user_metadata?.phone_number as string) || null,
        })
      } catch (syncError) {
        console.error('Failed to sync user profile after OTP verification', syncError)
      }
    }

    return NextResponse.json({ message: 'OTP verified', user: data?.user || null, access_token: data?.session?.access_token || null })
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || 'Unexpected error' }, { status: 500 })
  }
}


