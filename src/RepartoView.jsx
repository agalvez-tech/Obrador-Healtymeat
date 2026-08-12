import { useEffect, useRef, useState } from 'react'
import { api } from './utils/api.js'
import { todayISO, formatDateLong } from './utils/date.js'
import { geocodeAddress } from './utils/geocode.js'
import { optimizeRoute } from './utils/optimize.js'
import { openDataUrlInNewTab } from './utils/openDataUrl.js'
import DragReorderList from './DragReorderList.jsx'

const POLL_MS = 12000

function estadoEnRuta(pedido, isInRoute) {
  if (pedido.estado === 'enviado') {
    return { label: '✓ Enviado', tone: 'done' }
  }
  if (pedido.estado === 'ok_albaran') {
    const conAlbaran = pedido.sinAlbaran ? '(sin albarán)' : '— con albarán'
    return isInRoute
      ? { label: `OK reparto ${conAlbaran}`, tone: 'ok' }
      : { label: `OK albarán ${pedido.sinAlbaran ? '(sin archivo)' : ''}, pendiente de reparto`, tone: 'ok' }
  }
  if (pedido.estado === 'lista_para_repartir' && isInRoute) {
    return { label: 'En ruta — pendiente de albarán', tone: 'warn' }
  }
  if (pedido.estado === 'lista_para_repartir') {
    return { label: 'OK montado', tone: 'info' }
  }
  return { label: 'En producción', tone: 'muted' }
}

export default function RepartoView() {
  const [clients, setClients] = useState([])
  const [pedidosDia, setPedidosDia] = useState([])
  const [route, setRoute] = useState(null)
  const [depot, setDepot] = useState(null)
  const [depotDraft, setDepotDraft] = useState('')
  const [editingDepot, setEditingDepot] = useState(false)
  const [depotSaving, setDepotSaving] = useState(false)
  const [depotError, setDepotError] = useState(null)

  const [date, setDate] = useState(todayISO())
  const [selected, setSelected] = useState({}) // { [pedidoId]: true }
  const [optimizing, setOptimizing] = useState(false)
  const [optimizeNote, setOptimizeNote] = useState(null)
  const [optimizeError, setOptimizeError] = useState(null)
  const [loading, setLoading] = useState(true)
  const initializedSelection = useRef(false)
  const fileInputRefs = useRef({})

  async function refresh() {
    const [clientsData, pedidosData, routeData] = await Promise.all([
      api.getClients(),
      api.getPedidos({ tipoEntrega: 'propio', fecha: date }),
      api.getRoute(date),
    ])
    setClients(clientsData)
    setPedidosDia(pedidosData)
    setRoute(routeData)

    if (!initializedSelection.current) {
      const initial = {}
      if (routeData) {
        routeData.stops.forEach((s) => { initial[s.pedidoId] = true })
      } else {
        pedidosData.forEach((p) => { initial[p.id] = true })
      }
      setSelected(initial)
      initializedSelection.current = true
    }
    setLoading(false)
  }

  useEffect(() => {
    initializedSelection.current = false
    refresh()
    api.getSettings().then((s) => {
      if (s) {
        setDepot(s)
        setDepotDraft(s.direccion || '')
      }
    })
    const interval = setInterval(refresh, POLL_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  function togglePedido(id) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function marcarTodos(valor) {
    setSelected(Object.fromEntries(pedidosDia.map((p) => [p.id, valor])))
  }

  async function saveDepot() {
    if (!depotDraft.trim()) return
    setDepotSaving(true)
    setDepotError(null)
    try {
      const coords = await geocodeAddress(depotDraft.trim())
      if (!coords) {
        setDepotError('No he podido localizar esa dirección.')
        setDepotSaving(false)
        return
      }
      const settings = { direccion: depotDraft.trim(), lat: coords.lat, lng: coords.lng }
      await api.saveSettings(settings)
      setDepot(settings)
      setEditingDepot(false)
    } catch (err) {
      setDepotError(err.message || 'No se pudo guardar.')
    } finally {
      setDepotSaving(false)
    }
  }

  async function buildRoute() {
    setOptimizeError(null)
    setOptimizeNote(null)

    if (!depot) {
      setOptimizeError('Primero indica el punto de partida (almacén) más abajo.')
      return
    }
    const selectedIds = Object.keys(selected).filter((id) => selected[id])
    if (selectedIds.length === 0) {
      setOptimizeError('Marca al menos un pedido para la ruta de este día.')
      return
    }

    setOptimizing(true)
    try {
      const puntos = selectedIds
        .map((id) => {
          const pedido = pedidosDia.find((p) => p.id === id)
          const cliente = pedido && clients.find((c) => c.id === pedido.clienteId)
          if (!pedido || !cliente || !cliente.lat || !cliente.lng) return null
          return { pedidoId: pedido.id, lat: cliente.lat, lng: cliente.lng }
        })
        .filter(Boolean)

      if (puntos.length === 0) {
        setOptimizeError('Ninguno de los pedidos seleccionados tiene una dirección localizada.')
        setOptimizing(false)
        return
      }

      const { order, method } = await optimizeRoute({ lat: depot.lat, lng: depot.lng }, puntos)

      const stops = order.map((punto, i) => {
        const existing = route?.stops?.find((s) => s.pedidoId === punto.pedidoId)
        return {
          pedidoId: punto.pedidoId,
          orden: i + 1,
          entregado: existing?.entregado || false,
          entregadoAt: existing?.entregadoAt || null,
        }
      })

      const saved = await api.saveRoute(date, stops)
      setRoute(saved)
      setOptimizeNote(
        method === 'osrm'
          ? 'Ruta guardada, optimizada por distancia real de carretera.'
          : 'Ruta guardada. El optimizador por carretera no respondió, así que se ha ordenado por distancia en línea recta.'
      )
    } catch (err) {
      setOptimizeError(err.message || 'No se pudo calcular la ruta.')
    } finally {
      setOptimizing(false)
    }
  }

  async function handleAlbaranUpload(pedidoId, file) {
    const reader = new FileReader()
    reader.onload = async () => {
      await api.updatePedido({ id: pedidoId, albaranPdf: reader.result })
      await refresh()
    }
    reader.readAsDataURL(file)
  }

  async function handleNumeroAlbaran(pedidoId, numeroAlbaran) {
    const updated = await api.updatePedido({ id: pedidoId, numeroAlbaran })
    setPedidosDia((prev) => prev.map((p) => (p.id === pedidoId ? updated : p)))
  }

  async function handleReorderRoute(nuevoOrdenStops) {
    const stops = nuevoOrdenStops.map((s, i) => ({ ...s, orden: i + 1 }))
    const saved = await api.saveRoute(date, stops)
    setRoute(saved)
  }

  const entregados = route?.stops?.filter((s) => s.entregado).length || 0
  const totalRuta = route?.stops?.length || 0

  return (
    <div className="tab-view">
      <div className="tab-view-header">
        <h2>Reparto</h2>
        <input type="date" className="field-input field-input--date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <section className="office-section">
        <h2>Ruta — {formatDateLong(date)}</h2>
        {route ? (
          <p className="office-status">
            <span className="mono">{entregados}/{totalRuta}</span> entregados
            {route.updatedAt && (
              <span className="office-status-muted"> · actualizado {new Date(route.updatedAt).toLocaleTimeString('es-ES')}</span>
            )}
          </p>
        ) : (
          <p className="office-status office-status-muted">Todavía no se ha guardado la ruta de este día.</p>
        )}
      </section>

      {route && route.stops.length > 0 && (
        <section className="office-section">
          <h2>Orden de la ruta</h2>
          <p className="office-status-muted">
            Arrastra por el ⠿ para cambiar el orden manualmente, por si hace falta una variación de
            última hora. Se guarda solo, al momento.
          </p>
          <DragReorderList
            items={route.stops}
            keyField="pedidoId"
            className="ruta-orden-list"
            onReorder={handleReorderRoute}
            renderItem={(stop, dragHandleProps) => {
              const pedido = pedidosDia.find((p) => p.id === stop.pedidoId)
              return (
                <div className={`ruta-orden-row ${stop.entregado ? 'ruta-orden-row--done' : ''}`}>
                  <span className="drag-handle" onPointerDown={dragHandleProps} aria-label="Arrastrar para reordenar">⠿</span>
                  <span className="ruta-orden-num mono">{stop.orden}</span>
                  <span className="ruta-orden-nombre">
                    {pedido?.clienteNombre || 'Pedido'}
                    {stop.entregado && <span className="client-row-badge"> ✓ entregado</span>}
                  </span>
                </div>
              )
            }}
          />
        </section>
      )}

      <section className="office-section">
        <h2>Punto de partida</h2>
        {!editingDepot && depot && (
          <div className="depot-row">
            <span>{depot.direccion}</span>
            <button className="btn-link" onClick={() => setEditingDepot(true)}>Cambiar</button>
          </div>
        )}
        {(editingDepot || !depot) && (
          <div className="depot-edit">
            <input
              className="field-input"
              value={depotDraft}
              onChange={(e) => setDepotDraft(e.target.value)}
              placeholder="Carrer Emperador 15, Museros"
            />
            <button className="btn-secondary" onClick={saveDepot} disabled={depotSaving}>
              {depotSaving ? 'Localizando…' : 'Guardar'}
            </button>
          </div>
        )}
        {depotError && <p className="upload-error">{depotError}</p>}
      </section>

      <section className="office-section">
        <div className="office-section-header">
          <h2>Pedidos de este día</h2>
          <div className="office-section-actions">
            <button type="button" className="btn-secondary" onClick={() => marcarTodos(true)} disabled={pedidosDia.length === 0}>
              Marcar todos
            </button>
            <button type="button" className="btn-secondary" onClick={() => marcarTodos(false)} disabled={pedidosDia.length === 0}>
              Desmarcar todos
            </button>
          </div>
        </div>
        <p className="office-status-muted">
          Aparecen todos desde el momento en que entran, estén o no preparados — para poder organizar
          la ruta con antelación. Marca los que quieras incluir al optimizar.
        </p>
        {loading && <p className="office-status-muted">Cargando…</p>}
        {!loading && pedidosDia.length === 0 && (
          <p className="office-status-muted">Todavía no ha entrado ningún pedido para este día.</p>
        )}
        <div className="client-list">
          {pedidosDia.map((p) => {
            const cliente = clients.find((c) => c.id === p.clienteId)
            const stop = route?.stops?.find((s) => s.pedidoId === p.id)
            const isSelected = !!selected[p.id]
            const estado = estadoEnRuta(p, !!stop)
            return (
              <div key={p.id} className={`client-row ${isSelected ? 'client-row--selected' : ''}`}>
                <label className="client-row-check">
                  <input type="checkbox" checked={isSelected} onChange={() => togglePedido(p.id)} />
                </label>
                <div className="client-row-body">
                  <div className="client-row-name">
                    {p.clienteNombre}
                    {p.numeroPedido && <span className="office-status-muted">Nº {p.numeroPedido}</span>}
                    <span className={`estado-badge estado-badge--${estado.tone}`}>{estado.label}</span>
                  </div>
                  <div className="client-row-address">{cliente?.direccion}</div>
                  <div className="office-status-muted">
                    {p.lineas && p.lineas.length > 0
                      ? p.lineas.map((l) => `${l.producto || '(sin producto)'}: ${l.cantidad} ${l.unidad} · lote ${l.lote}`).join(' — ')
                      : 'todavía sin preparar'}
                  </div>
                  <div className="albaran-row">
                    {p.albaranPdf ? (
                      <button type="button" className="btn-link" onClick={() => openDataUrlInNewTab(p.albaranPdf)}>
                        📄 Ver albarán adjunto
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => fileInputRefs.current[p.id]?.click()}
                        >
                          + Añadir albarán (PDF)
                        </button>
                        <input
                          ref={(el) => (fileInputRefs.current[p.id] = el)}
                          type="file"
                          accept="application/pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => e.target.files?.[0] && handleAlbaranUpload(p.id, e.target.files[0])}
                        />
                      </>
                    )}
                    <NumeroAlbaranField pedido={p} onSave={handleNumeroAlbaran} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="office-build-bar">
        {optimizeError && <p className="upload-error">{optimizeError}</p>}
        {optimizeNote && <p className="office-status-muted">{optimizeNote}</p>}
        <button className="btn-primary" onClick={buildRoute} disabled={optimizing}>
          {optimizing ? 'Calculando ruta…' : `Optimizar y guardar ruta (${Object.values(selected).filter(Boolean).length})`}
        </button>
      </div>
    </div>
  )
}

function NumeroAlbaranField({ pedido, onSave }) {
  const [value, setValue] = useState(pedido.numeroAlbaran || '')
  return (
    <input
      className="field-input field-input--compact numero-albaran-input"
      placeholder="Nº de albarán (opcional)"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onSave(pedido.id, value.trim())}
    />
  )
}
