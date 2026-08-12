import { redis } from '../lib/redis.js'

const key = (semana) => `reparto:omitidos:${semana}`

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { semana } = req.query
      if (!semana) return res.status(400).json({ error: 'Falta el parámetro semana' })
      const omitidos = (await redis.get(key(semana))) || []
      return res.status(200).json(omitidos)
    }

    if (req.method === 'POST') {
      const { semana, clienteId, omitido } = req.body
      if (!semana || !clienteId) {
        return res.status(400).json({ error: 'Faltan semana o clienteId' })
      }
      const omitidos = (await redis.get(key(semana))) || []
      const next = omitido
        ? [...new Set([...omitidos, clienteId])]
        : omitidos.filter((id) => id !== clienteId)
      await redis.set(key(semana), next)
      return res.status(200).json(next)
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).end()
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error interno' })
  }
}
