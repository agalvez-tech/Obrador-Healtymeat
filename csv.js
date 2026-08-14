import Papa from 'papaparse'

// Quita acentos y pasa a minúsculas para comparar cabeceras de forma flexible
function normalize(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const FIELD_ALIASES = {
  nombre: ['nombre', 'cliente', 'parada', 'punto', 'destinatario'],
  direccion: ['direccion', 'address', 'domicilio'],
  items: ['entregar', 'que entregar', 'pedido', 'items', 'articulos', 'contenido', 'productos'],
  telefono: ['telefono', 'tel', 'movil', 'contacto'],
  notas: ['notas', 'observaciones', 'comentarios'],
  dias: ['dias', 'dia', 'dias habituales'],
  horario: ['horario', 'horarios', 'franja horaria'],
  lat: ['lat', 'latitud'],
  lng: ['lng', 'lon', 'long', 'longitud'],
}

function mapHeaders(headers) {
  const map = {}
  const normalizedHeaders = headers.map(normalize)
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    const idx = normalizedHeaders.findIndex((h) => aliases.includes(h))
    if (idx !== -1) map[field] = headers[idx]
  }
  return map
}

// Parsea un fichero CSV y devuelve un array de paradas normalizadas.
// Detecta automáticamente el delimitador (, o ;) y las columnas relevantes
// aunque el CSV venga con cabeceras en otro orden o con acentos distintos.
export function parseDeliveryCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'utf-8',
      complete: (results) => {
        try {
          const headers = results.meta.fields || []
          const map = mapHeaders(headers)

          if (!map.direccion) {
            reject(new Error('No encuentro una columna de dirección en el CSV. Revisa que exista una columna "Dirección".'))
            return
          }

          const stops = results.data
            .filter((row) => row[map.direccion] && String(row[map.direccion]).trim())
            .map((row, i) => ({
              id: `stop-${Date.now()}-${i}`,
              orden: i + 1,
              nombre: (map.nombre && row[map.nombre]) || `Parada ${i + 1}`,
              direccion: String(row[map.direccion]).trim(),
              items: (map.items && row[map.items]) || '',
              telefono: (map.telefono && row[map.telefono]) || '',
              notas: (map.notas && row[map.notas]) || '',
              dias: (map.dias && row[map.dias]) || '',
              horario: (map.horario && row[map.horario]) || '',
              lat: map.lat && row[map.lat] ? parseFloat(row[map.lat]) : null,
              lng: map.lng && row[map.lng] ? parseFloat(row[map.lng]) : null,
              entregado: false,
              geocodeStatus: map.lat && map.lng && row[map.lat] && row[map.lng] ? 'ok' : 'pendiente',
            }))

          if (stops.length === 0) {
            reject(new Error('El CSV no contiene ninguna fila con dirección.'))
            return
          }

          resolve(stops)
        } catch (e) {
          reject(e)
        }
      },
      error: (err) => reject(err),
    })
  })
}
