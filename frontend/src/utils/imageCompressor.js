const MAX_WIDTH = 1200
const MAX_HEIGHT = 1200
const QUALITY = 0.8

export function compressImage(file, maxWidth = MAX_WIDTH, maxHeight = MAX_HEIGHT, quality = QUALITY) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img

        if (width <= maxWidth && height <= maxHeight && file.size < 500 * 1024) {
          resolve(file)
          return
        }

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            const compressed = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressed)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target.result
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
