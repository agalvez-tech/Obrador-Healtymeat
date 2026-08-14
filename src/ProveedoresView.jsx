import { useEffect, useRef, useState } from 'react'
import { api } from './utils/api.js'
import { extractTextFromPdf } from './utils/pdfExtract.js'
import { extractSupplierDeliveryInfo } from './utils/proveedorParser.js'
import { openDataUrlInNewTab } from './utils/openDataUrl.js'
import { todayISO } from './utils/date.js'

export default function ProveedoresView() {
  const [proveedores, setProveedores] = useState([])
  const [materias, setMaterias] = useState([])
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [showManageProveedores, setShowManageProveedores] = useState(false)

  async function refresh() {
    const [proveedoresData, materiasData, entradasData] = await Promise.all([
      api.getProveedores(),
      api.getMateriasPrimas(),
      api.getTrazabilidadProveedores(),
    ])
    setProveedores(proveedoresData)
    setMaterias(materiasData)
    setEntradas(entradasData)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleSave(entry) {
    await api.addTrazabilidadProveedor(entry)
    setShowUpload(false)
    await refresh()
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este registro de entrada?')) return
    await api.deleteTrazabilidadProveedor(id)
    setEntradas((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="tab-view">
      <div className="tab-view-header">
        <h2>Proveedores</h2>
        <div className="office-section-actions">
          <button className="btn-secondary" onClick={() => setShowManageProveedores(true)}>Gestionar proveedores</button>
          <button className="btn-primary btn-primary--small" onClick={() => setShowUpload(true)}>+ Subir albarán</button>
        </div>
      </div>

      <p className="office-status-muted">
        Sube el albarán de cada entrega de materia prima que os llega — foto, PDF o texto. La fecha de
        recepción se marca sola con la de hoy (editable). El resto se detecta cuando es posible, y
        siempre se puede rellenar o corregir a mano antes de guardar.
      </p>

      {loading && <p className="office-status-muted">Cargando…</p>}
      {!loading && entradas.length === 0 && (
        <p className="office-status-muted">Todavía no hay entradas registradas.</p>
      )}

      <div className="production-list">
        {entradas.map((e) => (
          <div key={e.id} className="production-row">
            <div className="production-row-date mono">{e.fechaRecepcion}</div>
            <div className="production-row-body">
              <div className="production-row-name">{e.materiaPrima || '(sin materia prima)'}</div>
              <div className="office-status-muted">
                {e.proveedorNombre || '(sin proveedor)'} · {e.cantidad} {e.unidad}
                {e.lote ? ` · lote ${e.lote}` : ''}
                {e.numeroAlbaran ? ` · albarán ${e.numeroAlbaran}` : ''}
              </div>
              {e.origen && (e.origen.tipo === 'imagen' || e.origen.tipo === 'pdf') && (
                <button type="button" className="btn-link" onClick={() => openDataUrlInNewTab(e.origen.contenido)}>
                  {e.origen.tipo === 'imagen' ? '🖼 Ver foto del albarán' : '📄 Ver PDF del albarán'}
                </button>
              )}
            </div>
            <button className="btn-icon" onClick={() => handleDelete(e.id)} aria-label="Eliminar">🗑</button>
          </div>
        ))}
      </div>

      {showUpload && (
        <UploadEntradaModal
          proveedores={proveedores}
          materias={materias}
          onCancel={() => setShowUpload(false)}
          onSave={handleSave}
          onProveedorCreado={refresh}
        />
      )}

      {showManageProveedores && (
        <ManageProveedoresModal
          proveedores={proveedores}
          onClose={() => setShowManageProveedores(false)}
          onChange={refresh}
        />
      )}
    </div>
  )
}

function UploadEntradaModal({ proveedores, materias, onCancel, onSave, onProveedorCreado }) {
  const [proveedorId, setProveedorId] = useState('')
  const [nuevoProveedor, setNuevoProveedor] = useState('')
  const [modo, setModo] = useState('imagen')
  const [texto, setTexto] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [numeroAlbaran, setNumeroAlbaran] = useState('')
  const [fechaAlbaran, setFechaAlbaran] = useState('')
  const [fechaRecepcion, setFechaRecepcion] = useState(todayISO())
  const [materiaPrima, setMateriaPrima] = useState('')
  const [lote, setLote] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState('kg')
  const [origen, setOrigen] = useState(null)
  const [textoOriginal, setTextoOriginal] = useState('')

  const fileInputRef = useRef(null)

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function aplicarDeteccion(info) {
    if (info.proveedorId) setProveedorId(info.proveedorId)
    if (info.numeroAlbaran) setNumeroAlbaran(info.numeroAlbaran)
    if (info.fechaAlbaran) setFechaAlbaran(info.fechaAlbaran)
    if (info.productoTexto) setTextoOriginal(info.productoTexto)
    if (info.cantidad) setCantidad(info.cantidad)
    if (info.lote) setLote(info.lote)
    if (info.productoTexto) {
      const match = materias.find((m) => info.productoTexto.toUpperCase().includes(m.toUpperCase()))
      if (match) setMateriaPrima(match)
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivo(file)
    setProcesando(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setOrigen({ tipo: modo, contenido: dataUrl })
      if (modo === 'pdf') {
        const text = await extractTextFromPdf(dataUrl)
        aplicarDeteccion(extractSupplierDeliveryInfo(text, proveedores))
      }
    } catch {
      // si falla la lectura del PDF, se rellena todo a mano
    } finally {
      setProcesando(false)
    }
  }

  function handleTextoBlur() {
    if (!texto.trim()) return
    aplicarDeteccion(extractSupplierDeliveryInfo(texto, proveedores))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    let finalProveedorId = proveedorId
    let finalProveedorNombre = proveedores.find((p) => p.id === proveedorId)?.nombre || ''

    if (!finalProveedorId && nuevoProveedor.trim()) {
      try {
        const creado = await api.addProveedor(nuevoProveedor.trim())
        finalProveedorId = creado.id
        finalProveedorNombre = creado.nombre
        await onProveedorCreado()
      } catch (err) {
        setError(err.message || 'No se pudo crear el proveedor.')
        return
      }
    }

    if (!finalProveedorId) {
      setError('Selecciona o escribe el proveedor.')
      return
    }
    if (!materiaPrima) {
      setError('Selecciona la materia prima recibida.')
      return
    }
    if (!cantidad.trim()) {
      setError('Indica la cantidad.')
      return
    }

    setSaving(true)
    try {
      let contenido = origen
      if (modo === 'texto') contenido = { tipo: 'texto', contenido: texto.trim() }
      await onSave({
        proveedorId: finalProveedorId,
        proveedorNombre: finalProveedorNombre,
        origen: contenido,
        numeroAlbaran: numeroAlbaran.trim(),
        fechaAlbaran,
        fechaRecepcion,
        materiaPrima,
        lote: lote.trim(),
        cantidad: cantidad.trim(),
        unidad,
      })
    } catch (err) {
      setError(err.message || 'No se pudo guardar.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal client-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>Subir albarán de proveedor</h3>

        <label className="field-label">¿Cómo lo tienes?</label>
        <div className="pill-tabs pill-tabs--compact">
          <button type="button" className={`pill-tab ${modo === 'imagen' ? 'pill-tab--active' : ''}`} onClick={() => setModo('imagen')}>Foto</button>
          <button type="button" className={`pill-tab ${modo === 'pdf' ? 'pill-tab--active' : ''}`} onClick={() => setModo('pdf')}>PDF</button>
          <button type="button" className={`pill-tab ${modo === 'texto' ? 'pill-tab--active' : ''}`} onClick={() => setModo('texto')}>Pegar texto</button>
        </div>

        {modo === 'texto' && (
          <textarea
            className="field-input field-textarea"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={handleTextoBlur}
            placeholder="Pega aquí el texto del albarán…"
            rows={4}
          />
        )}
        {modo !== 'texto' && (
          <input
            ref={fileInputRef}
            type="file"
            accept={modo === 'imagen' ? 'image/*' : 'application/pdf'}
            capture={modo === 'imagen' ? 'environment' : undefined}
            onChange={handleFile}
            className="field-input"
          />
        )}
        {procesando && <p className="office-status-muted">Buscando los datos del albarán…</p>}
        {modo === 'imagen' && (
          <p className="office-status-muted">
            De una foto no puedo leer el texto automáticamente — rellena los campos de abajo a mano.
          </p>
        )}

        <label className="field-label">Proveedor</label>
        <select className="field-input" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
          <option value="">Selecciona…</option>
          {proveedores.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
        {!proveedorId && (
          <input
            className="field-input"
            placeholder="O escribe uno nuevo si no está en la lista"
            value={nuevoProveedor}
            onChange={(e) => setNuevoProveedor(e.target.value)}
          />
        )}

        <div className="field-row">
          <div>
            <label className="field-label">Fecha del albarán</label>
            <input type="date" className="field-input" value={fechaAlbaran} onChange={(e) => setFechaAlbaran(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Fecha de recepción</label>
            <input type="date" className="field-input" value={fechaRecepcion} onChange={(e) => setFechaRecepcion(e.target.value)} />
          </div>
        </div>

        <label className="field-label">Nº de albarán (opcional)</label>
        <input className="field-input" value={numeroAlbaran} onChange={(e) => setNumeroAlbaran(e.target.value)} />

        <label className="field-label">Materia prima recibida</label>
        <select className="field-input" value={materiaPrima} onChange={(e) => setMateriaPrima(e.target.value)}>
          <option value="">Selecciona…</option>
          {materias.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        {textoOriginal && <div className="linea-original">del albarán: "{textoOriginal}"</div>}

        <div className="field-row">
          <div>
            <label className="field-label">Cantidad</label>
            <input className="field-input" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Unidad</label>
            <select className="field-input" value={unidad} onChange={(e) => setUnidad(e.target.value)}>
              <option value="kg">kg</option>
              <option value="uds">uds</option>
            </select>
          </div>
        </div>

        <label className="field-label">Lote(s)</label>
        <input className="field-input" value={lote} onChange={(e) => setLote(e.target.value)} placeholder="Si hay varios, sepáralos por comas" />

        {error && <p className="upload-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn-ghost btn-ghost--dark" onClick={onCancel} disabled={saving}>Cancelar</button>
          <button type="submit" className="btn-primary btn-primary--small" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar entrada'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ManageProveedoresModal({ proveedores, onClose, onChange }) {
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)
    setError(null)
    try {
      await api.addProveedor(nombre.trim())
      setNombre('')
      await onChange()
    } catch (err) {
      setError(err.message || 'No se pudo añadir.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    await api.deleteProveedor(id)
    await onChange()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal client-form" onClick={(e) => e.stopPropagation()}>
        <h3>Proveedores habituales</h3>
        <form onSubmit={handleAdd} className="depot-edit">
          <input
            className="field-input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del proveedor"
          />
          <button className="btn-secondary" type="submit" disabled={saving}>Añadir</button>
        </form>
        {error && <p className="upload-error">{error}</p>}

        <div className="product-list">
          {proveedores.map((p) => (
            <div key={p.id} className="product-row">
              <span>{p.nombre}</span>
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
