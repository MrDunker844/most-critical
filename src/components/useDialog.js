import { useEffect, useRef } from 'react'

// Ouvre ou ferme un <dialog> natif en mode modal (focus piégé, Échap pour fermer).
export function useDialog(open) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return ref
}
