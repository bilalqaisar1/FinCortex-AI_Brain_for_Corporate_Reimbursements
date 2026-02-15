export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { syncUserProfile } from '@/app/api/v1/auth/_utils/syncUserProfile'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      user_id,
      email,
      full_name,
      employee_code,
      phone_number,
      department_id,
      manager_id,
      role_id,
    } = body || {}

    console.log('📥 Fetch User Profile Request Received:', {
      user_id,
    })

    if (!user_id) {
      console.error('❌ Validation Error: user_id is required')
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }

    // Read-only: Fetch user profile from database (no insert/update)
    const profile = await syncUserProfile(user_id)

    // Determine which table the profile came from by checking which ID field exists as Primary Key
    let userTable = 'users'
    if ('user_id' in profile && (profile as any).user_id) {
      userTable = 'users'
    } else if ('manager_id' in profile && (profile as any).manager_id) {
      userTable = 'managers'
    } else if ('admin_id' in profile) {
      userTable = 'admins'
    }

    const profileRoleId = profile.role_id || null

    // Prepare parallel fetches for related data
    const fetchRole = async () => {
      if (!profileRoleId) return null;
      try {
        const { data, error } = await supabaseAdmin
          .from('roles')
          .select('role_id, role_name, description')
          .eq('role_id', profileRoleId)
          .single();
        return !error ? data : null;
      } catch (e) {
        console.warn('⚠️ Could not fetch role information:', e);
        return null;
      }
    };

    const fetchDepartment = async () => {
      let depId = null;
      if (userTable === 'users' && (profile as any).department_id) {
        depId = (profile as any).department_id;
      } else if (userTable === 'managers' && (profile as any).manager_department_id) {
        depId = (profile as any).manager_department_id;
      }

      if (!depId) return null;

      try {
        const { data, error } = await supabaseAdmin
          .from('departments')
          .select('department_id, department_name')
          .eq('department_id', depId)
          .single();
        return !error ? data : null;
      } catch (e) {
        console.warn('⚠️ Could not fetch department information:', e);
        return null;
      }
    };

    const fetchManager = async () => {
      if (!(profile as any).manager_id) return null;
      try {
        const { data, error } = await supabaseAdmin
          .from('managers')
          .select('manager_id, manager_admin_id, full_name, email')
          .eq('manager_id', (profile as any).manager_id)
          .single();
        return !error ? data : null;
      } catch (e) {
        console.warn('⚠️ Could not fetch manager information:', e);
        return null;
      }
    };

    // Execute fetches in parallel
    const [roleInfo, departmentInfo, managerInfo] = await Promise.all([
      fetchRole(),
      fetchDepartment(),
      fetchManager()
    ]);

    // Determine userRole based on profile data
    let userRole: 'admin' | 'manager' | 'user' | null = null
    if (roleInfo?.role_name) {
      const roleName = roleInfo.role_name.toLowerCase()
      if (roleName === 'admin' || roleName.includes('admin')) {
        userRole = 'admin'
      } else if (roleName === 'manager' || roleName.includes('manager')) {
        userRole = 'manager'
      } else {
        userRole = 'user'
      }
    } else if (profileRoleId) {
      // Fallback: determine from role_id directly
      if (profileRoleId === 1) {
        userRole = 'admin'
      } else if (profileRoleId === 2) {
        userRole = 'manager'
      } else if (profileRoleId === 3) {
        userRole = 'user'
      }
    }

    // Get user ID based on table
    const userId = (profile as any).admin_id || (profile as any).manager_id || (profile as any).user_id || null;

    // Get admin_id - for users, get from manager; for managers, get from profile; for admins, it's their own ID
    let adminId: string | null = null
    if (userTable === 'users') {
      // For users, admin_id comes from their manager (via syncUserProfile or fresh fetch)
      adminId = managerInfo?.manager_admin_id || (profile as any).admin_id || null
    } else if (userTable === 'managers') {
      // For managers, admin_id is in their profile as 'manager_admin_id'
      adminId = (profile as any).manager_admin_id || (profile as any).admin_id || null
    } else if (userTable === 'admins') {
      // For admins, their admin_id is their own ID (primary key is admin_id)
      adminId = (profile as any).admin_id || null
    }

    // Log complete profile information
    const profileLog = {
      '👤 User Profile Data': {
        user_id: userId,
        email: profile.email,
        full_name: profile.full_name,
        employee_code: (profile as any).employee_code || null,
        phone_number: profile.phone_number,
        status: (profile as any).status || null,
        created_at: (profile as any).created_at || null,
        updated_at: (profile as any).updated_at || null,
      },
      '🎭 Role Assignment': {
        source_table: userTable,
        role_id: profileRoleId || null,
        role_name: roleInfo?.role_name || 'Not assigned',
        role_description: roleInfo?.description || 'N/A',
        determined_userRole: userRole || 'Not determined',
      },
      '🏢 Department': {
        department_id: (profile as any).department_id || 'Not assigned',
        department_name: departmentInfo?.department_name || 'N/A',
      },
      '👔 Manager': {
        manager_id: (profile as any).manager_id || 'Not assigned',
        manager_name: managerInfo?.full_name || 'N/A',
        manager_email: managerInfo?.email || 'N/A',
      },
      '👑 Admin': {
        admin_id: adminId || 'Not assigned',
      },
    }

    console.log('✅ User Profile Fetched Successfully:')
    console.log(JSON.stringify(profileLog, null, 2))

    return NextResponse.json({
      message: 'User profile fetched',
      profile: {
        ...profile,
        roles: roleInfo,
        departments: departmentInfo,
        manager: managerInfo,
        admin_id: adminId,
        userRole,
      },
    })
  } catch (error: any) {
    console.error('❌ Fetch user profile error:', error)
    console.error('Error stack:', error?.stack)
    return NextResponse.json(
      { detail: error?.message || 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}
