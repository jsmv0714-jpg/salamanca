-- Las cuentas creadas antes de exigir verificación de correo se consideran verificadas.
-- Sin esto, requireEmailVerification dejaría sin acceso a las cuentas existentes.
UPDATE "users" SET "email_verified" = true WHERE "email_verified" = false;
