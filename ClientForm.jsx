import { useState } from 'react'
import { geocodeAddress } from './utils/geocode.js'

export default function ClientForm({ initial, onCancel, onSave }) {
  const [nombre, setNombre] = useState(initial?.nombre || '')
  const [direccion, setDireccion] = useState(initial?.direccion || '')
  const [telefono, setTelefono] = useState(initial?.telefono || '')
  const [tipoEntrega, setTipoEntrega] = useState(initial?.tipoEntrega || 'propio')
  const [dias, setDias] = useState(initial?.dias || '')
  const [horario, setHorario] = useState(initial?.horario || '')
  const [notas, setNotas] = useState(initial?.notas || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    if (tipoEntrega === 'propio' && !direccion.trim()) {
      setError('La dirección es obligatoria para clientes de reparto propio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      let lat = initial?.lat ?? null
      let lng = initial?.lng ?? null
      if (tipoEntrega === 'propio' && direccion.trim()) {
        // Solo volvemos a geocodificar si la dirección ha cambiado o no tenía coordenadas
        if (!lat || !lng || direccion.trim() !== initial?.direccion) {
          const coords = await geocodeAddress(direccion.trim())
          if (!coords) {
            setError('No he podido localizar esa dirección en el mapa. Revísala e inténtalo de nuevo.')
            setSaving(false)
            return
          }
          lat = coords.lat
          lng = coords.lng
        }
      }
      await onSave({
        ...(initial?.id ? { id: initial.id } : {}),
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        tipoEntrega,
        dias: dias.trim(),
        horario: horario.trim(),
        notas: notas.trim(),
        lat,
        lng,
      })
    } catch (err) {
      setError(err.message || 'No se pudo guardar el cliente.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal client-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3>{initial ? 'Editar cliente' : 'Nuevo cliente'}</h3>

        <label className="field-label">Nombre</label>
        <input
          className="field-input"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Restaurante Casa Pepa"
          autoFocus
        />

        <label className="field-label">Tipo de entrega</label>
        <div className="pill-tabs pill-tabs--compact">
          <button
            type="button"
            className={`pill-tab ${tipoEntrega === 'propio' ? 'pill-tab--active' : ''}`}
            onClick={() => setTipoEntrega('propio')}
          >
            Reparto propio
          </button>
          <button
            type="button"
            className={`pill-tab ${tipoEntrega === 'agencia' ? 'pill-tab--active' : ''}`}
            onClick={() => setTipoEntrega('agencia')}
          >
            Agencia de envío
          </button>
        </div>

        <label className="field-label">
          Dirección{tipoEntrega === 'agencia' ? ' (opcional)' : ''}
        </label>
        <input
          className="field-input"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="Avinguda del Mar 22, Rafelbunyol"
        />

        <label className="field-label">Teléfono (opcional)</label>
        <input
          className="field-input"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="600111222"
        />

        <div className="field-row">
          <div>
            <label className="field-label">Días habituales (opcional)</label>
            <input
              className="field-input"
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              placeholder="L, X, J"
            />
          </div>
          <div>
            <label className="field-label">Horario (opcional)</label>
            <input
              className="field-input"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              placeholder="9:00-12:00"
            />
          </div>
        </div>

        <label className="field-label">Notas (opcional)</label>
        <input
          className="field-input"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Entrar por la puerta lateral"
        />

        {error && <p className="upload-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn-ghost btn-ghost--dark" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary btn-primary--small" disabled={saving}>
            {saving ? 'Localizando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
