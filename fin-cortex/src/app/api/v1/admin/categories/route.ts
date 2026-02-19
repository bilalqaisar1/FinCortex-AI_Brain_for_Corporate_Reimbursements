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
 * Resolve admin_id from request auth (cookies, header, or query param).
 */
async function resolveAdminId(request: NextRequest): Promise<string | null> {
    // Method 1: Try Authorization header
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
            if (!error && user) return user.id;
        } catch (e) {
            // fall through
        }
    }

    // Method 2: Try Supabase auth cookies
    try {
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();

        for (const cookie of allCookies) {
            if (cookie.name.includes("auth-token") && cookie.value) {
                try {
                    let token = cookie.value;
                    try {
                        const parsed = JSON.parse(token);
                        if (parsed.access_token) {
                            token = parsed.access_token;
                        } else if (Array.isArray(parsed) && parsed[0]) {
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

        // Try chunked cookies
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
                try {
                    const { data: { user }, error } = await supabaseAdmin.auth.getUser(combined);
                    if (!error && user) return user.id;
                } catch {
                    // Failed
                }
            }
        }
    } catch (e) {
        // Cookie auth failed
    }

    // Method 3: Query param fallback
    const { searchParams } = new URL(request.url);
    const adminIdParam = searchParams.get("admin_id");
    if (adminIdParam && adminIdParam !== "mock-manager-id" && adminIdParam.length > 10) {
        return adminIdParam;
    }

    return null;
}

export async function GET(request: NextRequest) {
    try {
        // Resolve admin and get their company
        const adminId = await resolveAdminId(request);
        let companyId: string | null = null;

        if (adminId) {
            const { data: company } = await supabaseAdmin
                .from("companies")
                .select("company_id")
                .eq("admin_id", adminId)
                .maybeSingle();
            companyId = company?.company_id || null;
        }

        let query = supabaseAdmin
            .from("expense_categories")
            .select("*")
            .order("category_id");

        // Scope to company if resolved
        if (companyId) {
            query = query.eq("company_id", companyId);
            console.log(`[Categories] Scoped to company_id=${companyId}`);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data || []
        });
    } catch (error: any) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
