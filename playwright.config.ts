import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const hasExternalServer = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  // Las pruebas comparten la base de datos y crean datos propios: un solo trabajador.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testIgnore: /.*\.setup\.ts/,
    },
  ],
  globalTeardown: "./e2e/global-teardown.ts",
  // Con E2E_BASE_URL se prueba un servidor ya desplegado; sin ella se levanta el de desarrollo.
  webServer: hasExternalServer
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        // Vacía los proveedores para que los correos de las pruebas se registren en consola.
        env: { RESEND_API_KEY: "", SMTP_HOST: "", SMTP_USER: "", SMTP_PASSWORD: "" },
      },
});
