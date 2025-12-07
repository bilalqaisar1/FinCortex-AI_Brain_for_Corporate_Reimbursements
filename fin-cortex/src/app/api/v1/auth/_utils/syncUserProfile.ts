import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SyncOverrides = {
  email?: string;
  full_name?: string;
  employee_code?: string;
  phone_number?: string | null;
  company_id?: number | null;
  department_id?: number | null;
  manager_id?: string | null;
  role_id?: number | null;
  password_hash?: string;
};

const FALLBACK_PASSWORD_SENTINEL = "supabase_managed";

const resolveString = (value?: unknown, fallback = "") =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;

export async function syncUserProfile(
  userId: string,
  overrides?: SyncOverrides
) {
  const trimmedUserId = resolveString(userId);

  if (!trimmedUserId) {
    throw new Error("user_id is required");
  }

  const authUserResponse = await supabaseAdmin.auth.admin.getUserById(
    trimmedUserId
  );

  if (authUserResponse.error || !authUserResponse.data?.user) {
    throw new Error(
      authUserResponse.error?.message ||
        "Unable to locate authenticated user for sync"
    );
  }

  const authUser = authUserResponse.data.user;
  const emailFromAuth =
    authUser.email ||
    (authUser.identities?.[0]?.identity_data as Record<string, any> | undefined)
      ?.email;

  const email = resolveString(overrides?.email ?? emailFromAuth);
  if (!email) {
    throw new Error("Email is required to sync user profile");
  }

  const rawFullName =
    overrides?.full_name ??
    authUser.user_metadata?.full_name ??
    authUser.user_metadata?.fullName ??
    authUser.user_metadata?.name ??
    authUser.user_metadata?.given_name ??
    authUser.user_metadata?.preferred_username;
  const full_name = resolveString(rawFullName, email.split("@")[0] || "User");

  const rawEmployeeCode =
    overrides?.employee_code ??
    authUser.user_metadata?.employee_code ??
    authUser.user_metadata?.employeeCode ??
    authUser.user_metadata?.employee_id ??
    authUser.app_metadata?.employee_code;
  const generatedEmployeeCode = `AUTO-${trimmedUserId
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase()}`;
  const employee_code = resolveString(
    rawEmployeeCode,
    generatedEmployeeCode
  ).toUpperCase();

  const phone_number =
    overrides?.phone_number ??
    (authUser.user_metadata?.phone_number as string | undefined) ??
    (authUser.user_metadata?.phone as string | undefined) ??
    (authUser.phone as string | undefined) ??
    null;

  const { data: existingUser, error: existingError } = await supabaseAdmin
    .from("users")
    .select(
      "user_id, company_id, manager_id, department_id, role_id, password_hash"
    )
    .eq("user_id", trimmedUserId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const payload = {
    user_id: trimmedUserId,
    email,
    full_name,
    employee_code,
    phone_number,
    company_id:
      overrides?.company_id ?? existingUser?.company_id ?? null,
    department_id:
      overrides?.department_id ?? existingUser?.department_id ?? null,
    manager_id:
      overrides?.manager_id ?? existingUser?.manager_id ?? null,
    role_id: overrides?.role_id ?? existingUser?.role_id ?? null,
    password_hash:
      overrides?.password_hash ??
      existingUser?.password_hash ??
      FALLBACK_PASSWORD_SENTINEL,
  };

  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


