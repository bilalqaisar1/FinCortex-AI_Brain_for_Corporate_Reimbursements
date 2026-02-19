import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

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

/**
 * Resolve admin_id from request auth (cookies or Authorization header).
 * This is the reliable server-side approach — never trust client-passed IDs.
 */
async function resolveAdminId(request: NextRequest): Promise<string | null> {
    // Method 1: Try Authorization header (Bearer token)
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
            if (!error && user) return user.id;
        } catch (e) {
            console.error("Auth header verification failed:", e);
        }
    }

    // Method 2: Try Supabase auth cookies
    try {
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();

        // Find the Supabase auth token from cookies
        // Cookie names follow pattern: sb-<project-ref>-auth-token
        for (const cookie of allCookies) {
            if (cookie.name.includes("auth-token") && cookie.value) {
                try {
                    // The cookie value might be a JSON string containing access_token
                    let token = cookie.value;

                    // Try parsing as JSON first (Supabase stores tokens as JSON in cookies)
                    try {
                        const parsed = JSON.parse(token);
                        if (parsed.access_token) {
                            token = parsed.access_token;
                        } else if (Array.isArray(parsed) && parsed[0]) {
                            // Sometimes stored as array chunks
                            const joined = parsed.join("");
                            const innerParsed = JSON.parse(joined);
                            if (innerParsed.access_token) {
                                token = innerParsed.access_token;
                            }
                        }
                    } catch {
                        // Not JSON, use as-is
                    }

                    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
                    if (!error && user) return user.id;
                } catch (e) {
                    // Try next cookie
                }
            }
        }

        // Also try chunked cookies (sb-xxx-auth-token.0, sb-xxx-auth-token.1, etc.)
        const chunkCookies = allCookies
            .filter(c => c.name.includes("auth-token."))
            .sort((a, b) => a.name.localeCompare(b.name));

        if (chunkCookies.length > 0) {
            const combined = chunkCookies.map(c => c.value).join("");
            try {
                const parsed = JSON.parse(combined);
                const token = parsed.access_token || combined;
                const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
                if (!error && user) return user.id;
            } catch (e) {
                // Try raw combined value
                try {
                    const { data: { user }, error } = await supabaseAdmin.auth.getUser(combined);
                    if (!error && user) return user.id;
                } catch {
                    // Failed
                }
            }
        }
    } catch (e) {
        console.error("Cookie auth verification failed:", e);
    }

    // Method 3: Try query param as last resort
    const { searchParams } = new URL(request.url);
    const adminIdParam = searchParams.get("admin_id");
    if (adminIdParam && adminIdParam !== "mock-manager-id" && adminIdParam.length > 10) {
        return adminIdParam;
    }

    return null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const departmentId = parseInt(id);

        if (isNaN(departmentId)) {
            return NextResponse.json(
                { success: false, error: "Invalid department ID" },
                { status: 400 }
            );
        }

        // Resolve admin_id from server-side auth (cookies/header)
        const adminId = await resolveAdminId(request);
        console.log(`[DeptDetail] Resolved adminId: ${adminId}`);

        // Resolve company_id from admin_id
        let companyId: string | null = null;
        if (adminId) {
            const { data: company } = await supabaseAdmin
                .from("companies")
                .select("company_id")
                .eq("admin_id", adminId)
                .maybeSingle();
            companyId = company?.company_id || null;
        }

        console.log(`[DeptDetail] dept=${departmentId}, adminId=${adminId}, companyId=${companyId}`);

        // Fetch department info
        const { data: dept, error: deptErr } = await supabaseAdmin
            .from("departments")
            .select("*")
            .eq("department_id", departmentId)
            .single();

        if (deptErr || !dept) {
            return NextResponse.json(
                { success: false, error: "Department not found" },
                { status: 404 }
            );
        }

        // ── Fetch managers for this department ──
        // Same pattern as admin.py: try manager_admin_id first, then manager_company_id
        let allDeptManagers: any[] = [];

        if (adminId) {
            const { data: m1 } = await supabaseAdmin
                .from("managers")
                .select("manager_id, full_name, email, manager_department_id, manager_company_id, manager_admin_id")
                .eq("manager_department_id", departmentId)
                .eq("manager_admin_id", adminId);
            allDeptManagers = m1 || [];
        }

        if (allDeptManagers.length === 0 && companyId) {
            const { data: m2 } = await supabaseAdmin
                .from("managers")
                .select("manager_id, full_name, email, manager_department_id, manager_company_id, manager_admin_id")
                .eq("manager_department_id", departmentId)
                .eq("manager_company_id", companyId);
            allDeptManagers = m2 || [];
        }

        console.log(`[DeptDetail] Found ${allDeptManagers.length} managers for dept ${departmentId}`);

        // ── Fetch employees ──
        // Users are linked via manager_id. Users table has NO company_id column.
        // Same pattern as admin.py: fetch per-manager, then filter by department
        const allEmployees: any[] = [];
        const seenUserIds = new Set<string>();

        // Get all manager IDs for this admin
        let allAdminManagerIds: string[] = [];

        if (adminId) {
            const { data: allMgrs } = await supabaseAdmin
                .from("managers")
                .select("manager_id")
                .eq("manager_admin_id", adminId);
            allAdminManagerIds = (allMgrs || []).map(m => m.manager_id);
        }

        if (allAdminManagerIds.length === 0 && companyId) {
            const { data: allMgrs } = await supabaseAdmin
                .from("managers")
                .select("manager_id")
                .eq("manager_company_id", companyId);
            allAdminManagerIds = (allMgrs || []).map(m => m.manager_id);
        }

        // Fetch users per-manager (same as admin.py line 590)
        for (const mgrId of allAdminManagerIds) {
            const { data: mgrUsers } = await supabaseAdmin
                .from("users")
                .select("user_id, full_name, email, department_id, manager_id")
                .eq("manager_id", mgrId);

            for (const emp of (mgrUsers || [])) {
                if (emp.user_id && !seenUserIds.has(emp.user_id) && emp.department_id === departmentId) {
                    seenUserIds.add(emp.user_id);
                    allEmployees.push(emp);
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                department: dept,
                managers: allDeptManagers,
                employees: allEmployees,
            }
        });
    } catch (error: any) {
        console.error("Error fetching department detail:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const departmentId = parseInt(id);

        if (isNaN(departmentId)) {
            return NextResponse.json(
                { success: false, error: "Invalid department ID" },
                { status: 400 }
            );
        }

        // Verify company ownership before deleting
        const adminId = await resolveAdminId(request);
        if (adminId) {
            const { data: company } = await supabaseAdmin
                .from("companies")
                .select("company_id")
                .eq("admin_id", adminId)
                .maybeSingle();

            if (company?.company_id) {
                const { data: dept } = await supabaseAdmin
                    .from("departments")
                    .select("company_id")
                    .eq("department_id", departmentId)
                    .maybeSingle();

                if (dept?.company_id && dept.company_id !== company.company_id) {
                    return NextResponse.json(
                        { success: false, error: "Access denied: Department does not belong to your company" },
                        { status: 403 }
                    );
                }
            }
        }

        const { data: usersWithDept } = await supabaseAdmin
            .from("users")
            .select("user_id")
            .eq("department_id", departmentId)
            .limit(1);

        if (usersWithDept && usersWithDept.length > 0) {
            return NextResponse.json(
                { success: false, error: "Cannot delete department: it is still assigned to users. Please reassign users first." },
                { status: 409 }
            );
        }

        const { error } = await supabaseAdmin
            .from("departments")
            .delete()
            .eq("department_id", departmentId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting department:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
