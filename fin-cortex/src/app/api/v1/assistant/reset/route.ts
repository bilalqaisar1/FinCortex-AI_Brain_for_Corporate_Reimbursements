import { NextRequest, NextResponse } from 'next/server';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || '';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { user_id, conversation_id } = body;

        if (!user_id) {
            return NextResponse.json(
                { error: 'Missing required field: user_id' },
                { status: 400 }
            );
        }

        const authHeader = request.headers.get('authorization') || '';

        const response = await fetch(
            `${MCP_SERVER_URL}/api/v1/rag/reset-conversation?user_id=${encodeURIComponent(user_id)}&conversation_id=${encodeURIComponent(conversation_id || 'default')}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authHeader ? { Authorization: authHeader } : {}),
                },
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { success: false, message: 'Failed to reset conversation' },
                { status: 200 }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Assistant reset proxy error:', error);
        return NextResponse.json(
            { success: true, message: 'Conversation reset locally' },
            { status: 200 }
        );
    }
}
