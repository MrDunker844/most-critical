import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Chip, FilmCard, TextField } from './ds'
import { posterFor } from './posters.js'
import { loadStore, saveStore } from './store.js'
import { average, byNewest, cx, plural } from './lib.js'
import { RateStars } from './components/fields.jsx'
import { FilmModal } from './components/FilmModal.jsx'
import { AddFilmDialog } from './components/AddFilmDialog.jsx'
import { useOmdbCatalog } from './catalog.js'

export default function App() {
  const [store, setStore] = useState(loadStore)
  const [openedId, setOpenedId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [sort, setSort] = useState('')
  const [allSort, setAllSort] = useState('')
  const [genre, setGenre] = useState(null)
  const [query, setQuery] = useState('')
  const catalog = useOmdbCatalog(query)
  const [details, setDetails] = useState({}) // fiches OMDb complètes déjà chargées : { [imdbId]: movie }

  // Enregistre dans le navigateur puis met à jour l'écran.
  // `strict` : si l'enregistrement échoue, on n'applique pas le changement (pour ne pas promettre un film qui disparaîtra).
  const persist = (next, { strict = false } = {}) => {
    const ok = saveStore(next)
    if (ok || !strict) setStore(next)
    return ok
  }

  // « Mes films » : films ajoutés, notés ou critiqués par le visiteur, avec leurs notes.
  const films = useMemo(() => {
    return store.films.map((f) => {
      const reviews = [...(f.reviews || []), ...(store.reviews[f.id] || [])].sort(byNewest)
      const myRating = store.ratings[f.id] || 0
      const notes = [...reviews.map((r) => r.rating), ...(myRating ? [myRating] : [])]
      return { ...f, poster: posterFor(f), reviews, myRating, count: notes.length, score: average(notes), imdb: store.imdb[f.id] }
    })
  }, [store])

  // « Tous les films » : résultats OMDb. Un film déjà dans « Mes films » s'affiche avec ses notes.
  const byImdb = useMemo(() => new Map(films.filter((f) => f.imdbId).map((f) => [f.imdbId, f])), [films])
  const allFilms = useMemo(() => catalog.items.map((r) => {
    if (byImdb.has(r.id)) return byImdb.get(r.id)
    const d = details[r.id] || (r.genres ? r : null)
    return {
      id: `omdb-${r.id}`, imdbId: r.id, title: r.title, year: r.year || undefined,
      poster: posterFor({ poster: r.poster }), rawPoster: r.poster,
      genres: d?.genres || [], synopsis: d?.plot || '',
      reviews: [], myRating: 0, count: 0, score: 0, imdb: d ? d.rating : undefined, fromOmdb: true,
    }
  }), [catalog.items, byImdb, details])

  // Tri de « Tous les films » sur les films déjà chargés. Les valeurs inconnues (année, note IMDb) vont en fin de liste.
  const allShown = sortCatalog(allFilms, allSort)

  const genres = [...new Set(films.flatMap((f) => f.genres))].sort((a, b) => a.localeCompare(b, 'fr'))
  const filtered = genre ? films.filter((f) => f.genres.includes(genre)) : films

  // Tri par note : films sans note en fin de liste, à note égale ordre alphabétique.
  const myFilms = !sort ? filtered : [...filtered].sort((a, b) =>
    (!a.count - !b.count) ||
    (sort === 'best' ? b.score - a.score : a.score - b.score) ||
    a.title.localeCompare(b.title, 'fr'),
  )

  const current = films.find((f) => f.id === openedId) || allFilms.find((f) => f.id === openedId)

  // Charge la fiche complète (genres, synopsis, note IMDb) d'un film OMDb.
  const loadDetails = (imdbId) => {
    if (details[imdbId]) return Promise.resolve(details[imdbId])
    return fetch(`/api/movie?${new URLSearchParams({ id: imdbId })}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((movie) => {
        if (movie) setDetails((d) => ({ ...d, [imdbId]: movie }))
        return movie
      })
  }

  const open = (film) => {
    setOpenedId(film.id)
    if (film.fromOmdb && !film.synopsis) loadDetails(film.imdbId).catch(() => {})
  }

  // Un film OMDb rejoint « Mes films » dès qu'on le note ou qu'on le critique.
  const withFilm = (s, film) => {
    if (!film.fromOmdb || s.films.some((f) => f.id === film.id)) return s
    const saved = {
      id: film.id, imdbId: film.imdbId, title: film.title, year: film.year,
      genres: film.genres, synopsis: film.synopsis, poster: film.rawPoster || undefined, reviews: [],
    }
    if (!film.genres.length) {
      // Fiche incomplète (résultat de recherche) : on la complète en arrière-plan.
      loadDetails(film.imdbId).then((m) => m && setStore((cur) => {
        const next = {
          ...cur,
          films: cur.films.map((f) => (f.id === film.id ? { ...f, genres: m.genres, synopsis: f.synopsis || m.plot } : f)),
          imdb: { ...cur.imdb, [film.id]: m.rating },
        }
        saveStore(next)
        return next
      })).catch(() => {})
    }
    const imdb = film.imdb !== undefined ? { ...s.imdb, [film.id]: film.imdb } : s.imdb
    return { ...s, films: [saved, ...s.films], imdb }
  }

  const findFilm = (filmId) => films.find((f) => f.id === filmId) || allFilms.find((f) => f.id === filmId)

  const rate = (film, rating) => {
    const s = withFilm(store, film)
    persist({ ...s, ratings: { ...s.ratings, [film.id]: rating } })
  }

  const addReview = (filmId, review) => {
    const film = findFilm(filmId)
    const s = film ? withFilm(store, film) : store
    persist({ ...s, reviews: { ...s.reviews, [filmId]: [review, ...(s.reviews[filmId] || [])] } })
  }

  // Films ajoutés depuis OMDb : on garde leur identifiant IMDb pour ne pas les ajouter deux fois.
  const knownIds = useMemo(() => new Set(store.films.map((f) => f.imdbId).filter(Boolean)), [store.films])

  const addFilm = ({ imdbRating, ...data }) => {
    const film = { id: `film-${Date.now().toString(36)}`, reviews: [], ...data }
    // La fiche OMDb donne déjà la note IMDb : pas besoin de la redemander.
    const imdb = imdbRating !== undefined ? { ...store.imdb, [film.id]: imdbRating } : store.imdb
    const ok = persist({ ...store, films: [film, ...store.films], imdb }, { strict: true })
    if (ok) setAdding(false)
    return ok
  }

  // Récupère la note IMDb des films qui n'en ont pas encore.
  // Si l'API ne répond pas, rien n'est enregistré : on réessaiera au prochain chargement.
  const asked = useRef(new Set())
  useEffect(() => {
    films.filter((f) => !(f.id in store.imdb) && !asked.current.has(f.id)).forEach((f) => {
      asked.current.add(f.id)
      fetch(`/api/imdb?${new URLSearchParams(f.imdbId ? { id: f.imdbId } : { title: f.title, year: f.year || '' })}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then(({ rating }) =>
          setStore((s) => {
            const next = { ...s, imdb: { ...s.imdb, [f.id]: rating } }
            saveStore(next)
            return next
          }),
        )
        .catch(() => {})
    })
  }, [films, store.imdb])

  return (
    <>
      <header className="topbar">
        <div className="page topbar__inner">
          <span className="brand">Most Critical</span>
          <Button variant="secondary" icon="plus" className="topbar__add" onClick={() => setAdding(true)}>
            Ajouter un film
          </Button>
        </div>
      </header>

      <main className="page catalog" aria-label="Catalogue">
        <section className="section" aria-labelledby="all-title">
          <div className="catalog__head">
            <h1 id="all-title" className="h1">Tous les films</h1>
          </div>

          <div className="catalog__bar">
            <div className="catalog__search">
              <TextField
                id="catalog-search"
                label="Chercher un film"
                placeholder="Titre en anglais ou en français, ex. Inception"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <SortSelect value={allSort} onChange={setAllSort} options={CATALOG_SORTS} />
          </div>

          {allFilms.length > 0 && <FilmGrid films={allShown} onOpen={open} onRate={rate} />}

          <p className="caption muted" aria-live="polite">
            {catalog.status === 'loading' ? 'Chargement des films…'
              : catalog.status === 'error' ? 'Impossible de joindre IMDb pour l’instant. Réessaie dans un moment.'
              : query.trim() && !catalog.items.length ? `Aucun film trouvé pour « ${query.trim()} ».`
              : query.trim() ? `${plural(catalog.total, 'film trouvé', 'films trouvés')}`
              : ''}
          </p>

          {catalog.hasMore && catalog.status !== 'loading' && (
            <Button variant="secondary" className="catalog__more" onClick={catalog.loadMore}>Voir plus de films</Button>
          )}
        </section>

        <section className="section" aria-labelledby="mine-title">
          <div className="catalog__head">
            <h2 id="mine-title" className="h1">Mes films</h2>
          </div>

          {films.length > 0 && (<>
            <div className="catalog__tools">
              <SortSelect value={sort} onChange={setSort} options={MY_SORTS} />

              <div className="chips" role="group" aria-label="Filtrer par catégorie">
                <Chip selected={!genre} onClick={() => setGenre(null)}>Toutes les catégories</Chip>
                {genres.map((g) => (
                  <Chip key={g} selected={genre === g} onClick={() => setGenre(genre === g ? null : g)}>{g}</Chip>
                ))}
              </div>
            </div>

            {myFilms.length ? (
              <FilmGrid films={myFilms} onOpen={open} onRate={rate} />
            ) : (
              <p className="caption muted">Aucun de tes films dans cette catégorie.</p>
            )}
          </>)}
        </section>
      </main>

      <FilmModal film={current} onClose={() => setOpenedId(null)} onAddReview={addReview} />

      <AddFilmDialog open={adding} onClose={() => setAdding(false)} onAdd={addFilm} knownIds={knownIds} />
    </>
  )
}

/* ---------- Tri ---------- */

const MY_SORTS = [['', '—'], ['best', 'Mieux notés'], ['worst', 'Moins bien notés']]

const CATALOG_SORTS = [
  ['', 'Pertinence'],
  ['title', 'Titre (A → Z)'],
  ['title-desc', 'Titre (Z → A)'],
  ['newest', 'Plus récents'],
  ['oldest', 'Plus anciens'],
  ['imdb', 'Note IMDb'],
  ['best', 'Mieux notés sur le site'],
]

const byTitle = (a, b) => a.title.localeCompare(b.title, 'fr')
// Compare deux valeurs, celles qui manquent en dernier.
const missingLast = (x, y, desc) => (x == null) - (y == null) || (x == null ? 0 : desc ? y - x : x - y)

function sortCatalog(films, sort) {
  if (!sort) return films
  const cmp = {
    title: byTitle,
    'title-desc': (a, b) => byTitle(b, a),
    newest: (a, b) => missingLast(a.year, b.year, true) || byTitle(a, b),
    oldest: (a, b) => missingLast(a.year, b.year, false) || byTitle(a, b),
    imdb: (a, b) => missingLast(typeof a.imdb === 'number' ? a.imdb : null, typeof b.imdb === 'number' ? b.imdb : null, true) || byTitle(a, b),
    best: (a, b) => missingLast(a.count ? a.score : null, b.count ? b.score : null, true) || byTitle(a, b),
  }[sort]
  return [...films].sort(cmp)
}

function SortSelect({ value, onChange, options }) {
  return (
    <label className="sort">
      <span className="mc-field__label">Trier par</span>
      <span className="mc-field__box select">
        <select className="mc-field__input" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
        </select>
      </span>
    </label>
  )
}

/* ---------- Grille de films ---------- */

function FilmGrid({ films, onOpen, onRate }) {
  return (
    <ul className="grid">
      {films.map((film) => (
        <FilmTile key={film.id} film={film} onOpen={() => onOpen(film)} onRate={(n) => onRate(film, n)} />
      ))}
    </ul>
  )
}

/* ---------- Carte de film dans la grille ---------- */

function FilmTile({ film, onOpen, onRate }) {
  return (
    <li className={cx('tile', !film.count && 'is-unrated', film.myRating === 5 && 'is-loved')}>
      <FilmCard title={film.title} score={film.score} poster={film.poster} year={film.year} genres={film.genres} />
      <button type="button" className="tile__open" onClick={onOpen}>
        <span className="sr-only">Voir les critiques de {film.title}</span>
      </button>
      <div className="tile__rate">
        <RateStars value={film.myRating} onChange={onRate} size={18} label={`Noter ${film.title}`} />
        <span className="tile__avg" aria-live="polite">
          {film.count ? (
            <>
              <b>{film.score.toFixed(1)}</b>
              {' · '}{plural(film.count, 'note', 'notes')}
            </>
          ) : (
            'Pas encore noté'
          )}
        </span>
      </div>
      {film.imdb !== undefined && (
        <p className="tile__imdb">
          {typeof film.imdb === 'number' ? <><b>IMDb</b> {film.imdb.toFixed(1)}/10</> : 'Note IMDb indisponible'}
        </p>
      )}
    </li>
  )
}
