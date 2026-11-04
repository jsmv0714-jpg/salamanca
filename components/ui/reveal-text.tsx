import { Fragment, type CSSProperties, type ElementType } from "react";

export type RevealPart = { text: string; className?: string };

/**
 * Título cuyas palabras entran una tras otra (aparecen, suben y se aclaran).
 * La animación es solo CSS (ver "reveal-word" en globals.css) y se desactiva si la persona
 * tiene activada la opción de reducir movimiento.
 */
export default function RevealText({
  as: Tag = "h1",
  parts,
  className,
  startDelay = 150,
  step = 90,
}: {
  as?: ElementType;
  parts: RevealPart[];
  className?: string;
  /** Milisegundos antes de que aparezca la primera palabra. */
  startDelay?: number;
  /** Milisegundos entre una palabra y la siguiente. */
  step?: number;
}) {
  let index = 0;
  return (
    <Tag className={className}>
      {parts.map((part, partIndex) =>
        part.text
          .split(/\s+/)
          .filter(Boolean)
          .map((word, wordIndex) => {
            const delay = startDelay + index++ * step;
            return (
              <Fragment key={`${partIndex}-${wordIndex}`}>
                <span
                  className={`reveal-word ${part.className ?? ""}`}
                  style={{ "--d": `${delay}ms` } as CSSProperties}
                >
                  {word}
                </span>{" "}
              </Fragment>
            );
          })
      )}
    </Tag>
  );
}
