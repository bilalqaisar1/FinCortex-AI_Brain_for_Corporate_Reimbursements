
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('user_id')

        if (!userId) {
            return NextResponse.json({ detail: 'Missing user_id parameter' }, { status: 400 })
        }

        console.log(`📡 [API] Fetching notifications for user: ${userId}`);

        const { data, error } = await supabaseAdmin
            .from('in_app_notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error(`❌ [API] database error fetching notifications for ${userId}:`, error);
            return NextResponse.json({ detail: 'Database error fetching notifications', code: error.code }, { status: 500 })
        }

        return NextResponse.json(data || [])
    } catch (error: any) {
        console.error('❌ [API] Unexpected error in notifications route:', error.message);
        return NextResponse.json({ detail: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

// Support marking as read via POST
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action, notification_id, user_id } = body

        if (action === 'mark_read') {
            const { error } = await supabaseAdmin
                .from('in_app_notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('notification_id', notification_id)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'mark_all_read') {
            const { error } = await supabaseAdmin
                .from('in_app_notifications')
                .update({ is_read: true, read_at: new Date().toISOString() })
                .eq('user_id', user_id)
                .eq('is_read', false)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ detail: 'Invalid action' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ detail: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
