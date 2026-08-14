import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import { redis, KEYS } from '../lib/redis.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const seedProductos = JSON.parse(
  readFileSync(join(__dirname, '../lib/data/productos-seed.json'), 'utf-8')
)

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      let productos = await redis.get(KEYS.productos)
      if (!productos) {
        productos = seedProductos
        await redis.set(KEYS.productos, productos)
      }
      return res.status(200).json(productos)
    }

    if (req.method === 'POST') {
      const productos = (await redis.get(KEYS.productos)) || []
      const nombre = (req.body.nombre || '').trim()
      const formato = (req.body.formato || '').trim()
      const formatos = Array.isArray(req.body.formatos) && req.body.formatos.length > 0
        ? req.body.formatos
        : ['uds']
      if (!nombre) return res.status(400).json({ error: 'Falta el nombre del producto' })
      if (productos.some((p) => p.nombre.toLowerCase() === nombre.toLowerCase())) {
        return res.status(409).json({ error: 'Ese producto ya existe' })
      }
      const nuevo = {
        id: `prod-${Date.now()}`,
        nombre,
        formato,
        formatos,
        unidadDefecto: formatos.includes('kg') && !formatos.includes('uds') ? 'kg' : (formatos[0] || 'uds'),
      }
      productos.push(nuevo)
      productos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      await redis.set(KEYS.productos, productos)
      return res.status(200).json(nuevo)
    }

    // Fusiona el catálogo base (nombre, formato de envasado, kg/uds/ambas)
    // con lo que ya hay guardado: actualiza los que coinciden por nombre y
    // añade los que falten, sin tocar productos añadidos a mano que no
    // estén en el listado base.
    if (req.method === 'PUT' && req.body?.accion === 'sincronizar-catalogo-base') {
      const productos = (await redis.get(KEYS.productos)) || []
      const porNombre = new Map(productos.map((p) => [p.nombre.toLowerCase(), p]))
      for (const base of seedProductos) {
        const key = base.nombre.toLowerCase()
        if (porNombre.has(key)) {
          const existente = porNombre.get(key)
          existente.formato = base.formato
          existente.formatos = base.formatos
          existente.unidadDefecto = base.unidadDefecto
        } else {
          const nuevo = { ...base, id: `prod-${Date.now()}-${Math.round(Math.random() * 10000)}` }
          productos.push(nuevo)
          porNombre.set(key, nuevo)
        }
      }
      productos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      await redis.set(KEYS.productos, productos)
      return res.status(200).json(productos)
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      const productos = (await redis.get(KEYS.productos)) || []
      await redis.set(KEYS.productos, productos.filter((p) => p.id !== id))
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE')
    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}
