const CACHE_KEY = 'rk-reparto-geocode-cache'

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // si el cache no cabe, no pasa nada, simplemente no se guarda
  }
}

const cache = loadCache()

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Geocodifica una dirección usando Nominatim (OpenStreetMap), gratuito.
// Añade "Valencia, España" si la dirección no parece incluir ya una ciudad/país,
// para mejorar la precisión en el área habitual de reparto.
async function geocodeOne(direccion) {
  const key = direccion.trim().toLowerCase()
  if (cache[key]) return cache[key]

  const hasContext = /valencia|espa|spain/i.test(direccion)
  const query = hasContext ? direccion : `${direccion}, Valencia, España`

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('geocode-failed')
  const data = await res.json()
  if (!data || data.length === 0) return null

  const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  cache[key] = result
  saveCache(cache)
  return result
}

export async function geocodeAddress(direccion) {
  return geocodeOne(direccion)
}

// Geocodifica una lista de paradas en orden, respetando ~1.1s entre peticiones
// (política de uso de Nominatim), llamando a onProgress tras cada una.
export async function geocodeStops(stops, onProgress) {
  for (const stop of stops) {
    if (stop.lat && stop.lng) {
      onProgress(stop.id, { lat: stop.lat, lng: stop.lng, geocodeStatus: 'ok' })
      continue
    }
    try {
      const coords = await geocodeOne(stop.direccion)
      if (coords) {
        onProgress(stop.id, { ...coords, geocodeStatus: 'ok' })
      } else {
        onProgress(stop.id, { geocodeStatus: 'error' })
      }
    } catch {
      onProgress(stop.id, { geocodeStatus: 'error' })
    }
    await sleep(1100)
  }
}

export function haversineKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
