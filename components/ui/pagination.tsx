import Link from "next/link";

const WINDOW = 5;

/** Números de página visibles: una ventana de hasta 5 centrada en la actual, sin salirse de los límites. */
export function pageWindow(currentPage: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(currentPage - Math.floor(WINDOW / 2), totalPages - WINDOW + 1));
  return Array.from({ length: Math.min(WINDOW, totalPages) }, (_, index) => start + index);
}

/** Paginación con Anterior/Siguiente y una ventana de páginas alrededor de la actual. */
export default function Pagination({
  label,
  currentPage,
  totalPages,
  hrefFor,
}: {
  label: string;
  currentPage: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(currentPage, totalPages);
  const plainLink =
    "rounded-md border border-unis-lightgray px-3 py-2 text-sm font-medium text-unis-gray transition hover:border-unis-red hover:text-unis-red";
  const disabled =
    "cursor-not-allowed rounded-md border border-unis-lightgray px-3 py-2 text-sm font-medium text-unis-lightgray";

  return (
    <nav aria-label={label} className="mt-8 flex items-center justify-center gap-2">
      {currentPage > 1 ? (
        <Link href={hrefFor(currentPage - 1)} className={plainLink}>
          Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className={disabled}>
          Anterior
        </span>
      )}

      {pages.map((page) =>
        page === currentPage ? (
          <span key={page} aria-current="page" className="rounded-md bg-unis-red px-3 py-2 text-sm font-semibold text-white">
            {page}
          </span>
        ) : (
          <Link key={page} href={hrefFor(page)} className={plainLink}>
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link href={hrefFor(currentPage + 1)} className={plainLink}>
          Siguiente
        </Link>
      ) : (
        <span aria-disabled="true" className={disabled}>
          Siguiente
        </span>
      )}
    </nav>
  );
}
