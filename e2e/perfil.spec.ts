import { test, expect, type Page } from "@playwright/test";
import { E2E_COMPANY, E2E_PASSWORD, E2E_STUDENT } from "./fixtures";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/cuenta$/);
}

test("perfil profesional: se guarda y se ve como lo vería otra persona", async ({ page }) => {
  await signIn(page, E2E_STUDENT.email, E2E_PASSWORD);
  await page.goto("/cuenta/perfil-profesional");

  await page.getByLabel("Titular").fill("Estudiante de Ingeniería · Datos");
  await page.getByLabel("Perfil profesional", { exact: true }).fill("Busco prácticas en analítica de datos.");
  const skills = page.getByLabel("Habilidades");
  await skills.fill("Python");
  await skills.press("Enter");
  await skills.fill("SQL");
  await skills.press("Enter");
  await skills.fill("python");
  await skills.press("Enter");
  await page.getByLabel("LinkedIn").fill("https://www.linkedin.com/in/estudiante-e2e");
  await page.getByText("Mostrar mi perfil a otros miembros").click();
  await expect(page.getByLabel("Mostrar mi perfil a otros miembros")).toBeChecked();
  await page.getByRole("button", { name: "Guardar perfil" }).click();

  await expect(page.getByText("Perfil guardado.")).toBeVisible();

  await page.getByRole("link", { name: "Ver cómo me ven otros" }).click();
  await expect(page.getByRole("heading", { name: E2E_STUDENT.name })).toBeVisible();
  const profile = page.getByRole("article");
  await expect(profile.getByText("Busco prácticas en analítica de datos.")).toBeVisible();
  await expect(profile.getByText("Python", { exact: true })).toBeVisible();
  await expect(profile.getByText("SQL", { exact: true })).toBeVisible();
  await expect(profile.getByRole("link", { name: "LinkedIn" })).toBeVisible();
});

// Imagen PNG válida de 1×1 píxel.
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

test("sube una foto de perfil y se muestra", async ({ page }) => {
  await signIn(page, E2E_STUDENT.email, E2E_PASSWORD);
  await page.goto("/cuenta/perfil-profesional");
  await expect(page.getByRole("button", { name: "Guardar perfil" })).toBeEnabled();

  await page.locator('input[type="file"]').setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: PNG_1X1 });

  await expect(page.getByText("Foto actualizada.")).toBeVisible();
  const photo = page.getByAltText(`Foto de ${E2E_STUDENT.name}`);
  await expect(photo).toBeVisible();
  const src = await photo.getAttribute("src");
  expect(src).toMatch(/\/media\/avatars\//);
  const response = await page.request.get(src as string);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/webp");
});

test("cada rol ve sus propios campos", async ({ page }) => {
  await signIn(page, E2E_COMPANY.email, E2E_PASSWORD);
  await page.goto("/cuenta/perfil-profesional");

  await expect(page.getByRole("heading", { name: "Logo" })).toBeVisible();
  await expect(page.getByLabel("Servicios y capacidades")).toBeVisible();
  await expect(page.getByLabel("Dirección")).toBeVisible();
  await expect(page.getByLabel("Carrera")).toHaveCount(0);
  await expect(page.getByLabel("Semestre")).toHaveCount(0);
});

test("un enlace de otra red no se guarda", async ({ page }) => {
  await signIn(page, E2E_STUDENT.email, E2E_PASSWORD);
  await page.goto("/cuenta/perfil-profesional");

  await page.getByLabel("LinkedIn").fill("https://instagram.com/estudiante");
  await page.getByRole("button", { name: "Guardar perfil" }).click();

  await expect(page.getByText("El enlace debe ser de LinkedIn.")).toBeVisible();
});
