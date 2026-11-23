import { test, expect, type Page } from "@playwright/test";
import { E2E_ADMIN, E2E_PASSWORD, E2E_STUDENT } from "./fixtures";

// Imagen PNG válida de 1×1 píxel.
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/cuenta$/);
}

test("un administrador publica una noticia y cualquier visitante la puede leer", async ({ page }) => {
  const title = `Convocatoria E2E ${Date.now()}`;

  await signIn(page, E2E_ADMIN.email, E2E_PASSWORD);
  await page.goto("/admin/noticias/nueva");
  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Resumen").fill("Resumen de prueba para comprobar el portal de noticias.");
  await page.getByLabel("Contenido").fill("Primer párrafo de la noticia de prueba.\n\n**Texto en negrita** y un enlace.");
  await page.locator('input[name="cover"]').setInputFiles({ name: "portada.png", mimeType: "image/png", buffer: PNG_1X1 });
  await page.getByRole("button", { name: "Publicar", exact: true }).click();

  await expect(page).toHaveURL(/\/admin\/noticias\?ok=publicada/);
  await expect(page.getByText(title)).toBeVisible();

  await page.context().clearCookies();
  await page.goto("/noticias");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByRole("link", { name: new RegExp(title) }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.locator("strong", { hasText: "Texto en negrita" })).toBeVisible();

  const cover = page.locator("article img").first();
  await expect(cover).toBeVisible();
  const src = await cover.getAttribute("src");
  expect(src).toMatch(/\/media\/news\//);
  expect((await page.request.get(src as string)).status()).toBe(200);
});

test("una persona sin permisos no puede entrar al panel de noticias", async ({ page }) => {
  await signIn(page, E2E_STUDENT.email, E2E_PASSWORD);
  await page.goto("/admin/noticias");
  await expect(page.getByRole("heading", { name: "Noticias y eventos" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Nueva publicación" })).toHaveCount(0);
});
