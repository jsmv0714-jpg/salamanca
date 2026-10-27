# Marketplace UniSalamanca

Marketplace del Consultorio Empresarial Winner de la Universidad de Salamanca Colombia. Conecta empresas, estudiantes, emprendedores, agremiaciones y docentes para publicar ofertas de prácticas y oportunidades B2B (ofertas y solicitudes de servicios entre empresas).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- PostgreSQL + Prisma 5
- better-auth (correo y contraseña)
- Tailwind CSS 4 + lucide-react

## Puesta en marcha

```bash
npm install
cp .env.example .env        # en Windows: copy .env.example .env  (y completa los valores)
npx prisma db push          # crea/actualiza las tablas según prisma/schema.prisma
npm run dev                 # http://localhost:3000
```

Si ya tienes la base de datos creada por otro medio, en lugar de `db push` puedes ejecutar `prisma/sql/001_better_auth_users.sql` una vez.

## Estructura

```
app/                  Rutas (App Router)
  api/auth/[...all]/  Endpoint de better-auth
  publicaciones/      Listado con filtros y detalle por slug
  login/  registro/   Autenticación
components/           Componentes de interfaz (layout, publicaciones)
lib/                  prisma.ts, auth.ts (servidor), auth-client.ts, roles.ts
prisma/schema.prisma  Modelo de datos
```

## Seguridad

- El rol `admin` no se puede elegir al registrarse; se asigna directamente en la base de datos.
- Nunca subas `.env` a git (ya está en `.gitignore`).

## Documentación

La documentación detallada (arquitectura, modelo de datos, autenticación y pendientes) está en el documento del proyecto compartido por el equipo.
