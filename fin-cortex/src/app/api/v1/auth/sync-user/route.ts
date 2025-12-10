export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { syncUserProfile } from '@/app/api/v1/auth/_utils/syncUserProfile'

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

    if (!user_id) {
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }

    const profile = await syncUserProfile(user_id, {
      email,
      full_name,
      employee_code,
      phone_number,
      department_id,
      manager_id,
      role_id,
    })

    return NextResponse.json({ message: 'User profile synced', profile })
  } catch (error: any) {
    console.error('Sync user profile error:', error)
    return NextResponse.json(
      { detail: error?.message || 'Failed to sync user profile' },
      { status: 500 }
    )
  }
}


