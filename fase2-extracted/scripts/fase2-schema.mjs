// Fase 2 (directorio y ventures): agrega modelos, enums y relaciones a prisma/schema.prisma.
// Es idempotente: si el schema ya incluye "ventures", no cambia nada.
// Uso (desde la raíz del proyecto):  node scripts/fase2-schema.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const schemaPath = resolve(process.argv[2] ?? "prisma/schema.prisma");
const original = readFileSync(schemaPath, "utf8");
const useCrlf = original.includes("\r\n");
let src = original.replace(/\r\n/g, "\n");

if (/^model ventures \{/m.test(src)) {
  console.log("El schema ya incluye ventures. No se hizo ningún cambio.");
  process.exit(0);
}

/** Agrega campos de relación al final de la sección de campos de un modelo existente. */
function addRelationFields(model, fields) {
  const start = src.search(new RegExp(`^model ${model} \\{`, "m"));
  if (start === -1) {
    throw new Error(`No encontré el modelo "${model}" en ${schemaPath}`);
  }
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

addRelationFields("users", [
  "ventures           ventures[]",
  "directory_profiles directory_profiles?",
]);
addRelationFields("sectors", [
  "ventures            ventures[]",
  "directory_profiles  directory_profiles[]",
]);
addRelationFields("areas_of_expertise", [
  "venture_areas           venture_areas[]",
  "directory_profile_areas directory_profile_areas[]",
]);

const nuevo = `
// ─── Fase 2: ventures (spin-offs y startups) y directorio del ecosistema Winner ───

model ventures {
  id                String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id           String         @db.Uuid
  type              venture_type
  name              String         @db.VarChar(150)
  slug              String         @unique @db.VarChar(180)
  tagline           String?        @db.VarChar(200)
  description       String
  sector_id         String?        @db.Uuid
  business_model    business_model @default(both)
  /// Nivel de madurez tecnológica (TRL), de 1 a 9.
  trl_level         Int            @default(1)
  /// Etapa del servicio Winner de donde sale (1 Entendimiento ... 6 Seguimiento).
  service_stage     Int?
  /// Solo spin-offs: grupo de investigación y consultor senior responsable.
  research_group    String?        @db.VarChar(150)
  senior_consultant String?        @db.VarChar(150)
  city              String?        @db.VarChar(100)
  logo_url          String?        @db.VarChar(500)
  website           String?        @db.VarChar(500)
  linkedin_url      String?        @db.VarChar(500)
  contact_email     String?        @db.VarChar(150)
  status            venture_status @default(draft)
  rejection_reason  String?
  published_at      DateTime?      @db.Timestamp(6)
  created_at        DateTime       @default(now()) @db.Timestamp(6)
  updated_at        DateTime       @default(now()) @updatedAt @db.Timestamp(6)
  users             users          @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  sectors           sectors?       @relation(fields: [sector_id], references: [id], onUpdate: NoAction)
  venture_areas     venture_areas[]

  @@index([status], map: "idx_ventures_status")
  @@index([type], map: "idx_ventures_type")
  @@index([user_id], map: "idx_ventures_user")
}

model venture_areas {
  venture_id         String             @db.Uuid
  area_id            String             @db.Uuid
  ventures           ventures           @relation(fields: [venture_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  areas_of_expertise areas_of_expertise @relation(fields: [area_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@id([venture_id, area_id])
}

/// Perfil público de un miembro del ecosistema. Solo aparece en el directorio si is_visible
/// es verdadero y la cuenta está activa.
model directory_profiles {
  id                      String                    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id                 String                    @unique @db.Uuid
  display_name            String?                   @db.VarChar(200)
  headline                String?                   @db.VarChar(200)
  /// "Core clave" del miembro: en qué es especialista y qué asesoría ofrece.
  core_expertise          String?
  business_model          business_model?
  sector_id               String?                   @db.Uuid
  city                    String?                   @db.VarChar(100)
  website                 String?                   @db.VarChar(500)
  linkedin_url            String?                   @db.VarChar(500)
  logo_url                String?                   @db.VarChar(500)
  contact_email           String?                   @db.VarChar(150)
  is_visible              Boolean                   @default(false)
  created_at              DateTime                  @default(now()) @db.Timestamp(6)
  updated_at              DateTime                  @default(now()) @updatedAt @db.Timestamp(6)
  users                   users                     @relation(fields: [user_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  sectors                 sectors?                  @relation(fields: [sector_id], references: [id], onUpdate: NoAction)
  directory_profile_areas directory_profile_areas[]

  @@index([is_visible], map: "idx_directory_profiles_visible")
}

model directory_profile_areas {
  profile_id         String             @db.Uuid
  area_id            String             @db.Uuid
  directory_profiles directory_profiles @relation(fields: [profile_id], references: [id], onDelete: Cascade, onUpdate: NoAction)
  areas_of_expertise areas_of_expertise @relation(fields: [area_id], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@id([profile_id, area_id])
}

enum venture_type {
  spin_off
  startup
}

enum venture_status {
  draft
  in_review
  published
  rejected
}

enum business_model {
  b2b
  b2c
  both
}
`;

src = src.replace(/\s*$/, "\n") + nuevo;

const out = useCrlf ? src.replace(/\n/g, "\r\n") : src;
writeFileSync(schemaPath, out, "utf8");

console.log("Listo: schema.prisma actualizado.");
console.log("Siguiente: npx prisma db push && npx prisma generate");
