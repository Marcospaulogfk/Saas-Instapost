import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() nao pode ser usado no browser. Use apenas em Route Handlers, Server Actions ou Edge Functions.",
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL ausente no ambiente.",
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
