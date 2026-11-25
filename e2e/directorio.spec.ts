import { test, expect, type Page } from "@playwright/test";
import { E2E_DIRECTORY_PROFILE_ID, E2E_PASSWORD, E2E_STUDENT } from "./fixtures";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(E2E_STUDENT.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/cuenta$/);
}

test("el directorio selecciona la ficha por URL y permite guardarla", async ({ page }) => {
  await signIn(page);
  await page.goto(`/directorio?ver=${E2E_DIRECTORY_PROFILE_ID}`);

  const detail = page.getByRole("region", { name: "Detalle del miembro del directorio" });
  await expect(detail.getByRole("heading", { name: "Empresa E2E" })).toBeVisible();
  await expect(detail.getByText("Áreas de asesoría")).toBeVisible();

  await detail.getByRole("button", { name: "Guardar en mi perfil" }).click();
  await expect(detail.getByRole("button", { name: "Quitar de guardadas" })).toBeVisible();

  await page.goto("/cuenta/guardados");
  await expect(page.getByText("Miembros del directorio guardados (1)")).toBeVisible();
  await expect(page.getByRole("link", { name: "Empresa E2E" })).toBeVisible();
});

test("denunciar una ficha del directorio exige justificar el motivo", async ({ page }) => {
  await signIn(page);
  await page.goto(`/directorio?ver=${E2E_DIRECTORY_PROFILE_ID}`);

  const detail = page.getByRole("region", { name: "Detalle del miembro del directorio" });
  await detail.getByRole("button", { name: "Más opciones" }).click();
  await page.getByRole("menuitem", { name: "Denunciar ante un administrador" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Motivo").selectOption("spam");
  await dialog.getByLabel("Justifica tu denuncia").fill("muy corto");
  await dialog.getByRole("button", { name: "Enviar denuncia" }).click();

  await expect(dialog.getByText(/al menos 20 caracteres/)).toBeVisible();
});

test.describe("en móvil", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("al pulsar un miembro se ve su ficha y se puede volver al listado", async ({ page }) => {
    await page.goto("/directorio");

    const list = page.getByRole("region", { name: "Listado del directorio" });
    await list.getByRole("link").filter({ hasText: "Empresa E2E" }).click();

    await expect(page).toHaveURL(new RegExp(`ver=${E2E_DIRECTORY_PROFILE_ID}`));
    const detail = page.getByRole("region", { name: "Detalle del miembro del directorio" });
    await expect(detail).toBeVisible();
    await expect(detail.getByRole("heading", { name: "Empresa E2E" })).toBeVisible();
    await expect(list).toBeHidden();

    await page.getByRole("link", { name: "Volver al listado" }).click();
    await expect(list).toBeVisible();
    await expect(page).not.toHaveURL(/ver=/);
  });
});
