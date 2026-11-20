export const cx = (...names) => names.filter(Boolean).join(' ')

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
export const formatDate = (iso) => dateFormat.format(new Date(iso))

export const average = (notes) =>
  notes.length ? Math.round((notes.reduce((sum, n) => sum + n, 0) / notes.length) * 10) / 10 : 0

export const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`

// Les dates sont en ISO (« 2026-11-12 » ou « 2026-11-20T15:04:05.000Z ») : l'ordre texte est l'ordre chronologique.
export const byNewest = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)
