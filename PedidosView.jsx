import { useEffect, useRef } from 'react'
import L from 'leaflet'

// Iconos personalizados con los colores de marca, en vez de los pines
// por defecto de Leaflet (que no encajan con la identidad RK).
function makeDivIcon(color, label, pulse) {
  return L.divIcon({
    className: '',
    html: `<div class="stop-pin ${pulse ? 'stop-pin--live' : ''}" style="--pin-color:${color}">${label ?? ''}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

export default function MapView({ stops, currentPosition, focusStopId }) {
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const markersRef = useRef({})
  const meMarkerRef = useRef(null)
  const hasCentered = useRef(false)

  useEffect(() => {
    leafletMap.current = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([39.4699, -0.3763], 12) // Valencia por defecto hasta tener GPS

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(leafletMap.current)

    return () => {
      leafletMap.current.remove()
    }
  }, [])

  // Marcador de "mi ubicación"
  useEffect(() => {
    if (!leafletMap.current || !currentPosition) return
    const { lat, lng } = currentPosition

    if (!meMarkerRef.current) {
      meMarkerRef.current = L.marker([lat, lng], {
        icon: makeDivIcon('#1E5FBF', '', true),
        zIndexOffset: 1000,
      }).addTo(leafletMap.current)
    } else {
      meMarkerRef.current.setLatLng([lat, lng])
    }

    if (!hasCentered.current) {
      leafletMap.current.setView([lat, lng], 13)
      hasCentered.current = true
    }
  }, [currentPosition])

  // Marcadores de paradas
  useEffect(() => {
    if (!leafletMap.current) return
    const map = leafletMap.current
    const seen = new Set()

    stops.forEach((stop) => {
      if (!stop.lat || !stop.lng) return
      seen.add(stop.id)
      const color = stop.entregado ? '#2F7A4D' : '#CF731B'
      const label = stop.entregado ? '✓' : stop.orden

      if (markersRef.current[stop.id]) {
        markersRef.current[stop.id].setIcon(makeDivIcon(color, label))
        markersRef.current[stop.id].setLatLng([stop.lat, stop.lng])
      } else {
        const marker = L.marker([stop.lat, stop.lng], { icon: makeDivIcon(color, label) })
          .addTo(map)
          .bindPopup(`<strong>${stop.orden}. ${escapeHtml(stop.nombre)}</strong><br>${escapeHtml(stop.direccion)}`)
        markersRef.current[stop.id] = marker
      }
    })

    Object.keys(markersRef.current).forEach((id) => {
      if (!seen.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })

    // Si no tenemos GPS aún, encuadrar el mapa a las paradas geocodificadas
    if (!hasCentered.current) {
      const coords = stops.filter((s) => s.lat && s.lng).map((s) => [s.lat, s.lng])
      if (coords.length > 0) {
        map.fitBounds(coords, { padding: [40, 40], maxZoom: 14 })
        hasCentered.current = true
      }
    }
  }, [stops])

  // Centrar en una parada concreta cuando se toca en la lista
  useEffect(() => {
    if (!focusStopId || !leafletMap.current) return
    const marker = markersRef.current[focusStopId]
    if (marker) {
      leafletMap.current.setView(marker.getLatLng(), 16, { animate: true })
      marker.openPopup()
    }
  }, [focusStopId])

  return <div ref={mapRef} className="map-view" />
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
