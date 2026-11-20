import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Icon, IconButton, ReviewCard, ScoreDial, Tabs, TextField } from '../ds'
import { formatDate, meta, newId, plural } from '../lib.js'
import { Field, RateStars, Required } from './fields.jsx'
import { useDialog } from './useDialog.js'

export function FilmModal({ film, autoplay, startWriting, pseudo, onClose, onRate, onAddReview }) {
  const ref = useDialog(!!film)
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
    >
      {film && (
        <FilmDetails
          key={film.id}
          film={film}
          autoplay={autoplay}
          startWriting={startWriting}
          pseudo={pseudo}
          onClose={onClose}
          onRate={onRate}
          onAddReview={onAddReview}
        />
      )}
    </dialog>
  )
}

function FilmDetails({ film, autoplay, startWriting, pseudo, onClose, onRate, onAddReview }) {
  const press = film.reviews.filter((r) => r.critic)
  const audience = film.reviews.filter((r) => !r.critic)
  const [tab, setTab] = useState(press.length ? 'press' : 'public')
  const [writing, setWriting] = useState(!!startWriting)
  const [thanks, setThanks] = useState(false)
  const formRef = useRef(null)
  const list = tab === 'press' ? press : audience

  useEffect(() => {
    if (!writing) return
    formRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    document.getElementById('review-pseudo')?.focus({ preventScroll: true })
  }, [writing])

  const publish = (review) => {
    onAddReview(film.id, review)
    setWriting(false)
    setThanks(true)
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
            {film.user && <Badge tone="outline">Ajouté par toi</Badge>}
            <h2 id="modal-title" className="h1">{film.title}</h2>
            {meta(film) && <p className="caption muted">{meta(film)}</p>}
            <ul className="pills">
              {film.genres.map((g) => <li key={g} className="pill">{g}</li>)}
            </ul>
            {film.synopsis && <p className="body">{film.synopsis}</p>}
            {film.cast?.length > 0 && (
              <p className="caption muted"><span className="label">Avec</span> {film.cast.join(', ')}</p>
            )}
          </div>
        </div>

        <section className="panel scorecard" aria-label="Note du film">
          {film.count ? (
            <ScoreDial value={film.score} size={104} label="Moyenne" />
          ) : (
            <div className="scorecard__none" aria-hidden="true"><Icon name="star" size={32} /></div>
          )}
          <div className="scorecard__text">
            <span className="title" aria-live="polite">
              {film.count ? `${film.score.toFixed(1)} · ${plural(film.count, 'note', 'notes')}` : 'Pas encore de note'}
            </span>
            <span className="caption muted">
              {film.reviews.length ? plural(film.reviews.length, 'critique', 'critiques') : 'Aucune critique pour l’instant'}
            </span>
            <div className="scorecard__mine">
              <span className="label caption muted">{film.myRating ? 'Ta note' : 'Note ce film'}</span>
              <RateStars value={film.myRating} onChange={(n) => onRate(film.id, n)} size={24} label={`Noter ${film.title}`} />
            </div>
          </div>
          <Distribution notes={film.notes} />
        </section>

        <section className="reviews" aria-labelledby="reviews-title">
          <div className="reviews__head">
            <h3 id="reviews-title" className="h2">Critiques</h3>
            {!writing && (
              <Button variant="secondary" icon="comment" onClick={() => { setWriting(true); setThanks(false) }}>
                Écrire une critique
              </Button>
            )}
          </div>

          {thanks && (
            <p className="notice" role="status"><Icon name="check" size={16} /> Merci ! Ta critique est en ligne.</p>
          )}

          {writing && (
            <div ref={formRef}>
              <ReviewForm defaultPseudo={pseudo} onCancel={() => setWriting(false)} onSubmit={publish} />
            </div>
          )}

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
            <p className="caption muted empty-line">
              {tab === 'press' ? 'Pas encore de critique presse pour ce film.' : 'Pas encore de critique du public. Sois le premier ou la première.'}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}

/* ---------- Écrire une critique ---------- */

export const REVIEW_MAX = 500

function ReviewForm({ defaultPseudo, onCancel, onSubmit }) {
  const [pseudo, setPseudo] = useState(defaultPseudo || '')
  const [rating, setRating] = useState(0)
  const [headline, setHeadline] = useState('')
  const [text, setText] = useState('')
  const [errors, setErrors] = useState({})

  const clear = (key) => setErrors((e) => ({ ...e, [key]: undefined }))
  const left = REVIEW_MAX - text.length

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!pseudo.trim()) errs.pseudo = 'Indique ton pseudo.'
    if (!rating) errs.rating = 'Choisis une note de 1 à 5 étoiles.'
    if (!text.trim()) errs.text = 'Écris quelques mots avant de publier.'
    setErrors(errs)
    const first = ['pseudo', 'rating', 'text'].find((k) => errs[k])
    if (first) {
      const el = document.getElementById(`review-${first}`)
      ;(first === 'rating' ? el?.querySelector('button') : el)?.focus()
      return
    }
    onSubmit({
      id: newId('rv'),
      author: pseudo.trim(),
      critic: false,
      rating,
      date: new Date().toISOString(),
      headline: headline.trim() || undefined,
      text: text.trim(),
      likes: 0,
      comments: 0,
    })
  }

  return (
    <form className="panel compose" onSubmit={submit} noValidate aria-label="Écrire une critique">
      <div className="compose__row">
        <TextField
          id="review-pseudo"
          label={<>Pseudo<Required /></>}
          placeholder="CinéphileDuDimanche"
          value={pseudo}
          error={errors.pseudo}
          onChange={(e) => { setPseudo(e.target.value.slice(0, 40)); clear('pseudo') }}
        />
        <Field id="review-rating" label={<>Note<Required /></>} error={errors.rating}>
          <div className="compose__stars">
            <RateStars
              id="review-rating"
              value={rating}
              size={28}
              label="Ta note"
              invalid={!!errors.rating}
              describedBy={errors.rating ? 'review-rating-msg' : undefined}
              onChange={(n) => { setRating(n); clear('rating') }}
            />
            <span className={rating && rating <= 2 ? 'score is-low' : 'score'}>{rating ? `${rating}/5` : '–'}</span>
          </div>
        </Field>
      </div>

      <TextField
        id="review-headline"
        label="Titre"
        placeholder="Une claque visuelle"
        value={headline}
        onChange={(e) => setHeadline(e.target.value.slice(0, 80))}
      />

      <div className="compose__text">
        <TextField
          id="review-text"
          label={<>Ta critique<Required /></>}
          multiline
          rows={5}
          placeholder="Ce qui t’a plu, ce qui t’a moins plu…"
          value={text}
          error={errors.text}
          onChange={(e) => { setText(e.target.value.slice(0, REVIEW_MAX)); clear('text') }}
        />
        <p className={left <= 50 ? 'counter is-near' : 'counter'} aria-live="polite">
          {text.length}/{REVIEW_MAX}
          <span className="sr-only"> caractères</span>
        </p>
      </div>

      <div className="form__foot">
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" icon="check">Publier ma critique</Button>
      </div>
    </form>
  )
}

/* ---------- Répartition des notes ---------- */

function Distribution({ notes }) {
  const rows = [5, 4, 3, 2, 1].map((star) => ({ star, count: notes.filter((n) => Math.ceil(n) === star).length }))
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

/* ---------- Bande-annonce ---------- */
// Si `film.trailer` contient un identifiant YouTube, on l'intègre.
// Sinon on joue un teaser en cartons, tiré de `film.teaser`.

const CARD_MS = 2400

function Trailer({ film, autoplay }) {
  const teaser = film.teaser || []
  const available = !!film.trailer || teaser.length > 0
  const cards = [...teaser, film.title]
  const [step, setStep] = useState(autoplay && available ? 0 : -1)
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
      ) : available ? (
        <div className="trailer__idle">
          <IconButton icon="play" label={`Lire la bande-annonce de ${film.title}`} variant="solid" onClick={() => setStep(0)} className="trailer__play" />
          <span className="label">Bande-annonce · 0:{String(seconds).padStart(2, '0')}</span>
        </div>
      ) : (
        <div className="trailer__idle">
          <Icon name="film" size={32} />
          <span className="label">Pas encore de bande-annonce</span>
        </div>
      )}
    </div>
  )
}
