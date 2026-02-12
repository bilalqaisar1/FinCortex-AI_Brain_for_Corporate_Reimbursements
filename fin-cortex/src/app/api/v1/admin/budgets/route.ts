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
        const adminId = searchParams.get("admin_id");

        if (!adminId) {
            return NextResponse.json({ success: true, data: [] });
        }

        // 1. Resolve Company ID from Admin
        const { data: company, error: compError } = await supabaseAdmin
            .from("companies")
            .select("company_id, company_name, account_balance")
            .eq("admin_id", adminId)
            .maybeSingle();

        if (compError || !company) {
            console.error("Error resolving company for budget fetch:", compError);
            return NextResponse.json({ success: true, data: [] });
        }

        const companyId = company.company_id;
        const companyNameResolved = company.company_name;

        // 2. Fetch approved reimbursements for THIS company only
        const { data: reimbursements, error: reimbError } = await supabaseAdmin
            .from("reimbursements")
            .select("amount_approved, amount_claimed, created_at, category_id")
            .eq("company_id", companyId)
            .eq("status", "approved");

        if (reimbError) {
            console.error("Error fetching reimbursements:", reimbError);
        }

        // Aggregate used amounts
        let totalUsed = 0;
        let monthlyUsed = 0;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        if (reimbursements) {
            reimbursements.forEach((r) => {
                const amount = r.amount_approved || r.amount_claimed || 0;
                totalUsed += amount;

                const rDate = new Date(r.created_at);
                if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
                    monthlyUsed += amount;
                }
            });
        }

        // 3. Fetch budgets for this company with category names
        const { data: budgetsData, error: budgetError } = await supabaseAdmin
            .from("company_budgets")
            .select(`
                budget_id, 
                total_balance, 
                monthly_limit, 
                last_updated,
                category_id,
                expense_categories(category_name),
                department_id,
                departments(department_name)
            `)
            .eq("company_id", companyId)
            .order("last_updated", { ascending: false });

        if (budgetError) {
            console.error("Error fetching budgets:", budgetError);
        }

        // 4. Calculate total allocated
        const totalAllocated = (budgetsData || []).reduce((sum, b) => sum + (b.total_balance || 0), 0);

        // 5. Construct response with category-specific usage if possible
        const budgets = (budgetsData || []).map((b: any) => {
            const total = b.total_balance || 0;
            const categoryId = b.category_id;

            // Calculate usage for THIS specific category
            let catTotalUsed = 0;
            let catMonthlyUsed = 0;

            if (reimbursements) {
                reimbursements.forEach((r: any) => {
                    // Match by category_id if budget has one. 
                    // If budget is "Global" (null category), we might still want to show company total or just global ones.
                    // For now, let's assume if category matches, it counts.
                    if (categoryId && r.category_id === categoryId) {
                        const amount = r.amount_approved || r.amount_claimed || 0;
                        catTotalUsed += amount;

                        const rDate = new Date(r.created_at);
                        if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
                            catMonthlyUsed += amount;
                        }
                    } else if (!categoryId && !b.department_id) {
                        // For general budget (no category AND no department), we might show everything? 
                        // Or only those missing category?
                        // Let's stick to showing everything for general budget as a fallback.
                        const amount = r.amount_approved || r.amount_claimed || 0;
                        catTotalUsed += amount;

                        const rDate = new Date(r.created_at);
                        if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
                            catMonthlyUsed += amount;
                        }
                    }
                });
            }

            const remaining = total - catTotalUsed;

            let utilization = 0;
            if (total > 0) {
                utilization = parseFloat(((catTotalUsed / total) * 100).toFixed(1));
            } else if (catTotalUsed > 0) {
                utilization = 100;
            }

            let status = "healthy";
            if (remaining < 0) status = "critical";
            else if (utilization > 80) status = "warning";

            return {
                budget_id: b.budget_id,
                company_id: companyId,
                company_name: companyNameResolved,
                category_id: b.category_id,
                category_name: b.expense_categories?.category_name || "General Budget",
                department_id: b.department_id,
                department_name: b.departments?.department_name,
                total_amount: total,
                used_amount: catTotalUsed,
                remaining_amount: remaining,
                utilization_percentage: utilization,
                monthly_limit: b.monthly_limit || 0,
                monthly_used: catMonthlyUsed,
                status,
                currency: "PKR",
                last_updated: b.last_updated
            };
        });

        return NextResponse.json({
            success: true,
            data: budgets,
            account_balance: company.account_balance || 0,
            total_allocated: totalAllocated,
            company_name: companyNameResolved
        });

    } catch (error: any) {
        console.error("Error fetching budgets:", error);
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { total_amount, monthly_limit, admin_id } = body;
        let { company_id } = body;

        if (!total_amount) {
            return NextResponse.json({ detail: "Total budget amount is required" }, { status: 400 });
        }

        // 1. Resolve Admin ID
        let resolvedAdminId = admin_id;

        // Try to get from Authorization header if not in body
        if (!resolvedAdminId) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
                    if (!authError && user) {
                        resolvedAdminId = user.id;
                    }
                } catch (e) {
                    console.error("Auth verification failed:", e);
                }
            }
        }

        // 2. Resolve Company ID from Admin
        if (!company_id) {
            if (resolvedAdminId) {
                // Find company owned by this admin
                const { data: company } = await supabaseAdmin
                    .from("companies")
                    .select("company_id")
                    .eq("admin_id", resolvedAdminId)
                    .maybeSingle();

                if (company) {
                    company_id = company.company_id;
                } else {
                    // This case shouldn't happen with the new signup flow, but as a fallback:
                    // Check if they have an admin profile first
                    const { data: adminProfile } = await supabaseAdmin
                        .from("admins")
                        .select("full_name")
                        .eq("admin_id", resolvedAdminId)
                        .maybeSingle();

                    if (adminProfile) {
                        const { data: newCompany } = await supabaseAdmin
                            .from("companies")
                            .insert({
                                admin_id: resolvedAdminId,
                                company_name: `${adminProfile.full_name}'s Organization`
                            })
                            .select()
                            .single();

                        if (newCompany) company_id = newCompany.company_id;
                    }
                }
            } else {
                // Extreme fallback for testing or non-auth calls: use first admin's company
                // In production, we should probably return 401 if resolvedAdminId is missing
                const { data: firstAdmin } = await supabaseAdmin.from("admins").select("admin_id").limit(1).single();
                if (firstAdmin) {
                    const { data: company } = await supabaseAdmin
                        .from("companies")
                        .select("company_id")
                        .eq("admin_id", firstAdmin.admin_id)
                        .maybeSingle();
                    if (company) company_id = company.company_id;
                }
            }
        }

        if (!company_id) {
            return NextResponse.json({ detail: "Company associated with admin not found. Please ensure you are signed in as an admin with an assigned organization." }, { status: 400 });
        }

        const { category_id, department_id } = body;

        // 3. Verify Account Balance
        const { data: compData } = await supabaseAdmin
            .from("companies")
            .select("account_balance")
            .eq("company_id", company_id)
            .single();

        const currentBalance = compData?.account_balance || 0;
        if (currentBalance < total_amount) {
            return NextResponse.json({
                detail: `Budget exceeds company balance. Available: PKR ${currentBalance.toLocaleString()}, Requested: PKR ${total_amount.toLocaleString()}`
            }, { status: 400 });
        }

        // 4. Subtract from balance
        const newBalance = currentBalance - total_amount;
        await supabaseAdmin
            .from("companies")
            .update({ account_balance: newBalance })
            .eq("company_id", company_id);

        const budgetData = {
            company_id,
            total_balance: total_amount,
            monthly_limit: monthly_limit || null,
            category_id: category_id || null,
            department_id: department_id || null,
            last_updated: new Date().toISOString()
        };

        // Check if budget already exists for this (company, category, department)
        let query = supabaseAdmin
            .from("company_budgets")
            .select("budget_id, total_balance")
            .eq("company_id", company_id);

        if (department_id) {
            query = query.eq("department_id", department_id);
        } else if (category_id) {
            query = query.eq("category_id", category_id);
        } else {
            query = query.is("category_id", null).is("department_id", null);
        }

        const { data: existingBudget } = await query.maybeSingle();

        let result;
        if (existingBudget) {
            // Refund the old amount first if we are replacing
            const oldAmount = existingBudget.total_balance || 0;
            await supabaseAdmin
                .from("companies")
                .update({ account_balance: newBalance + oldAmount })
                .eq("company_id", company_id);

            // Update existing budget
            result = await supabaseAdmin
                .from("company_budgets")
                .update(budgetData)
                .eq("budget_id", existingBudget.budget_id)
                .select()
                .single();
        } else {
            // Insert new budget
            result = await supabaseAdmin
                .from("company_budgets")
                .insert(budgetData)
                .select()
                .single();
        }

        if (result.error) throw result.error;

        return NextResponse.json({
            success: true,
            message: `Budget of PKR ${total_amount.toLocaleString()} allocated. Balance adjusted.`,
            data: result.data
        });

    } catch (error: any) {
        console.error("Error creating budget:", error);
        return NextResponse.json({ detail: error.message }, { status: 500 });
    }
}
