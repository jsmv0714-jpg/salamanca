# Guion de presentación — Marketplace UniSalamanca

**Duración sugerida:** 8–10 minutos de exposición + 5 minutos de preguntas  
**Público:** profesorado, Consultorio Empresarial Winner, equipo de proyecto o evaluadores  
**Objetivo:** mostrar que la plataforma no es solo una maqueta, sino un producto desplegado con flujos reales, moderación, seguridad y operación gratuita.

> Consejo: ten abiertas tres pestañas antes de empezar: la app desplegada, `/api/health` y el repositorio en GitHub.

---

## 1. Pitch de 30 segundos

> “Marketplace UniSalamanca es una plataforma web gratuita y desplegada que conecta a empresas, estudiantes, emprendedores, docentes y agremiaciones con oportunidades de prácticas y servicios B2B. Permite publicar, postularse, mostrar un directorio del ecosistema Winner y moderar contenido con trazabilidad. Está construida con Next.js 16, React 19, TypeScript, PostgreSQL en Neon y Cloudflare R2, y se ejecuta en Render con copias automáticas y monitorización. El foco no fue solo que se viera bien, sino que fuera seguro, auditable y operativo con coste cero.”

---

## 2. Estructura sugerida de la presentación

| Tiempo | Bloque | Mensaje clave |
|---:|---|---|
| 0:00–0:45 | Introducción | El problema y qué resuelve |
| 0:45–1:45 | Stack y arquitectura | Tecnología moderna y despliegue gratuito |
| 1:45–3:30 | Recorrido funcional | Publicaciones, directorio, ventures, noticias y cuenta |
| 3:30–5:00 | Demo en vivo | Flujos reales con acciones |
| 5:00–6:30 | Seguridad y moderación | Lo que diferencia al proyecto de un CRUD |
| 6:30–8:00 | Operación y calidad | Despliegue, copias, monitor y pruebas |
| 8:00–8:30 | Cierre | Estado actual y próximos pasos |

---

## 3. Guion por diapositivas

### Diapositiva 1 — Título

**Texto en pantalla**

> Marketplace UniSalamanca  
> Consultorio Empresarial Winner · Universidad de Salamanca Colombia  
> Plataforma web de oportunidades, directorio y moderación

**Qué decir**

> “Buenos días. Hoy presento el Marketplace UniSalamanca, una plataforma pensada para que el ecosistema empresarial de la Universidad de Salamanca Colombia pueda encontrar talento, ofrecer servicios y mostrar capacidades de forma organizada. La versión que muestro hoy está desplegada y con flujos reales, no es una maqueta.”

**Destacar**

- Enlace de producción.
- Repositorio en GitHub.

---

### Diapositiva 2 — El problema

**Texto en pantalla**

> La oferta de prácticas y servicios estaba dispersa  
> Difícil visibilidad del ecosistema  
> Sin moderación ni trazabilidad

**Qué decir**

> “El problema que abordamos tiene tres partes. Primero, las oportunidades de prácticas y los servicios entre empresas estaban dispersos. Segundo, no había una forma clara de descubrir perfiles de estudiantes, emprendedores, empresas y docentes. Y tercero, cualquier espacio abierto necesita moderación: reportes, revisión y una auditoría de quién hace cada cambio.”

---

### Diapositiva 3 — Qué construimos

**Texto en pantalla**

> Publicaciones B2B y de prácticas  
> Postulaciones con hoja de vida  
> Directorio Winner  
> Ventures y noticias  
> Panel de administración

**Qué decir**

> “Construimos un marketplace con seis áreas claras. Publicaciones para prácticas y servicios B2B; postulaciones con mensaje y hoja de vida; directorio público del ecosistema; ventures para spin-offs y startups; noticias y eventos; y un panel de administración para revisar contenido, usuarios y reportes.”

---

### Diapositiva 4 — Stack y por qué elegimos cada pieza

**Texto en pantalla**

| Necesidad | Herramienta |
|---|---|
| Interfaz y rutas | Next.js 16 · React 19 · TypeScript |
| Estilos | Tailwind CSS 4 |
| Datos | PostgreSQL en Neon + Prisma 5 |
| Acceso | better-auth |
| Archivos | Cloudflare R2 |
| Imágenes | sharp |
| Correo | Gmail SMTP (con Resend como respaldo) |
| Despliegue | Render · GitHub Actions · UptimeRobot |

**Qué decir**

> “Usamos Next.js 16 con App Router, React 19 y TypeScript para toda la aplicación. La base es PostgreSQL en Neon, accedida con Prisma. La autenticación la resuelve better-auth con verificación obligatoria de correo. Los archivos van a Cloudflare R2, compatible con S3, y las imágenes se procesan en servidor con sharp para quitar metadatos y generar miniaturas. El correo sale por Gmail SMTP, con Resend como respaldo. Todo se despliega en Render, con copias en GitHub Actions y monitorización en UptimeRobot. La clave aquí es que cada pieza tiene un propósito y todas caben en planes gratuitos.”

**Frase para memorizar**

> “Next para la experiencia, Prisma y Neon para los datos, better-auth para la identidad, R2 para los archivos y GitHub/Render/UptimeRobot para operar.”

---

### Diapositiva 5 — Arquitectura

**Texto en pantalla**

> Navegador → Render (Next.js) → Neon PostgreSQL  
> Render → Cloudflare R2 (medios)  
> Render → Gmail SMTP (correo)  
> UptimeRobot → `/api/health`  
> GitHub Actions → copia diaria → R2

**Qué decir**

> “El navegador habla solo con la aplicación en Render. La aplicación valida sesión y permisos en servidor, consulta Neon con Prisma, guarda medios en R2 y envía correos por SMTP. UptimeRobot consulta el endpoint de salud cada cinco minutos para mantener despierta la app y avisar si falla. GitHub Actions hace una copia diaria de PostgreSQL y la sube a un bucket separado de R2.”

---

### Diapositiva 6 — Demo: recorrido público

**Acciones en pantalla**

1. Abrir la portada.
2. Entrar a `/publicaciones` y aplicar un filtro.
3. Abrir el detalle de una publicación.
4. Entrar a `/directorio`, cambiar filtro y abrir un perfil con `?ver=`.
5. Entrar a `/ventures` y `/noticias`.

**Qué decir**

> “Empiezo por la parte pública. En publicaciones podemos filtrar y paginar, y el detalle muestra requisitos, beneficios, modalidad y contacto. En el directorio podemos filtrar el ecosistema y abrir un perfil concreto; la URL conserva el estado con parámetros como `?ver=` y `?page=`, así que se puede compartir. Ventures muestra iniciativas y noticias mantiene informada a la comunidad.”

---

### Diapositiva 7 — Demo: acciones reales

**Acciones en pantalla**

1. Iniciar sesión con la cuenta administradora.
2. En una publicación o perfil del directorio: guardar, compartir, ocultar y denunciar.
3. Ver `/cuenta/guardados`.
4. Mostrar `/cuenta/notificaciones`.

**Qué decir**

> “Las acciones no son decorativas. Guardar, ocultar y denunciar escriben en la base de datos. Los elementos guardados aparecen en `/cuenta/guardados`, y las denuncias llegan al panel de administración con su justificación, que va de 20 a 1000 caracteres. Además, las decisiones y novedades generan notificaciones internas; el correo las complementa, pero no es la única vía.”

**Importante**

- No hagas una denuncia falsa en producción si no vas a resolverla después.
- Si quieres algo rápido, muestra solo guardar y compartir.

---

### Diapositiva 8 — Demo: administración y seguridad

**Acciones en pantalla**

1. Abrir `/admin/usuarios`.
2. Abrir `/admin/reportes`, `/admin/reportes/ventures` o `/admin/reportes/directorio`.
3. Mostrar `/api/health`.

**Qué decir**

> “El panel de administración no se anuncia a quien no es admin: las rutas devuelven 404. Desde aquí se aprueban o rechazan publicaciones, se resuelven reportes y se gestionan roles. El rol admin no se puede elegir al registrarse y cada cambio queda registrado en una tabla de auditoría. El sistema impide quitarse el propio rol o dejar la plataforma sin administradores. Finalmente, `/api/health` nos dice si la base responde y si el almacenamiento está en modo remoto.”

---

### Diapositiva 9 — Calidad y operación

**Texto en pantalla**

> Verificación obligatoria · Rate limits · CSRF por Origin  
> imágenes sin EXIF · CV validado · auditoría de roles  
> migraciones automáticas · copias diarias · monitor externo  
> typecheck · lint · Vitest · Playwright · build

**Qué decir**

> “Hay varias capas que normalmente no se ven pero marcan la diferencia. Verificación de correo obligatoria, límites de intentos guardados en base de datos, protección CSRF por origen, redirecciones seguras y cabeceras de seguridad. Las imágenes se re-codifican para eliminar metadatos de ubicación, y las hojas de vida se validan por firma real y se descargan solo desde roles autorizados. En calidad, dejamos en verde `typecheck`, `lint`, pruebas unitarias, pruebas de extremo a extremo y build. En Operación, Render aplica migraciones antes de arrancar y GitHub Actions guarda copias diarias.”

---

### Diapositiva 10 — Cierre

**Texto en pantalla**

> Producto desplegado con coste cero  
> Flujos reales y moderación  
> Seguridad y trazabilidad  
> Siguiente paso: correo real, copias activas y textos legales aprobados

**Qué decir**

> “Para cerrar: lo que hoy se muestra es un marketplace operativo con coste cero, flujos reales y una arquitectura preparada para crecer. El siguiente paso operativo es terminar la configuración de almacenamiento y correo en producción, activar del todo las copias y monitors, y que la universidad valide los textos legales. Con eso, la plataforma queda lista para uso real.”

---

## 4. Programas, lenguajes y herramientas para destacar

### Lenguajes

- **TypeScript**: Base del proyecto; da seguridad de tipos en frontend y backend.
- **TSX**: Componentes React con tipado.
- **SQL**: Migraciones y consultas sobre PostgreSQL.
- **CSS / Tailwind**: Estilos utilitarios consistentes.
- **YAML**: Blueprint de Render y workflow de GitHub Actions.
- **Markdown**: Documentación.
- **Bash / PowerShell**: Automatización local y de despliegue.

### Programas y servicios

| Herramienta | Para qué sirve en el proyecto |
|---|---|
| Node.js 22 + npm | Ejecutar y gestionar dependencias |
| Next.js 16 | Framework web, rutas, server actions y renderizado |
| React 19 | Interfaz de usuario |
| TypeScript | Tipado estático |
| Tailwind CSS 4 | Diseño y estilos |
| Prisma 5 | Modelado de datos, migraciones y consultas tipadas |
| Prisma Studio | Exploración visual de la base |
| PostgreSQL / Neon | Base de datos gestionada |
| better-auth | Registro, login, sesiones y verificación |
| Cloudflare R2 | Imágenes, videos y backups |
| AWS SDK para S3 | Subida firmada y acceso al bucket |
| sharp | Procesamiento de imágenes y miniaturas |
| Nodemailer + Gmail SMTP | Correo transaccional |
| Resend | Respaldo de correo |
| Render | Hosting de la aplicación |
| GitHub / GitHub Actions | Versionado y copias diarias |
| UptimeRobot | Monitorización y avisos |
| Vitest | Pruebas unitarias |
| Playwright | Pruebas de extremo a extremo |
| ESLint | Calidad y convenciones de código |

---

## 5. Lo que más conviene destacar

1. **No es solo una maqueta:** hay login real, base de datos, archivos y despliegue.
2. **Moderación completa:** reportes de publicaciones, ventures y directorio con resolución y auditoría.
3. **Seguridad por diseño:** admin oculto, anti-escalada, CSRF, rate limits y cabeceras HTTP.
4. **Privacidad:** fotos re-codificadas sin EXIF/GPS; CV validado y con acceso restringido.
5. **Coste cero:** Render Free, Neon Free, R2, GitHub Actions y UptimeRobot.
6. **Operabilidad:** health check, migraciones automáticas, copias diarias y monitor.
7. **Calidad:** pruebas unitarias y E2E; build, lint y typecheck en verde.
8. **Crecimiento ordenado:** catálogos, estados y relaciones preparados para más contenido.

---

## 6. Demo de respaldo si falla internet

Si la app no responde por el planar de Render:

1. Explica que Render Free se duerme y puede tardar cerca de un minuto en despertar.
2. Muestra `/api/health` o el log de Render.
3. Abre el repositorio y recorre:
   - `README.md` → despliegue y checklist.
   - `prisma/schema.prisma` → modelo de datos.
   - `docs/DOCUMENTACION.md` → arquitectura y flujos.
   - `app/admin/` → moderación.
   - `tests/` y `e2e/` → calidad.

Frase de respaldo:

> “Este comportamiento es esperable en el plan gratuito; por eso añadimos UptimeRobot, que mantiene la app activa con consultas periódicas al health check.”

---

## 7. Posibles preguntas y respuestas rápidas

**¿Por qué Render y no Vercel?**  
Render permite ejecutar migraciones antes de arrancar y encaja con el servicio Node continuo que necesitamos; ambos tienen plan gratuito, pero Render simplifica el arranque con `npm run db:deploy && npm start`.

**¿Por qué Neon?**  
PostgreSQL gestionado con rama de producción y desarrollo, plan gratuito y compatible con Prisma. La contrapartida es que no trae copias automáticas, por eso añadimos GitHub Actions.

**¿Por qué R2 y no S3?**  
R2 es compatible con S3, evita costes de salida y permite separar medios de backups con tokens distintos.

**¿Cómo evitan que alguien se registre como administrador?**  
El rol no está en el formulario público; los hooks de better-auth descartan `role` y `status`, y las rutas de administración devuelven 404 a no administradores.

**¿Qué pasa si falla el correo?**  
Las notificaciones internas siguen funcionando. El SMTP es importante para verificación y recuperación, pero no es un punto único de fallo para la interacción dentro de la app; además, el proveedor se elige en tiempo de ejecución y Resend queda como respaldo.

**¿Las fotos suben directamente al bucket?**  
En publicaciones sí: el navegador usa una URL firmada y luego el servidor confirma. La foto de perfil se procesa y sube desde el servidor; por eso depende de las credenciales reales de R2 configuradas en Render.

**¿Cómo se prueba una copia?**  
Se descarga el volcado `custom` de R2 y se restaura en una base vacía con `pg_restore --clean --no-owner`. Una copia no probada no cuenta como copia válida.

**¿Los textos legales están listos?**  
No. Términos, privacidad y contacto siguen marcados como borrador hasta validación universitaria; es un pendiente explícito, no un olvido.

---

## 8. Checklist antes de presentar

- [ ] La app abre en producción.
- [ ] `/api/health` responde `200` con `database: ok`.
- [ ] La cuenta administradora entra y ve `/admin/usuarios`.
- [ ] La URL pública de una imagen cargada funciona.
- [ ] GitHub tiene los últimos commits de `main`.
- [ ] Render ya desplegó esos commits.
- [ ] Ventanas y pestañas preparadas: app, health, GitHub y docs.
- [ ] No hay secretos visibles en pantalla.
- [ ] Si se hará una denuncia de demo, obtener permiso o resolverla después.

---

## 9. Frase final sugerida

> “El valor del proyecto no está solo en que conecte ofertas y personas, sino en que lo hace con reglas claras, moderación, privacidad y una operación que cualquiera puede reproducir sin coste. Eso lo convierte en una base sólida para el ecosistema Winner.”
