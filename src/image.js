// Prépare une affiche importée : recadrée en 2:3 et réduite à 480 × 720 px en JPEG,
// pour qu'elle tienne dans le stockage du navigateur (quelques dizaines de Ko au lieu de plusieurs Mo).

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export async function toPosterDataURL(file, { width = 480, height = 720, quality = 0.85 } = {}) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('Image illisible'))
      i.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    ctx.fillStyle = '#0f0d0b'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}
