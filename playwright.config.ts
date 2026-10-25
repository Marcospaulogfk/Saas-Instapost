// Teste de regressão VISUAL dos estilos de carrossel (Playwright).
// Separado do Vitest de propósito: os arquivos chamam *.visual.ts (o Vitest só
// pega *.test.ts) e moram em tests/visual. Rode com `npm run test:visual`.
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "tests/visual",
  testMatch: /.*\.visual\.ts$/,
  // Fotos de erro/diff de cada rodada. test-results/ (raiz) é QA manual antigo,
  // por isso uma pasta própria, ignorada pelo git.
  outputDir: "tests/visual/.saida",
  // Referência guardada em tests/visual/__referencias__/estilos.visual/<nome>.png
  // sem sufixo de plataforma (-win32, -linux): a mesma foto vale no Windows e no CI.
  snapshotPathTemplate: "{testDir}/__referencias__/{testFileName}/{arg}{ext}",
  fullyParallel: false,
  workers: 1,
  retries: 1,
  // Primeira compilação da página pelo Next pode passar de 60s.
  timeout: 180_000,
  expect: {
    timeout: 30_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://localhost:3010",
    viewport: { width: 1400, height: 1700 },
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1400, height: 1700 },
        deviceScaleFactor: 1,
      },
    },
  ],
  // Se já houver um `next dev` na 3010 (normal no dia a dia), reaproveita.
  // Só sobe outro quando ninguém está rodando (ex.: CI).
  webServer: {
    command: "npx next dev -p 3010",
    url: "http://localhost:3010/preview-estilos",
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
