import { useEffect, useRef, useState } from 'react'
import { api } from './utils/api.js'

const ESTADOS = [
  { key: 'elaboracion', label: 'En elaboración' },
  { key: 'lista_para_repartir', label: 'Lista para repartir' },
  { key: 'enviado', label: 'Enviado' },
]

export default function PedidosView() {
  const [clients, setClients] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('elaboracion')
  const [showUpload, setShowUpload] = useState(false)

  async function refresh() {
    const [clientsData, pedidosData] = await Promise.all([api.getClients(), api.getPedidos()])
    setClients(clientsData)
    setPedidos(pedidosData)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 15000)
    return () => clearInterval(interval)
  }, [])

  async function handleUpload(data) {
    await api.addPedido(data)
    setShowUpload(false)
    await refresh()
  }

  async function savePreparerFields(pedido, patch) {
    const updated = await api.updatePedido({ id: pedido.id, ...patch })
    setPedidos((prev) => prev.map((p) => (p.id === pedido.id ? updated : p)))
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este pedido?')) return
    await api.deletePedido(id)
    setPedidos((prev) => prev.filter((p) => p.id !== id))
  }

  const filtered = pedidos.filter((p) => p.estado === tab)
  const counts = ESTADOS.reduce((acc, e) => {
    acc[e.key] = pedidos.filter((p) => p.estado === e.key).length
    return acc
  }, {})

  return (
    <div className="tab-view">
      <div className="tab-view-header">
        <h2>Pedidos</h2>
        <button className="btn-primary btn-primary--small" onClick={() => setShowUpload(true)}>
          + Subir pedido
        </button>
      </div>

      <div className="pill-tabs">
        {ESTADOS.map((e) => (
          <button
            key={e.key}
            className={`pill-tab ${tab === e.key ? 'pill-tab--active' : ''}`}
            onClick={() => setTab(e.key)}
          >
            {e.label} <span className="mono">{counts[e.key] || 0}</span>
          </button>
        ))}
      </div>

      {loading && <p className="office-status-muted">Cargando pedidos…</p>}
      {!loading && filtered.length === 0 && (
        <p className="office-status-muted">No hay pedidos en este estado.</p>
      )}

      <div className="pedido-list">
        {filtered.map((p) => (
          <PedidoCard key={p.id} pedido={p} onSave={savePreparerFields} onDelete={handleDelete} />
        ))}
      </div>

      {showUpload && (
        <UploadPedidoModal
          clients={clients}
          onCancel={() => setShowUpload(false)}
          onSave={handleUpload}
        />
      )}
    </div>
  )
}

function PedidoCard({ pedido, onSave, onDelete }) {
  const [lote, setLote] = useState(pedido.lote || '')
  const [cantidad, setCantidad] = useState(pedido.cantidad || '')
  const [unidad, setUnidad] = useState(pedido.unidadCantidad || 'uds')
  const [saving, setSaving] = useState(false)

  const isAgencia = pedido.tipoEntrega === 'agencia'
  const puedeConfirmar = pedido.estado === 'elaboracion' && lote.trim() && cantidad.trim()

  async function confirmarOk() {
    setSaving(true)
    await onSave(pedido, {
      lote: lote.trim(),
      cantidad: cantidad.trim(),
      unidadCantidad: unidad,
      estado: 'lista_para_repartir',
    })
    setSaving(false)
  }

  async function guardarCampos() {
    setSaving(true)
    await onSave(pedido, { lote: lote.trim(), cantidad: cantidad.trim(), unidadCantidad: unidad })
    setSaving(false)
  }

  async function revertir() {
    setSaving(true)
    await onSave(pedido, { estado: 'elaboracion' })
    setSaving(false)
  }

  return (
    <div className="pedido-card">
      <div className="pedido-card-top">
        <div>
          <div className="pedido-card-cliente">{pedido.clienteNombre}</div>
          <div className="pedido-card-meta">
            <span className={`badge ${isAgencia ? 'badge--agencia' : 'badge--propio'}`}>
              {isAgencia ? 'Agencia' : 'Reparto propio'}
            </span>
            <span className="office-status-muted">
              subido {pedido.fechaSubida} · reparto {pedido.fechaReparto}
            </span>
          </div>
        </div>
        <button className="btn-icon" onClick={() => onDelete(pedido.id)} aria-label="Eliminar">🗑</button>
      </div>

      <PedidoOrigenPreview origen={pedido.origen} />

      <div className="pedido-card-fields">
        <input
          className="field-input field-input--compact"
          placeholder="Nº de lote"
          value={lote}
          onChange={(e) => setLote(e.target.value)}
          onBlur={guardarCampos}
        />
        <div className="pedido-cantidad-row">
          <input
            className="field-input field-input--compact"
            placeholder="Cantidad"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            onBlur={guardarCampos}
          />
          <select className="field-select" value={unidad} onChange={(e) => { setUnidad(e.target.value); guardarCampos() }}>
            <option value="uds">uds</option>
            <option value="kg">kg</option>
          </select>
        </div>
      </div>

      {pedido.estado === 'elaboracion' && (
        <button className="btn-primary btn-primary--small" disabled={!puedeConfirmar || saving} onClick={confirmarOk}>
          {saving ? 'Guardando…' : 'OK reparto'}
        </button>
      )}

      {pedido.estado !== 'elaboracion' && (
        <div className="pedido-card-actions">
          <span className="office-status-muted">
            {pedido.estado === 'lista_para_repartir' ? 'Listo, pendiente de reparto' : 'Entregado'}
          </span>
          {pedido.estado === 'lista_para_repartir' && (
            <button className="btn-link" onClick={revertir} disabled={saving}>Revertir</button>
          )}
        </div>
      )}
    </div>
  )
}

function PedidoOrigenPreview({ origen }) {
  if (!origen) return null
  if (origen.tipo === 'texto') {
    return <div className="pedido-origen-texto">{origen.contenido}</div>
  }
  if (origen.tipo === 'imagen') {
    return (
      <a href={origen.contenido} target="_blank" rel="noreferrer" className="pedido-origen-imagen-link">
        <img src={origen.contenido} alt="Pedido" className="pedido-origen-imagen" />
      </a>
    )
  }
  if (origen.tipo === 'pdf') {
    return (
      <a href={origen.contenido} target="_blank" rel="noreferrer" className="btn-link">
        📄 Ver PDF del pedido
      </a>
    )
  }
  return null
}

function UploadPedidoModal({ clients, onCancel, onSave }) {
  const [clienteId, setClienteId] = useState('')
  const [modo, setModo] = useState('texto')
  const [texto, setTexto] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivo(file)
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!clienteId) {
      setError('Selecciona qué cliente ha hecho el pedido.')
      return
    }
    if (modo === 'texto' && !texto.trim()) {
      setError('Pega el texto del pedido.')
      return
    }
    if (modo !== 'texto' && !archivo) {
      setError('Selecciona un archivo.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      let contenido = texto.trim()
      if (modo !== 'texto') {
        contenido = await readFileAsDataUrl(archivo)
      }
      await onSave({ clienteId, origen: { tipo: modo, contenido } })
    } catch (err) {
      setError(err.message || 'No se pudo subir el pedido.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal client-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>Subir pedido</h3>

        <label className="field-label">¿Quién ha hecho el pedido?</label>
        <select className="field-input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Selecciona un cliente…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} {c.tipoEntrega === 'agencia' ? '(agencia)' : ''}
            </option>
          ))}
        </select>

        <label className="field-label">¿Cómo lo tienes?</label>
        <div className="pill-tabs pill-tabs--compact">
          <button type="button" className={`pill-tab ${modo === 'texto' ? 'pill-tab--active' : ''}`} onClick={() => setModo('texto')}>Pegar texto</button>
          <button type="button" className={`pill-tab ${modo === 'imagen' ? 'pill-tab--active' : ''}`} onClick={() => setModo('imagen')}>Imagen</button>
          <button type="button" className={`pill-tab ${modo === 'pdf' ? 'pill-tab--active' : ''}`} onClick={() => setModo('pdf')}>PDF</button>
        </div>

        {modo === 'texto' && (
          <textarea
            className="field-input field-textarea"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pega aquí el pedido tal como te lo han mandado…"
            rows={5}
          />
        )}
        {modo !== 'texto' && (
          <input
            ref={fileInputRef}
            type="file"
            accept={modo === 'imagen' ? 'image/*' : 'application/pdf'}
            onChange={handleFile}
            className="field-input"
          />
        )}

        {error && <p className="upload-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn-ghost btn-ghost--dark" onClick={onCancel} disabled={saving}>Cancelar</button>
          <button type="submit" className="btn-primary btn-primary--small" disabled={saving}>
            {saving ? 'Subiendo…' : 'Subir pedido'}
          </button>
        </div>
      </form>
    </div>
  )
}
