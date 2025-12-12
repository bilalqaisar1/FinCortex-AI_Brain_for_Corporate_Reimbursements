import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SyncOverrides = {
  email?: string;
  full_name?: string;
  employee_code?: string;
  phone_number?: string | null;
  department_id?: number | null;
  manager_id?: string | null;
  role_id?: number | null;
  password_hash?: string;
};

const safeStr = (value: unknown): string | undefined =>
  (typeof value === "string" && value.trim().length > 0) ? value.trim() : undefined;

/**
 * Read-only function to fetch user profile from database
 * Does NOT insert or update any records - only fetches existing data
 */
export async function syncUserProfile(
  userId: string,
  overrides?: SyncOverrides
) {
  const trimmedUserId = safeStr(userId);
  if (!trimmedUserId) throw new Error("user_id is required");

  // 1. Get Auth User (to verify user exists)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(trimmedUserId);

  if (authError || !authData?.user) {
    throw new Error(authError?.message || "Unable to locate authenticated user");
  }

  const { user: authUser } = authData;
  const email = safeStr(overrides?.email) ??
    safeStr(authUser.email) ??
    safeStr(authUser.identities?.[0]?.identity_data?.email);

  if (!email) {
    throw new Error("Email is required to fetch user profile");
  }

  // 2. Determine which table the user exists in by checking by user_id
  // Try admins table first
  const { data: adminProfile, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("*")
    .eq("admin_id", trimmedUserId)
    .maybeSingle();

  if (!adminError && adminProfile) {
    return adminProfile;
  }

  // Try managers table
  const { data: managerProfile, error: managerError } = await supabaseAdmin
    .from("managers")
    .select("*")
    .eq("manager_id", trimmedUserId)
    .maybeSingle();

  if (!managerError && managerProfile) {
    // Manager profile found - it already has admin_id in the table
    return managerProfile;
  }

  // Try users table
  const { data: userProfile, error: userError } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("user_id", trimmedUserId)
    .maybeSingle();

  if (!userError && userProfile) {
    // User profile found - fetch admin_id from manager if manager_id exists
    if ((userProfile as any).manager_id) {
      try {
        const { data: managerData, error: managerFetchError } = await supabaseAdmin
          .from("managers")
          .select("admin_id")
          .eq("manager_id", (userProfile as any).manager_id)
          .maybeSingle();

        if (!managerFetchError && managerData) {
          // Add admin_id to user profile from manager
          return {
            ...userProfile,
            admin_id: managerData.admin_id || null,
          };
        }
      } catch (err) {
        // If manager fetch fails, return user profile without admin_id
        console.warn("⚠️ Could not fetch manager admin_id:", err);
      }
    }
    return userProfile;
  }

  // If user doesn't exist in any table, throw error
  throw new Error("User profile not found in database");
}
