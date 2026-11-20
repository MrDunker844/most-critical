import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Relais vers OMDb : la clé reste sur le serveur (variable OMDB_API_KEY, dans .env en local).
//
// GET /api/search?q=…&page=2     → { results: [{ id, title, year, poster }], total } — films dont le titre correspond, 10 par page
// GET /api/popular               → { results: [{ id, title, year, genres, plot, poster, rating }] } — films affichés par défaut
// GET /api/movie?id=tt…          → { id, title, year, genres, plot, poster, rating } — fiche d'un film trouvé par la recherche
// GET /api/imdb?id=tt…           → { rating: 7.8 } ou { rating: null } si le film est introuvable
// GET /api/imdb?title=…&year=…   → idem, en cherchant par titre (films d'exemple)
// 502 si OMDb ne répond pas.

const NOT_FOUND = ['Movie not found!', 'Too many results.', 'Incorrect IMDb ID.']
const clean = (v) => (v && v !== 'N/A' ? v : null)
const toYear = (v) => (parseInt(v, 10) || null)

// OMDb ne sait pas lister « tous les films » : sans recherche, on montre ces classiques (identifiants IMDb).
const POPULAR = [
  'tt0111161', 'tt0068646', 'tt0468569', 'tt0110912', 'tt0109830', 'tt1375666',
  'tt0133093', 'tt0816692', 'tt0120737', 'tt0245429', 'tt6751668', 'tt0114369',
  'tt0172495', 'tt0137523', 'tt0167260', 'tt0076759', 'tt0211915', 'tt1675434',
]

function omdb(key) {
  const call = async (params) => {
    const data = await (
      await fetch(`https://www.omdbapi.com/?${new URLSearchParams({ apikey: key || '', ...params })}`, {
        signal: AbortSignal.timeout(5000),
      })
    ).json()
    if (data.Response === 'False') {
      if (NOT_FOUND.includes(data.Error)) return null
      throw new Error(data.Error)
    }
    return data
  }

  const movie = async (id) => {
    const m = await call({ i: id || '', plot: 'short' })
    if (!m) return null
    const rating = parseFloat(m.imdbRating)
    return {
      id: m.imdbID,
      title: m.Title,
      year: toYear(m.Year),
      genres: (clean(m.Genre) || '').split(',').map((g) => g.trim()).filter(Boolean),
      plot: clean(m.Plot) || '',
      poster: clean(m.Poster),
      rating: Number.isNaN(rating) ? null : rating,
    }
  }

  let popular = null // gardé en mémoire : la liste par défaut ne coûte qu'une série d'appels par démarrage du serveur

  const routes = {
    '/api/search': async (q) => {
      const query = (q.get('q') || '').trim()
      const page = Math.max(1, parseInt(q.get('page'), 10) || 1)
      const data = query ? await call({ s: query, type: 'movie', page: String(page) }) : null
      return {
        results: (data?.Search || []).map((m) => ({ id: m.imdbID, title: m.Title, year: toYear(m.Year), poster: clean(m.Poster) })),
        total: parseInt(data?.totalResults, 10) || 0,
      }
    },
    '/api/popular': async () => {
      if (!popular) popular = (await Promise.all(POPULAR.map(movie))).filter(Boolean)
      return { results: popular }
    },
    '/api/movie': async (q) => movie(q.get('id')),
    '/api/imdb': async (q) => {
      const params = q.get('id') ? { i: q.get('id') } : { t: q.get('title') || '' }
      if (!q.get('id') && q.get('year')) params.y = q.get('year')
      const rating = parseFloat((await call(params))?.imdbRating)
      return { rating: Number.isNaN(rating) ? null : rating }
    },
  }

  const handler = async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost')
    const route = routes[url.pathname]
    if (!route) return next()
    try {
      const body = await route(url.searchParams)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(body))
    } catch {
      res.statusCode = 502
      res.end()
    }
  }
  return { name: 'omdb', configureServer: (s) => { s.middlewares.use(handler) }, configurePreviewServer: (s) => { s.middlewares.use(handler) } }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), omdb(loadEnv(mode, process.cwd(), '').OMDB_API_KEY)],
}))
