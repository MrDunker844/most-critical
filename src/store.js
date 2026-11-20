// Ce que le visiteur ajoute (films, notes, critiques) est enregistré dans le navigateur (localStorage),
// pour être toujours là après un rechargement. Les films d'exemple restent dans src/data/films.js.
//
// Forme :
//   films   : films ajoutés, le plus récent en premier
//   ratings : { [filmId]: note de 1 à 5 } — la note du visiteur, une par film
//   reviews : { [filmId]: [critique, …] } — critiques écrites par le visiteur
//   pseudo  : dernier pseudo utilisé, pour préremplir le formulaire
//   imdb    : { [filmId]: note IMDb sur 10, ou null si introuvable } — pour ne pas rappeler l'API

const KEY = 'most-critical:data:v1'
const EMPTY = { films: [], ratings: {}, reviews: {}, pseudo: '', imdb: {} }

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
  } catch {
    return EMPTY
  }
}

// Renvoie false si le navigateur refuse l'écriture (stockage plein ou désactivé).
export function saveStore(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}
