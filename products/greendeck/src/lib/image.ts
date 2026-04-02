export async function compressImageToBlob(
  file: File,
  maxSize = 900,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(
        1,
        maxSize / Math.max(img.width, img.height)
      )
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas
        .getContext('2d')!
        .drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality)
    }
    img.src = URL.createObjectURL(file)
  })
}
