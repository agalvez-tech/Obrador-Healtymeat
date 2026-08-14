import { useState } from 'react'
import * as XLSX from 'xlsx'
import { api } from './utils/api.js'
import { todayISO, addDaysISO } from './utils/date.js'

function primerDiaDelMes(iso) {
  return iso.slice(0, 8) + '01'
}

export default function ExportView() {
  const [desde, setDesde] = useState(addDaysISO(todayISO(), -7))
  const [hasta, setHasta] = useState(todayISO())
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState(null)
  const [ultimaDescarga, setUltimaDescarga] = useState(null)

  function aplicarRango(dias) {
    if (dias === 'mes') {
      setDesde(primerDiaDelMes(todayISO()))
      setHasta(todayISO())
      return
    }
    setDesde(addDaysISO(todayISO(), -dias))
    setHasta(todayISO())
  }

  async function generarExcel() {
    setGenerando(true)
    setError(null)
    try {
      const [pedidos, produccion, clientes] = await Promise.all([
        api.getPedidos({ desde, hasta }),
        api.getProduccion(),
        api.getClients(),
      ])
      const produccionRango = produccion.filter((e) => e.fecha >= desde && e.fecha <= hasta)

      const wb = XLSX.utils.book_new()

      // --- Hoja 1: Pedidos (uno por pedido) ---
      const filasPedidos = pedidos.map((p) => ({
        'Nº pedido': p.numeroPedido || '',
        Cliente: p.clienteNombre,
        'Tipo entrega': p.tipoEntrega === 'agencia' ? 'Agencia' : 'Propio',
        Estado: {
          elaboracion: 'En producción',
          lista_para_repartir: 'OK montado',
          ok_albaran: 'OK albarán',
          enviado: 'Enviado',
        }[p.estado] || p.estado,
        'Fecha subida': p.fechaSubida,
        'Fecha reparto': p.fechaReparto,
        'Nº albarán': p.numeroAlbaran || '',
        'Sin albarán': p.sinAlbaran ? 'Sí' : '',
        'Nº líneas': (p.lineas || []).length,
        Entregado: p.entregadoAt ? new Date(p.entregadoAt).toLocaleString('es-ES') : '',
      }))
      const hojaPedidos = XLSX.utils.json_to_sheet(filasPedidos)
      XLSX.utils.book_append_sheet(wb, hojaPedidos, 'Pedidos')

      // --- Hoja 2: Líneas de pedido (una fila por producto) ---
      const filasLineas = []
      pedidos.forEach((p) => {
        ;(p.lineas || []).forEach((l) => {
          filasLineas.push({
            Cliente: p.clienteNombre,
            'Nº pedido': p.numeroPedido || '',
            Producto: l.producto || '(sin producto)',
            Cantidad: l.cantidad,
            Unidad: l.unidad,
            Lote: l.lote,
            'Fecha reparto': p.fechaReparto,
          })
        })
      })
      const hojaLineas = XLSX.utils.json_to_sheet(filasLineas)
      XLSX.utils.book_append_sheet(wb, hojaLineas, 'Líneas de pedido')

      // --- Hoja 3: Producción ---
      const filasProduccion = produccionRango.map((e) => ({
        Fecha: e.fecha,
        Producto: e.producto,
        Lote: e.lote,
        Cantidad: e.cantidad,
        Unidad: e.unidad,
      }))
      const hojaProduccion = XLSX.utils.json_to_sheet(filasProduccion)
      XLSX.utils.book_append_sheet(wb, hojaProduccion, 'Producción')

      // --- Hoja 4: Clientes ---
      const filasClientes = clientes.map((c) => ({
        Nombre: c.nombre,
        'Tipo entrega': c.tipoEntrega === 'agencia' ? 'Agencia' : 'Propio',
        Dirección: c.direccion || '',
        Teléfono: c.telefono || '',
        Días: c.dias || '',
        Horario: c.horario || '',
        Notas: c.notas || '',
      }))
      const hojaClientes = XLSX.utils.json_to_sheet(filasClientes)
      XLSX.utils.book_append_sheet(wb, hojaClientes, 'Clientes')

      const nombreArchivo = `healthymeat-obrador_${desde}_a_${hasta}.xlsx`
      XLSX.writeFile(wb, nombreArchivo)
      setUltimaDescarga(nombreArchivo)
    } catch (err) {
      setError(err.message || 'No se pudo generar el Excel.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="tab-view">
      <div className="tab-view-header">
        <h2>Exportar</h2>
      </div>

      <p className="office-status-muted">
        Descarga una copia en Excel de todo lo registrado — pedidos (con sus líneas de producto),
        producción y el listado de clientes. Los albaranes y firmas (PDF/imágenes) no se incluyen, solo
        los datos: números, fechas, cantidades y estados.
      </p>

      <div className="office-section">
        <h2>Rango de fechas</h2>
        <p className="office-status-muted">
          Se aplica a Pedidos (por fecha de subida) y a Producción. El listado de Clientes se
          descarga siempre completo.
        </p>
        <div className="pill-tabs pill-tabs--compact">
          <button type="button" className="pill-tab" onClick={() => aplicarRango(7)}>Última semana</button>
          <button type="button" className="pill-tab" onClick={() => aplicarRango('mes')}>Este mes</button>
          <button type="button" className="pill-tab" onClick={() => aplicarRango(365)}>Último año</button>
        </div>
        <div className="field-row">
          <div>
            <label className="field-label">Desde</label>
            <input type="date" className="field-input" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Hasta</label>
            <input type="date" className="field-input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </div>
      </div>

      {error && <p className="upload-error">{error}</p>}
      {ultimaDescarga && !error && (
        <p className="office-status-muted">✓ Descargado: {ultimaDescarga}</p>
      )}

      <button className="btn-primary" onClick={generarExcel} disabled={generando}>
        {generando ? 'Generando…' : '📥 Descargar Excel'}
      </button>
    </div>
  )
}
