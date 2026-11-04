// Fase 3 (publicaciones, postulaciones y administración de cuentas):
// agrega la tabla "applications", el estado "in_review" para publicaciones y las relaciones necesarias.
// Es idempotente: si el schema ya incluye "applications", no cambia nada.
// Uso (desde la raíz del proyecto):  node scripts/fase3-schema.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const schemaPath = resolve(process.argv[2] ?? "prisma/schema.prisma");
const original = readFileSync(schemaPath, "utf8");
const useCrlf = original.includes("\r\n");
let src = original.replace(/\r\n/g, "\n");

if (/^model applications \{/m.test(src)) {
  console.log("El schema ya incluye applications. No se hizo ningún cambio.");
  process.exit(0);
}

/** Agrega líneas al final de la sección de campos de un modelo existente. */
function addFields(model, fields) {
  const start = src.search(new RegExp(`^model ${model} \\{`, "m"));
  if (start === -1) throw new Error(`No encontré el modelo "${model}" en ${schemaPath}`);
  const end = src.indexOf("\n}", start);
  const lines = src.slice(start, end).split("\n");

  let lastField = 0;
  lines.forEach((line, i) => {
    const t = line.trim();
    if (i > 0 && t !== "" && !t.startsWith("@@")) lastField = i;
  });

  const missing = fields.filter(
    (f) => !lines.some((l) => l.trim().startsWith(f.split(/\s+/)[0] + " "))
  );
  lines.splice(lastField + 1, 0, ...missing.map((f) => "  " + f));
  src = src.slice(0, start) + lines.join("\n") + src.slice(end);
}

/** Agrega un valor a un enum existente. */
function addEnumValue(enumName, value) {
  const start = src.search(new RegExp(`^enum ${enumName} \\{`, "m"));
  if (start === -1) throw new Error(`No encontré el enum "${enumName}" en ${schemaPath}`);
  const end = src.indexOf("\n}", start);
  const block = src.slice(start, end);
  if (new RegExp(`^\\s*${value}\\s*$`, "m").test(block)) return;
  src = src.slice(0, start) + block + `\n  ${value}` + src.slice(end);
}

addEnumValue("publication_status", "in_review");

addFields("publications", [
  "rejection_reason String?",
  "applications     applications[]",
]);
addFields("users", ["applications       applications[]"]);

const nuevo = `
// ─── Fase 3: postulaciones a publicaciones ───

model applications {
  id             String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  publication_id String             @db.Uuid
  applicant_id   String             @db.Uuid
  message        String
  /// Enlaces que comparte quien se postula (hoja de vida, portafolio, LinkedIn).
  cv_url         String?            @db.VarChar(500)
  portfolio_url  String?            @db.VarChar(500)
  linkedin_url   String?            @db.VarChar(500)
  phone          String?            @db.VarChar(50)
  /// Autorización para compartir sus datos con quien publicó la oferta.
  data_consent   Boolean            @default(false)
  consent_at     DateTime?          @db.Timestamp(6)
  status         application_status @default(sent)
  created_at     DateTime           @default(now()) @db.Timestamp(6)
  updated_at     DateTime           @default(now()) @updatedAt @db.Timestamp(6)
  publications   publications       @relation(fields: [publication_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  users          users              @relation(fields: [applicant_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@unique([publication_id, applicant_id], map: "uq_applications_publication_applicant")
  @@index([applicant_id], map: "idx_applications_applicant")
  @@index([status], map: "idx_applications_status")
}

enum application_status {
  sent
  viewed
  shortlisted
  accepted
  rejected
  withdrawn
}
`;

src = src.replace(/\s*$/, "\n") + nuevo;

writeFileSync(schemaPath, useCrlf ? src.replace(/\n/g, "\r\n") : src, "utf8");

console.log("Listo: schema.prisma actualizado.");
console.log("Siguiente: npx prisma db push && npx prisma generate");
