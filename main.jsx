import { useEffect, useState } from 'react'
import { api } from './utils/api.js'
import { todayISO, addDaysISO, weekKey, weekRange, getWeekDates } from './utils/date.js'

function formatWeekLabel(weekAnchor) {
  const dates = getWeekDates(weekAnchor)
  const inicio = new Date(`${dates[0].iso}T00:00:00`)
  const fin = new Date(`${dates[6].iso}T00:00:00`)
  const fmt = (d) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  return `${fmt(inicio)} – ${fmt(fin)}`
}

export default function WeeklyClientStatus({ clients }) {
  const [weekAnchor, setWeekAnchor] = useState(todayISO())
  const [pedidos, setPedidos] = useState([])
  const [omitidos, setOmitidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  const semana = weekKey(weekAnchor)
  const { desde, hasta } = weekRange(weekAnchor)

  async function refresh() {
    const [pedidosData, omitidosData] = await Promise.all([
      api.getPedidos({ desde, hasta }),
      api.getOmitidos(semana),
    ])
    setPedidos(pedidosData)
    setOmitidos(omitidosData)
    setLoading(false)
  }

  useEffect(() => {
    setLoading(true)
    refresh()
    const interval = setInterval(refresh, 15000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekAnchor])

  async function toggleOmitido(clienteId, omitido) {
    const next = await api.setOmitido(semana, clienteId, omitido)
    setOmitidos(next)
  }

  function estadoCliente(cliente) {
    const pedidosCliente = pedidos.filter((p) => p.clienteId === cliente.id)
    if (pedidosCliente.length === 0) {
      return omitidos.includes(cliente.id)
        ? { color: 'gris', label: 'No quiere esta semana' }
        : { color: 'rojo', label: 'Sin pedido esta semana' }
    }
    const montado = pedidosCliente.some((p) => p.estado !== 'elaboracion')
    return montado
      ? { color: 'verde', label: 'Pedido montado' }
      : { color: 'naranja', label: 'Pedido subido, sin montar' }
  }

  const filtered = clients.filter((c) => c.nombre.toLowerCase().includes(filter.trim().toLowerCase()))
  const ordenColor = { rojo: 0, naranja: 1, verde: 2, gris: 3 }
  const sorted = [...filtered].sort((a, b) => {
    const ea = estadoCliente(a)
    const eb = estadoCliente(b)
    return ordenColor[ea.color] - ordenColor[eb.color] || a.nombre.localeCompare(b.nombre, 'es')
  })

  const counts = sorted.reduce((acc, c) => {
    const color = estadoCliente(c).color
    acc[color] = (acc[color] || 0) + 1
    return acc
  }, {})

  return (
    <div className="weekly-status">
      <div className="weekly-status-nav">
        <button type="button" className="btn-icon" onClick={() => setWeekAnchor(addDaysISO(weekAnchor, -7))} aria-label="Semana anterior">‹</button>
        <span className="weekly-status-range">{formatWeekLabel(weekAnchor)}</span>
        <button type="button" className="btn-icon" onClick={() => setWeekAnchor(addDaysISO(weekAnchor, 7))} aria-label="Semana siguiente">›</button>
        <button type="button" className="btn-link" onClick={() => setWeekAnchor(todayISO())}>Hoy</button>
      </div>

      <div className="weekly-status-legend">
        <span className="weekly-dot weekly-dot--rojo" /> Sin pedido ({counts.rojo || 0})
        <span className="weekly-dot weekly-dot--naranja" /> Subido ({counts.naranja || 0})
        <span className="weekly-dot weekly-dot--verde" /> Montado ({counts.verde || 0})
        <span className="weekly-dot weekly-dot--gris" /> No quiere ({counts.gris || 0})
      </div>

      <input
        className="field-input"
        placeholder="Buscar cliente…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {loading && <p className="office-status-muted">Cargando…</p>}

      <div className="weekly-status-list">
        {sorted.map((c) => {
          const estado = estadoCliente(c)
          return (
            <div key={c.id} className="weekly-status-row">
              <span className={`weekly-dot weekly-dot--${estado.color}`} />
              <div className="weekly-status-row-body">
                <div className="weekly-status-row-name">{c.nombre}</div>
                <div className="office-status-muted">{estado.label}</div>
              </div>
              {(estado.color === 'rojo' || estado.color === 'gris') && (
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => toggleOmitido(c.id, estado.color === 'rojo')}
                >
                  {estado.color === 'rojo' ? 'No quiere esta semana' : 'Sí quiere'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
