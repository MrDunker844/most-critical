import { useState } from 'react'
import { Icon } from '../ds'
import { cx } from '../lib.js'

/* Note en étoiles entières : cliquer sur la 3e étoile donne 3.
   Étoiles pleines en amber, vides en contour line (README du design system). */
export function RateStars({ value = 0, onChange, size = 20, label = 'Ta note', id, invalid, describedBy }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div
      id={id}
      className="rate"
      role="group"
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={cx('rate__star', n <= shown && 'is-on')}
          aria-label={`${n} sur 5`}
          aria-pressed={n === value}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
        >
          <Icon name="star" size={size} filled={n <= shown} />
        </button>
      ))}
    </div>
  )
}

/* Champ maison (liste, note, image) qui reprend l'habillage du TextField du design system :
   libellé en capitales, message d'erreur sous le champ en orange avec une icône. */
export function Field({ id, label, htmlFor, error, hint, className, children }) {
  return (
    <div className={cx('mc-field', error && 'is-error', className)}>
      {htmlFor ? (
        <label className="mc-field__label" htmlFor={htmlFor}>{label}</label>
      ) : (
        <span className="mc-field__label" id={`${id}-label`}>{label}</span>
      )}
      {children}
      {(error || hint) && (
        <p id={`${id}-msg`} className="mc-field__msg">
          {error && <Icon name="alert" size={14} />}
          {error || hint}
        </p>
      )}
    </div>
  )
}

export const Required = () => <span className="req" aria-hidden="true"> *</span>
