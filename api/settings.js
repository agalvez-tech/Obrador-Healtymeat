import { redis, KEYS } from '../lib/redis.js'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const settings = (await redis.get(KEYS.settings)) || null
      return res.status(200).json(settings)
    }

    if (req.method === 'POST') {
      await redis.set(KEYS.settings, req.body)
      return res.status(200).json(req.body)
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}
