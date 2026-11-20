import { useEffect, useState } from 'react'

// Films de « Tous les films », venus d'OMDb (via le relais /api du serveur).
// Sans recherche : une sélection de classiques (/api/popular).
// Avec une recherche : les films dont le titre correspond, 10 par page (/api/search).
export function useOmdbCatalog(query) {
  const q = query.trim()
  const [state, setState] = useState({ q: null, items: [], total: 0, page: 1, status: 'idle' })

  const fetchPage = (page, signal) => {
    setState((s) => ({ ...s, status: 'loading' }))
    const url = q ? `/api/search?${new URLSearchParams({ q, page: String(page) })}` : '/api/popular'
    return fetch(url, { signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('api'))))
      .then(({ results, total }) =>
        setState((s) => {
          // Pas de doublons quand OMDb renvoie deux fois le même film d'une page à l'autre.
          const prev = page > 1 ? s.items : []
          const seen = new Set(prev.map((m) => m.id))
          const items = [...prev, ...results.filter((m) => !seen.has(m.id))]
          return { q, items, total: q ? total : results.length, page, status: 'done' }
        }),
      )
      .catch((err) => {
        if (err.name !== 'AbortError') setState((s) => ({ ...s, status: 'error' }))
      })
  }

  // Nouvelle recherche : on attend que la frappe se calme avant d'appeler l'API.
  useEffect(() => {
    const ctrl = new AbortController()
    const t = setTimeout(() => fetchPage(1, ctrl.signal), q ? 350 : 0)
    return () => { clearTimeout(t); ctrl.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const current = state.q === q
  return {
    items: current ? state.items : [],
    total: current ? state.total : 0,
    status: current ? state.status : 'loading',
    hasMore: current && !!q && state.items.length < state.total,
    loadMore: () => fetchPage(state.page + 1),
  }
}
