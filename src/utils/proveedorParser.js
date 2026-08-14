// Extractor de "mejor esfuerzo" para albaranes de proveedores de materia
// prima. A diferencia de los pedidos de clientes (que casi siempre vienen
// del mismo generador, gstock, con un formato fijo), cada proveedor tiene
// su propio formato de albarán, así que esto solo intenta rellenar lo que
// pueda con confianza razonable — el resto se deja para completar a mano.

const FECHA_RE = /Fecha\s*:?\s*(\d{2})[/\-](\d{2})[/\-](\d{4})/i
const NUMERO_ALBARAN_RE = /ALBAR[ÁA]N\s*N[ºo°]?\.?\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9\-\/]{2,40})/i
const DETALLE_RE = /Detalle([\s\S]*?)(?:Notas|Observaciones|$)/i
const CANTIDAD_RE = /(\d{1,5}[.,]\d{1,4})/

function fechaToISO(match) {
  if (!match) return ''
  const [, dd, mm, yyyy] = match
  return `${yyyy}-${mm}-${dd}`
}

// Intenta encontrar el nombre de un proveedor conocido dentro del texto.
function detectarProveedor(text, proveedores) {
  const normalizado = text.toUpperCase()
  return proveedores.find((p) => normalizado.includes(p.nombre.toUpperCase())) || null
}

export function extractSupplierDeliveryInfo(text, proveedores = []) {
  const fecha = fechaToISO(text.match(FECHA_RE))
  const numeroAlbaran = (text.match(NUMERO_ALBARAN_RE) || [])[1] || ''
  const proveedor = detectarProveedor(text, proveedores)

  let productoTexto = ''
  let cantidad = ''
  let lotes = ''

  const detalleMatch = text.match(DETALLE_RE)
  if (detalleMatch) {
    const bloque = detalleMatch[1]
      .replace(/Concepto\s*Q\.?/i, '')
      .trim()
    const cantidadMatch = bloque.match(CANTIDAD_RE)
    if (cantidadMatch) {
      const idx = bloque.indexOf(cantidadMatch[0])
      productoTexto = bloque.slice(0, idx).replace(/\s+/g, ' ').trim()
      cantidad = cantidadMatch[0].replace(',', '.')
      const resto = bloque.slice(idx + cantidadMatch[0].length)
      lotes = resto
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => /^[A-Z0-9\-]{3,20}$/i.test(t))
        .join(', ')
    } else {
      productoTexto = bloque.replace(/\s+/g, ' ').trim()
    }
  }

  return {
    proveedorId: proveedor?.id || '',
    proveedorNombre: proveedor?.nombre || '',
    numeroAlbaran,
    fechaAlbaran: fecha,
    productoTexto,
    cantidad,
    lote: lotes,
  }
}
