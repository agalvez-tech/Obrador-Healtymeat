import { redis, KEYS } from '../lib/redis.js'
import { nextDeliveryDate } from '../lib/schedule.js'

const INDEX_KEY = 'reparto:pedidos:index'
const pedidoKey = (id) => `reparto:pedido:${id}`

async function getAllPedidos() {
  const ids = await redis.zrange(INDEX_KEY, 0, -1)
  if (!ids || ids.length === 0) return []
  const keys = ids.map(pedidoKey)
  const values = await redis.mget(...keys)
  return values.filter(Boolean)
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { id, estado, fecha, tipoEntrega, desde, hasta, repartoDesde, repartoHasta } = req.query
      if (id) {
        const p = await redis.get(pedidoKey(id))
        return res.status(200).json(p || null)
      }
      let pedidos = await getAllPedidos()
      if (estado) pedidos = pedidos.filter((p) => p.estado === estado)
      if (fecha) pedidos = pedidos.filter((p) => p.fechaReparto === fecha)
      if (tipoEntrega) pedidos = pedidos.filter((p) => p.tipoEntrega === tipoEntrega)
      if (desde) pedidos = pedidos.filter((p) => p.fechaSubida >= desde)
      if (hasta) pedidos = pedidos.filter((p) => p.fechaSubida <= hasta)
      if (repartoDesde) pedidos = pedidos.filter((p) => p.fechaReparto >= repartoDesde)
      if (repartoHasta) pedidos = pedidos.filter((p) => p.fechaReparto <= repartoHasta)
      pedidos.sort((a, b) => (a.creadoAt || 0) - (b.creadoAt || 0))
      return res.status(200).json(pedidos)
    }

    if (req.method === 'POST') {
      const body = req.body

      // Acciones fusionadas aquí (antes eran /api/deliver y /api/firmar,
      // por separado) para no pasarnos del límite de funciones serverless
      // del plan gratuito de Vercel.
      if (body.accion === 'entregar') {
        return marcarEntregado(req, res)
      }
      if (body.accion === 'firmar') {
        return firmarPedido(req, res)
      }

      if (!body.clienteId || !body.origen) {
        return res.status(400).json({ error: 'Faltan clienteId u origen del pedido' })
      }
      const clients = (await redis.get(KEYS.clients)) || []
      const cliente = clients.find((c) => c.id === body.clienteId)
      if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' })

      const now = Date.now()
      const fechaReparto =
        cliente.tipoEntrega === 'agencia'
          ? new Date().toISOString().slice(0, 10)
          : nextDeliveryDate(cliente.dias)

      const lineas =
        Array.isArray(body.lineas) && body.lineas.length > 0
          ? body.lineas.map((l, i) => ({
              id: l.id || `linea-${now}-${i}`,
              producto: l.producto || '',
              textoOriginal: l.textoOriginal || '',
              cantidad: l.cantidad || '',
              unidad: l.unidad === 'kg' ? 'kg' : 'uds',
              lote: l.lote || '',
            }))
          : [{ id: `linea-${now}-0`, producto: '', textoOriginal: '', cantidad: '', unidad: 'uds', lote: '' }]

      const pedido = {
        id: `p-${now}-${Math.round(Math.random() * 1000)}`,
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        tipoEntrega: cliente.tipoEntrega || 'propio',
        origen: body.origen, // { tipo: 'texto'|'imagen'|'pdf', contenido }
        numeroPedido: body.numeroPedido || '',
        numeroAlbaran: '',
        fechaSubida: new Date().toISOString().slice(0, 10),
        fechaReparto,
        estado: 'elaboracion',
        lineas,
        albaranPdf: null,
        sinAlbaran: false,
        firmaImagen: null,
        albaranFirmado: null,
        creadoAt: now,
        actualizadoAt: now,
        entregadoAt: null,
      }

      await redis.set(pedidoKey(pedido.id), pedido)
      await redis.zadd(INDEX_KEY, { score: now, member: pedido.id })
      return res.status(200).json(pedido)
    }

    if (req.method === 'PUT') {
      const body = req.body
      if (!body.id) return res.status(400).json({ error: 'Falta el id del pedido' })
      const existing = await redis.get(pedidoKey(body.id))
      if (!existing) return res.status(404).json({ error: 'Pedido no encontrado' })

      const updated = { ...existing, ...body, actualizadoAt: Date.now() }

      // Si se adjunta el albarán mientras el pedido está "OK montado", sube
      // solo a "OK albarán" — así se puede ver de un vistazo a quién le
      // falta subirlo. Esto pasa tanto si se sube desde Pedidos como desde Reparto.
      if (body.albaranPdf && existing.estado === 'lista_para_repartir') {
        updated.estado = 'ok_albaran'
      }

      if (body.estado === 'enviado' && existing.estado !== 'enviado') {
        updated.entregadoAt = Date.now()
      }
      await redis.set(pedidoKey(updated.id), updated)
      return res.status(200).json(updated)
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'Falta el id' })
      await redis.del(pedidoKey(id))
      await redis.zrem(INDEX_KEY, id)
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE')
    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}

// Antes era /api/deliver — marca (o desmarca) una parada como entregada y
// sincroniza el estado del pedido correspondiente.
async function marcarEntregado(req, res) {
  try {
    const { date, pedidoId, entregado } = req.body
    if (!date || !pedidoId) {
      return res.status(400).json({ error: 'Faltan date o pedidoId' })
    }

    const route = await redis.get(KEYS.route(date))
    if (!route) return res.status(404).json({ error: 'No hay ruta guardada para ese día' })

    const stop = route.stops.find((s) => s.pedidoId === pedidoId)
    if (!stop) return res.status(404).json({ error: 'Esa parada no está en la ruta de hoy' })

    stop.entregado = !!entregado
    stop.entregadoAt = entregado ? Date.now() : null
    route.updatedAt = Date.now()
    await redis.set(KEYS.route(date), route)

    const pedido = await redis.get(pedidoKey(pedidoId))
    if (pedido) {
      if (entregado) {
        pedido.estado = 'enviado'
      } else {
        pedido.estado = pedido.albaranPdf || pedido.sinAlbaran ? 'ok_albaran' : 'lista_para_repartir'
      }
      pedido.entregadoAt = entregado ? Date.now() : null
      pedido.actualizadoAt = Date.now()
      await redis.set(pedidoKey(pedidoId), pedido)
    }

    return res.status(200).json(route)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}

// Antes era /api/firmar — guarda la firma capturada por el repartidor y
// marca el pedido y la parada correspondiente como entregados.
async function firmarPedido(req, res) {
  try {
    const { date, pedidoId, firmaImagen, albaranFirmado } = req.body
    if (!date || !pedidoId || !firmaImagen) {
      return res.status(400).json({ error: 'Faltan date, pedidoId o firmaImagen' })
    }

    const pedido = await redis.get(pedidoKey(pedidoId))
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' })

    const now = Date.now()
    pedido.firmaImagen = firmaImagen
    pedido.albaranFirmado = albaranFirmado || null
    pedido.estado = 'enviado'
    pedido.entregadoAt = now
    pedido.actualizadoAt = now
    await redis.set(pedidoKey(pedidoId), pedido)

    const route = await redis.get(KEYS.route(date))
    if (route) {
      const stop = route.stops.find((s) => s.pedidoId === pedidoId)
      if (stop) {
        stop.entregado = true
        stop.entregadoAt = now
        route.updatedAt = now
        await redis.set(KEYS.route(date), route)
      }
    }

    return res.status(200).json(pedido)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}
