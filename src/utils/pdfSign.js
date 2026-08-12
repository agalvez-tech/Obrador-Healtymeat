import { PDFDocument } from 'pdf-lib'

// Convierte un data URL "data:application/pdf;base64,...." o
// "data:image/png;base64,...." a sus bytes puros.
function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function bytesToDataUrl(bytes, mime) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return `data:${mime};base64,${btoa(binary)}`
}

// Añade la imagen de firma en la esquina inferior derecha de la última
// página del PDF del albarán, y devuelve un nuevo PDF (como data URL) con la
// firma ya incrustada. Si algo falla (PDF corrupto, formato inesperado...),
// lanza el error para que quien llama decida cómo avisar al usuario.
export async function mergeSignatureIntoPdf(albaranPdfDataUrl, firmaPngDataUrl) {
  const pdfBytes = dataUrlToBytes(albaranPdfDataUrl)
  const pdfDoc = await PDFDocument.load(pdfBytes)

  const pngBytes = dataUrlToBytes(firmaPngDataUrl)
  const pngImage = await pdfDoc.embedPng(pngBytes)

  const pages = pdfDoc.getPages()
  const lastPage = pages[pages.length - 1]
  const { width } = lastPage.getSize()

  const sigWidth = 160
  const sigHeight = (pngImage.height / pngImage.width) * sigWidth

  lastPage.drawImage(pngImage, {
    x: width - sigWidth - 40,
    y: 40,
    width: sigWidth,
    height: sigHeight,
  })
  lastPage.drawText('Firmado en la entrega', {
    x: width - sigWidth - 40,
    y: 40 + sigHeight + 4,
    size: 9,
  })

  const merged = await pdfDoc.save()
  return bytesToDataUrl(merged, 'application/pdf')
}
