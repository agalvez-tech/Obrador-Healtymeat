// Palabras que no ayudan a distinguir un producto de otro (conectores,
// unidades genéricas...). Se ignoran al comparar textos.
const STOPWORDS = new Set(['DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'Y', 'GR', 'UND', 'UD', 'UDS', 'X'])

// Sinónimos habituales entre cómo pide el cliente y cómo lo llamamos
// internamente en el catálogo (p. ej. "hamburguesa" en el pedido vs
// "burger" en nuestros productos).
const SYNONYMS = {
  HAMBURGUESA: 'BURGER',
  HAMBURGUESAS: 'BURGER',
}

// Alias de frase completa para casos donde el nombre del pedido no se
// parece nada al del catálogo por palabras sueltas (por ejemplo, "pollo
// empanado crunchy" es, para nosotros, "Pollo Voltereta"). Se comprueban
// antes del cálculo genérico por palabras, y tienen prioridad absoluta.
// Para añadir uno nuevo: { patron: /texto que viene en el pedido/i, nombre: 'NOMBRE EXACTO DEL CATÁLOGO' }
const ALIAS_FRASE = [
  { patron: /POLLO.*CRUNCHY|CRUNCHY.*POLLO|POLLO\s+EMPANADO/i, nombre: 'POLLO VOLTERETA' },
]

function normalize(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => SYNONYMS[w] || w)
}

function contentWords(words) {
  return words.filter((w) => !STOPWORDS.has(w) && w.length > 1)
}

// Compara dos listas de palabras normalizadas y devuelve una puntuación
// 0-1 según cuántas palabras "de contenido" del catálogo aparecen (exacta
// o como subcadena en cualquier dirección) en el texto candidato.
function similarityScore(candidateWords, catalogWords) {
  const candidateContent = contentWords(candidateWords)
  const catalogContent = contentWords(catalogWords)
  if (catalogContent.length === 0) return 0
  let hits = 0
  for (const cw of catalogContent) {
    const found = candidateContent.some((w) => w === cw || w.includes(cw) || cw.includes(w))
    if (found) hits += 1
  }
  return hits / catalogContent.length
}

// Intenta encontrar el producto del catálogo que mejor coincide con el
// texto libre de una línea del pedido. Devuelve null si no hay suficiente
// confianza, para que la persona lo seleccione a mano.
export function matchProductoToCatalog(textoProducto, catalogo, threshold = 0.6) {
  for (const alias of ALIAS_FRASE) {
    if (alias.patron.test(textoProducto)) {
      const producto = catalogo.find((p) => p.nombre.toUpperCase() === alias.nombre.toUpperCase())
      if (producto) return { producto, score: 1 }
    }
  }

  const candidateWords = normalize(textoProducto)
  let best = null
  let bestScore = 0
  for (const p of catalogo) {
    const score = similarityScore(candidateWords, normalize(p.nombre))
    if (score > bestScore) {
      bestScore = score
      best = p
    }
  }
  if (best && bestScore >= threshold) {
    return { producto: best, score: bestScore }
  }
  return null
}

const NUMERO_PEDIDO_PATTERNS = [
  /PEDIDO\s+DE\s+COMPRA\s*N[ºo°]?\.?\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-\/]{2,40})/i,
  /N[ºo°]\.?\s*(?:DE\s*)?PEDIDO\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-\/]{2,40})/i,
  /PEDIDO\s*N[ºo°]?\.?\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-\/]{2,40})/i,
]

// Busca un número/referencia de pedido en el texto del PDF (p. ej.
// "PEDIDO DE COMPRA Nº P-4-2026/000324"). Es opcional: si no encuentra
// nada con confianza razonable, devuelve una cadena vacía.
export function extractNumeroPedido(text) {
  for (const pattern of NUMERO_PEDIDO_PATTERNS) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  return ''
}

const NUMERO_ALBARAN_PATTERNS = [
  /ALBAR[ÁA]N\s*N[ºo°]?\.?\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-\/]{2,40})/i,
  /N[ºo°]\.?\s*ALBAR[ÁA]N\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-\/]{2,40})/i,
]

// Busca el número de albarán en el texto del PDF (p. ej. "Albarán nº
// ALB2026-482"). Igual que el número de pedido, es opcional: si no lo
// encuentra, devuelve vacío para que se rellene a mano.
export function extractNumeroAlbaran(text) {
  for (const pattern of NUMERO_ALBARAN_PATTERNS) {
    const match = text.match(pattern)
    if (match) return match[1].trim()
  }
  return ''
}

const CANTIDAD_RE = /(\d{1,4}[.,]\d{2,4})/g
const FORMATO_RE =
  /(BANDEJA\s*\d*\s*UND[A-Z]*(?:\s*X\s*\d+\s*GR)?|CAJA[S]?\s*(?:DE\s*)?\d*\s*UND[A-Z]*(?:\s*X\s*\d+\s*GR)?|BOLSA[S]?\s*\d*\s*KG|\bKG\b|\bUDS?\b|\bUNIDADES?\b)/i

function formatCantidad(raw) {
  const n = parseFloat(raw.replace(',', '.'))
  if (Number.isNaN(n)) return raw
  return n % 1 === 0 ? String(n) : String(n)
}

function guessUnidad(formatoTexto) {
  if (!formatoTexto) return 'uds'
  return /KG/i.test(formatoTexto) && !/CAJA|BANDEJA/i.test(formatoTexto) ? 'kg' : 'uds'
}

// Extrae las líneas de producto (cantidad + texto de producto + formato) de
// todo el texto de un pedido en PDF, usando los números de cantidad
// ("2,0000", "45,0000"...) como ancla de cada fila de la tabla.
export function extractLineasFromText(text) {
  const flat = text.replace(/\s+/g, ' ')
  const matches = [...flat.matchAll(CANTIDAD_RE)]
  const lineas = []

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i][0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : flat.length
    const chunk = flat.slice(start, end)

    const formatoMatch = chunk.match(FORMATO_RE)
    const productoTexto = (formatoMatch ? chunk.slice(0, formatoMatch.index) : chunk)
      .replace(/\s+/g, ' ')
      .trim()

    if (!productoTexto) continue

    lineas.push({
      cantidadRaw: formatCantidad(matches[i][1]),
      productoTexto,
      formatoTexto: formatoMatch ? formatoMatch[0].trim() : '',
      unidadSugerida: guessUnidad(formatoMatch ? formatoMatch[0] : ''),
    })
  }

  return lineas
}

// Combina la extracción de líneas con el cruce contra el catálogo. Cada
// línea resultante trae `producto` ya rellenado si hay coincidencia fiable,
// o vacío si no, para que la persona lo seleccione manualmente.
export function extractLineasConCatalogo(text, catalogo) {
  return extractLineasFromText(text).map((linea, i) => {
    const match = matchProductoToCatalog(linea.productoTexto, catalogo)
    return {
      id: `linea-${Date.now()}-${i}`,
      producto: match ? match.producto.nombre : '',
      textoOriginal: linea.productoTexto,
      cantidad: linea.cantidadRaw,
      unidad: match?.producto.unidadDefecto || linea.unidadSugerida,
      lote: '',
    }
  })
}
