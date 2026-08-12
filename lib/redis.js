import { Redis } from '@upstash/redis'

// Usa las mismas variables de entorno UPSTASH_REDIS_REST_URL y
// UPSTASH_REDIS_REST_TOKEN que ya tienes configuradas en Vercel para la app
// de fichajes. Todas las claves de esta app van prefijadas con "reparto:"
// para no chocar con las claves de fichajes en la misma base de datos.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export const KEYS = {
  clients: 'reparto:clients',
  settings: 'reparto:settings',
  route: (date) => `reparto:route:${date}`,
  pedidos: 'reparto:pedidos',
  productos: 'reparto:productos',
  produccion: 'reparto:produccion',
}
