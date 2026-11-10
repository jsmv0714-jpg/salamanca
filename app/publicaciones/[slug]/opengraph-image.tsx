import { ImageResponse } from "next/og";
import { prisma } from "../../../lib/prisma";

export const alt = "Publicación en Unisalamanca Marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen para compartir una oferta: tipo, título y la marca. Solo para publicaciones públicas. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const publication = await prisma.publications.findUnique({
    where: { slug },
    select: { title: true, status: true, publication_types: { select: { name: true } } },
  });
  const isPublic = publication && (publication.status === "published" || publication.status === "closed");
  const title = isPublic ? publication.title : "Publicación del Marketplace";
  const typeName = isPublic ? publication.publication_types.name : "Unisalamanca Marketplace";
  const titleSize = title.length > 70 ? 56 : 68;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 88,
          background: "#2A2266",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#16B6D6" }}>{typeName}</div>
        <div style={{ width: 96, height: 8, borderRadius: 4, background: "#16B6D6", margin: "32px 0 40px" }} />
        <div style={{ display: "flex", fontSize: titleSize, fontWeight: 800, lineHeight: 1.15 }}>{title}</div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 28, color: "rgba(255, 255, 255, 0.8)" }}>
          Unisalamanca Marketplace · Consultorio Empresarial Winner
        </div>
      </div>
    ),
    { ...size }
  );
}
