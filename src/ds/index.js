// Point d'entrée unique vers le design system Most Critical.
// L'ordre des imports compte : React doit être exposé avant l'exécution du bundle.
import './react-global.js'
import '../../.agents/components/bundle.js'
import '../../.agents/tokens.css'
import '../../.agents/components/bundle.css'

export const {
  Button, IconButton, StarRating, ScoreDial, Chip, Badge, TextField,
  Switch, Tabs, Avatar, FilmCard, ReviewCard, Icon,
} = window.MostCritical
