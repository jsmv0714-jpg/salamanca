import { test as setup, expect } from "@playwright/test";
import { seedFixtures } from "./fixtures";

setup("crea las cuentas y la publicación de prueba", async () => {
  await seedFixtures();
  expect(true).toBe(true);
});
