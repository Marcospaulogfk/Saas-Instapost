import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, "..", ".env.local")

const env = {}
for (const raw of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
  const m = raw.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
  if (m) env[m[1]] = m[2]
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const devUserId = env.DEV_USER_ID

if (!url || !serviceKey) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente em .env.local",
  )
  process.exit(1)
}

if (!devUserId) {
  console.error("❌ DEV_USER_ID nao configurado em .env.local")
  console.error("")
  console.error("   Como pegar seu UUID:")
  console.error(
    "   1. Supabase Dashboard > Authentication > Users > clique no seu email > 'User UID'",
  )
  console.error(
    "   2. Ou no SQL Editor: SELECT id FROM auth.users WHERE email = 'seu@email.com';",
  )
  console.error("")
  console.error("   Cole o UUID em .env.local na linha DEV_USER_ID= e rode de novo.")
  process.exit(1)
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
if (!UUID_REGEX.test(devUserId)) {
  console.error(
    `❌ DEV_USER_ID="${devUserId}" nao parece um UUID valido (formato esperado: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).`,
  )
  process.exit(1)
}

const DEV_BRAND_NAME = "Marca Dev"
const DEV_BRAND_COLORS = ["#E84D1E", "#1A1A1A", "#FAF8F5"]

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log("🌱 Seed dev-user (idempotente)\n")
console.log(`   DEV_USER_ID = ${devUserId}\n`)

// ---------- 1. Validar que o user existe em auth.users ----------
const { data: authData, error: authErr } =
  await supabase.auth.admin.getUserById(devUserId)
if (authErr || !authData?.user) {
  console.error(`❌ User ${devUserId} nao existe em auth.users.`)
  console.error(
    "   Confirme o UUID em Supabase Dashboard > Authentication > Users.",
  )
  if (authErr) console.error(`   (Erro do Supabase: ${authErr.message})`)
  process.exit(1)
}
console.log(`✅ Auth user encontrado: ${authData.user.email}`)

// ---------- 2. public.users (upsert credits = 1000, status = trial) ----------
// O trigger handle_new_user ja deve ter populado public.users no cadastro.
// Aqui so garantimos os campos do dev (ate se a row sumir, recriamos via upsert).
const { error: usersErr } = await supabase
  .from("users")
  .upsert(
    {
      id: devUserId,
      email: authData.user.email,
      credits: 1000,
      subscription_status: "trial",
      plan_credits_monthly: 0,
      plan_credits_used_this_month: 0,
    },
    { onConflict: "id" },
  )
if (usersErr) {
  console.error("❌ Erro ao upsert public.users:", usersErr.message)
  process.exit(1)
}
console.log("✅ public.users atualizado: credits = 1000, status = trial")

// ---------- 3. Brand "Marca Dev" (cria se nao existir) ----------
const { data: existingBrand, error: brandLookupErr } = await supabase
  .from("brands")
  .select("id, name")
  .eq("user_id", devUserId)
  .eq("name", DEV_BRAND_NAME)
  .maybeSingle()

if (brandLookupErr) {
  console.error("❌ Erro ao consultar brand existente:", brandLookupErr.message)
  process.exit(1)
}

if (existingBrand) {
  console.log(
    `✅ Brand "${DEV_BRAND_NAME}" ja existe (id ${existingBrand.id.slice(0, 8)}...)`,
  )
} else {
  const { data: brand, error: brandErr } = await supabase
    .from("brands")
    .insert({
      user_id: devUserId,
      name: DEV_BRAND_NAME,
      description: "Marca de teste para spike de geracao de carrosseis",
      brand_colors: DEV_BRAND_COLORS,
      tone_of_voice:
        "Direto, autoral, com toque de humor seco. Frases curtas. Sem rodeio.",
      target_audience:
        "Devs e founders early-stage, 25-40 anos, focados em construir produto",
      visual_style: "Cinematografico, alto contraste, editorial dark",
      main_objective:
        "Educar sobre construcao de produto e crescimento organico",
      default_font: "inter",
      default_template: "cinematic",
    })
    .select()
    .single()
  if (brandErr) {
    console.error("❌ Erro ao criar brand:", brandErr.message)
    console.error(
      "   Provavel causa: migration 0005 ainda nao foi aplicada (default_font/default_template).",
    )
    process.exit(1)
  }
  console.log(
    `✅ Brand criada: "${DEV_BRAND_NAME}" (id ${brand.id.slice(0, 8)}...)`,
  )
  console.log(`   Cores: ${DEV_BRAND_COLORS.join(" | ")}`)
}

console.log("\n🎉 Seed completo.")
console.log("   Reinicie 'npm run dev' pra DEV_MODE pegar o novo DEV_USER_ID.")
