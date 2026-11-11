"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { SKILL_MAX_COUNT, SKILL_MAX_LENGTH } from "../../lib/profile";
import { inputClass } from "../ui/form";

/** Lista de habilidades en forma de chips. Envía un solo campo `name` con las habilidades separadas por comas. */
export default function SkillInput({
  name,
  label,
  hint,
  error,
  initial,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  initial: string;
}) {
  const inputId = useId();
  const [skills, setSkills] = useState<string[]>(() =>
    initial
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const [draft, setDraft] = useState("");
  const [limitNote, setLimitNote] = useState("");

  function add(raw: string) {
    const value = raw.replace(/\s+/g, " ").trim().replace(/,$/, "").trim();
    if (!value) return;
    if (value.length > SKILL_MAX_LENGTH) {
      setLimitNote(`Cada habilidad puede tener hasta ${SKILL_MAX_LENGTH} caracteres.`);
      return;
    }
    if (skills.some((s) => s.toLocaleLowerCase("es") === value.toLocaleLowerCase("es"))) {
      setDraft("");
      return;
    }
    if (skills.length >= SKILL_MAX_COUNT) {
      setLimitNote(`Puedes registrar hasta ${SKILL_MAX_COUNT} habilidades.`);
      return;
    }
    setSkills([...skills, value]);
    setDraft("");
    setLimitNote("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && draft === "" && skills.length > 0) {
      setSkills(skills.slice(0, -1));
    }
  }

  const message = limitNote || error;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-unis-text">
        {label}
      </label>
      <div
        className={`${inputClass} flex min-h-[2.75rem] flex-wrap items-center gap-2 py-1.5 focus-within:border-unis-cyan focus-within:ring-unis-cyan`}
      >
        {skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-full bg-unis-cyan/10 py-1 pl-3 pr-1 text-xs font-semibold text-unis-red ring-1 ring-inset ring-unis-cyan/30"
          >
            {skill}
            <button
              type="button"
              onClick={() => setSkills(skills.filter((s) => s !== skill))}
              aria-label={`Quitar ${skill}`}
              className="rounded-full p-0.5 text-unis-gray transition hover:bg-white hover:text-unis-red"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setLimitNote("");
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => add(draft)}
          placeholder={skills.length === 0 ? "Escribe y pulsa Enter" : ""}
          aria-describedby={`${inputId}-hint`}
          className="min-w-[10rem] flex-1 border-0 bg-transparent p-1 text-sm text-unis-text outline-none placeholder:text-unis-gray/70 focus:ring-0"
        />
      </div>
      <input type="hidden" name={name} value={skills.join(", ")} />
      <p id={`${inputId}-hint`} className={`mt-1 text-xs ${message ? "font-medium text-red-700" : "text-unis-gray"}`}>
        {message || hint || `Pulsa Enter o escribe una coma para añadir. Máximo ${SKILL_MAX_COUNT}.`}
      </p>
      <p className="sr-only" aria-live="polite">
        {skills.length} {skills.length === 1 ? "habilidad" : "habilidades"}
      </p>
    </div>
  );
}
