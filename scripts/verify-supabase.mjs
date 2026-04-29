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

if (!url || !serviceKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente")
  process.exit(1)
}

console.log(`🔌 Conectando em ${url}\n`)

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log("---- Tabelas ----")
const tables = ["users", "brands", "projects", "slides", "subscriptions"]
let tableFails = 0
for (const t of tables) {
  const { count, error } = await supabase
    .from(t)
    .select("*", { count: "exact", head: true })
  if (error) {
    console.log(`❌ ${t}: ${error.message}`)
    tableFails++
  } else {
    console.log(`✅ ${t}: ok (${count ?? 0} linhas)`)
  }
}

console.log("\n---- Funcoes RPC ----")
const fakeUuid = "00000000-0000-0000-0000-000000000000"

const { data: consumeData, error: consumeErr } = await supabase.rpc(
  "consume_image_credit",
  { p_user_id: fakeUuid },
)
if (consumeErr) {
  if (consumeErr.code === "42883" || /does not exist/i.test(consumeErr.message)) {
    console.log(`❌ consume_image_credit: funcao nao existe`)
  } else {
    console.log(`⚠ consume_image_credit: ${consumeErr.message} (code ${consumeErr.code})`)
  }
} else {
  console.log(`✅ consume_image_credit: existe, retornou ${consumeData} pra user fake (esperado: false)`)
}

const { error: refundErr } = await supabase.rpc("refund_image_credit", {
  p_user_id: fakeUuid,
})
if (refundErr) {
  if (refundErr.code === "42883" || /does not exist/i.test(refundErr.message)) {
    console.log(`❌ refund_image_credit: funcao nao existe`)
  } else {
    console.log(`⚠ refund_image_credit: ${refundErr.message} (code ${refundErr.code})`)
  }
} else {
  console.log(`✅ refund_image_credit: existe, executou sem erro`)
}

console.log("\n---- Trigger handle_new_user ----")
const { data: triggerData, error: triggerErr } = await supabase
  .from("users")
  .select("id, credits, subscription_status")
  .limit(5)
if (triggerErr) {
  console.log(`⚠ Nao deu pra checar (${triggerErr.message})`)
} else {
  console.log(`✅ Tabela users acessivel via service_role. ${triggerData.length} linha(s) encontrada(s).`)
  if (triggerData.length === 0) {
    console.log("   (Sem usuarios ainda — o trigger so dispara quando alguem se cadastra em auth.users.)")
  } else {
    triggerData.forEach((u) => {
      console.log(`   - id=${u.id.slice(0, 8)}... credits=${u.credits} status=${u.subscription_status}`)
    })
  }
}

console.log(`\n${tableFails === 0 ? "🎉 Tudo certo!" : `⚠ ${tableFails} tabela(s) com problema — provavelmente alguma migration nao rodou.`}`)
