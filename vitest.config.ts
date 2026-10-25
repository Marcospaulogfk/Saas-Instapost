import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: [
      // next/font/google baixa fontes no build; nos testes vira classe fixa.
      { find: "next/font/google", replacement: path.resolve(__dirname, "tests/stubs/next-font-google.ts") },
      { find: "@", replacement: path.resolve(__dirname, ".") },
    ],
  },
  test: {
    include: ["lib/**/*.test.ts", "tests/**/*.test.{ts,tsx}"],
  },
})
