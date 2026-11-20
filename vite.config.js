import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Relais vers OMDb : la clé reste sur le serveur (variable OMDB_API_KEY, dans .env en local).
// GET /api/imdb?title=…&year=… → { rating: 7.8 } ou { rating: null } si le film est introuvable ; 502 si OMDb ne répond pas.
function imdb(key) {
  const handler = async (req, res, next) => {
    if (!req.url.startsWith('/api/imdb')) return next()
    const { searchParams } = new URL(req.url, 'http://localhost')
    const params = new URLSearchParams({ apikey: key || '', t: searchParams.get('title') || '' })
    if (searchParams.get('year')) params.set('y', searchParams.get('year'))
    try {
      const data = await (await fetch(`https://www.omdbapi.com/?${params}`, { signal: AbortSignal.timeout(5000) })).json()
      if (data.Response === 'False' && data.Error !== 'Movie not found!') throw new Error(data.Error)
      const rating = parseFloat(data.imdbRating)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ rating: Number.isNaN(rating) ? null : rating }))
    } catch {
      res.statusCode = 502
      res.end()
    }
  }
  return { name: 'imdb', configureServer: (s) => { s.middlewares.use(handler) }, configurePreviewServer: (s) => { s.middlewares.use(handler) } }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), imdb(loadEnv(mode, process.cwd(), '').OMDB_API_KEY)],
}))
