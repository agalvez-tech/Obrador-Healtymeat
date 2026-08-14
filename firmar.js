import { redis, KEYS } from '../lib/redis.js'

const pedidoKey = (id) => `reparto:pedido:${id}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }

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
