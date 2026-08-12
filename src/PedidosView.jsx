import { useEffect, useRef, useState } from 'react'
import { api } from './utils/api.js'
import { extractTextFromPdf } from './utils/pdfExtract.js'
import { extractLineasConCatalogo, extractNumeroPedido } from './utils/pdfOrderParser.js'
import { openDataUrlInNewTab } from './utils/openDataUrl.js'

const ESTADOS = [
  { key: 'elaboracion', label: 'En producción' },
  { key: 'lista_para_repartir', label: 'OK envío' },
  { key: 'enviado', label: 'Enviado' },
]

function nuevaLineaVacia() {
  return { id: `linea-${Date.now()}-${Math.round(Math.random() * 1000)}`, producto: '', textoOriginal: '', cantidad: '', unidad: 'uds', lote: '' }
}

export default function PedidosView() {
  const [clients, setClients] = useState([])
  const [productos, setProductos] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('elaboracion')
  const [showUpload, setShowUpload] = useState(false)

  async function refresh() {
    const [clientsData, productosData, pedidosData] = await Promise.all([
      api.getClients(),
      api.getProductos(),
      api.getPedidos(),
    ])
    setClients(clientsData)
    setProductos(productosData)
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

  async function savePedido(pedido, patch) {
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
          <PedidoCard key={p.id} pedido={p} productos={productos} onSave={savePedido} onDelete={handleDelete} />
        ))}
      </div>

      {showUpload && (
        <UploadPedidoModal
          clients={clients}
          productos={productos}
          onCancel={() => setShowUpload(false)}
          onSave={handleUpload}
        />
      )}
    </div>
  )
}

function PedidoCard({ pedido, productos, onSave, onDelete }) {
  const [lineas, setLineas] = useState(pedido.lineas || [])
  const [numeroPedido, setNumeroPedido] = useState(pedido.numeroPedido || '')
  const [saving, setSaving] = useState(false)

  const isAgencia = pedido.tipoEntrega === 'agencia'
  const puedeConfirmar =
    pedido.estado === 'elaboracion' &&
    lineas.length > 0 &&
    lineas.every((l) => l.producto && l.cantidad.toString().trim() && l.lote.trim())

  function actualizarLinea(id, patch) {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function añadirLinea() {
    setLineas((prev) => [...prev, nuevaLineaVacia()])
  }

  function quitarLinea(id) {
    setLineas((prev) => prev.filter((l) => l.id !== id))
  }

  async function guardarLineas() {
    setSaving(true)
    await onSave(pedido, { lineas })
    setSaving(false)
  }

  async function guardarNumeroPedido() {
    setSaving(true)
    await onSave(pedido, { numeroPedido: numeroPedido.trim() })
    setSaving(false)
  }

  async function confirmarOk() {
    setSaving(true)
    await onSave(pedido, { lineas, estado: 'lista_para_repartir' })
    setSaving(false)
  }

  async function revertir() {
    setSaving(true)
    await onSave(pedido, { estado: 'elaboracion' })
    setSaving(false)
  }

  const soloLectura = pedido.estado !== 'elaboracion'
  const [expandido, setExpandido] = useState(false)

  const resumenLineas = lineas.length
    ? lineas.map((l) => l.producto || '(sin producto)').join(', ')
    : 'sin líneas todavía'

  return (
    <div className="pedido-card">
      <div
        className="pedido-card-top pedido-card-top--clickable"
        role="button"
        tabIndex={0}
        onClick={() => setExpandido((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandido((v) => !v) }}
      >
        <div>
          <div className="pedido-card-cliente">
            <span className={`chevron ${expandido ? 'chevron--open' : ''}`}>▸</span>
            {pedido.clienteNombre}
          </div>
          <div className="pedido-card-meta">
            <span className={`badge ${isAgencia ? 'badge--agencia' : 'badge--propio'}`}>
              {isAgencia ? 'Agencia' : 'Reparto propio'}
            </span>
            {pedido.numeroPedido && <span className="office-status-muted">Nº {pedido.numeroPedido}</span>}
            <span className="office-status-muted">
              subido {pedido.fechaSubida} · reparto {pedido.fechaReparto}
            </span>
          </div>
          {!expandido && (
            <div className="pedido-card-resumen">
              {resumenLineas}
              {pedido.estado === 'enviado' && <span className="pedido-resumen-firmado"> · ✓ firmado</span>}
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn-icon"
          aria-label="Eliminar"
          onClick={(e) => { e.stopPropagation(); onDelete(pedido.id) }}
        >
          🗑
        </button>
      </div>

      {expandido && (
        <>
          <PedidoOrigenPreview origen={pedido.origen} />

          <div>
            <label className="field-label">Nº de pedido (opcional)</label>
            <input
              className="field-input field-input--compact"
              placeholder="Se rellena solo si el PDF lo trae, o escríbelo a mano"
              value={numeroPedido}
              disabled={soloLectura}
              onChange={(e) => setNumeroPedido(e.target.value)}
              onBlur={guardarNumeroPedido}
            />
          </div>

          {pedido.tipoEntrega === 'propio' && pedido.estado !== 'elaboracion' && (
            <AlbaranStatus pedido={pedido} />
          )}

          <div className="lineas-pedido">
            {lineas.map((linea) => (
              <div key={linea.id} className="linea-pedido">
                <select
                  className="field-input field-input--compact linea-producto"
                  value={linea.producto}
                  disabled={soloLectura}
                  onChange={(e) => actualizarLinea(linea.id, { producto: e.target.value })}
                  onBlur={guardarLineas}
                >
                  <option value="">{linea.producto ? linea.producto : 'Selecciona el producto…'}</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.nombre}>{p.nombre}</option>
                  ))}
                </select>
                {linea.textoOriginal && (
                  <div className="linea-original">del pedido: "{linea.textoOriginal}"</div>
                )}
                <div className="linea-cantidad-row">
                  <input
                    className="field-input field-input--compact"
                    placeholder="Cantidad"
                    value={linea.cantidad}
                    disabled={soloLectura}
                    onChange={(e) => actualizarLinea(linea.id, { cantidad: e.target.value })}
                    onBlur={guardarLineas}
                  />
                  <select
                    className="field-select"
                    value={linea.unidad}
                    disabled={soloLectura}
                    onChange={(e) => { actualizarLinea(linea.id, { unidad: e.target.value }); guardarLineas() }}
                  >
                    <option value="uds">uds</option>
                    <option value="kg">kg</option>
                  </select>
                  <input
                    className="field-input field-input--compact"
                    placeholder="Lote (obligatorio)"
                    value={linea.lote}
                    disabled={soloLectura}
                    onChange={(e) => actualizarLinea(linea.id, { lote: e.target.value })}
                    onBlur={guardarLineas}
                  />
                  {!soloLectura && (
                    <button type="button" className="btn-icon" onClick={() => quitarLinea(linea.id)} aria-label="Quitar línea">🗑</button>
                  )}
                </div>
              </div>
            ))}
            {!soloLectura && (
              <button type="button" className="btn-link" onClick={añadirLinea}>+ Añadir línea de producto</button>
            )}
          </div>
        </>
      )}

      {pedido.estado === 'elaboracion' && (
        <button className="btn-primary btn-primary--small" disabled={!puedeConfirmar || saving} onClick={confirmarOk}>
          {saving ? 'Guardando…' : 'OK envío'}
        </button>
      )}

      {pedido.estado !== 'elaboracion' && (
        <div className="pedido-card-actions">
          <span className="office-status-muted">
            {pedido.estado === 'lista_para_repartir' ? 'OK envío, pendiente de reparto' : 'Entregado'}
          </span>
          {pedido.estado === 'lista_para_repartir' && (
            <button className="btn-link" onClick={revertir} disabled={saving}>Revertir</button>
          )}
        </div>
      )}
    </div>
  )
}

function AlbaranStatus({ pedido }) {
  if (pedido.estado === 'enviado') {
    const fecha = pedido.entregadoAt ? new Date(pedido.entregadoAt).toLocaleString('es-ES') : ''
    const albaran = pedido.albaranFirmado || pedido.albaranPdf
    return (
      <div className="albaran-status albaran-status--firmado">
        <div>✓ Entregado y firmado{fecha ? ` · ${fecha}` : ''}</div>
        <div className="albaran-status-links">
          {albaran && (
            <button type="button" className="btn-link" onClick={() => openDataUrlInNewTab(albaran)}>
              📄 Ver albarán firmado
            </button>
          )}
          {pedido.firmaImagen && (
            <button type="button" className="btn-link" onClick={() => openDataUrlInNewTab(pedido.firmaImagen)}>
              ✍️ Ver firma
            </button>
          )}
        </div>
      </div>
    )
  }

  if (pedido.albaranPdf) {
    return (
      <div className="albaran-status">
        📄 Albarán adjunto, pendiente de que el cliente firme en la entrega. —{' '}
        <button type="button" className="btn-link" onClick={() => openDataUrlInNewTab(pedido.albaranPdf)}>
          Ver albarán
        </button>
      </div>
    )
  }

  return (
    <div className="albaran-status albaran-status--pendiente">
      ⚠ Todavía no se ha adjuntado el albarán — se puede añadir desde la pestaña Reparto.
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
      <button
        type="button"
        className="pedido-origen-imagen-link"
        onClick={() => openDataUrlInNewTab(origen.contenido)}
      >
        <img src={origen.contenido} alt="Pedido" className="pedido-origen-imagen" />
      </button>
    )
  }
  if (origen.tipo === 'pdf') {
    return (
      <button type="button" className="btn-link" onClick={() => openDataUrlInNewTab(origen.contenido)}>
        📄 Ver PDF del pedido
      </button>
    )
  }
  return null
}

function UploadPedidoModal({ clients, productos, onCancel, onSave }) {
  const [clienteId, setClienteId] = useState('')
  const [modo, setModo] = useState('texto')
  const [texto, setTexto] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [saving, setSaving] = useState(false)
  const [progreso, setProgreso] = useState(null)
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
      let lineas = null
      let numeroPedido = ''

      if (modo !== 'texto') {
        setProgreso('Leyendo archivo…')
        contenido = await readFileAsDataUrl(archivo)
      }

      if (modo === 'pdf') {
        setProgreso('Buscando los productos en el PDF…')
        try {
          const textoPdf = await extractTextFromPdf(contenido)
          lineas = extractLineasConCatalogo(textoPdf, productos)
          if (lineas.length === 0) lineas = null
          numeroPedido = extractNumeroPedido(textoPdf)
        } catch {
          // Si el PDF no se puede leer (escaneado, formato raro...), seguimos
          // sin desglose automático; la persona lo rellenará a mano.
          lineas = null
        }
      }

      await onSave({ clienteId, origen: { tipo: modo, contenido }, lineas, numeroPedido })
    } catch (err) {
      setError(err.message || 'No se pudo subir el pedido.')
      setSaving(false)
      setProgreso(null)
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

        {modo === 'pdf' && (
          <p className="office-status-muted">
            Si el PDF trae una tabla de productos, intentaré rellenar las líneas automáticamente
            cruzándolas con tu catálogo. Lo que no reconozca se deja en blanco para elegirlo a mano.
          </p>
        )}

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
        {progreso && <p className="office-status-muted">{progreso}</p>}

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
