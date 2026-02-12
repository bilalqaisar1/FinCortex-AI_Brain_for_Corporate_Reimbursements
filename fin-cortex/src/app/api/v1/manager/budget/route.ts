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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const managerId = searchParams.get("manager_id");

        if (!managerId) {
            return NextResponse.json({ detail: "manager_id is required" }, { status: 400 });
        }

        // 1. Resolve Manager Profile and Department
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("managers")
            .select("manager_company_id, manager_department_id, departments(department_name)")
            .eq("manager_id", managerId)
            .maybeSingle();

        if (profileError || !profile) {
            console.error("Error resolving manager profile:", profileError);
            return NextResponse.json({ detail: "Manager profile not found" }, { status: 404 });
        }

        const companyId = profile.manager_company_id;
        const departmentId = profile.manager_department_id;
        const departmentName = (profile.departments as any)?.department_name || "Assigned Department";

        if (!companyId) {
            return NextResponse.json({ detail: "Manager is not associated with a company" }, { status: 400 });
        }

        // 2. Fetch Department-Specific Budget
        let totalBudget = 0;
        let monthlyLimit = 0;

        if (departmentId) {
            const { data: budgetData, error: budgetError } = await supabaseAdmin
                .from("company_budgets")
                .select("*")
                .eq("company_id", companyId)
                .eq("department_id", departmentId)
                .maybeSingle();

            if (budgetError) {
                console.error("Error fetching department budget:", budgetError);
            }

            if (budgetData) {
                totalBudget = budgetData.total_balance || 0;
                monthlyLimit = budgetData.monthly_limit || 0;
            }
        }

        // 3. Calculate Spending (Reimbursements)
        const { data: reimbursements, error: reimbError } = await supabaseAdmin
            .from("reimbursements")
            .select("reimbursement_id, amount_claimed, amount_approved, status, created_at, description, expense_categories(category_name)")
            .eq("company_id", companyId)
            .eq("department_id", departmentId)
            .order("created_at", { ascending: false })
            .limit(50);

        if (reimbError) {
            console.error("Error fetching reimbursements:", reimbError);
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let usedBudget = 0;
        let monthlyUsed = 0;
        const categorySpending: Record<string, number> = {};
        const recentTransactions: any[] = [];

        (reimbursements || []).forEach((r: any) => {
            const status = r.status;
            const amount = r.amount_approved || r.amount_claimed || 0;

            if (status === "approved") {
                usedBudget += amount;

                if (r.created_at) {
                    const rDate = new Date(r.created_at);
                    if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
                        monthlyUsed += amount;
                    }
                }
            }

            if (status === "approved" || status === "pending") {
                const catName = r.expense_categories?.category_name || "Uncategorized";
                categorySpending[catName] = (categorySpending[catName] || 0) + amount;
            }

            if (recentTransactions.length < 5) {
                recentTransactions.push({
                    id: r.reimbursement_id,
                    type: "Debit",
                    amount: amount,
                    description: r.description || "Reimbursement",
                    date: r.created_at,
                    status: status
                });
            }
        });

        // 4. Prepare UI Data
        const categoriesUi = Object.entries(categorySpending).map(([cat_name, spent]) => {
            let percentage = 0;
            if (totalBudget > 0) {
                percentage = parseFloat(((spent / totalBudget) * 100).toFixed(1));
            }
            return {
                category: cat_name,
                used: spent,
                limit: 0,
                percentage: percentage
            };
        });

        const remainingBudget = totalBudget - usedBudget;
        let utilizationPercentage = 0;
        if (totalBudget > 0) {
            utilizationPercentage = parseFloat(((usedBudget / totalBudget) * 100).toFixed(1));
        } else if (usedBudget > 0) {
            utilizationPercentage = 100;
        }

        return NextResponse.json({
            success: true,
            data: {
                total_budget: totalBudget,
                used_budget: usedBudget,
                remaining_budget: remainingBudget,
                utilization_percentage: utilizationPercentage,
                monthly_limit: monthlyLimit,
                monthly_used: monthlyUsed,
                monthly_remaining: Math.max(0, monthlyLimit - monthlyUsed),
                department_name: departmentName,
                department_id: departmentId,
                categories: categoriesUi,
                recent_transactions: recentTransactions
            }
        });

    } catch (error: any) {
        console.error("Error serving manager budget:", error);
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
