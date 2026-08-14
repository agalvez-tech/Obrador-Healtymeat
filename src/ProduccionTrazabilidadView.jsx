import { useEffect, useState } from 'react'
import { api } from './utils/api.js'

function nuevaMaterialVacia() {
  return { id: `mat-${Date.now()}-${Math.round(Math.random() * 1000)}`, materiaPrima: '', cantidad: '', unidad: 'kg', lote: '' }
}

export default function ProduccionTrazabilidadView() {
  const [produccion, setProduccion] = useState([])
  const [materias, setMaterias] = useState([])
  const [trazabilidad, setTrazabilidad] = useState([])
  const [loading, setLoading] = useState(true)
  const [seleccion, setSeleccion] = useState({})
  const [materiales, setMateriales] = useState([nuevaMaterialVacia()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [okMsg, setOkMsg] = useState(null)

  async function refresh() {
    const [produccionData, materiasData, trazabilidadData] = await Promise.all([
      api.getProduccion(),
      api.getMateriasPrimas(),
      api.getTrazabilidadProduccion(),
    ])
    setProduccion(produccionData)
    setMaterias(materiasData)
    setTrazabilidad(trazabilidadData)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  function toggleSeleccion(id) {
    setSeleccion((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function actualizarMaterial(id, patch) {
    setMateriales((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  function añadirMaterial() {
    setMateriales((prev) => [...prev, nuevaMaterialVacia()])
  }

  function quitarMaterial(id) {
    setMateriales((prev) => prev.filter((m) => m.id !== id))
  }

  function yaTrazado(produccionId) {
    return trazabilidad.some((t) => t.produccionIds.includes(produccionId))
  }

  async function handleGuardar() {
    setError(null)
    const produccionIds = Object.keys(seleccion).filter((id) => seleccion[id])
    if (produccionIds.length === 0) {
      setError('Selecciona al menos un producto producido.')
      return
    }
    const materialesValidos = materiales.filter((m) => m.materiaPrima && (m.cantidad.trim() || m.lote.trim()))
    if (materialesValidos.length === 0) {
      setError('Añade al menos una materia prima usada (con cantidad o lote).')
      return
    }
    const resumen = produccion
      .filter((p) => produccionIds.includes(p.id))
      .map((p) => `${p.producto} (${p.fecha})`)
      .join(', ')

    setSaving(true)
    try {
      await api.addTrazabilidadProduccion({
        produccionIds,
        produccionResumen: resumen,
        materiales: materialesValidos,
      })
      setSeleccion({})
      setMateriales([nuevaMaterialVacia()])
      setOkMsg('Trazabilidad guardada.')
      await refresh()
      setTimeout(() => setOkMsg(null), 4000)
    } catch (err) {
      setError(err.message || 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteTrazabilidad(id) {
    if (!confirm('¿Eliminar este registro de trazabilidad?')) return
    await api.deleteTrazabilidadProduccion(id)
    setTrazabilidad((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="tab-view">
      <div className="tab-view-header">
        <h2>Producción para trazabilidad</h2>
      </div>

      <p className="office-status-muted">
        Selecciona uno o varios productos ya registrados en Producción, y añade con qué materias primas
        (kg o lote) se han fabricado. Esto queda archivado para poder justificar la trazabilidad ante
        Sanidad.
      </p>

      <section className="office-section">
        <h2>Productos producidos</h2>
        {loading && <p className="office-status-muted">Cargando…</p>}
        {!loading && produccion.length === 0 && (
          <p className="office-status-muted">Todavía no hay nada en el registro de Producción.</p>
        )}
        <div className="client-list">
          {produccion.map((p) => (
            <div key={p.id} className={`client-row ${seleccion[p.id] ? 'client-row--selected' : ''}`}>
              <label className="client-row-check">
                <input type="checkbox" checked={!!seleccion[p.id]} onChange={() => toggleSeleccion(p.id)} />
              </label>
              <div className="client-row-body">
                <div className="client-row-name">
                  {p.producto}
                  {yaTrazado(p.id) && <span className="client-row-badge">✓ ya trazado</span>}
                </div>
                <div className="office-status-muted">{p.fecha} · {p.cantidad} {p.unidad} · lote {p.lote}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="office-section">
        <h2>Materias primas usadas</h2>
        <div className="lineas-pedido">
          {materiales.map((m) => (
            <div key={m.id} className="linea-pedido">
              <select
                className="field-input field-input--compact"
                value={m.materiaPrima}
                onChange={(e) => actualizarMaterial(m.id, { materiaPrima: e.target.value })}
              >
                <option value="">Selecciona la materia prima…</option>
                {materias.map((mat) => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
              <div className="linea-cantidad-row">
                <input
                  className="field-input field-input--compact"
                  placeholder="Cantidad"
                  value={m.cantidad}
                  onChange={(e) => actualizarMaterial(m.id, { cantidad: e.target.value })}
                />
                <select
                  className="field-select"
                  value={m.unidad}
                  onChange={(e) => actualizarMaterial(m.id, { unidad: e.target.value })}
                >
                  <option value="kg">kg</option>
                  <option value="uds">uds</option>
                  <option value="lote">solo lote</option>
                </select>
                <input
                  className="field-input field-input--compact"
                  placeholder="Lote"
                  value={m.lote}
                  onChange={(e) => actualizarMaterial(m.id, { lote: e.target.value })}
                />
                <button type="button" className="btn-icon" onClick={() => quitarMaterial(m.id)} aria-label="Quitar">🗑</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="btn-link" onClick={añadirMaterial}>+ Añadir materia prima</button>
      </section>

      {error && <p className="upload-error">{error}</p>}
      {okMsg && <p className="office-status-muted">✓ {okMsg}</p>}

      <button className="btn-primary" onClick={handleGuardar} disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar trazabilidad'}
      </button>

      <section className="office-section">
        <h2>Registros guardados</h2>
        {trazabilidad.length === 0 && <p className="office-status-muted">Todavía no hay ninguno.</p>}
        <div className="production-list">
          {trazabilidad.map((t) => (
            <div key={t.id} className="production-row">
              <div className="production-row-date mono">{new Date(t.creadoAt).toLocaleDateString('es-ES')}</div>
              <div className="production-row-body">
                <div className="production-row-name">{t.produccionResumen}</div>
                <div className="office-status-muted">
                  {t.materiales.map((m) => `${m.materiaPrima}: ${m.cantidad || '—'} ${m.unidad !== 'lote' ? m.unidad : ''}${m.lote ? ` (lote ${m.lote})` : ''}`).join(' — ')}
                </div>
              </div>
              <button className="btn-icon" onClick={() => handleDeleteTrazabilidad(t.id)} aria-label="Eliminar">🗑</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
