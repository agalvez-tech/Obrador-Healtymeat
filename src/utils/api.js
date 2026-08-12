async function req(path, options) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Error ${res.status}`)
  }
  return res.json()
}

export const api = {
  getClients: () => req('/clients'),
  addClient: (client) => req('/clients', { method: 'POST', body: JSON.stringify(client) }),
  updateClient: (client) => req('/clients', { method: 'PUT', body: JSON.stringify(client) }),
  deleteClient: (id) => req(`/clients?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getRoute: (date) => req(`/route?date=${date}`),
  saveRoute: (date, stops) => req('/route', { method: 'POST', body: JSON.stringify({ date, stops }) }),

  markDelivered: (date, pedidoId, entregado) =>
    req('/deliver', { method: 'POST', body: JSON.stringify({ date, pedidoId, entregado }) }),

  firmarPedido: (date, pedidoId, firmaImagen, albaranFirmado) =>
    req('/firmar', { method: 'POST', body: JSON.stringify({ date, pedidoId, firmaImagen, albaranFirmado }) }),

  getSettings: () => req('/settings'),
  saveSettings: (settings) => req('/settings', { method: 'POST', body: JSON.stringify(settings) }),

  getPedidos: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return req(`/pedidos${qs ? `?${qs}` : ''}`)
  },
  addPedido: (pedido) => req('/pedidos', { method: 'POST', body: JSON.stringify(pedido) }),
  updatePedido: (pedido) => req('/pedidos', { method: 'PUT', body: JSON.stringify(pedido) }),
  deletePedido: (id) => req(`/pedidos?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getProductos: () => req('/productos'),
  addProducto: (nombre, formato) => req('/productos', { method: 'POST', body: JSON.stringify({ nombre, formato }) }),
  deleteProducto: (id) => req(`/productos?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getProduccion: (fecha) => req(`/produccion${fecha ? `?fecha=${fecha}` : ''}`),
  addProduccion: (entry) => req('/produccion', { method: 'POST', body: JSON.stringify(entry) }),
  deleteProduccion: (id) => req(`/produccion?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getOmitidos: (semana) => req(`/omitidos?semana=${semana}`),
  setOmitido: (semana, clienteId, omitido) =>
    req('/omitidos', { method: 'POST', body: JSON.stringify({ semana, clienteId, omitido }) }),
}
