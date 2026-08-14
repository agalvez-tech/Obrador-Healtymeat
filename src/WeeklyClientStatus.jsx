import { useEffect, useState } from 'react'
import { api } from './utils/api.js'
import { todayISO, addDaysISO, weekKey, getWeekDates } from './utils/date.js'

const DIA_NOMBRE = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado', D: 'Domingo' }

export default function WeeklyClientStatus({ clients }) {
  const [weekAnchor, setWeekAnchor] = useState(todayISO())
  const [pedidos, setPedidos] = useState([])
  const [omitidos, setOmitidos] = useState([])
  const [loading, setLoading] = useState(true)

  const semana = weekKey(weekAnchor)
  const weekDates = getWeekDates(weekAnchor)

  async function refresh() {
    const [pedidosData, omitidosData] = await Promise.all([
      api.getPedidos({ repartoDesde: weekDates[0].iso, repartoHasta: weekDates[6].iso }),
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

  const clientesConDia = clients.filter((c) => (c.dias || '').trim())
  const clientesSinDia = clients.filter((c) => !(c.dias || '').trim())

  function estadoCelda(cliente, diaIso) {
    const pedido = pedidos.find((p) => p.clienteId === cliente.id && p.fechaReparto === diaIso)
    if (pedido) {
      return pedido.estado === 'elaboracion'
        ? { color: 'naranja', label: 'Pedido subido, sin montar' }
        : { color: 'verde', label: 'Pedido montado' }
    }
    return omitidos.includes(cliente.id)
      ? { color: 'gris', label: 'No quiere esta semana' }
      : { color: 'rojo', label: 'Sin pedido' }
  }

  return (
    <div className="weekly-status">
      <div className="weekly-status-nav">
        <button type="button" className="btn-icon" onClick={() => setWeekAnchor(addDaysISO(weekAnchor, -7))} aria-label="Semana anterior">‹</button>
        <span className="weekly-status-range">
          {weekDates[0].iso} – {weekDates[6].iso}
        </span>
        <button type="button" className="btn-icon" onClick={() => setWeekAnchor(addDaysISO(weekAnchor, 7))} aria-label="Semana siguiente">›</button>
        <button type="button" className="btn-link" onClick={() => setWeekAnchor(todayISO())}>Hoy</button>
      </div>

      <div className="weekly-status-legend">
        <span className="weekly-dot weekly-dot--rojo" /> Sin pedido
        <span className="weekly-dot weekly-dot--naranja" /> Subido, sin montar
        <span className="weekly-dot weekly-dot--verde" /> Montado
        <span className="weekly-dot weekly-dot--gris" /> No quiere esta semana
      </div>

      {loading && <p className="office-status-muted">Cargando…</p>}

      <div className="calendar-scroll">
        <div className="calendar-grid">
          {weekDates.map((dia) => (
            <div key={dia.iso} className="calendar-col">
              <div className="calendar-col-header">
                <div>{DIA_NOMBRE[dia.label]}</div>
                <div className="mono office-status-muted">{dia.iso.slice(8)}/{dia.iso.slice(5, 7)}</div>
              </div>
              <div className="calendar-col-body">
                {clientesConDia
                  .filter((c) => c.dias.toUpperCase().includes(dia.label))
                  .map((c) => {
                    const estado = estadoCelda(c, dia.iso)
                    return (
                      <div key={c.id} className={`calendar-chip calendar-chip--${estado.color}`}>
                        <span className="calendar-chip-nombre">{c.nombre}</span>
                        {(estado.color === 'rojo' || estado.color === 'gris') && (
                          <button
                            type="button"
                            className="calendar-chip-toggle"
                            onClick={() => toggleOmitido(c.id, estado.color === 'rojo')}
                            title={estado.color === 'rojo' ? 'No quiere esta semana' : 'Sí quiere esta semana'}
                          >
                            {estado.color === 'rojo' ? '⊘' : '↺'}
                          </button>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {clientesSinDia.length > 0 && (
        <p className="office-status-muted calendar-nota">
          {clientesSinDia.length} cliente{clientesSinDia.length === 1 ? '' : 's'} sin días habituales
          asignados (incluye normalmente a los de agencia) no aparecen en este calendario — revísalos
          desde la vista "Lista".
        </p>
      )}
    </div>
  )
}
