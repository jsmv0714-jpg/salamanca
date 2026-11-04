import type { ReactNode } from "react";

const tones = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
} as const;

export default function Callout({
  tone = "info",
  children,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}
