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
      // Ensure the 'admin' role exists in the roles table
      let roleId: number | null = null;
      try {
        // Try to find existing admin role
        const { data: existingRole } = await supabaseAdmin
          .from('roles')
          .select('role_id')
          .eq('role_name', 'admin')
          .maybeSingle();

        if (existingRole) {
          roleId = existingRole.role_id;
        } else {
          // Create the admin role if it doesn't exist
          const { data: newRole } = await supabaseAdmin
            .from('roles')
            .insert({ role_name: 'admin' })
            .select('role_id')
            .single();
          roleId = newRole?.role_id || null;

          // Also seed 'manager' and 'user' roles so the rest of the app works
          const existingRoles = await supabaseAdmin
            .from('roles')
            .select('role_name');
          const existingNames = new Set((existingRoles.data || []).map((r: any) => r.role_name));
          const toSeed = ['manager', 'user'].filter(r => !existingNames.has(r));
          if (toSeed.length > 0) {
            await supabaseAdmin
              .from('roles')
              .insert(toSeed.map(r => ({ role_name: r })));
          }
        }
      } catch (roleErr) {
        console.warn('Could not resolve/create admin role, proceeding without role_id:', roleErr);
      }

      // Insert into admins table
      const adminInsert: Record<string, any> = {
        admin_id: userId,
        full_name,
        email,
        password_hash: 'legacy_auth_handled_by_supabase', // Required field in schema
        phone_number: phone_number || null,
      };
      if (roleId) {
        adminInsert.role_id = roleId;
      }

      const { error: dbError } = await supabaseAdmin
        .from('admins')
        .insert(adminInsert)

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


