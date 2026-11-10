import { ImageResponse } from "next/og";

export const alt = "Unisalamanca Marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
        <div style={{ width: 96, height: 8, borderRadius: 4, background: "#16B6D6", marginBottom: 44 }} />
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1 }}>
          Conectamos empresas, estudiantes y emprendedores
        </div>
        <div style={{ marginTop: 36, fontSize: 32, color: "rgba(255, 255, 255, 0.8)" }}>
          Marketplace del Consultorio Empresarial Winner · Universidad de Salamanca Colombia
        </div>
      </div>
    ),
    { ...size }
  );
}
