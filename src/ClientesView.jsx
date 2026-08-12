import { useEffect, useRef, useState } from 'react'
import { api } from './utils/api.js'
import { geocodeStops } from './utils/geocode.js'
import { parseDeliveryCSV } from './utils/csv.js'
import ClientForm from './ClientForm.jsx'
import WeeklyClientStatus from './WeeklyClientStatus.jsx'

export default function ClientesView() {
  const [vista, setVista] = useState('lista') // 'lista' | 'semanal'
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [formTarget, setFormTarget] = useState(null)
  const [filter, setFilter] = useState('')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(null)
  const fileInputRef = useRef(null)

  async function refreshClients() {
    const data = await api.getClients()
    setClients(data)
    setLoadingClients(false)
  }

  useEffect(() => {
    refreshClients()
  }, [])

  async function handleSaveClient(data) {
    if (data.id) {
      await api.updateClient(data)
    } else {
      await api.addClient(data)
    }
    await refreshClients()
    setFormTarget(null)
  }

  async function handleDeleteClient(id) {
    if (!confirm('¿Eliminar este cliente de la lista habitual?')) return
    await api.deleteClient(id)
    await refreshClients()
  }

  async function handleImportCSV(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportProgress('Leyendo CSV…')
    try {
      const parsed = await parseDeliveryCSV(file)
      let done = 0
      await geocodeStops(parsed, () => {
        done += 1
        setImportProgress(`Localizando direcciones… ${done}/${parsed.length}`)
      })
      for (const p of parsed) {
        setImportProgress(`Guardando clientes… ${parsed.indexOf(p) + 1}/${parsed.length}`)
        await api.addClient({
          nombre: p.nombre,
          direccion: p.direccion,
          telefono: p.telefono,
          dias: p.dias,
          horario: p.horario,
          notas: p.notas,
          lat: p.lat,
          lng: p.lng,
          tipoEntrega: 'propio',
        })
      }
      await refreshClients()
      setImportProgress(`Importados ${parsed.length} clientes.`)
    } catch (err) {
      setImportProgress(err.message || 'No se pudo importar el CSV.')
    } finally {
      setImporting(false)
      e.target.value = ''
      setTimeout(() => setImportProgress(null), 4000)
    }
  }

  const filteredClients = clients.filter((c) => {
    if (tipoFilter !== 'todos' && c.tipoEntrega !== tipoFilter) return false
    const q = filter.trim().toLowerCase()
    if (!q) return true
    return c.nombre.toLowerCase().includes(q) || (c.direccion || '').toLowerCase().includes(q)
  })

  return (
    <div className="tab-view">
      <div className="tab-view-header">
        <h2>Clientes</h2>
        <div className="office-section-actions">
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            Importar CSV
          </button>
          <button className="btn-primary btn-primary--small" onClick={() => setFormTarget('new')}>
            + Nuevo cliente
          </button>
        </div>
      </div>

      <div className="pill-tabs">
        <button className={`pill-tab ${vista === 'lista' ? 'pill-tab--active' : ''}`} onClick={() => setVista('lista')}>Lista</button>
        <button className={`pill-tab ${vista === 'semanal' ? 'pill-tab--active' : ''}`} onClick={() => setVista('semanal')}>Vista semanal</button>
      </div>

      {vista === 'semanal' && <WeeklyClientStatus clients={clients} />}

      {vista === 'lista' && (
        <>
          {importProgress && <p className="office-status-muted">{importProgress}</p>}

          <div className="pill-tabs">
            <button className={`pill-tab ${tipoFilter === 'todos' ? 'pill-tab--active' : ''}`} onClick={() => setTipoFilter('todos')}>Todos</button>
            <button className={`pill-tab ${tipoFilter === 'propio' ? 'pill-tab--active' : ''}`} onClick={() => setTipoFilter('propio')}>Reparto propio</button>
            <button className={`pill-tab ${tipoFilter === 'agencia' ? 'pill-tab--active' : ''}`} onClick={() => setTipoFilter('agencia')}>Agencia</button>
          </div>

          <input
            className="field-input"
            placeholder="Buscar por nombre o dirección…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          {loadingClients && <p className="office-status-muted">Cargando clientes…</p>}
          {!loadingClients && filteredClients.length === 0 && (
            <p className="office-status-muted">No hay clientes que coincidan.</p>
          )}

          <div className="client-list">
            {filteredClients.map((c) => (
              <div key={c.id} className="client-row">
                <div className="client-row-body">
                  <div className="client-row-name">
                    {c.nombre}
                    <span className={`badge ${c.tipoEntrega === 'agencia' ? 'badge--agencia' : 'badge--propio'}`}>
                      {c.tipoEntrega === 'agencia' ? 'Agencia' : 'Propio'}
                    </span>
                  </div>
                  {c.direccion && <div className="client-row-address">{c.direccion}</div>}
                  {(c.dias || c.horario) && (
                    <div className="client-row-schedule">
                      {c.dias && <span className="client-row-days">{c.dias}</span>}
                      {c.horario && <span>{c.horario}</span>}
                    </div>
                  )}
                </div>
                <div className="client-row-actions">
                  <button className="btn-icon" onClick={() => setFormTarget(c)} aria-label="Editar">✎</button>
                  <button className="btn-icon" onClick={() => handleDeleteClient(c.id)} aria-label="Eliminar">🗑</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImportCSV}
        style={{ display: 'none' }}
      />

      {formTarget && (
        <ClientForm
          initial={formTarget === 'new' ? null : formTarget}
          onCancel={() => setFormTarget(null)}
          onSave={handleSaveClient}
        />
      )}
    </div>
  )
}
