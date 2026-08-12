import { redis } from '../lib/redis.js'

const INDEX_KEY = 'reparto:produccion:index'
const entryKey = (id) => `reparto:produccion:${id}`

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { fecha } = req.query
      const ids = await redis.zrange(INDEX_KEY, 0, -1)
      let entries = []
      if (ids && ids.length > 0) {
        const values = await redis.mget(...ids.map(entryKey))
        entries = values.filter(Boolean)
      }
      if (fecha) entries = entries.filter((e) => e.fecha === fecha)
      entries.sort((a, b) => (b.creadoAt || 0) - (a.creadoAt || 0))
      return res.status(200).json(entries)
    }

    if (req.method === 'POST') {
      const { fecha, producto, lote, cantidad, unidad } = req.body
      if (!fecha || !producto || !cantidad) {
        return res.status(400).json({ error: 'Faltan fecha, producto o cantidad' })
      }
      const now = Date.now()
      const entry = {
        id: `prod-log-${now}`,
        fecha,
        producto,
        lote: lote || '',
        cantidad,
        unidad: unidad === 'kg' ? 'kg' : 'uds',
        creadoAt: now,
      }
      await redis.set(entryKey(entry.id), entry)
      await redis.zadd(INDEX_KEY, { score: now, member: entry.id })
      return res.status(200).json(entry)
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'Falta el id' })
      await redis.del(entryKey(id))
      await redis.zrem(INDEX_KEY, id)
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, DELETE')
    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}
