import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, "..", ".env.local")
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i), l.slice(i + 1)]
    }),
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("env faltando")
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { error: countErr, count } = await supabase
  .from("single_posts")
  .select("*", { count: "exact", head: true })

if (countErr) {
  console.error("FALHOU contagem:", countErr.message)
  process.exit(1)
}
console.log(`OK — single_posts existe, ${count ?? 0} linhas`)

const { error: joinErr } = await supabase
  .from("single_posts")
  .select(
    "id, brand_id, template_id, title, raw_brief, content, rendered_image_url, status, created_at, updated_at, brand:brands!inner(id, name)",
  )
  .limit(1)

if (joinErr) {
  console.error("FALHOU join:", joinErr.message)
  process.exit(1)
}
console.log("OK — join com brands funciona")

const { data: policies, error: polErr } = await supabase
  .rpc("pg_catalog_pg_policies_count", {})
  .select()

// se não tiver RPC criada, só lista via REST (não tem em PostgREST)
if (polErr && !polErr.message.includes("not found")) {
  console.warn("(checagem de policies pulada — sem RPC custom)")
}

console.log("✓ Pronto pra testar o fluxo no browser")
