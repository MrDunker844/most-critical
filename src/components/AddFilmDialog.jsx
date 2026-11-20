import { useEffect, useId, useRef, useState } from 'react'
import { Button, Icon, IconButton } from '../ds'
import { CATEGORIES } from '../data/categories.js'
import { MAX_UPLOAD_BYTES, toPosterDataURL } from '../image.js'
import { DEFAULT_POSTER } from '../posters.js'
import { cx } from '../lib.js'
import { Field, Required } from './fields.jsx'
import { useDialog } from './useDialog.js'

// Genres OMDb (en anglais) → catégories du site, pour pré-remplir la catégorie.
const GENRES = {
  Action: 'Action', Animation: 'Animation', Adventure: 'Aventure', Comedy: 'Comédie', Documentary: 'Documentaire',
  Drama: 'Drame', Family: 'Famille', Fantasy: 'Fantastique', Horror: 'Horreur', Crime: 'Policier',
  Romance: 'Romance', 'Sci-Fi': 'Science-fiction', Thriller: 'Thriller', Mystery: 'Thriller', Western: 'Western',
}
const toCategory = (genres = []) => genres.map((g) => GENRES[g]).find(Boolean) || ''

export function AddFilmDialog({ open, onClose, onAdd, knownIds }) {
  const ref = useDialog(open)
  return (
    <dialog
      ref={ref}
      className="modal modal--form"
      aria-labelledby="add-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
    >
      {open && <AddFilmForm onCancel={onClose} onAdd={onAdd} knownIds={knownIds} />}
    </dialog>
  )
}

function AddFilmForm({ onCancel, onAdd, knownIds = new Set() }) {
  const [film, setFilm] = useState(null) // film choisi dans OMDb : { id, title, year, genres, plot, poster, rating }
  const [fetching, setFetching] = useState(false)
  const [category, setCategory] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [poster, setPoster] = useState(null) // image importée : prioritaire sur l'affiche officielle
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState(null)
  const fileRef = useRef(null)

  const clear = (key) => setErrors((e) => ({ ...e, [key]: undefined }))
  const shownPoster = poster || film?.poster || null

  const choose = async (result) => {
    setFetching(true)
    clear('film')
    try {
      const res = await fetch(`/api/movie?${new URLSearchParams({ id: result.id })}`)
      const movie = res.ok ? await res.json() : null
      if (!movie) throw new Error()
      setFilm(movie)
      setSynopsis(movie.plot)
      setPoster(null)
      const guess = toCategory(movie.genres)
      if (guess) { setCategory(guess); clear('category') }
      requestAnimationFrame(() => document.getElementById('film-category')?.focus())
    } catch {
      setErrors((x) => ({ ...x, film: 'Impossible de récupérer la fiche de ce film. Réessaie dans un instant.' }))
    } finally {
      setFetching(false)
    }
  }

  const changeFilm = () => {
    setFilm(null)
    setSynopsis('')
    setPoster(null)
    requestAnimationFrame(() => document.getElementById('film-search')?.focus())
  }

  const validate = () => {
    const e = {}
    if (!film) e.film = 'Cherche le film puis choisis-le dans la liste.'
    if (!category) e.category = 'Choisis une catégorie.'
    return e
  }

  const pickImage = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return setErrors((x) => ({ ...x, poster: 'Ce fichier n’est pas une image.' }))
    if (file.size > MAX_UPLOAD_BYTES) return setErrors((x) => ({ ...x, poster: 'L’image dépasse 10 Mo. Choisis-en une plus légère.' }))
    setLoading(true)
    try {
      setPoster(await toPosterDataURL(file))
      clear('poster')
    } catch {
      setErrors((x) => ({ ...x, poster: 'Impossible de lire cette image. Essaie un JPG ou un PNG.' }))
    } finally {
      setLoading(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (errs.film) return document.getElementById('film-search')?.focus()
    if (errs.category) return document.getElementById('film-category')?.focus()
    const ok = onAdd({
      title: film.title,
      year: film.year || undefined,
      imdbId: film.id,
      imdbRating: film.rating,
      genres: [category],
      synopsis: synopsis.trim(),
      poster: shownPoster,
    })
    if (!ok) setSaveError('Le navigateur n’a pas pu enregistrer le film (stockage plein ou désactivé). Essaie sans affiche ou avec une image plus légère.')
  }

  const posterCaption = loading
    ? 'Préparation de l’image…'
    : poster ? 'Aperçu de ton affiche.'
    : film?.poster ? 'Affiche officielle du film. Tu peux la remplacer.'
    : film ? 'Ce film n’a pas d’affiche officielle : ajoute la tienne ou garde celle-ci.'
    : 'Choisis un film pour récupérer son affiche, ou importe la tienne.'

  return (
    <form className="modal__inner form" onSubmit={submit} noValidate>
      <IconButton icon="plus" label="Fermer" variant="ghost" className="modal__close" onClick={onCancel} />
      <header className="form__head">
        <h2 id="add-title" className="h1">Ajouter un film</h2>
        <p className="caption muted">Seuls les films qui existent peuvent être ajoutés. Les champs marqués d’un * sont obligatoires.</p>
      </header>

      <div className="form__grid">
        <Field id="film-poster" label="Affiche" error={errors.poster} hint={shownPoster ? null : 'JPG, PNG ou WebP, 10 Mo max.'} className="poster-field">
          <div className="poster-field__row">
            <div className="mc-poster poster-field__preview">
              <img src={shownPoster || DEFAULT_POSTER} alt={shownPoster ? 'Aperçu de l’affiche' : 'Affiche par défaut'} />
            </div>
            <div className="poster-field__actions">
              <p className="caption muted">{posterCaption}</p>
              <Button variant="secondary" size="sm" icon="plus" onClick={() => fileRef.current?.click()} disabled={loading}>
                {shownPoster ? 'Changer l’image' : 'Choisir une image'}
              </Button>
              {poster && film?.poster && (
                <Button variant="ghost" size="sm" onClick={() => setPoster(null)}>Reprendre l’affiche officielle</Button>
              )}
              <input
                ref={fileRef}
                id="film-poster-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                tabIndex={-1}
                aria-labelledby="film-poster-label"
                onChange={pickImage}
              />
            </div>
          </div>
        </Field>

        <div className="form__fields">
          {film ? (
            <Field id="film-picked" label={<>Film<Required /></>}>
              <div className="picked">
                <div className="picked__text">
                  <span className="picked__title">{film.title}</span>
                  <span className="caption muted">{[film.year, film.genres.join(', ')].filter(Boolean).join(' · ')}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={changeFilm}>Changer de film</Button>
              </div>
            </Field>
          ) : (
            <FilmSearch error={errors.film} busy={fetching} knownIds={knownIds} onPick={choose} />
          )}

          <Field id="film-category" htmlFor="film-category" label={<>Catégorie<Required /></>} error={errors.category}>
            <div className="mc-field__box select">
              <select
                id="film-category"
                className="mc-field__input"
                value={category}
                aria-invalid={!!errors.category}
                aria-describedby={errors.category ? 'film-category-msg' : undefined}
                onChange={(e) => { setCategory(e.target.value); clear('category') }}
              >
                <option value="">Choisir…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </Field>

          <Field id="film-synopsis" htmlFor="film-synopsis" label="Synopsis">
            <div className="mc-field__box">
              <textarea
                id="film-synopsis"
                className="mc-field__input"
                rows={5}
                placeholder={film ? 'De quoi parle le film, en quelques lignes.' : 'Rempli automatiquement quand tu choisis le film.'}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
              />
            </div>
          </Field>
        </div>
      </div>

      {saveError && <p className="mc-field__msg form__error" role="alert">{saveError}</p>}

      <footer className="form__foot">
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" icon="check" disabled={loading || fetching}>Ajouter le film</Button>
      </footer>
    </form>
  )
}

/* ---------- Recherche d'un film dans OMDb (liste de suggestions accessible au clavier) ---------- */

function FilmSearch({ error, busy, knownIds, onPick }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listId = useId()
  const q = query.trim()

  // Cherche 350 ms après la dernière frappe ; annule la requête précédente si on retape.
  useEffect(() => {
    if (q.length < 2) { setResults([]); setStatus('idle'); return }
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setStatus('loading')
      try {
        const res = await fetch(`/api/search?${new URLSearchParams({ q })}`, { signal: ctrl.signal })
        if (!res.ok) throw new Error()
        setResults((await res.json()).results)
        setActive(-1)
        setStatus('done')
      } catch (e) {
        if (e.name !== 'AbortError') setStatus('error')
      }
    }, 350)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [q])

  const pick = (r) => {
    if (!r || knownIds.has(r.id)) return
    setOpen(false)
    onPick(r)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (open) pick(results[active] ?? (results.length === 1 ? results[0] : null)) }
    else if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); setOpen(false) }
  }

  const showPanel = open && q.length >= 2
  const message =
    busy ? 'Récupération de la fiche du film…'
    : status === 'loading' ? 'Recherche…'
    : status === 'error' ? 'La recherche ne répond pas. Réessaie dans un instant.'
    : status === 'done' && !results.length ? `Aucun film trouvé pour « ${q} ». Essaie le titre original ou anglais.`
    : null

  return (
    <div className={cx('mc-field', 'search', error && 'is-error')}>
      <label className="mc-field__label" htmlFor="film-search">Film<Required /></label>
      <div className="search__anchor">
      <div className="mc-field__box">
        <Icon name="search" size={18} className="mc-field__icon" />
        <input
          id="film-search"
          className="mc-field__input"
          type="text"
          role="combobox"
          autoComplete="off"
          placeholder="Tape le titre du film…"
          value={query}
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={!!error}
          aria-describedby="film-search-msg"
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          disabled={busy}
        />
      </div>
      {showPanel && (
        <div className="search__panel">
          {message && <p className="search__msg caption muted" role="status">{message}</p>}
          {!busy && results.length > 0 && (
            <ul id={listId} role="listbox" className="search__list" aria-label="Films trouvés">
              {results.map((r, i) => {
                const known = knownIds.has(r.id)
                return (
                  <li
                    key={r.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    aria-disabled={known || undefined}
                    className={cx('search__option', i === active && 'is-active', known && 'is-known')}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(r)}
                  >
                    <img className="search__thumb" src={r.poster || DEFAULT_POSTER} alt="" loading="lazy" />
                    <span className="search__text">
                      <span className="search__title">{r.title}</span>
                      <span className="caption muted">{known ? 'Déjà dans la liste' : r.year || 'Année inconnue'}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
      </div>
      <p id="film-search-msg" className="mc-field__msg">
        {error && <Icon name="alert" size={14} />}
        {error || 'Choisis le film dans la liste : le titre, l’année, le synopsis et l’affiche sont remplis pour toi.'}
      </p>
    </div>
  )
}
