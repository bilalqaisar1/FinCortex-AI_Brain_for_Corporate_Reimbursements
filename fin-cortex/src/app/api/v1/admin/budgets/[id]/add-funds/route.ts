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

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { amount } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ detail: "Valid amount is required" }, { status: 400 });
        }

        // 1. Fetch current budget to identify company
        const { data: currentBudget, error: fetchError } = await supabaseAdmin
            .from("company_budgets")
            .select("total_balance, company_id")
            .eq("budget_id", id)
            .single();

        if (fetchError || !currentBudget) {
            return NextResponse.json({ detail: "Budget not found" }, { status: 404 });
        }

        const companyId = currentBudget.company_id;
        const newTotal = (currentBudget.total_balance || 0) + amount;

        // 2. Fetch current balance to verify and deduct
        const { data: company, error: compError } = await supabaseAdmin
            .from("companies")
            .select("account_balance")
            .eq("company_id", companyId)
            .single();

        if (compError || !company) throw new Error("Could not resolve company for balance deduction");

        const currentBalance = company.account_balance || 0;

        if (currentBalance < amount) {
            return NextResponse.json({
                detail: `Insufficient balance to complete top-up. Available: PKR ${currentBalance.toLocaleString()}, Needed: PKR ${amount.toLocaleString()}`
            }, { status: 400 });
        }

        // 3. Perform Updates (Budget Increase + Company Balance Deduction)
        // Update Budget
        const { data: updatedBudget, error: updateError } = await supabaseAdmin
            .from("company_budgets")
            .update({
                total_balance: newTotal,
                last_updated: new Date().toISOString()
            })
            .eq("budget_id", id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Deduct from Company Balance
        const { error: balanceError } = await supabaseAdmin
            .from("companies")
            .update({ account_balance: currentBalance - amount })
            .eq("company_id", companyId);

        if (balanceError) {
            // Rollback budget? In a production system, we'd use a single RPC call or transaction.
            console.error("Critical: Balance deduction failed after budget update!");
            throw balanceError;
        }

        return NextResponse.json({
            success: true,
            message: `Added PKR ${amount.toLocaleString()} to budget. Company balance adjusted.`,
            data: updatedBudget
        });

    } catch (error: any) {
        console.error("Error adding funds:", error);
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
