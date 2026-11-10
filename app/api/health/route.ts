import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { hasRemoteStorage } from "../../../lib/storage";

/**
 * Comprobación de salud para el monitoreo externo.
 * Responde 200 si la base de datos contesta y 503 si no.
 */
export async function GET() {
  const started = Date.now();
  let database: "ok" | "error" = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Health check: la base de datos no responde:", error);
    database = "error";
  }

  return NextResponse.json(
    {
      status: database === "ok" ? "ok" : "degraded",
      checks: {
        database,
        storage: hasRemoteStorage() ? "remote" : "local",
      },
      durationMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    },
    {
      status: database === "ok" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
