import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import { redis, KEYS } from '../lib/redis.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const seedMateriasPrimas = JSON.parse(
  readFileSync(join(__dirname, '../lib/data/materias-primas-seed.json'), 'utf-8')
)

// Este endpoint agrupa dos catálogos pequeños (proveedores y materias
// primas) que antes eran archivos separados, para no pasarnos del límite
// de funciones serverless del plan gratuito de Vercel. Se distinguen con
// el parámetro `tipo`.
export default async function handler(req, res) {
  try {
    const tipo = req.method === 'GET' || req.method === 'DELETE' ? req.query.tipo : req.body.tipo
    if (tipo !== 'proveedores' && tipo !== 'materias-primas') {
      return res.status(400).json({ error: 'Falta o no es válido el parámetro tipo' })
    }

    if (tipo === 'proveedores') {
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
    }

    if (tipo === 'materias-primas') {
      if (req.method === 'GET') {
        let materias = await redis.get(KEYS.materiasPrimas)
        if (!materias) {
          materias = seedMateriasPrimas
          await redis.set(KEYS.materiasPrimas, materias)
        }
        return res.status(200).json(materias)
      }
      if (req.method === 'POST') {
        const materias = (await redis.get(KEYS.materiasPrimas)) || []
        const nombre = (req.body.nombre || '').trim().toUpperCase()
        if (!nombre) return res.status(400).json({ error: 'Falta el nombre' })
        if (materias.some((m) => m.toUpperCase() === nombre)) {
          return res.status(409).json({ error: 'Ya existe' })
        }
        materias.push(nombre)
        materias.sort((a, b) => a.localeCompare(b, 'es'))
        await redis.set(KEYS.materiasPrimas, materias)
        return res.status(200).json(materias)
      }
      if (req.method === 'DELETE') {
        const { nombre } = req.query
        const materias = (await redis.get(KEYS.materiasPrimas)) || []
        await redis.set(KEYS.materiasPrimas, materias.filter((m) => m !== nombre))
        return res.status(200).json({ ok: true })
      }
    }

    res.setHeader('Allow', 'GET, POST, DELETE')
    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}
