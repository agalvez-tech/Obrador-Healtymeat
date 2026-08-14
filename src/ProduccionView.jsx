import { useEffect, useState } from 'react'
import { api } from './utils/api.js'
import { todayISO, formatDateLong } from './utils/date.js'

export default function ProduccionView() {
  const [productos, setProductos] = useState([])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [fecha, setFecha] = useState(todayISO())
  const [producto, setProducto] = useState('')
  const [lote, setLote] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState('kg')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showManageProducts, setShowManageProducts] = useState(false)

  async function refresh() {
    const [productosData, entriesData] = await Promise.all([api.getProductos(), api.getProduccion()])
    setProductos(productosData)
    setEntries(entriesData)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!producto || !cantidad.trim()) {
      setError('Selecciona el producto e indica la cantidad.')
      return
    }
    if (!lote.trim()) {
      setError('Indica el número de lote.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.addProduccion({ fecha, producto, lote: lote.trim(), cantidad: cantidad.trim(), unidad })
      setLote('')
      setCantidad('')
      await refresh()
    } catch (err) {
      setError(err.message || 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este registro de producción?')) return
    await api.deleteProduccion(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="tab-view">
      <div className="tab-view-header">
        <h2>Producción del obrador</h2>
        <button className="btn-secondary" onClick={() => setShowManageProducts(true)}>Gestionar productos</button>
      </div>

      <form className="office-section production-form" onSubmit={handleSubmit}>
        <div className="field-row field-row--3">
          <div>
            <label className="field-label">Fecha</label>
            <input type="date" className="field-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Producto</label>
            <select
              className="field-input"
              value={producto}
              onChange={(e) => {
                const nombre = e.target.value
                setProducto(nombre)
                const match = productos.find((p) => p.nombre === nombre)
                if (match?.unidadDefecto) setUnidad(match.unidadDefecto)
              }}
            >
              <option value="">Selecciona…</option>
              {productos.map((p) => (
                <option key={p.id} value={p.nombre}>
                  {p.nombre}{p.formato ? ` — ${p.formato}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Lote</label>
            <input className="field-input" value={lote} onChange={(e) => setLote(e.target.value)} placeholder="Nº de lote" />
          </div>
        </div>

        <div className="field-row">
          <div>
            <label className="field-label">Cantidad</label>
            <input className="field-input" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Cantidad" />
          </div>
          <div>
            <label className="field-label">Unidad</label>
            <select className="field-input" value={unidad} onChange={(e) => setUnidad(e.target.value)}>
              <option value="kg">kg</option>
              <option value="uds">uds</option>
            </select>
          </div>
        </div>

        {error && <p className="upload-error">{error}</p>}
        {productos.length === 0 && !loading && (
          <p className="office-status-muted">
            Todavía no hay productos en el catálogo. Añádelos con "Gestionar productos".
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={saving || productos.length === 0 || !lote.trim()}>
          {saving ? 'Guardando…' : '+ Añadir a producción'}
        </button>
      </form>

      <section className="office-section">
        <h2>Registro de producción</h2>
        {loading && <p className="office-status-muted">Cargando…</p>}
        {!loading && entries.length === 0 && <p className="office-status-muted">Todavía no hay nada registrado.</p>}
        <div className="production-list">
          {entries.map((e) => (
            <div key={e.id} className="production-row">
              <div className="production-row-date mono">{e.fecha}</div>
              <div className="production-row-body">
                <div className="production-row-name">{e.producto}</div>
                <div className="office-status-muted">
                  {e.cantidad} {e.unidad}{e.lote ? ` · lote ${e.lote}` : ''}
                </div>
              </div>
              <button className="btn-icon" onClick={() => handleDelete(e.id)} aria-label="Eliminar">🗑</button>
            </div>
          ))}
        </div>
      </section>

      {showManageProducts && (
        <ManageProductsModal
          productos={productos}
          onClose={() => setShowManageProducts(false)}
          onChange={refresh}
        />
      )}
    </div>
  )
}

function ManageProductsModal({ productos, onClose, onChange }) {
  const [nombre, setNombre] = useState('')
  const [formato, setFormato] = useState('')
  const [tieneKg, setTieneKg] = useState(false)
  const [tieneUds, setTieneUds] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)

  async function handleAdd(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    if (!tieneKg && !tieneUds) {
      setError('Marca al menos un formato (kg o uds).')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const formatos = [tieneUds && 'uds', tieneKg && 'kg'].filter(Boolean)
      await api.addProducto(nombre.trim(), formato.trim(), formatos)
      setNombre('')
      setFormato('')
      await onChange()
    } catch (err) {
      setError(err.message || 'No se pudo añadir.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    await api.deleteProducto(id)
    await onChange()
  }

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      await api.sincronizarCatalogoBase()
      await onChange()
      setSyncMsg('Catálogo actualizado con los formatos (kg/uds) del listado base.')
    } catch (err) {
      setSyncMsg(err.message || 'No se pudo sincronizar.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal client-form" onClick={(e) => e.stopPropagation()}>
        <h3>Productos del obrador</h3>

        <button type="button" className="btn-secondary" onClick={handleSync} disabled={syncing}>
          {syncing ? 'Sincronizando…' : 'Actualizar formatos desde el listado base'}
        </button>
        {syncMsg && <p className="office-status-muted">{syncMsg}</p>}

        <form onSubmit={handleAdd}>
          <label className="field-label">Nombre</label>
          <input
            className="field-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del producto"
          />
          <label className="field-label">Formato de envasado (opcional)</label>
          <input
            className="field-input"
            value={formato}
            onChange={(e) => setFormato(e.target.value)}
            placeholder="Bandeja 20 unidades"
          />
          <label className="field-label">¿Cómo se mide?</label>
          <div className="formatos-checkboxes">
            <label><input type="checkbox" checked={tieneUds} onChange={(e) => setTieneUds(e.target.checked)} /> Unidades</label>
            <label><input type="checkbox" checked={tieneKg} onChange={(e) => setTieneKg(e.target.checked)} /> Kg</label>
          </div>
          {error && <p className="upload-error">{error}</p>}
          <button className="btn-primary btn-primary--small" type="submit" disabled={saving}>Añadir producto</button>
        </form>

        <div className="product-list">
          {productos.map((p) => (
            <div key={p.id} className="product-row">
              <span>
                {p.nombre}
                {p.formato && <span className="office-status-muted"> — {p.formato}</span>}
                <span className="office-status-muted"> ({(p.formatos || [p.unidadDefecto]).join(' + ')})</span>
              </span>
              <button className="btn-icon" onClick={() => handleDelete(p.id)} aria-label="Eliminar">🗑</button>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-primary btn-primary--small" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
