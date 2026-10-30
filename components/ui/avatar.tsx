/** Logo del miembro o, si no hay, una inicial sobre fondo suave. */
export default function Avatar({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl?: string | null;
  size?: "md" | "lg";
}) {
  const box = size === "lg" ? "h-20 w-20 text-3xl" : "h-14 w-14 text-xl";
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`Logo de ${name}`}
        className={`${box} shrink-0 rounded-lg border border-unis-lightgray bg-white object-contain`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${box} flex shrink-0 items-center justify-center rounded-lg bg-unis-bg font-black text-unis-red`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </div>
  );
}
