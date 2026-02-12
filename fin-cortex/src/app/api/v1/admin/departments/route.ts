
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
