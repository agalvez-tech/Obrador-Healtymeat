import { redis } from '../lib/redis.js'

const INDEX_KEY = 'reparto:trazabilidad-proveedores:index'
const entryKey = (id) => `reparto:trazabilidad-proveedor:${id}`

async function getAll() {
  const ids = await redis.zrange(INDEX_KEY, 0, -1)
  if (!ids || ids.length === 0) return []
  const values = await redis.mget(...ids.map(entryKey))
  return values.filter(Boolean)
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { id } = req.query
      if (id) {
        const entry = await redis.get(entryKey(id))
        return res.status(200).json(entry || null)
      }
      const entries = await getAll()
      entries.sort((a, b) => (b.creadoAt || 0) - (a.creadoAt || 0))
      return res.status(200).json(entries)
    }

    if (req.method === 'POST') {
      const body = req.body
      const now = Date.now()
      const entry = {
        id: `trz-prov-${now}-${Math.round(Math.random() * 1000)}`,
        proveedorId: body.proveedorId || '',
        proveedorNombre: body.proveedorNombre || '',
        origen: body.origen || null, // { tipo: 'imagen'|'pdf'|'texto', contenido }
        numeroAlbaran: body.numeroAlbaran || '',
        fechaAlbaran: body.fechaAlbaran || '',
        fechaRecepcion: body.fechaRecepcion || new Date().toISOString().slice(0, 10),
        materiaPrima: body.materiaPrima || '',
        lote: body.lote || '',
        cantidad: body.cantidad || '',
        unidad: body.unidad === 'uds' ? 'uds' : 'kg',
        notas: body.notas || '',
        creadoAt: now,
      }
      await redis.set(entryKey(entry.id), entry)
      await redis.zadd(INDEX_KEY, { score: now, member: entry.id })
      return res.status(200).json(entry)
    }

    if (req.method === 'PUT') {
      const body = req.body
      if (!body.id) return res.status(400).json({ error: 'Falta el id' })
      const existing = await redis.get(entryKey(body.id))
      if (!existing) return res.status(404).json({ error: 'No encontrado' })
      const updated = { ...existing, ...body }
      await redis.set(entryKey(updated.id), updated)
      return res.status(200).json(updated)
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'Falta el id' })
      await redis.del(entryKey(id))
      await redis.zrem(INDEX_KEY, id)
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE')
    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}
