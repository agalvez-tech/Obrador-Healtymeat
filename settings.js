import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'
import { redis, KEYS } from '../lib/redis.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const seedSettings = JSON.parse(
  readFileSync(join(__dirname, '../lib/data/settings-seed.json'), 'utf-8')
)

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      let settings = await redis.get(KEYS.settings)
      if (!settings) {
        settings = seedSettings
        await redis.set(KEYS.settings, settings)
      }
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
