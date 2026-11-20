# Most Critical

Le système de design de **Most Critical**, une app de critiques de films. L'ambiance est celle d'une salle obscure juste avant la séance : un fond presque noir et chaud, et une lumière ambre et orange qui vient de l'écran et du projecteur. Le contenu (affiches, notes, critiques) est la seule chose éclairée.

## Principes

1. **La salle est éteinte.** Les fonds restent sombres et chauds (`ground`, `surface`, `surface-raised`), jamais gris bleuté. Les affiches de film apportent la couleur.
2. **L'ambre, c'est la note.** `amber` est réservé à ce qui compte : les étoiles, la note chiffrée, l'action principale. S'il y a de l'ambre partout, la note ne ressort plus.
3. **Affiche et texte.** Les titres sont en `display` (Bebas Neue, condensé, en capitales) comme une affiche. La lecture des critiques se fait en `sans` (Inter), confortable et neutre.
4. **Des filets, pas des ombres.** On sépare les éléments avec `line` (1px) et des changements de surface. La seule « ombre » est la lueur du projecteur (`glow`), au survol de l'action principale et des affiches.
5. **Pas de rouge.** Une mauvaise note s'éteint (`ink-muted`), elle ne crie pas. Les erreurs passent en `orange`, toujours avec une icône et un texte.

## Ton éditorial

- On tutoie le lecteur, avec un ton direct de passionné : « Ton avis compte, note ce film. »
- Les critiques ont un titre court et une note claire : « Une claque visuelle », **4.5/5**.
- Métadonnées dans l'ordre : année · durée · réalisateur·rice → `2024 · 2 h 46 · Denis Villeneuve`.
- Les boutons sont des verbes : *Noter*, *Écrire une critique*, *Ajouter à ma liste*.

## Couleurs

| Rôle | Token | Usage |
| --- | --- | --- |
| Fond | `ground` | La page |
| Cartes | `surface` | Cartes de film, listes |
| Survol / champs | `surface-raised` | États interactifs |
| Texte | `ink` / `ink-muted` | Contenu / métadonnées |
| Marque | `amber` | Étoiles, note, bouton principal |
| Accent | `orange` | Liens, badge « Coup de cœur », focus |
| Décor | `ember` | Grands aplats seulement, jamais de texte |
| Erreur | `orange` + icône | Messages de formulaire |

Sur un fond `amber`, `amber-soft` ou `orange`, le texte est toujours en `ink-on-amber`.

## Notation

- Note sur 5, au demi-point près. Étoiles pleines en `amber`, demi-étoile en `amber-soft`, étoiles vides en contour `line`.
- La note chiffrée utilise le style `score` en `amber`. Une note ≤ 2 passe en `ink-muted`.
- Écart entre étoiles : `space-1`.

## Composants

Les composants sont dans `window.MostCritical` (React 18). Les moments qui portent la signature de Most Critical :

- **ScoreDial** : la note dans un cadran de projecteur, sur l'affiche de chaque FilmCard.
- **Tabs** : l'onglet actif s'allume comme un écran (barre ambre avec une lueur).
- **StarRating** interactif au demi-point près.

Il y a aussi les composants de base : Button (primary, secondary, accent, ghost), IconButton, Chip, Badge, TextField, Switch, Avatar, FilmCard et ReviewCard.

## Mise en page

- Grille d'affiches en ratio 2:3, coins `radius-sm`, gouttière `space-4`.
- Cartes : fond `surface`, bordure 1px `line`, coins `radius-md`, marge interne `space-4`.
- Puces de genre : `radius-pill`, style `label`.
- Marges de page mobile `space-6`, en-têtes `space-10`.

## Iconographie

Pas encore d'icônes ni de logo : le nom s'écrit en Bebas Neue, en `ink`. Pour les icônes, privilégier un jeu à trait fin (1.5px) aux bouts arrondis, en `ink-muted`, ou en `amber` quand l'icône est active.

## Accessibilité

Tout texte respecte un contraste d'au moins 4.5:1 sur son fond. `ember` (3.5:1 sur `ground`) est purement décoratif. Le focus clavier est un anneau de 2px en `orange`.
