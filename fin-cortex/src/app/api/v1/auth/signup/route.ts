export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, full_name, phone_number, company_name } = body || {}

    if (!email || !password || !full_name || !company_name) {
      return NextResponse.json({ detail: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone_number: phone_number || null,
        role: 'admin', // Force admin role for public signup
      },
    })

    if (error) {
      console.error('Signup error:', error.message);
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
        await supabaseAdmin.auth.admin.deleteUser(userId)
        return NextResponse.json({ detail: `Database error: ${dbError.message}` }, { status: 400 })
      } else {
        // Create a default company for this admin
        const { error: companyError } = await supabaseAdmin
          .from('companies')
          .insert({
            admin_id: userId,
            company_name: company_name,
          })

        if (companyError) {
          console.error('Failed to create company for admin:', companyError)
        }
      }
    }

    return NextResponse.json({
      message: 'Admin account created successfully.',
      user_id: userId
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err?.message || 'Unexpected error' }, { status: 500 })
  }
}


