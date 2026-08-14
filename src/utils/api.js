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
    req('/pedidos', { method: 'POST', body: JSON.stringify({ accion: 'entregar', date, pedidoId, entregado }) }),

  firmarPedido: (date, pedidoId, firmaImagen, albaranFirmado) =>
    req('/pedidos', { method: 'POST', body: JSON.stringify({ accion: 'firmar', date, pedidoId, firmaImagen, albaranFirmado }) }),

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
  addProducto: (nombre, formato, formatos) =>
    req('/productos', { method: 'POST', body: JSON.stringify({ nombre, formato, formatos }) }),
  deleteProducto: (id) => req(`/productos?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  sincronizarCatalogoBase: () =>
    req('/productos', { method: 'PUT', body: JSON.stringify({ accion: 'sincronizar-catalogo-base' }) }),

  getProduccion: (fecha) => req(`/produccion${fecha ? `?fecha=${fecha}` : ''}`),
  addProduccion: (entry) => req('/produccion', { method: 'POST', body: JSON.stringify(entry) }),
  deleteProduccion: (id) => req(`/produccion?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getOmitidos: (semana) => req(`/clients?accion=omitidos&semana=${semana}`),
  setOmitido: (semana, clienteId, omitido) =>
    req('/clients', { method: 'POST', body: JSON.stringify({ accion: 'omitidos', semana, clienteId, omitido }) }),

  getProveedores: () => req('/catalogos?tipo=proveedores'),
  addProveedor: (nombre) => req('/catalogos', { method: 'POST', body: JSON.stringify({ tipo: 'proveedores', nombre }) }),
  deleteProveedor: (id) => req(`/catalogos?tipo=proveedores&id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getMateriasPrimas: () => req('/catalogos?tipo=materias-primas'),
  addMateriaPrima: (nombre) => req('/catalogos', { method: 'POST', body: JSON.stringify({ tipo: 'materias-primas', nombre }) }),
  deleteMateriaPrima: (nombre) => req(`/catalogos?tipo=materias-primas&nombre=${encodeURIComponent(nombre)}`, { method: 'DELETE' }),

  getTrazabilidadProveedores: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return req(`/trazabilidad-proveedores${qs ? `?${qs}` : ''}`)
  },
  addTrazabilidadProveedor: (entry) => req('/trazabilidad-proveedores', { method: 'POST', body: JSON.stringify(entry) }),
  updateTrazabilidadProveedor: (entry) => req('/trazabilidad-proveedores', { method: 'PUT', body: JSON.stringify(entry) }),
  deleteTrazabilidadProveedor: (id) => req(`/trazabilidad-proveedores?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getTrazabilidadProduccion: () => req('/trazabilidad-produccion'),
  addTrazabilidadProduccion: (entry) => req('/trazabilidad-produccion', { method: 'POST', body: JSON.stringify(entry) }),
  deleteTrazabilidadProduccion: (id) => req(`/trazabilidad-produccion?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
