import { redis, KEYS } from '../lib/redis.js'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { date } = req.query
      if (!date) return res.status(400).json({ error: 'Falta el parámetro date' })
      const route = await redis.get(KEYS.route(date))
      return res.status(200).json(route || null)
    }

    if (req.method === 'POST') {
      const { date, stops } = req.body
      if (!date || !Array.isArray(stops)) {
        return res.status(400).json({ error: 'Faltan date o stops' })
      }
      const route = { date, stops, updatedAt: Date.now() }
      await redis.set(KEYS.route(date), route)
      return res.status(200).json(route)
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}
