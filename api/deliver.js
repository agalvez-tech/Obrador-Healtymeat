import { redis, KEYS } from '../lib/redis.js'

const pedidoKey = (id) => `reparto:pedido:${id}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }

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

    // Mantenemos el pedido sincronizado con el estado de la parada
    const pedido = await redis.get(pedidoKey(pedidoId))
    if (pedido) {
      pedido.estado = entregado ? 'enviado' : 'lista_para_repartir'
      pedido.entregadoAt = entregado ? Date.now() : null
      pedido.actualizadoAt = Date.now()
      await redis.set(pedidoKey(pedidoId), pedido)
    }

    return res.status(200).json(route)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}
