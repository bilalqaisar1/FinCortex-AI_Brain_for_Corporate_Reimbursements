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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { data, error } = await supabaseAdmin
            .from("company_budgets")
            .select("*, companies(company_name)")
            .eq("budget_id", id)
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ detail: "Budget not found" }, { status: 404 });

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { total_amount, monthly_limit, admin_id } = body;

        // Verify ownership
        if (!admin_id) {
            return NextResponse.json({ detail: "admin_id is required" }, { status: 400 });
        }

        const { data: budget, error: fetchError } = await supabaseAdmin
            .from("company_budgets")
            .select("company_id, total_balance")
            .eq("budget_id", id)
            .single();

        if (fetchError || !budget) return NextResponse.json({ detail: "Budget not found" }, { status: 404 });

        const { data: company } = await supabaseAdmin
            .from("companies")
            .select("company_id, account_balance")
            .eq("admin_id", admin_id)
            .maybeSingle();

        if (!company || company.company_id !== budget.company_id) {
            return NextResponse.json({ detail: "Forbidden: Budget does not belong to your organization" }, { status: 403 });
        }

        const oldTotal = budget.total_balance || 0;
        const currentBalance = company.account_balance || 0;

        const updateData: any = {
            last_updated: new Date().toISOString()
        };

        if (total_amount !== undefined) {
            // Handle balance adjustment
            const diff = total_amount - oldTotal;
            if (diff > 0) {
                // Increase: deduct from company balance
                if (currentBalance < diff) {
                    return NextResponse.json({
                        detail: `Insufficient company balance to increase budget. Need PKR ${diff.toLocaleString()}, have PKR ${currentBalance.toLocaleString()}`
                    }, { status: 400 });
                }
                await supabaseAdmin
                    .from("companies")
                    .update({ account_balance: currentBalance - diff })
                    .eq("company_id", company.company_id);
            } else if (diff < 0) {
                // Decrease: refund to company balance
                await supabaseAdmin
                    .from("companies")
                    .update({ account_balance: currentBalance + Math.abs(diff) })
                    .eq("company_id", company.company_id);
            }
            updateData.total_balance = total_amount;
        }

        if (monthly_limit !== undefined) updateData.monthly_limit = monthly_limit;

        const { data, error } = await supabaseAdmin
            .from("company_budgets")
            .update(updateData)
            .eq("budget_id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Budget updated and company balance adjusted",
            data
        });
    } catch (error: any) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const adminId = searchParams.get("admin_id");

        if (!adminId) {
            return NextResponse.json({ detail: "admin_id is required" }, { status: 400 });
        }

        // Verify ownership
        const { data: budget, error: fetchError } = await supabaseAdmin
            .from("company_budgets")
            .select("company_id, total_balance")
            .eq("budget_id", id)
            .single();

        if (fetchError || !budget) return NextResponse.json({ detail: "Budget not found" }, { status: 404 });

        const { data: company } = await supabaseAdmin
            .from("companies")
            .select("company_id, account_balance")
            .eq("admin_id", adminId)
            .maybeSingle();

        if (!company || company.company_id !== budget.company_id) {
            return NextResponse.json({ detail: "Forbidden: Budget does not belong to your organization" }, { status: 403 });
        }

        // 1. Refund the remaining budget amount to company account
        const refundAmount = budget.total_balance || 0;
        if (refundAmount > 0) {
            await supabaseAdmin
                .from("companies")
                .update({ account_balance: (company.account_balance || 0) + refundAmount })
                .eq("company_id", company.company_id);
        }

        // 2. Delete the budget
        const { error } = await supabaseAdmin
            .from("company_budgets")
            .delete()
            .eq("budget_id", id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: `Budget deleted and PKR ${refundAmount.toLocaleString()} refunded to company balance.`
        });
    } catch (error: any) {
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
