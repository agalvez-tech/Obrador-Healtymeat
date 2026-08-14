// Los navegadores modernos (Chrome sobre todo) bloquean la navegación
// directa a una URL "data:" al abrir pestaña nueva — la pestaña se queda en
// blanco sin avisar. La solución es convertir el data URL en un Blob real
// y abrir ese blob: URL en su lugar, que sí se puede abrir sin problema.
export function openDataUrlInNewTab(dataUrl) {
  try {
    const [header, base64] = dataUrl.split(',')
    const mimeMatch = header.match(/data:(.*?);base64/)
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: mime })
    const blobUrl = URL.createObjectURL(blob)
    window.open(blobUrl, '_blank')
    // Se revoca más tarde, dando tiempo a que la pestaña nueva cargue el archivo
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
  } catch {
    alert('No se pudo abrir el archivo.')
  }
}
