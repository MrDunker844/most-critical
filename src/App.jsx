import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Chip, FilmCard, Icon, StarRating, Tabs, TextField } from './ds'
import { FILMS } from './data/films.js'
import { posterFor } from './posters.js'
import { loadStore, saveStore } from './store.js'
import { average, byNewest, cx, meta, newId, normalize, plural } from './lib.js'
import { RateStars } from './components/fields.jsx'
import { FilmModal } from './components/FilmModal.jsx'
import { AddFilmDialog } from './components/AddFilmDialog.jsx'

export default function App() {
  const [store, setStore] = useState(loadStore)
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState(null)
  const [view, setView] = useState('all')
  const [opened, setOpened] = useState(null) // { id, play, write }
  const [adding, setAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(null)
  const [toast, setToast] = useState(null)

  // Enregistre dans le navigateur puis met à jour l'écran.
  // `strict` : si l'enregistrement échoue, on n'applique pas le changement (pour ne pas promettre un film qui disparaîtra).
  const persist = (next, { strict = false } = {}) => {
    const ok = saveStore(next)
    if (ok || !strict) setStore(next)
    return ok
  }

  // Films d'exemple + films ajoutés, avec leurs notes : critiques (exemple et visiteur) + note du visiteur.
  const films = useMemo(() => {
    const all = [...store.films.map((f) => ({ ...f, user: true })), ...FILMS]
    return all.map((f) => {
      const reviews = [...(f.reviews || []), ...(store.reviews[f.id] || [])].sort(byNewest)
      const myRating = store.ratings[f.id] || 0
      const notes = [...reviews.map((r) => r.rating), ...(myRating ? [myRating] : [])]
      return { ...f, poster: posterFor(f), reviews, myRating, notes, count: notes.length, score: average(notes), imdb: store.imdb[f.id] }
    })
  }, [store])

  const genres = useMemo(() => [...new Set(films.flatMap((f) => f.genres))].sort((a, b) => a.localeCompare(b, 'fr')), [films])

  const q = normalize(query.trim())
  const matching = films.filter(
    (f) =>
      (!genre || f.genres.includes(genre)) &&
      (!q || normalize(`${f.title} ${f.director || ''} ${(f.cast || []).join(' ')}`).includes(q)),
  )
  const views = {
    all: matching,
    top: [...matching].sort((a, b) => b.score - a.score || b.count - a.count),
    favorites: matching.filter((f) => f.badge),
  }
  const shown = views[view]

  const featured = films.find((f) => f.featured) || films[0]
  const current = opened && films.find((f) => f.id === opened.id)

  const open = (film, opts = {}) => setOpened({ id: film.id, ...opts })

  const rate = (filmId, rating) => persist({ ...store, ratings: { ...store.ratings, [filmId]: rating } })

  const addReview = (filmId, review) =>
    persist({
      ...store,
      pseudo: review.author,
      reviews: { ...store.reviews, [filmId]: [review, ...(store.reviews[filmId] || [])] },
    })

  const addFilm = (data) => {
    const film = { id: newId('film'), createdAt: new Date().toISOString(), cast: [], reviews: [], ...data }
    const ok = persist({ ...store, films: [film, ...store.films] }, { strict: true })
    if (!ok) return false
    setAdding(false)
    setQuery('')
    setGenre(null)
    setView('all')
    setJustAdded(film.id)
    setToast(`« ${film.title} » a été ajouté.`)
    requestAnimationFrame(() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' }))
    return true
  }

  // Récupère la note IMDb des films qui n'en ont pas encore (films existants et films ajoutés).
  // Si l'API ne répond pas, rien n'est enregistré : on réessaiera au prochain chargement.
  const asked = useRef(new Set())
  useEffect(() => {
    films.filter((f) => !(f.id in store.imdb) && !asked.current.has(f.id)).forEach((f) => {
      asked.current.add(f.id)
      fetch(`/api/imdb?${new URLSearchParams({ title: f.title, year: f.year || '' })}`)
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

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <>
      <header className="topbar">
        <div className="page topbar__inner">
          <a className="brand" href="#">Most Critical</a>
          <div className="topbar__search">
            <TextField
              icon="search"
              placeholder="Un film, un·e réalisateur·rice, un·e acteur·rice…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="secondary" icon="plus" className="topbar__add" onClick={() => setAdding(true)}>
            Ajouter un film
          </Button>
        </div>
      </header>

      <main>
        <Hero film={featured} onOpen={open} />

        <section id="catalog" className="page catalog" aria-labelledby="catalog-title">
          <div className="catalog__head">
            <h2 id="catalog-title" className="h1">Les films</h2>
            <p className="caption muted">Les films, notés par ceux qui les aiment.</p>
          </div>

          <Tabs
            value={view}
            onChange={setView}
            items={[
              { value: 'all', label: 'À l’affiche', count: views.all.length },
              { value: 'top', label: 'Mieux notés' },
              { value: 'favorites', label: 'Coups de cœur', count: views.favorites.length },
            ]}
          />

          <div className="chips" role="group" aria-label="Filtrer par genre">
            <Chip selected={!genre} onClick={() => setGenre(null)}>Tous les genres</Chip>
            {genres.map((g) => (
              <Chip key={g} selected={genre === g} onClick={() => setGenre(genre === g ? null : g)}>
                {g}
              </Chip>
            ))}
          </div>

          {shown.length ? (
            <ul className="grid">
              {shown.map((film) => (
                <FilmTile
                  key={film.id}
                  film={film}
                  isNew={film.id === justAdded}
                  onOpen={() => open(film)}
                  onRate={(n) => rate(film.id, n)}
                />
              ))}
            </ul>
          ) : (
            <div className="empty">
              <Icon name="film" size={32} />
              <p className="title">Aucun film ne correspond.</p>
              <p className="caption muted">Essaie un autre genre ou une autre recherche.</p>
              <Button variant="secondary" size="sm" onClick={() => { setQuery(''); setGenre(null) }}>
                Tout afficher
              </Button>
            </div>
          )}
        </section>
      </main>

      <footer className="page footer">
        <span className="brand brand--sm">Most Critical</span>
        <span className="caption muted">
          Films et critiques d’exemple fictifs. Tes films, notes et critiques sont enregistrés dans ce navigateur.
        </span>
      </footer>

      <FilmModal
        film={current}
        autoplay={!!opened?.play}
        startWriting={!!opened?.write}
        pseudo={store.pseudo}
        onClose={() => setOpened(null)}
        onRate={rate}
        onAddReview={addReview}
      />

      <AddFilmDialog open={adding} onClose={() => setAdding(false)} onAdd={addFilm} />

      <div className="toast-region" role="status" aria-live="polite">
        {toast && <p className="toast"><Icon name="check" size={18} />{toast}</p>}
      </div>
    </>
  )
}

/* ---------- Carte de film dans la grille ---------- */

function FilmTile({ film, isNew, onOpen, onRate }) {
  return (
    <li className={cx('tile', isNew && 'is-new', !film.count && 'is-unrated')}>
      <FilmCard
        title={film.title}
        score={film.score}
        poster={film.poster}
        year={film.year}
        duration={film.duration}
        director={film.director}
        genres={film.genres}
        badge={film.badge}
      />
      <button type="button" className="tile__open" onClick={onOpen}>
        <span className="sr-only">Voir les détails de {film.title}</span>
      </button>
      <div className="tile__rate">
        <RateStars value={film.myRating} onChange={onRate} size={18} label={`Noter ${film.title}`} />
        <span className="tile__avg" aria-live="polite">
          {film.count ? (
            <>
              <b className={film.score <= 2 ? 'is-low' : undefined}>{film.score.toFixed(1)}</b>
              {' · '}{plural(film.count, 'note', 'notes')}
            </>
          ) : (
            'Pas encore de note'
          )}
        </span>
      </div>
      <p className="tile__imdb">
        {typeof film.imdb === 'number' ? <><b>IMDb</b> {film.imdb.toFixed(1)}/10</> : 'Note IMDb indisponible'}
      </p>
    </li>
  )
}

/* ---------- Héros : le film à l'affiche ---------- */

function Hero({ film, onOpen }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <img className="hero__bg" src={film.poster} alt="" />
      <div className="page hero__inner">
        <div className="hero__text">
          <Badge tone="soft">À l’affiche cette semaine</Badge>
          <h2 id="hero-title" className="display hero__title">{film.title}</h2>
          <p className="caption muted">{meta(film)}</p>
          <p className="body hero__pitch">{film.synopsis}</p>
          <div className="hero__rating">
            <StarRating value={Math.round(film.score * 2) / 2} size={22} />
            <span className="score">{film.score.toFixed(1)}</span>
            <span className="caption muted">{plural(film.count, 'note', 'notes')}</span>
          </div>
          <div className="actions">
            <Button icon="play" size="lg" onClick={() => onOpen(film, { play: true })}>Voir la bande-annonce</Button>
            <Button variant="secondary" size="lg" icon="comment" onClick={() => onOpen(film, { write: true })}>
              Écrire une critique
            </Button>
          </div>
        </div>
        <button type="button" className="hero__poster" onClick={() => onOpen(film)}>
          <span className="mc-poster"><img src={film.poster} alt={`Affiche de ${film.title}`} /></span>
        </button>
      </div>
    </section>
  )
}
