import type { ReactNode } from "react";

const tones = {
  neutral: "bg-unis-bg text-unis-gray ring-unis-lightgray",
  red: "bg-red-50 text-unis-red ring-red-200",
  green: "bg-green-50 text-green-800 ring-green-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  blue: "bg-blue-50 text-blue-800 ring-blue-200",
} as const;

export type BadgeTone = keyof typeof tones;

export default function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
