import { trlPhase } from "../../lib/ventures";

/** Barra de 9 segmentos con el nivel TRL alcanzado y su fase. */
export default function TrlMeter({ level }: { level: number }) {
  const phase = trlPhase(level);
  return (
    <div>
      <div className="flex gap-1" role="img" aria-label={`TRL ${level} de 9, fase ${phase.label}`}>
        {Array.from({ length: 9 }, (_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full ${i < level ? "bg-unis-red" : "bg-unis-lightgray"}`}
          />
        ))}
      </div>
      <p className="mt-2 text-sm font-semibold text-unis-text">
        TRL {level} · Fase {phase.label}
      </p>
      <p className="text-xs text-unis-gray">{phase.description}</p>
    </div>
  );
}
