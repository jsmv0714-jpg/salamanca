-- Adapta la tabla "users" para better-auth.
-- Es la alternativa manual a `npx prisma db push` (usa una de las dos, no ambas).
-- Es seguro ejecutarla más de una vez.

ALTER TABLE users ADD COLUMN IF NOT EXISTS name varchar(200) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image varchar(500);

-- better-auth guarda el hash de la contraseña en account.password, no aquí.
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Conserva el estado de verificación de usuarios que ya existían.
UPDATE users SET email_verified = true WHERE email_verified_at IS NOT NULL;

-- Nota: las tablas session, account y verification las crea `npx prisma db push`
-- a partir de prisma/schema.prisma; no se repiten aquí.
