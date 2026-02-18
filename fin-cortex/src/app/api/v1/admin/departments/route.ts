
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

export async function GET() {
    try {
        const { data, error } = await supabaseAdmin
            .from("departments")
            .select("*")
            .order("department_id");

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data || []
        });
    } catch (error: any) {
        console.error("Error fetching departments:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { department_name } = body;

        if (!department_name || !department_name.trim()) {
            return NextResponse.json(
                { success: false, error: "Department name is required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from("departments")
            .insert({ department_name: department_name.trim() })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error: any) {
        console.error("Error creating department:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

