// Hojas de vida en archivo (PDF y Word): agrega la tabla "application_files".
// Es idempotente: si el schema ya la incluye, no cambia nada.
// Uso (desde la raíz del proyecto):  node scripts/fase3-cv-schema.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const schemaPath = resolve(process.argv[2] ?? "prisma/schema.prisma");
const original = readFileSync(schemaPath, "utf8");
const useCrlf = original.includes("\r\n");
let src = original.replace(/\r\n/g, "\n");

if (/^model application_files \{/m.test(src)) {
  console.log("El schema ya incluye application_files. No se hizo ningún cambio.");
  process.exit(0);
}
if (!/^model applications \{/m.test(src)) {
  console.error("Error: no encuentro el modelo applications. Aplica primero scripts/fase3-schema.mjs.");
  process.exit(1);
}

// Relación en el modelo applications.
const start = src.search(/^model applications \{/m);
const end = src.indexOf("\n}", start);
const lines = src.slice(start, end).split("\n");
let lastField = 0;
lines.forEach((line, i) => {
  const t = line.trim();
  if (i > 0 && t !== "" && !t.startsWith("@@")) lastField = i;
});
lines.splice(lastField + 1, 0, "  application_files application_files?");
src = src.slice(0, start) + lines.join("\n") + src.slice(end);

src =
  src.replace(/\s*$/, "\n") +
  `
/// Hoja de vida adjunta a una postulación. Se guarda aparte para no cargar el archivo al listar postulaciones.
model application_files {
  id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  application_id String       @unique @db.Uuid
  filename       String       @db.VarChar(255)
  mime_type      String       @db.VarChar(100)
  size_bytes     Int
  data           Bytes
  created_at     DateTime     @default(now()) @db.Timestamp(6)
  applications   applications @relation(fields: [application_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
}
`;

writeFileSync(schemaPath, useCrlf ? src.replace(/\n/g, "\r\n") : src, "utf8");
console.log("Listo: schema.prisma actualizado.");
console.log("Siguiente: npx prisma db push && npx prisma generate");
