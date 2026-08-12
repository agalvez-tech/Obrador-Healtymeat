import { haversineKm } from './geocode.js'

// Optimiza el orden de las paradas a partir de un punto de partida (depósito).
// Intenta usar OSRM (distancia real por carretera, servidor público gratuito).
// Si el servicio público no responde (puede saturarse al ser gratuito),
// se recurre a un algoritmo de vecino más cercano por línea recta, para que
// la ruta de hoy siempre se pueda guardar aunque el servicio esté caído.
export async function optimizeRoute(depot, points) {
  try {
    const result = await optimizeWithOSRM(depot, points)
    return result
  } catch {
    return optimizeNearestNeighbor(depot, points)
  }
}

async function optimizeWithOSRM(depot, points) {
  if (points.length === 0) return { order: [], method: 'osrm' }
  if (points.length === 1) return { order: [points[0]], method: 'osrm' }

  const all = [depot, ...points]
  const coords = all.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&roundtrip=false&overview=false`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  let res
  try {
    res = await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
  if (!res.ok) throw new Error('osrm-failed')
  const data = await res.json()
  if (data.code !== 'Ok' || !data.waypoints) throw new Error('osrm-no-route')

  // waypoint_index indica la posición de cada punto en la ruta óptima.
  // El índice 0 es siempre el depósito, así que lo excluimos del resultado.
  const order = data.waypoints
    .map((w, i) => ({ originalIndex: i, tripIndex: w.waypoint_index }))
    .filter((w) => w.originalIndex !== 0)
    .sort((a, b) => a.tripIndex - b.tripIndex)
    .map((w) => points[w.originalIndex - 1])

  return { order, method: 'osrm' }
}

function optimizeNearestNeighbor(depot, points) {
  const remaining = [...points]
  const order = []
  let current = depot
  while (remaining.length) {
    let bestIdx = 0
    let bestDist = Infinity
    remaining.forEach((p, i) => {
      const d = haversineKm(current, p)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    })
    current = remaining[bestIdx]
    order.push(current)
    remaining.splice(bestIdx, 1)
  }
  return { order, method: 'straight-line' }
}
