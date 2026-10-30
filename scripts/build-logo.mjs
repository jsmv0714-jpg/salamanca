// Convierte el SVG copiado de la página de la universidad en un logo animado y limpio.
// Uso (desde la raíz del proyecto):
//   node scripts/build-logo.mjs
// Lee public/logo-original.svg y escribe public/logo-unisalamanca.svg
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const input = process.argv[2] ?? "public/logo-original.svg";
const output = process.argv[3] ?? "public/logo-unisalamanca.svg";

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

if (!existsSync(input)) fail(`no encuentro ${input}. Guarda ahí el código SVG que copiaste.`);

const raw = readFileSync(input, "utf8");
const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1];
if (!viewBox) fail("el archivo no parece un SVG: no tiene viewBox.");
const [, , width, height] = viewBox.split(/[\s,]+/).map(Number);

// Todas las piezas del dibujo (letras y formas), en el orden en que aparecen.
const shapeRe = /<(path|rect|polygon|polyline|circle|ellipse|line)\b([^>]*?)(?:\/>|>\s*<\/\1>)/g;
const shapes = [...raw.matchAll(shapeRe)].map(([, tag, attrs]) => ({ tag, attrs }));
if (shapes.length === 0) fail("no encontré ninguna forma dentro del SVG.");

// Las piezas anteriores a la primera de color cian son el texto pequeño de la
// parte de abajo ("Corporación Universitaria..."); las demás son el logotipo grande.
let split = shapes.findIndex((s) => /fill="#16b6d6"/i.test(s.attrs));
if (split < 0) split = 0;

const body = shapes
  .map(({ tag, attrs }, i) => {
    let a = attrs
      .replace(/\s(?:opacity|filter)="[^"]*"/g, "") // quita lo que dejó la animación original
      .replace(/\sstyle="[^"]*"/g, "")
      .replace(/\s+$/, "");

    a = /\sclass="[^"]*"/.test(a)
      ? a.replace(/class="([^"]*)"/, 'class="$1 a"')
      : `${a} class="a"`;

    // Primero entra el logotipo grande, letra por letra, y después el texto pequeño.
    const delay = i < split ? 900 + i * 15 : (i - split) * 60;
    return `<${tag}${a} style="--d:${delay}ms"/>`;
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}" role="img" aria-label="UniSalamanca"><title>UniSalamanca</title><style>.cls-1{fill:#2A2266}.a{opacity:0;animation:in .7s cubic-bezier(.22,1,.36,1) both;animation-delay:var(--d,0ms)}@keyframes in{from{opacity:0;filter:blur(6px);transform:translateY(12px)}to{opacity:1;filter:blur(0);transform:none}}@media (prefers-reduced-motion:reduce){.a{animation:none;opacity:1}}</style><g>${body}</g></svg>\n`;

writeFileSync(output, svg, "utf8");
console.log(`Listo: ${output}`);
console.log(`${shapes.length} piezas (${shapes.length - split} del logotipo, ${split} del texto pequeño), ${(svg.length / 1024).toFixed(1)} KB.`);
