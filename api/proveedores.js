import { redis, KEYS } from '../lib/redis.js'

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const proveedores = (await redis.get(KEYS.proveedores)) || []
      return res.status(200).json(proveedores)
    }

    if (req.method === 'POST') {
      const proveedores = (await redis.get(KEYS.proveedores)) || []
      const nombre = (req.body.nombre || '').trim()
      if (!nombre) return res.status(400).json({ error: 'Falta el nombre del proveedor' })
      if (proveedores.some((p) => p.nombre.toLowerCase() === nombre.toLowerCase())) {
        return res.status(409).json({ error: 'Ese proveedor ya existe' })
      }
      const nuevo = { id: `prov-${Date.now()}`, nombre }
      proveedores.push(nuevo)
      proveedores.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      await redis.set(KEYS.proveedores, proveedores)
      return res.status(200).json(nuevo)
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      const proveedores = (await redis.get(KEYS.proveedores)) || []
      await redis.set(KEYS.proveedores, proveedores.filter((p) => p.id !== id))
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, DELETE')
    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}
