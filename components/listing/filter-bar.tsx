import Link from "next/link";
import { ChevronDown, EyeOff } from "lucide-react";

export type FilterGroup = {
  key: string;
  label: string;
  activeLabel?: string;
  options: Array<{ label: string; href: string; active: boolean }>;
};

/** Barra de filtros horizontal. Cada filtro es un desplegable nativo, así funciona sin JavaScript. */
export default function FilterBar({
  groups,
  clearHref,
  hidden,
}: {
  groups: FilterGroup[];
  clearHref?: string;
  hidden?: { count: number; href: string; active: boolean };
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {groups.map((group) => {
        const isActive = Boolean(group.activeLabel);
        return (
          <details key={group.key} className="group relative">
            <summary
              className={`flex cursor-pointer list-none items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition marker:hidden [&::-webkit-details-marker]:hidden ${
                isActive
                  ? "border-unis-cyan bg-unis-cyan/10 text-[#0A7F9E]"
                  : "border-unis-lightgray bg-white text-unis-text hover:border-unis-cyan"
              }`}
            >
              {isActive ? group.activeLabel : group.label}
              <ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="absolute left-0 z-30 mt-2 max-h-80 w-64 overflow-y-auto rounded-2xl border border-unis-lightgray bg-white p-2 shadow-xl">
              {group.options.map((option) => (
                <Link
                  key={option.label}
                  href={option.href}
                  className={`block rounded-xl px-3 py-2 text-sm transition ${
                    option.active
                      ? "bg-unis-cyan/10 font-semibold text-[#0A7F9E]"
                      : "text-unis-gray hover:bg-unis-bg hover:text-unis-text"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </details>
        );
      })}

      {clearHref ? (
        <Link href={clearHref} className="px-2 text-sm font-medium text-unis-red hover:underline">
          Limpiar
        </Link>
      ) : null}

      {hidden && hidden.count > 0 ? (
        <Link
          href={hidden.href}
          className={`ml-auto inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            hidden.active
              ? "border-unis-red/40 bg-unis-red/5 text-unis-red"
              : "border-unis-lightgray bg-white text-unis-gray hover:border-unis-red hover:text-unis-red"
          }`}
        >
          <EyeOff className="h-4 w-4" aria-hidden="true" />
          {hidden.active ? "Volver a la lista" : `Ocultas (${hidden.count})`}
        </Link>
      ) : null}
    </div>
  );
}
