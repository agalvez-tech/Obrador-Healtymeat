import { useEffect, useState } from 'react'
import MapView from './MapView.jsx'
import SignaturePad from './SignaturePad.jsx'
import { api } from './utils/api.js'
import { todayISO, formatDateLong } from './utils/date.js'
import { mergeSignatureIntoPdf } from './utils/pdfSign.js'

const ROUTE_POLL_MS = 15000

export default function DriverView({ onChangeRole }) {
  const [clients, setClients] = useState([])
  const [pedidosById, setPedidosById] = useState({})
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [currentPosition, setCurrentPosition] = useState(null)
  const [gpsError, setGpsError] = useState(null)
  const [focusStopId, setFocusStopId] = useState(null)
  const [pendingIds, setPendingIds] = useState({})
  const [stopErrors, setStopErrors] = useState({})
  const [signingPedidoId, setSigningPedidoId] = useState(null)
  const date = todayISO()

  async function loadEverything() {
    try {
      const [clientsData, routeData] = await Promise.all([api.getClients(), api.getRoute(date)])
      setClients(clientsData)
      setRoute(routeData)

      if (routeData?.stops?.length) {
        const pedidos = await Promise.all(
          routeData.stops.map((s) => api.getPedidos({ id: s.pedidoId }))
        )
        const map = {}
        routeData.stops.forEach((s, i) => {
          if (pedidos[i]) map[s.pedidoId] = pedidos[i]
        })
        setPedidosById(map)
      } else {
        setPedidosById({})
      }
      setLoadError(null)
    } catch (err) {
      setLoadError(err.message || 'No se pudo cargar la ruta.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEverything()
    const interval = setInterval(loadEverything, ROUTE_POLL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Este dispositivo no admite geolocalización.')
      return
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsError(null)
      },
      (err) => setGpsError(err.message || 'No se pudo obtener tu ubicación.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  async function toggleEntregadoSinFirma(pedidoId, next) {
    setPendingIds((p) => ({ ...p, [pedidoId]: true }))
    setStopErrors((e) => ({ ...e, [pedidoId]: null }))
    setRoute((prev) => ({
      ...prev,
      stops: prev.stops.map((s) => (s.pedidoId === pedidoId ? { ...s, entregado: next } : s)),
    }))
    try {
      await api.markDelivered(date, pedidoId, next)
      await loadEverything()
    } catch (err) {
      setRoute((prev) => ({
        ...prev,
        stops: prev.stops.map((s) => (s.pedidoId === pedidoId ? { ...s, entregado: !next } : s)),
      }))
      setStopErrors((e) => ({ ...e, [pedidoId]: 'No se pudo guardar. Comprueba la conexión y vuelve a intentarlo.' }))
    } finally {
      setPendingIds((p) => ({ ...p, [pedidoId]: false }))
    }
  }

  async function handleFirmaConfirmada(pedidoId, firmaPng) {
    setPendingIds((p) => ({ ...p, [pedidoId]: true }))
    setStopErrors((e) => ({ ...e, [pedidoId]: null }))
    try {
      const pedido = pedidosById[pedidoId]
      let albaranFirmado = null
      if (pedido?.albaranPdf) {
        try {
          albaranFirmado = await mergeSignatureIntoPdf(pedido.albaranPdf, firmaPng)
        } catch {
          albaranFirmado = null
        }
      }
      await api.firmarPedido(date, pedidoId, firmaPng, albaranFirmado)
      setSigningPedidoId(null)
      await loadEverything()
    } catch (err) {
      setStopErrors((e) => ({ ...e, [pedidoId]: 'No se pudo guardar la firma. Vuelve a intentarlo.' }))
    } finally {
      setPendingIds((p) => ({ ...p, [pedidoId]: false }))
    }
  }

  const stopsWithData = (route?.stops || [])
    .map((s) => {
      const pedido = pedidosById[s.pedidoId]
      const client = pedido && clients.find((c) => c.id === pedido.clienteId)
      if (!pedido || !client) return null
      return { ...client, ...s, pedido, id: s.pedidoId }
    })
    .filter(Boolean)

  const total = stopsWithData.length
  const entregados = stopsWithData.filter((s) => s.entregado).length

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <img src="/logo.jpg" alt="HealthyMeat" className="brand-logo" />
          <span className="brand-name">Reparto</span>
        </div>
        <button className="btn-ghost" onClick={onChangeRole}>Cambiar modo</button>
      </header>

      {loading && (
        <div className="upload-screen">
          <p className="office-status-muted">Cargando la ruta de hoy…</p>
        </div>
      )}

      {!loading && loadError && (
        <div className="upload-screen">
          <div className="upload-card">
            <p className="upload-error">{loadError}</p>
            <button className="btn-primary" onClick={loadEverything}>Reintentar</button>
          </div>
        </div>
      )}

      {!loading && !loadError && !route && (
        <div className="upload-screen">
          <div className="upload-card">
            <img src="/logo.jpg" alt="HealthyMeat" className="upload-logo" />
            <h1>Sin ruta todavía</h1>
            <p>La oficina no ha planificado la ruta de hoy ({formatDateLong(date)}) todavía. Esta pantalla se actualiza sola en cuanto la guarden.</p>
            <button className="btn-secondary" onClick={loadEverything}>Comprobar ahora</button>
          </div>
        </div>
      )}

      {!loading && !loadError && route && (
        <>
          <RouteProgress stopsData={stopsWithData} total={total} entregados={entregados} onSelect={setFocusStopId} />

          <MapView stops={stopsWithData} currentPosition={currentPosition} focusStopId={focusStopId} />

          {gpsError && (
            <div className="toolbar">
              <span className="gps-error">📍 {gpsError}</span>
            </div>
          )}

          <div className="stop-list">
            {stopsWithData.map((stop) => (
              <StopCard
                key={stop.pedidoId}
                stop={stop}
                pending={!!pendingIds[stop.pedidoId]}
                error={stopErrors[stop.pedidoId]}
                onToggleSinFirma={() => toggleEntregadoSinFirma(stop.pedidoId, !stop.entregado)}
                onFirmar={() => setSigningPedidoId(stop.pedidoId)}
                onFocus={() => setFocusStopId(stop.pedidoId)}
              />
            ))}
          </div>
        </>
      )}

      {signingPedidoId && (
        <SignaturePad
          confirmLabel="Confirmar entrega"
          onCancel={() => setSigningPedidoId(null)}
          onConfirm={(png) => handleFirmaConfirmada(signingPedidoId, png)}
        />
      )}
    </div>
  )
}

function RouteProgress({ stopsData, total, entregados, onSelect }) {
  const pct = total ? Math.round((entregados / total) * 100) : 0
  return (
    <div className="route-progress">
      <div className="route-progress-bar">
        <div className="route-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="route-progress-meta">
        <span className="mono">{entregados}/{total}</span>
        <span className="route-progress-label">entregados</span>
      </div>
      <div className="route-dots">
        {stopsData.map((s) => (
          <button
            key={s.pedidoId}
            className={`route-dot ${s.entregado ? 'route-dot--done' : ''}`}
            onClick={() => onSelect(s.pedidoId)}
            aria-label={`Ir a parada ${s.orden}`}
          >
            {s.orden}
          </button>
        ))}
      </div>
    </div>
  )
}

function StopCard({ stop, pending, error, onToggleSinFirma, onFirmar, onFocus }) {
  const pedido = stop.pedido
  const tieneAlbaran = !!pedido?.albaranPdf

  return (
    <div className={`stop-card ${stop.entregado ? 'stop-card--done' : ''}`} onClick={onFocus}>
      <div className="stop-card-index mono">{stop.orden}</div>
      <div className="stop-card-body">
        <div className="stop-card-name">{stop.nombre}</div>
        <div className="stop-card-address">{stop.direccion}</div>
        <div className="stop-card-items">
          {(pedido.lineas || []).map((l) => (
            <div key={l.id}>📦 {l.producto || '(sin producto)'}: {l.cantidad} {l.unidad} · lote {l.lote}</div>
          ))}
        </div>
        {stop.telefono && <div className="stop-card-phone">☎ {stop.telefono}</div>}
        {(stop.dias || stop.horario) && (
          <div className="stop-card-schedule">
            🕐 {[stop.dias, stop.horario].filter(Boolean).join(' · ')}
          </div>
        )}
        {tieneAlbaran && (
          <a href={pedido.albaranFirmado || pedido.albaranPdf} target="_blank" rel="noreferrer" className="btn-link">
            📄 Ver albarán
          </a>
        )}
        {error && <div className="stop-card-warning">{error}</div>}
      </div>

      {!stop.entregado && tieneAlbaran && (
        <button
          className="stop-card-toggle"
          disabled={pending}
          onClick={(e) => { e.stopPropagation(); onFirmar() }}
        >
          {pending ? '…' : 'Firmar y entregar'}
        </button>
      )}
      {!stop.entregado && !tieneAlbaran && (
        <button
          className="stop-card-toggle"
          disabled={pending}
          onClick={(e) => { e.stopPropagation(); onToggleSinFirma() }}
        >
          {pending ? '…' : 'Marcar entregado'}
        </button>
      )}
      {stop.entregado && (
        <button
          className="stop-card-toggle stop-card-toggle--done"
          disabled={pending}
          onClick={(e) => { e.stopPropagation(); onToggleSinFirma() }}
        >
          ✓ Entregado
        </button>
      )}
    </div>
  )
}
