import { test, expect, type Page } from "@playwright/test";
import {
  E2E_ADMIN,
  E2E_COMPANY,
  E2E_PASSWORD,
  E2E_PUBLICATION_SLUG,
  E2E_STUDENT,
} from "./fixtures";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/cuenta$/);
}

async function signOut(page: Page) {
  await page.goto("/cuenta");
  // La cabecera también tiene un botón "Cerrar sesión": se usa el de la página para no depender del orden de carga.
  await page.getByRole("main").getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).not.toHaveURL(/\/cuenta/);
}

test("el chequeo de salud responde ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { status: string; checks: { database: string } };
  expect(body.status).toBe("ok");
  expect(body.checks.database).toBe("ok");
});

test("el registro avisa que hay que confirmar el correo", async ({ page }) => {
  const email = `e2e.registro.${Date.now()}@unisalamanca.test`;

  await page.goto("/registro");
  await page.getByLabel("Nombre completo / Razón social").fill("Registro E2E");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText(/Cuenta creada\. Te enviamos un enlace/)).toBeVisible();
});

test("inicio y cierre de sesión", async ({ page }) => {
  await signIn(page, E2E_STUDENT.email, E2E_STUDENT.password);
  await expect(page.getByRole("heading", { name: /^Hola, Estudiante/ })).toBeVisible();

  await signOut(page);
  await expect(page.getByRole("heading", { name: /Conectamos/ })).toBeVisible();
});

test("solo quien puede publicar ve los botones de crear", async ({ page }) => {
  // exact: el título "Ventures" también coincide con el aviso "Aún no hay ventures publicadas".
  await page.goto("/publicaciones");
  await expect(page.getByRole("heading", { name: "Publicaciones", exact: true })).toBeVisible();
  await page.goto("/ventures");
  await expect(page.getByRole("heading", { name: "Ventures", exact: true })).toBeVisible();

  await signIn(page, E2E_STUDENT.email, E2E_STUDENT.password);
  await page.goto("/publicaciones");
  await expect(page.getByRole("heading", { name: "Publicaciones", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Publicar", exact: true })).toHaveCount(0);
  await page.goto("/ventures");
  await expect(page.getByRole("heading", { name: "Ventures", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Registrar una venture" })).toHaveCount(0);
  await signOut(page);

  await signIn(page, E2E_COMPANY.email, E2E_COMPANY.password);
  await page.goto("/publicaciones");
  await expect(page.getByRole("link", { name: "Publicar", exact: true })).toBeVisible();
  await page.goto("/ventures");
  await expect(page.getByRole("heading", { name: "Ventures", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Registrar una venture" })).toHaveCount(0);
  await signOut(page);
});

test.describe("retirar una postulación y volver a enviarla una vez", () => {
  test.describe.configure({ mode: "serial" });

  async function sendInternshipApplication(page: Page) {
    await page.goto(`/publicaciones/${E2E_PUBLICATION_SLUG}`);
    await page.getByLabel("¿Por qué te interesa esta práctica?").fill("Me interesa la práctica por mi experiencia en desarrollo web.");
    await page.locator('input[name="cv_file"]').setInputFiles({
      name: "hoja-de-vida.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% hoja de vida de prueba E2E\n"),
    });
    await page.locator('input[name="data_consent"]').check();
    await page.getByRole("button", { name: "Enviar postulación" }).click();
  }

  async function withdrawApplication(page: Page) {
    await page.goto("/cuenta/postulaciones");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Retirar postulación" }).click();
    await expect(page.getByText("Retirada", { exact: true })).toBeVisible();
  }

  test("se retira, vuelve a postularse una vez y después ya no puede", async ({ page }) => {
    await signIn(page, E2E_STUDENT.email, E2E_STUDENT.password);

    await sendInternshipApplication(page);
    await expect(page).toHaveURL(/\/cuenta\/postulaciones\?enviada=1$/);

    await withdrawApplication(page);
    await expect(page.getByText("enviar una nueva postulación")).toBeVisible();

    await sendInternshipApplication(page);
    await expect(page).toHaveURL(/\/cuenta\/postulaciones\?enviada=1$/);
    await expect(page.getByRole("button", { name: "Retirar postulación" })).toBeVisible();

    await withdrawApplication(page);
    await expect(page.getByText("enviar una nueva postulación")).toHaveCount(0);

    await page.goto(`/publicaciones/${E2E_PUBLICATION_SLUG}`);
    await expect(page.getByText("Ya volviste a postularte una vez", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "Enviar postulación" })).toHaveCount(0);

    await signOut(page);
  });
});

test.describe("reporte de una publicación y moderación", () => {
  test.describe.configure({ mode: "serial" });

  test("un estudiante reporta una publicación una sola vez", async ({ page }) => {
    await signIn(page, E2E_STUDENT.email, E2E_STUDENT.password);

    await page.goto(`/publicaciones/${E2E_PUBLICATION_SLUG}`);
    await page.getByRole("link", { name: "Reportar esta publicación" }).click();
    await expect(page).toHaveURL(new RegExp(`/publicaciones/${E2E_PUBLICATION_SLUG}/reportar$`));

    await page.getByLabel("Motivo").selectOption("scam");
    await page.getByLabel("Detalles (opcional)").fill("Prueba E2E: la publicación pide un pago para postularse.");
    await page.getByRole("button", { name: "Enviar reporte" }).click();
    await expect(page.getByText(/Recibimos tu reporte/)).toBeVisible();

    // Al volver al formulario, ya consta el reporte y no se puede duplicar.
    await page.goto(`/publicaciones/${E2E_PUBLICATION_SLUG}/reportar`);
    await expect(page.getByText("Ya reportaste esta publicación", { exact: false })).toBeVisible();

    await signOut(page);
  });

  test("un administrador resuelve el reporte y avisa al estudiante", async ({ page }) => {
    await signIn(page, E2E_ADMIN.email, E2E_ADMIN.password);

    await page.goto("/admin/reportes");
    await expect(page.getByRole("heading", { name: "Reportes de abuso" })).toBeVisible();
    await expect(page.getByText("Práctica E2E de prueba").first()).toBeVisible();

    await page.getByLabel(/Nota para el reporte/).fill("Revisado en la prueba E2E: no se retira la publicación.");
    await page.getByRole("button", { name: "Marcar resuelto" }).click();
    await expect(page.getByText("Reporte marcado como resuelto.")).toBeVisible();

    await signOut(page);

    await signIn(page, E2E_STUDENT.email, E2E_STUDENT.password);
    await page.goto("/cuenta/notificaciones");
    await expect(page.getByRole("heading", { name: "Notificaciones" })).toBeVisible();
    await expect(page.getByText("Reporte revisado").first()).toBeVisible();
  });
});
