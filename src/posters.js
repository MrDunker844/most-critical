// Affiches générées : compositions géométriques en SVG, une palette par film.
// « Les affiches de film apportent la couleur » : chaque film a sa propre teinte,
// ce qui laisse l'ambre du système à la note.
// Pour utiliser une vraie affiche, renseigne `poster` (URL) dans les données du film.

const COMPOSITIONS = [
  // Soleil couchant
  ([b, m, a]) =>
    `<rect width="200" height="300" fill="${b}"/><circle cx="130" cy="110" r="70" fill="${a}"/>` +
    `<rect y="200" width="200" height="100" fill="${m}"/>`,
  // Bandes
  ([b, m, a]) =>
    `<rect width="200" height="300" fill="${b}"/>` +
    [0, 1, 2, 3, 4]
      .map((k) => `<rect y="${48 + k * 40}" width="200" height="${22 - k * 3}" fill="${k % 2 ? m : a}"/>`)
      .join(''),
  // Arche
  ([b, m, a]) =>
    `<rect width="200" height="300" fill="${b}"/><path d="M30 300V150a70 70 0 0 1 140 0v150z" fill="${m}"/>` +
    `<circle cx="100" cy="72" r="24" fill="${a}"/>`,
  // Diagonale
  ([b, m, a]) =>
    `<rect width="200" height="300" fill="${b}"/><path d="M0 300L200 96V300z" fill="${m}"/>` +
    `<path d="M0 0h128L0 168z" fill="${a}"/>`,
  // Cercles concentriques
  ([b, m, a]) =>
    `<rect width="200" height="300" fill="${b}"/><circle cx="100" cy="150" r="92" fill="${m}"/>` +
    `<circle cx="100" cy="150" r="66" fill="${b}"/><circle cx="100" cy="150" r="42" fill="${a}"/>` +
    `<circle cx="100" cy="150" r="16" fill="${b}"/>`,
  // Blocs
  ([b, m, a]) =>
    `<rect width="200" height="300" fill="${b}"/><rect x="20" y="20" width="160" height="124" rx="4" fill="${m}"/>` +
    `<rect x="20" y="160" width="74" height="120" rx="4" fill="${a}"/>` +
    `<rect x="106" y="160" width="74" height="120" rx="4" fill="${m}" opacity=".55"/>`,
  // Pellicule
  ([b, m, a]) =>
    `<rect width="200" height="300" fill="${b}"/><rect x="16" width="56" height="300" fill="${m}"/>` +
    Array.from({ length: 8 }, (_, k) =>
      `<rect x="22" y="${10 + k * 38}" width="10" height="18" rx="3" fill="${b}"/>` +
      `<rect x="56" y="${10 + k * 38}" width="10" height="18" rx="3" fill="${b}"/>`,
    ).join('') +
    `<rect x="88" y="-8" width="120" height="196" rx="4" fill="${a}"/>` +
    `<rect x="88" y="204" width="120" height="104" rx="4" fill="${m}"/>`,
]

export function posterFor(film) {
  if (film.poster) return film.poster
  const draw = COMPOSITIONS[film.composition % COMPOSITIONS.length]
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">` +
    draw(film.palette) +
    `</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
