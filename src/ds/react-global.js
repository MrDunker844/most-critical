// Le bundle du design system (.agents/components/bundle.js) lit React sur window.
// On y expose l'instance React de l'app pour que les composants partagent le même React que react-dom.
import React from 'react'

window.React = React
