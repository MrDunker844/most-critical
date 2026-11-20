import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Chip, FilmCard, Icon, IconButton, ReviewCard, ScoreDial, StarRating, Tabs, TextField } from './ds'
import { FILMS } from './data/films.js'
import { posterFor } from './posters.js'

/* ---------- Utilitaires ---------- */

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const formatDate = (iso) => dateFormat.format(new Date(iso))

const average = (reviews) =>
  reviews.length ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10 : 0

const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const meta = (film) => [film.year, film.duration, film.director].join(' · ')

const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`

const todayISO = () => new Date().toISOString().slice(0, 10)

/* ---------- App ---------- */

export default function App() {
  const [reviewsById, setReviewsById] = useState(() => Object.fromEntries(FILMS.map((f) => [f.id, f.reviews])))
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState(null)
  const [view, setView] = useState('all')
  const [opened, setOpened] = useState(null) // { id, play }

  const films = useMemo(
    () =>
      FILMS.map((f) => {
        const reviews = reviewsById[f.id]
        return { ...f, poster: posterFor(f), reviews, score: average(reviews) }
      }),
    [reviewsById],
  )

  const genres = useMemo(() => [...new Set(FILMS.flatMap((f) => f.genres))].sort((a, b) => a.localeCompare(b, 'fr')), [])

  const q = normalize(query.trim())
  const matching = films.filter(
    (f) => (!genre || f.genres.includes(genre)) && (!q || normalize(`${f.title} ${f.director} ${f.cast.join(' ')}`).includes(q)),
  )
  const views = {
    all: matching,
    top: [...matching].sort((a, b) => b.score - a.score),
    favorites: matching.filter((f) => f.badge),
  }
  const shown = views[view]

  const featured = films.find((f) => f.featured) || films[0]
  const current = opened && films.find((f) => f.id === opened.id)

  const open = (film, play = false) => setOpened({ id: film.id, play })
  const addReview = (filmId, review) =>
    setReviewsById((prev) => ({ ...prev, [filmId]: [review, ...prev[filmId]] }))

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
        </div>
      </header>

      <main>
        <Hero film={featured} onOpen={open} />

        <section className="page catalog" aria-labelledby="catalog-title">
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
                <li key={film.id} className="tile">
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
                  <button type="button" className="tile__open" onClick={() => open(film)}>
                    <span className="sr-only">Voir les détails de {film.title}</span>
                  </button>
                </li>
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
        <span className="caption muted">Films et critiques fictifs, pour la démo.</span>
      </footer>

      <FilmModal
        film={current}
        autoplay={!!opened?.play}
        onClose={() => setOpened(null)}
        onAddReview={addReview}
      />
    </>
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
            <span className="caption muted">{plural(film.reviews.length, 'critique', 'critiques')}</span>
          </div>
          <div className="actions">
            <Button icon="play" size="lg" onClick={() => onOpen(film, true)}>Voir la bande-annonce</Button>
            <Button variant="secondary" size="lg" icon="comment" onClick={() => onOpen(film)}>Lire les critiques</Button>
          </div>
        </div>
        <button type="button" className="hero__poster" onClick={() => onOpen(film)}>
          <span className="mc-poster"><img src={film.poster} alt={`Affiche de ${film.title}`} /></span>
        </button>
      </div>
    </section>
  )
}

/* ---------- Pop-up film ---------- */

function FilmModal({ film, autoplay, onClose, onAddReview }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (film && !dialog.open) dialog.showModal()
    if (!film && dialog.open) dialog.close()
  }, [film])

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
    >
      {film && <FilmDetails key={film.id} film={film} autoplay={autoplay} onClose={onClose} onAddReview={onAddReview} />}
    </dialog>
  )
}

function FilmDetails({ film, autoplay, onClose, onAddReview }) {
  const press = film.reviews.filter((r) => r.critic)
  const audience = film.reviews.filter((r) => !r.critic)
  const [tab, setTab] = useState(press.length ? 'press' : 'public')
  const list = tab === 'press' ? press : audience

  const publish = (review) => {
    onAddReview(film.id, review)
    setTab('public')
  }

  return (
    <div className="modal__inner">
      <IconButton icon="plus" label="Fermer" variant="overlay" className="modal__close" onClick={onClose} />

      <Trailer film={film} autoplay={autoplay} />

      <div className="modal__body">
        <div className="modal__head">
          <div className="modal__poster mc-poster"><img src={film.poster} alt={`Affiche de ${film.title}`} /></div>
          <div className="modal__info">
            {film.badge && <Badge tone="orange" icon="heart">{film.badge}</Badge>}
            <h2 id="modal-title" className="h1">{film.title}</h2>
            <p className="caption muted">{meta(film)}</p>
            <ul className="pills">
              {film.genres.map((g) => <li key={g} className="pill">{g}</li>)}
            </ul>
            <p className="body">{film.synopsis}</p>
            <p className="caption muted"><span className="label">Avec</span> {film.cast.join(', ')}</p>
          </div>
        </div>

        <section className="panel scorecard" aria-label="Note du film">
          <ScoreDial value={film.score} size={104} label="Moyenne" />
          <div className="scorecard__text">
            <span className="title">{plural(film.reviews.length, 'critique', 'critiques')}</span>
            <span className="caption muted">
              Presse {press.length ? average(press).toFixed(1) : '–'} · Public {audience.length ? average(audience).toFixed(1) : '–'}
            </span>
          </div>
          <Distribution reviews={film.reviews} />
        </section>

        <ReviewForm onPublish={publish} />

        <section className="reviews" aria-label="Critiques">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'press', label: 'Presse', count: press.length },
              { value: 'public', label: 'Public', count: audience.length },
            ]}
          />
          {list.length ? (
            <div className="reviews__list">
              {list.map((r) => (
                <ReviewCard
                  key={r.id}
                  author={r.author}
                  critic={r.critic}
                  rating={r.rating}
                  date={formatDate(r.date)}
                  headline={r.headline}
                  likes={r.likes}
                  comments={r.comments}
                >
                  {r.text}
                </ReviewCard>
              ))}
            </div>
          ) : (
            <p className="caption muted empty-line">Pas encore de critique ici. Sois le premier ou la première.</p>
          )}
        </section>
      </div>
    </div>
  )
}

/* ---------- Bande-annonce ---------- */
// Si `film.trailer` contient un identifiant YouTube, on l'intègre.
// Sinon on joue un teaser en cartons, tiré de `film.teaser`.

const CARD_MS = 2400

function Trailer({ film, autoplay }) {
  const cards = [...film.teaser, film.title]
  const [step, setStep] = useState(autoplay ? 0 : -1)
  const playing = step >= 0
  const last = step === cards.length - 1

  useEffect(() => {
    if (!playing || film.trailer) return
    const t = setTimeout(() => setStep((s) => (s + 1 >= cards.length ? -1 : s + 1)), last ? CARD_MS + 1200 : CARD_MS)
    return () => clearTimeout(t)
  }, [step, playing, last, cards.length, film.trailer])

  const seconds = Math.round((cards.length * CARD_MS + 1200) / 1000)

  return (
    <div className="trailer">
      <img className="trailer__bg" src={film.poster} alt="" />
      {playing && film.trailer ? (
        <iframe
          className="trailer__frame"
          src={`https://www.youtube-nocookie.com/embed/${film.trailer}?autoplay=1&rel=0`}
          title={`Bande-annonce de ${film.title}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : playing ? (
        <div className="trailer__stage" aria-live="polite">
          <p key={step} className={last ? 'trailer__card trailer__card--title display' : 'trailer__card h1'}>
            {cards[step]}
          </p>
          {last && <p className="trailer__sub label">Au cinéma</p>}
          <button type="button" className="trailer__stop label" onClick={() => setStep(-1)}>Arrêter</button>
          <div className="trailer__progress" aria-hidden="true">
            <span
              key={step}
              style={{
                '--from': `${(step / cards.length) * 100}%`,
                '--to': `${((step + 1) / cards.length) * 100}%`,
                animationDuration: `${last ? CARD_MS + 1200 : CARD_MS}ms`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="trailer__idle">
          <IconButton icon="play" label={`Lire la bande-annonce de ${film.title}`} variant="solid" onClick={() => setStep(0)} className="trailer__play" />
          <span className="label">Bande-annonce · 0:{String(seconds).padStart(2, '0')}</span>
        </div>
      )}
    </div>
  )
}

/* ---------- Répartition des notes ---------- */

function Distribution({ reviews }) {
  const rows = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => Math.ceil(r.rating) === star).length }))
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <ul className="dist" aria-label="Répartition des notes">
      {rows.map(({ star, count }) => (
        <li key={star} className="dist__row">
          <span className="dist__star">{star}<Icon name="star" size={12} filled /></span>
          <span className="dist__bar"><span style={{ width: `${(count / max) * 100}%` }} /></span>
          <span className="dist__count">{count}</span>
        </li>
      ))}
    </ul>
  )
}

/* ---------- Écrire une critique ---------- */

function ReviewForm({ onPublish }) {
  const [rating, setRating] = useState(0)
  const [headline, setHeadline] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const reset = () => {
    setRating(0); setHeadline(''); setText(''); setError(null); setFormKey((k) => k + 1)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) {
      setError('Écris quelques mots avant de publier.')
      return
    }
    onPublish({
      id: `me-${Date.now()}`,
      author: 'Toi',
      critic: false,
      rating,
      date: todayISO(),
      headline: headline.trim() || undefined,
      text: text.trim(),
      likes: 0,
      comments: 0,
    })
    reset()
    setDone(true)
  }

  return (
    <form className="panel compose" onSubmit={submit}>
      <div className="compose__head">
        <div>
          <h3 className="h2">Ton avis compte</h3>
          <p className="caption muted">
            {done ? 'Merci ! Ta critique est en ligne, dans l’onglet Public.' : 'Note ce film, au demi-point près.'}
          </p>
        </div>
        <StarRating key={formKey} interactive value={rating} size={28} showValue onChange={(v) => { setRating(v); setDone(false) }} />
      </div>

      {rating > 0 && (
        <div className="compose__fields">
          <TextField label="Titre" placeholder="Une claque visuelle" value={headline} onChange={(e) => setHeadline(e.target.value)} />
          <TextField
            label="Ta critique"
            multiline
            rows={4}
            placeholder="Ce qui t’a plu, ce qui t’a moins plu…"
            value={text}
            error={error}
            onChange={(e) => { setText(e.target.value); setError(null) }}
          />
          <div className="actions">
            <Button type="submit" icon="check">Publier ma critique</Button>
            <Button variant="ghost" onClick={reset}>Annuler</Button>
          </div>
        </div>
      )}
    </form>
  )
}
