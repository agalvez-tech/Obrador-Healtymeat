import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

// Extrae todo el texto de un PDF (a partir de su dataURL) como una única
// cadena, página a página, respetando aproximadamente el orden de lectura.
export async function extractTextFromPdf(pdfDataUrl) {
  const base64 = pdfDataUrl.split(',')[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
  let fullText = ''
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => item.str).join(' ')
    fullText += pageText + '\n'
  }
  return fullText
}
