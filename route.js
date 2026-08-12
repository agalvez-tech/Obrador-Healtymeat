import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import { redis, KEYS } from '../lib/redis.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const seedClients = JSON.parse(
  readFileSync(join(__dirname, '../lib/data/clients-seed.json'), 'utf-8')
)

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      let clients = await redis.get(KEYS.clients)
      if (!clients) {
        // Primera vez que se pide la lista: precargamos los clientes habituales
        // que ya vienen localizados desde el listado de HealthyMeat.
        clients = seedClients
        await redis.set(KEYS.clients, clients)
      }
      return res.status(200).json(clients)
    }

    if (req.method === 'POST') {
      const body = req.body
      const clients = (await redis.get(KEYS.clients)) || []
      const newClient = {
        id: `c-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        nombre: body.nombre || '',
        direccion: body.direccion || '',
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        telefono: body.telefono || '',
        dias: body.dias || '',
        horario: body.horario || '',
        notas: body.notas || '',
        tipoEntrega: body.tipoEntrega === 'agencia' ? 'agencia' : 'propio',
      }
      clients.push(newClient)
      await redis.set(KEYS.clients, clients)
      return res.status(200).json(newClient)
    }

    if (req.method === 'PUT') {
      const body = req.body
      const clients = (await redis.get(KEYS.clients)) || []
      const idx = clients.findIndex((c) => c.id === body.id)
      if (idx === -1) return res.status(404).json({ error: 'Cliente no encontrado' })
      clients[idx] = { ...clients[idx], ...body }
      await redis.set(KEYS.clients, clients)
      return res.status(200).json(clients[idx])
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      const clients = (await redis.get(KEYS.clients)) || []
      const filtered = clients.filter((c) => c.id !== id)
      await redis.set(KEYS.clients, filtered)
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE')
    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}
