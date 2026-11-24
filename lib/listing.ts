/**
 * Ayudas compartidas por los listados con panel de detalle (publicaciones y ventures).
 * Sin Prisma para que se puedan probar en unitarias.
 */

type AuthorSource = {
  name: string;
  companies?: { trade_name: string } | null;
  associations?: { name: string } | null;
  entrepreneurs?: { project_name: string | null; first_name: string; last_name: string } | null;
};

/** Nombre que se muestra como autor de una publicación, según el tipo de cuenta. */
export function authorDisplayName(author: AuthorSource): string {
  return (
    author.companies?.trade_name ||
    author.associations?.name ||
    author.entrepreneurs?.project_name ||
    [author.entrepreneurs?.first_name, author.entrepreneurs?.last_name].filter(Boolean).join(" ") ||
    author.name ||
    "Miembro del ecosistema"
  );
}

/** Lista de ids de publicaciones o ventures marcadas por la persona, como conjunto para búsquedas rápidas. */
export function markSets(rows: Array<{ id: string; saved: boolean; hidden: boolean }>) {
  return {
    saved: new Set(rows.filter((row) => row.saved).map((row) => row.id)),
    hidden: new Set(rows.filter((row) => row.hidden).map((row) => row.id)),
  };
}
