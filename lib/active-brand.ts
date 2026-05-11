import { cookies } from "next/headers"

const COOKIE_NAME = "syncpost_active_brand"
const ONE_YEAR = 60 * 60 * 24 * 365

export async function getActiveBrandIdFromCookie(): Promise<string | null> {
  const store = await cookies()
  const value = store.get(COOKIE_NAME)?.value
  return value ?? null
}

export async function writeActiveBrandCookie(brandId: string) {
  const store = await cookies()
  store.set(COOKIE_NAME, brandId, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    httpOnly: false,
  })
}

export async function clearActiveBrandCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
