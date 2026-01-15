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
          role: 'admin', // Force admin role for public signup
        },
      },
    })

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 })
    }

    const userId = data.user?.id
    if (userId) {
      // Insert into admins table
      const { error: dbError } = await supabaseAdmin
        .from('admins')
        .insert({
          admin_id: userId,
          full_name,
          email,
          password_hash: 'legacy_auth_handled_by_supabase', // Required field in schema
          phone_number: phone_number || null,
          role_id: 1, // Admin role ID
        })

      if (dbError) {
        console.error('Failed to create admin profile:', dbError)
      } else {
        // Create a default company for this admin
        const { error: companyError } = await supabaseAdmin
          .from('companies')
          .insert({
            admin_id: userId,
            company_name: `${full_name}'s Organization`,
          })

        if (companyError) {
          console.error('Failed to create company for admin:', companyError)
        }
      }
    }

    return NextResponse.json({
      message: 'Admin signup initiated. Check your email for the verification code.',
      user_id: userId
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || 'Unexpected error' }, { status: 500 })
  }
}


