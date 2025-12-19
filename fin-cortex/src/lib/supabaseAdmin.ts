import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

// Validate environment variables - this file should only be imported in server-side code (API routes)
// Client components should NOT import this file directly
if (!supabaseUrl) {
  throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!serviceRoleKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. " +
    "Please add it to your .env.local file. " +
    "Note: This file should only be imported in server-side code (API routes), not in client components."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
