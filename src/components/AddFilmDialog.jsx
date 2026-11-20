import { useRef, useState } from 'react'
import { Button, IconButton, TextField } from '../ds'
import { CATEGORIES } from '../data/categories.js'
import { MAX_UPLOAD_BYTES, toPosterDataURL } from '../image.js'
import { DEFAULT_POSTER } from '../posters.js'
import { Field, Required } from './fields.jsx'
import { useDialog } from './useDialog.js'

const MAX_YEAR = new Date().getFullYear() + 5

export function AddFilmDialog({ open, onClose, onAdd }) {
  const ref = useDialog(open)
  return (
    <dialog
      ref={ref}
      className="modal modal--form"
      aria-labelledby="add-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
    >
      {open && <AddFilmForm onCancel={onClose} onAdd={onAdd} />}
    </dialog>
  )
}

function AddFilmForm({ onCancel, onAdd }) {
  const [title, setTitle] = useState('')
  const [year, setYear] = useState('')
  const [category, setCategory] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [poster, setPoster] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState(null)
  const fileRef = useRef(null)

  const clear = (key) => setErrors((e) => ({ ...e, [key]: undefined }))

  const validate = () => {
    const e = {}
    if (!title.trim()) e.title = 'Donne un titre au film.'
    const y = year.trim()
    if (y && !(/^\d{4}$/.test(y) && +y >= 1888 && +y <= MAX_YEAR)) e.year = `Indique une année entre 1888 et ${MAX_YEAR}.`
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
    const firstInvalid = ['title', 'year', 'category'].find((k) => errs[k])
    if (firstInvalid) {
      document.getElementById(`film-${firstInvalid}`)?.focus()
      return
    }
    const ok = onAdd({
      title: title.trim(),
      year: year.trim() ? Number(year) : undefined,
      genres: [category],
      synopsis: synopsis.trim(),
      poster,
    })
    if (!ok) setSaveError('Le navigateur n’a pas pu enregistrer le film (stockage plein ou désactivé). Essaie sans affiche ou avec une image plus légère.')
  }

  return (
    <form className="modal__inner form" onSubmit={submit} noValidate>
      <IconButton icon="plus" label="Fermer" variant="ghost" className="modal__close" onClick={onCancel} />
      <header className="form__head">
        <h2 id="add-title" className="h1">Ajouter un film</h2>
        <p className="caption muted">Les champs marqués d’un * sont obligatoires.</p>
      </header>

      <div className="form__grid">
        <Field id="film-poster" label="Affiche" error={errors.poster} hint={poster ? null : 'JPG, PNG ou WebP, 10 Mo max.'} className="poster-field">
          <div className="poster-field__row">
            <div className="mc-poster poster-field__preview">
              <img src={poster || DEFAULT_POSTER} alt={poster ? 'Aperçu de l’affiche' : 'Affiche par défaut'} />
            </div>
            <div className="poster-field__actions">
              <p className="caption muted">{loading ? 'Préparation de l’image…' : poster ? 'Aperçu de ton affiche.' : 'Sans image, le film aura cette affiche par défaut.'}</p>
              <Button variant="secondary" size="sm" icon="plus" onClick={() => fileRef.current?.click()} disabled={loading}>
                {poster ? 'Changer l’image' : 'Choisir une image'}
              </Button>
              {poster && <Button variant="ghost" size="sm" onClick={() => setPoster(null)}>Retirer l’image</Button>}
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
          <TextField
            id="film-title"
            label={<>Titre<Required /></>}
            placeholder="Orbite basse"
            value={title}
            error={errors.title}
            onChange={(e) => { setTitle(e.target.value); clear('title') }}
          />
          <div className="form__pair">
            <TextField
              id="film-year"
              label="Année"
              placeholder={String(new Date().getFullYear())}
              value={year}
              error={errors.year}
              onChange={(e) => { setYear(e.target.value.replace(/\D/g, '').slice(0, 4)); clear('year') }}
            />
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
          </div>
          <TextField
            id="film-synopsis"
            label="Synopsis"
            multiline
            rows={5}
            placeholder="De quoi parle le film, en quelques lignes."
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
          />
        </div>
      </div>

      {saveError && <p className="mc-field__msg form__error" role="alert">{saveError}</p>}

      <footer className="form__foot">
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" icon="check" disabled={loading}>Ajouter le film</Button>
      </footer>
    </form>
  )
}
