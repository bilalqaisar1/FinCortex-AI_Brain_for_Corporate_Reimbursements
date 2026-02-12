import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase Admin Client
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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { admin_id, amount } = body;

        if (!admin_id || !amount || amount <= 0) {
            return NextResponse.json({ detail: "Admin ID and a valid positive amount are required" }, { status: 400 });
        }

        // 1. Resolve Company
        const { data: company, error: compError } = await supabaseAdmin
            .from("companies")
            .select("company_id, account_balance")
            .eq("admin_id", admin_id)
            .maybeSingle();

        if (compError || !company) {
            console.error("Error resolving company for top-up:", compError);
            return NextResponse.json({ detail: "Company not found for this admin" }, { status: 404 });
        }

        const companyId = company.company_id;
        const currentBalance = company.account_balance || 0;

        // 2. Update balance
        const newBalance = currentBalance + amount;
        const { data: updatedCompany, error: updateError } = await supabaseAdmin
            .from("companies")
            .update({ account_balance: newBalance })
            .eq("company_id", companyId)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({
            success: true,
            message: `Successfully topped up PKR ${amount.toLocaleString()}. New balance: PKR ${newBalance.toLocaleString()}`,
            data: { account_balance: newBalance }
        });

    } catch (error: any) {
        console.error("Error topping up company balance:", error);
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
