import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import { redis, KEYS } from '../lib/redis.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const seedMateriasPrimas = JSON.parse(
  readFileSync(join(__dirname, '../lib/data/materias-primas-seed.json'), 'utf-8')
)

export default async function handler(req, res) {
  try {
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

    res.setHeader('Allow', 'GET, POST, DELETE')
    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}
