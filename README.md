# Marketplace UniSalamanca

Marketplace del Consultorio Empresarial Winner de la Universidad de Salamanca Colombia. Conecta empresas, estudiantes, emprendedores, agremiaciones y docentes para publicar ofertas de prácticas y oportunidades B2B (ofertas y solicitudes de servicios entre empresas).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- PostgreSQL + Prisma 5
- better-auth (correo y contraseña)
- Tailwind CSS 4 + lucide-react

## Puesta en marcha

```bash
npm install                 # instala dependencias y genera el cliente de Prisma
cp .env.example .env        # en Windows: copy .env.example .env  (y completa los valores)
npx prisma migrate deploy   # aplica las migraciones y crea las tablas
npm run dev                 # http://localhost:3000
```

Para crear nuevas migraciones durante el desarrollo usa `npm run db:migrate`; `npm run db:status` muestra el estado y `npm run db:seed` carga las áreas de ejemplo. Si solo estás explorando el modelo, `npm run db:push` sigue disponible, pero no reemplaza a las migraciones en producción.

Si ya tienes la base de datos creada por otro medio, puedes ejecutar `prisma/sql/001_better_auth_users.sql` una vez.

## Correo

Los correos transaccionales (recuperación de contraseña, verificación y avisos de postulaciones) usan Resend cuando existe `RESEND_API_KEY`. Sin esa variable, el correo se imprime en la consola del servidor, lo que permite probar los flujos en local sin proveedor externo. `EMAIL_FROM` es opcional y define el remitente.

## Medios

Las publicaciones aceptan hasta 10 archivos: imágenes JPG, PNG o WebP de 5 MB y videos MP4 o WebM de 50 MB. Cada imagen se re-encodea con `sharp` (se eliminan los metadatos EXIF/GPS y se limita a 2000 px) y se genera una miniatura WebP de 640 px para las tarjetas.

- Sin `S3_BUCKET`, en desarrollo los archivos se guardan en `.uploads/` y los sirve la ruta `/media/[...key]`. En producción la subida falla si no hay bucket configurado.
- Con `S3_BUCKET` (Cloudflare R2, AWS S3 u otro compatible), el navegador sube el archivo directamente con una URL firmada y el servidor solo confirma y procesa la imagen. El bucket debe permitir `PUT` desde el dominio de la app (CORS: `PUT`, cabecera `Content-Type`) y `MEDIA_PUBLIC_URL` es obligatoria: debe apuntar al dominio público del bucket o a su URL `r2.dev`.

## Notificaciones y reportes

Las postulaciones, las decisiones sobre ellas y la aprobación o rechazo de publicaciones generan avisos internos en `/cuenta/notificaciones`; la campana del encabezado muestra los que están sin leer. No sustituyen al correo: conviven con él.

Cualquier persona con sesión activa puede reportar una publicación desde su ficha (`/publicaciones/[slug]/reportar`), salvo quien la publicó. Los reportes llegan a `/admin/reportes`, donde un administrador puede marcarlos como resueltos, descartarlos o retirar la publicación (queda rechazada con el motivo y se resuelven todos sus reportes abiertos). Tanto el autor como quienes reportaron reciben un aviso cuando se toma la decisión.

## Estructura

```
app/                  Rutas (App Router)
  api/auth/[...all]/  Endpoint de better-auth
  publicaciones/      Listado con filtros, paginación y detalle por slug
  cuenta/             Panel de la persona: perfil, publicaciones, postulaciones, directorio y notificaciones
  admin/              Moderación de publicaciones, ventures, usuarios y reportes de abuso
  login/  registro/   Autenticación
  recuperar/  restablecer/  Recuperación de contraseña
components/           Componentes de interfaz (layout, publicaciones)
lib/                  prisma.ts, auth.ts (servidor), auth-client.ts, roles.ts, email.ts
scripts/              Utilidades de consola (administradores, datos de ejemplo)
prisma/migrations/    Migraciones de la base de datos
tests/                Pruebas unitarias con Vitest (`npm test`)
e2e/                  Pruebas de extremo a extremo con Playwright (`npm run test:e2e`)
```

## Pruebas

`npm test` ejecuta las pruebas unitarias con Vitest. Para las de extremo a extremo, instala una vez el navegador (`npx playwright install chromium`) y ejecuta `npm run test:e2e`: Playwright levanta el servidor de desarrollo, crea cuentas y una publicación con correos `e2e.*`, recorre registro, inicio de sesión, reporte y moderación, y al terminar borra esos datos. `npm run test:e2e:ui` abre el modo interactivo. Con `E2E_BASE_URL` puedes apuntar a un entorno ya desplegado (por ejemplo, un staging); no lo uses contra producción porque el flujo escribe datos de prueba.

Cada ejecución consume un registro del límite de 10 por hora y varios inicios de sesión del límite de 20 por 15 minutos, ambos por IP y guardados en memoria. Si repites la suite muchas veces contra el mismo servidor de desarrollo, reinícialo para limpiar esos contadores.

## Administradores

El rol `admin` no se puede elegir al registrarse. Para el primer administrador usa `npm run admin:promote -- correo@ejemplo.com` (y `admin:demote` para retirarlo). Después, un administrador puede promover o retirar el rol desde `/admin/usuarios`; el sistema impide quitarse el propio rol o dejar la plataforma sin administradores y registra cada cambio en `role_changes`.

## Despliegue y operación

Antes de publicar, revisa `.env.example` y define al menos `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL` y las variables de almacenamiento (`S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `MEDIA_PUBLIC_URL`). Sin bucket, las subidas fallan en producción. Para el correo real, verifica el dominio en Resend (SPF y DKIM), define `RESEND_API_KEY` y ajusta `EMAIL_FROM`; sin la clave los correos solo se imprimen en consola.

En cada despliegue ejecuta `npm run db:deploy` antes de arrancar la app (`npm run build` y `npm start`). El endpoint `GET /api/health` responde `200` con `{"status":"ok"}` cuando la base de datos contesta y `503` cuando no; úsalo en el monitor de disponibilidad (por ejemplo, cada minuto, avisando tras dos fallos seguidos) y revisa los errores 5xx en los registros del servidor.

Copias de seguridad: programa un `pg_dump` diario en formato custom (`pg_dump "$DATABASE_URL" --format=custom --file=copia.dump`), guárdalo fuera del servidor con retención de al menos 30 días y prueba una restauración mensual en una base vacía (`pg_restore --clean --no-owner --dbname=...`). Para los medios, activa versionado en el bucket o copia periódica: `.uploads/` es solo para desarrollo y no debe usarse en producción.

Las páginas de términos, privacidad y contacto siguen marcadas como borrador hasta que la universidad valide el texto legal y el correo de contacto; no quites ese aviso sin esa revisión.

### Lista de verificación antes de publicar

1. Variables de producción completas y con secretos propios (no los de desarrollo): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL` y el bloque `S3_*` + `MEDIA_PUBLIC_URL`.
2. Base de datos: `npm run db:status` sin migraciones pendientes, `npm run db:deploy` en el despliegue y el primer administrador creado con `npm run admin:promote -- correo@dominio`.
3. Almacenamiento: CORS del bucket limitado al dominio de la app (`PUT` y `Content-Type`), `MEDIA_PUBLIC_URL` sin barra final y una subida de prueba (imagen y video) desde una publicación.
4. Correo: dominio verificado en Resend con SPF y DKIM, y pruebas reales de verificación de cuenta, recuperación de contraseña y aviso de postulación.
5. Legal y contenido: términos, privacidad y correo de contacto validados por la universidad; retirar el aviso de borrador solo después de esa revisión.
6. Operación: monitor sobre `/api/health` (alerta tras dos fallos seguidos), revisión de errores 5xx y copias de seguridad de base de datos y medios con restauración probada.
7. Calidad: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e` y `npm run build` en verde sobre el commit que se va a desplegar.

## Despliegue gratuito (Render, Neon, Cloudflare R2, UptimeRobot)

Todo el despliegue usa planes gratuitos. Limitaciones: la app en Render se duerme tras 15 minutos sin tráfico (tarda cerca de un minuto en despertar; el monitor de UptimeRobot la mantiene activa), y Neon guarda 1 GB por proyecto y no hace copias automáticas, por eso existe la copia diaria de GitHub Actions.

1. **Base de datos (Neon).** Crea un proyecto en el plan Free y copia la cadena de conexión con `sslmode=require`. Será `DATABASE_URL`.
2. **Archivos (Cloudflare R2).** Crea dos buckets: `unisalamanca-media` (medios) y `unisalamanca-backups` (copias). En el de medios activa el acceso público de desarrollo (`MEDIA_PUBLIC_URL`) y aplica la política CORS de la sección de medios. Crea un token de API con lectura y escritura solo para cada bucket: uno para `S3_*` y otro para `BACKUP_S3_*`. En el bucket de copias añade una regla de ciclo de vida que borre objetos de más de 30 días.
3. **Aplicación (Render).** En *New → Blueprint* conecta el repositorio; Render lee `render.yaml`. Completa las variables marcadas como secretas (`DATABASE_URL`, `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` con la URL de Render, `RESEND_API_KEY`, `EMAIL_FROM`, `CONTACT_EMAIL` y las `S3_*`). `BETTER_AUTH_SECRET` se genera sola. Hay una plantilla en `render-import.env.example`: cópiala a `render-import.env`, rellena los valores y pégala en *Environment → Import from .env*; el archivo local está ignorado por Git.
4. **Primer administrador.** Como Render Free no ofrece consola, ejecútalo desde tu equipo con la `DATABASE_URL` de Neon en `.env`: `npm run admin:promote -- correo@dominio`.
5. **Monitor (UptimeRobot).** Crea un monitor HTTP sobre `https://<tu-app>.onrender.com/api/health` cada 5 minutos con aviso por correo. Opcional: crea un monitor tipo *heartbeat* para las copias y pon su URL en `BACKUP_HEARTBEAT_URL`.
6. **Copias (GitHub Actions).** En *Settings → Secrets and variables → Actions* agrega `DATABASE_URL`, `BACKUP_S3_ENDPOINT`, `BACKUP_S3_BUCKET`, `BACKUP_S3_ACCESS_KEY_ID` y `BACKUP_S3_SECRET_ACCESS_KEY` (y opcionalmente `BACKUP_HEARTBEAT_URL`). El flujo corre cada día a las 05:17 UTC y puedes lanzarlo a mano desde la pestaña *Actions*. Mientras falte alguno de esos secretos, la ejecución termina sin error y solo deja un aviso en el registro; en cuanto estén completos, las copias empiezan a subirse solas.

Revisa cada mes que la copia se haya creado y restaura una en una base vacía (`pg_restore --clean --no-owner --dbname=...`); una copia que nunca se ha probado no sirve.

## Seguridad

- Las rutas de administración responden **404** a quien no es administrador: no revelamos que la ruta existe ni ofrecemos una pantalla de "acceso denegado".
- El rol `admin` no se puede asignar desde el registro público ni desde `/api/auth/update-user`; solo desde el panel o la consola.
- Nunca subas `.env` a git (ya está en `.gitignore`).

## Documentación

La documentación detallada (arquitectura, modelo de datos, autenticación y pendientes) está en el documento del proyecto compartido por el equipo.
