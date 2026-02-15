import { NextRequest, NextResponse } from 'next/server';

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, user_id, conversation_id } = body;

        if (!message || !user_id) {
            return NextResponse.json(
                { error: 'Missing required fields: message, user_id' },
                { status: 400 }
            );
        }

        // Get the authorization token from the request headers
        const authHeader = request.headers.get('authorization') || '';

        const response = await fetch(`${MCP_SERVER_URL}/api/v1/rag/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify({
                user_id,
                message,
                conversation_id: conversation_id || 'default',
                token: authHeader.replace('Bearer ', ''),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('MCP Server error:', errorText);
            return NextResponse.json(
                {
                    response: "I'm having trouble connecting to the AI service. Please try again in a moment.",
                    conversation_id: conversation_id || 'default',
                    sources: [],
                },
                { status: 200 } // Return 200 so the chat UI handles it gracefully
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Assistant chat proxy error:', error);
        return NextResponse.json(
            {
                response: "I'm experiencing connectivity issues. Please try again shortly.",
                conversation_id: 'default',
                sources: [],
            },
            { status: 200 }
        );
    }
}
