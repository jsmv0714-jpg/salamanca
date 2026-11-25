import { test, expect, type Page } from "@playwright/test";
import { E2E_PASSWORD, E2E_PUBLICATION_SLUG, E2E_STUDENT } from "./fixtures";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/cuenta$/);
}

test("el listado muestra el detalle a la derecha y se puede guardar la publicación", async ({ page }) => {
  await signIn(page, E2E_STUDENT.email, E2E_PASSWORD);
  await page.goto(`/publicaciones?ver=${E2E_PUBLICATION_SLUG}`);

  const detail = page.getByRole("region", { name: "Detalle de la publicación" });
  await expect(detail.getByRole("link", { name: "Aplicar" })).toBeVisible();

  const save = detail.getByRole("button", { name: "Guardar en mi perfil" });
  await save.click();
  await expect(detail.getByRole("button", { name: "Quitar de guardadas" })).toBeVisible();

  await page.goto("/cuenta/guardados");
  await expect(page.getByText("Publicaciones guardadas (1)")).toBeVisible();
});

test("denunciar exige justificar el motivo", async ({ page }) => {
  await signIn(page, E2E_STUDENT.email, E2E_PASSWORD);
  await page.goto(`/publicaciones?ver=${E2E_PUBLICATION_SLUG}`);

  const detail = page.getByRole("region", { name: "Detalle de la publicación" });
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

  test("al pulsar una publicación se ve el detalle y se puede volver al listado", async ({ page }) => {
    await page.goto("/publicaciones");

    const list = page.getByRole("region", { name: "Listado de publicaciones" });
    await list.getByRole("link").filter({ hasText: "Práctica E2E de prueba" }).click();

    await expect(page).toHaveURL(/ver=e2e-practica-smoke/);
    const detail = page.getByRole("region", { name: "Detalle de la publicación" });
    await expect(detail).toBeVisible();
    await expect(detail.getByRole("heading", { name: "Práctica E2E de prueba" })).toBeVisible();
    await expect(list).toBeHidden();

    await page.getByRole("link", { name: "Volver al listado" }).click();
    await expect(list).toBeVisible();
    await expect(page).not.toHaveURL(/ver=/);
  });
});
