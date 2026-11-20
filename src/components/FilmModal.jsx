import { useState } from 'react'
import { Button, IconButton, ReviewCard, TextField } from '../ds'
import { formatDate, plural } from '../lib.js'
import { Field, RateStars, Required } from './fields.jsx'
import { useDialog } from './useDialog.js'

export function FilmModal({ film, onClose, onAddReview }) {
  const ref = useDialog(!!film)
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
    >
      {film && <FilmDetails key={film.id} film={film} onClose={onClose} onAddReview={onAddReview} />}
    </dialog>
  )
}

function FilmDetails({ film, onClose, onAddReview }) {
  const [writing, setWriting] = useState(false)

  const publish = (review) => {
    onAddReview(film.id, review)
    setWriting(false)
  }

  return (
    <div className="modal__inner modal__body">
      <IconButton icon="plus" label="Fermer" variant="ghost" className="modal__close" onClick={onClose} />

      <div className="modal__head">
        <div className="modal__poster mc-poster"><img src={film.poster} alt={`Affiche de ${film.title}`} /></div>
        <div className="modal__info">
          <h2 id="modal-title" className="h1">{film.title}</h2>
          <p className="caption muted">{[film.year, ...film.genres].filter(Boolean).join(' · ')}</p>
          {film.synopsis && <p className="body">{film.synopsis}</p>}
          <p className="title">
            {film.count ? `${film.score.toFixed(1)} · ${plural(film.count, 'note', 'notes')}` : 'Pas encore noté'}
          </p>
        </div>
      </div>

      <section className="reviews" aria-labelledby="reviews-title">
        <div className="reviews__head">
          <h3 id="reviews-title" className="h2">Critiques</h3>
          {!writing && (
            <Button variant="secondary" icon="comment" onClick={() => setWriting(true)}>Écrire une critique</Button>
          )}
        </div>

        {writing && <ReviewForm onCancel={() => setWriting(false)} onSubmit={publish} />}

        {film.reviews.length ? (
          <div className="reviews__list">
            {film.reviews.map((r) => (
              <ReviewCard key={r.id} author={r.author} rating={r.rating} date={formatDate(r.date)}>
                {r.text}
              </ReviewCard>
            ))}
          </div>
        ) : (
          <p className="caption muted">Pas encore de critique.</p>
        )}
      </section>
    </div>
  )
}

/* ---------- Écrire une critique ---------- */

const REVIEW_MAX = 500

function ReviewForm({ onCancel, onSubmit }) {
  const [pseudo, setPseudo] = useState('')
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [errors, setErrors] = useState({})

  const clear = (key) => setErrors((e) => ({ ...e, [key]: undefined }))

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!pseudo.trim()) errs.pseudo = 'Indique ton pseudo.'
    if (!rating) errs.rating = 'Choisis une note de 1 à 5 étoiles.'
    if (!text.trim()) errs.text = 'Écris quelques mots avant de publier.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit({ id: `rv-${Date.now().toString(36)}`, author: pseudo.trim(), rating, date: new Date().toISOString(), text: text.trim() })
  }

  return (
    <form className="panel compose" onSubmit={submit} noValidate aria-label="Écrire une critique">
      <div className="compose__row">
        <TextField
          id="review-pseudo"
          label={<>Pseudo<Required /></>}
          value={pseudo}
          error={errors.pseudo}
          onChange={(e) => { setPseudo(e.target.value); clear('pseudo') }}
        />
        <Field id="review-rating" label={<>Note<Required /></>} error={errors.rating}>
          <div className="compose__stars">
            <RateStars
              id="review-rating"
              value={rating}
              size={28}
              label="Ta note"
              invalid={!!errors.rating}
              onChange={(n) => { setRating(n); clear('rating') }}
            />
          </div>
        </Field>
      </div>

      <div className="compose__text">
        <TextField
          id="review-text"
          label={<>Ta critique<Required /></>}
          multiline
          rows={5}
          value={text}
          error={errors.text}
          onChange={(e) => { setText(e.target.value.slice(0, REVIEW_MAX)); clear('text') }}
        />
        <p className="counter" aria-live="polite">{text.length}/{REVIEW_MAX}</p>
      </div>

      <div className="form__foot">
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" icon="check">Publier ma critique</Button>
      </div>
    </form>
  )
}
