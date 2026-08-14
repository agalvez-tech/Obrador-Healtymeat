import { redis } from '../lib/redis.js'

const INDEX_KEY = 'reparto:trazabilidad-produccion:index'
const entryKey = (id) => `reparto:trazabilidad-produccion:${id}`

async function getAll() {
  const ids = await redis.zrange(INDEX_KEY, 0, -1)
  if (!ids || ids.length === 0) return []
  const values = await redis.mget(...ids.map(entryKey))
  return values.filter(Boolean)
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const entries = await getAll()
      entries.sort((a, b) => (b.creadoAt || 0) - (a.creadoAt || 0))
      return res.status(200).json(entries)
    }

    if (req.method === 'POST') {
      const body = req.body
      if (!Array.isArray(body.produccionIds) || body.produccionIds.length === 0) {
        return res.status(400).json({ error: 'Falta seleccionar al menos un registro de producción' })
      }
      if (!Array.isArray(body.materiales) || body.materiales.length === 0) {
        return res.status(400).json({ error: 'Falta indicar al menos una materia prima usada' })
      }
      const now = Date.now()
      const entry = {
        id: `trz-prod-${now}-${Math.round(Math.random() * 1000)}`,
        produccionIds: body.produccionIds,
        produccionResumen: body.produccionResumen || '',
        materiales: body.materiales.map((m) => ({
          materiaPrima: m.materiaPrima || '',
          cantidad: m.cantidad || '',
          unidad: m.unidad === 'uds' ? 'uds' : m.unidad === 'lote' ? 'lote' : 'kg',
          lote: m.lote || '',
        })),
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
