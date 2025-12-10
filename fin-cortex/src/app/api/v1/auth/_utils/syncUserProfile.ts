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

const FALLBACK_PASSWORD_SENTINEL = "supabase_managed";

const safeStr = (value: unknown): string | undefined =>
  (typeof value === "string" && value.trim().length > 0) ? value.trim() : undefined;

export async function syncUserProfile(
  userId: string,
  overrides?: SyncOverrides
) {
  const trimmedUserId = safeStr(userId);
  if (!trimmedUserId) throw new Error("user_id is required");

  // 1. Get Auth User
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(trimmedUserId);

  if (authError || !authData?.user) {
    throw new Error(authError?.message || "Unable to locate authenticated user for sync");
  }

  const { user: authUser } = authData;
  const metadata = authUser.user_metadata || {};

  // 2. Resolve Core Fields
  // Priority: Overrides -> Auth User Email -> Identity Email
  const email = safeStr(overrides?.email) ??
    safeStr(authUser.email) ??
    safeStr(authUser.identities?.[0]?.identity_data?.email);

  if (!email) {
    throw new Error("Email is required to sync user profile");
  }

  const full_name = safeStr(overrides?.full_name) ??
    safeStr(metadata.full_name) ??
    safeStr(metadata.fullName) ??
    safeStr(metadata.name) ??
    safeStr(metadata.given_name) ??
    email.split("@")[0];

  let employee_code = safeStr(overrides?.employee_code) ??
    safeStr(metadata.employee_code) ??
    safeStr(metadata.employeeCode) ??
    safeStr(metadata.employee_id);

  if (!employee_code) {
    employee_code = `AUTO-${trimmedUserId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  }
  employee_code = employee_code.toUpperCase();

  const phone_number = overrides?.phone_number ??
    (metadata.phone_number as string) ??
    (metadata.phone as string) ??
    (authUser.phone as string) ??
    null;

  // 3. Check Existence (needed for password handling and collision checks)
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("user_id, password_hash")
    .eq("user_id", trimmedUserId)
    .maybeSingle();

  // 4. Handle Email Collision (Orphaned Account recovery)
  if (!existingUser) {
    const { data: collisionUser } = await supabaseAdmin
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (collisionUser && collisionUser.user_id !== trimmedUserId) {
      // Reclaim Profile: Update the old user_id to the new one
      const updateData: any = {
        user_id: trimmedUserId,
        full_name,
        employee_code,
        phone_number,
        updated_at: new Date().toISOString()
      };

      if (overrides?.department_id !== undefined) updateData.department_id = overrides.department_id;
      if (overrides?.manager_id !== undefined) updateData.manager_id = overrides.manager_id;
      if (overrides?.role_id !== undefined) updateData.role_id = overrides.role_id;
      if (overrides?.password_hash) updateData.password_hash = overrides.password_hash;

      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update(updateData)
        .eq("user_id", collisionUser.user_id);

      if (updateError) {
        throw new Error(`Failed to reclaim user profile from ${collisionUser.user_id}: ${updateError.message}`);
      }

      // Return updated record
      const { data: updatedRecord } = await supabaseAdmin
        .from("users")
        .select()
        .eq("user_id", trimmedUserId)
        .single();
      return updatedRecord;
    }
  }

  // 5. Construct Payload for Upsert
  const password_hash =
    overrides?.password_hash ??
    existingUser?.password_hash ??
    FALLBACK_PASSWORD_SENTINEL;

  const payload: any = {
    user_id: trimmedUserId,
    email,
    full_name,
    employee_code,
    phone_number,
    password_hash,
    updated_at: new Date().toISOString(),
  };

  // Only include optional fields if provided (Updates) or if specific logic applies (Inserts)
  if (overrides?.department_id !== undefined) payload.department_id = overrides.department_id;
  if (overrides?.manager_id !== undefined) payload.manager_id = overrides.manager_id;
  if (overrides?.role_id !== undefined) payload.role_id = overrides.role_id;

  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert(payload) // upsert updates only columns present in payload
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
