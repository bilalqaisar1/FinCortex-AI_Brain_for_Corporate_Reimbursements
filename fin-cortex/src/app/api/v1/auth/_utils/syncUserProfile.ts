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

  // Validate UUID format - RPC function always returns UUID (or empty string for not found)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidUUID = uuidRegex.test(trimmedUserId);

  if (!isValidUUID) {
    throw new Error(`Invalid user_id format. Expected UUID but received: ${trimmedUserId}`);
  }

  // Try to get auth user by UUID (optional - user might not exist in auth.users)
  let authUser: any = null;
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(trimmedUserId);
    if (!authError && authData?.user) {
      authUser = authData.user;
    }
  } catch (authErr) {
    // User might not exist in auth.users - that's okay, we'll query database directly
    console.warn("⚠️ User not found in auth.users, will query database directly:", authErr);
  }

  // 2. Query database tables by UUID only (RPC always returns UUID)
  // RPC returns the ID from the table where the user was found, so we should check in order:
  // 1. Managers (most common for RPC since it checks managers second)
  // 2. Admins
  // 3. Users

  // Try managers table first (RPC checks managers second, so this is likely)
  const { data: managerProfile, error: managerError } = await supabaseAdmin
    .from("managers")
    .select("*")
    .eq("manager_id", trimmedUserId)
    .maybeSingle();

  if (!managerError && managerProfile) {
    // Manager profile found - it already has admin_id in the table
    return managerProfile;
  }

  // Try admins table
  const { data: adminProfile, error: adminError } = await supabaseAdmin
    .from("admins")
    .select("*")
    .eq("admin_id", trimmedUserId)
    .maybeSingle();

  if (!adminError && adminProfile) {
    return adminProfile;
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
          .select("manager_admin_id")
          .eq("manager_id", (userProfile as any).manager_id)
          .maybeSingle();

        if (!managerFetchError && managerData) {
          // Add admin_id to user profile from manager
          return {
            ...userProfile,
            admin_id: managerData.manager_admin_id || null,
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
<<<<<<< Updated upstream
}
=======
}
>>>>>>> Stashed changes
