export function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateLong(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDaysISO(iso, days) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

// Devuelve los 7 días (lunes a domingo) de la semana que contiene "iso".
export function getWeekDates(iso) {
  const d = new Date(`${iso}T00:00:00`)
  const dow = d.getDay() // 0=domingo..6=sábado
  const offsetToMonday = dow === 0 ? -6 : 1 - dow
  const monday = new Date(d)
  monday.setDate(d.getDate() + offsetToMonday)

  const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    return { iso: toISO(day), label: labels[i], dayNum: day.getDate() }
  })
}

// Clave estable para "la semana que contiene esta fecha", tipo "2026-W33".
// Se usa como identificador para guardar qué clientes no quieren pedido esa semana.
export function weekKey(iso) {
  const dates = getWeekDates(iso)
  const monday = new Date(`${dates[0].iso}T00:00:00`)
  const firstJan = new Date(monday.getFullYear(), 0, 1)
  const diffDays = Math.round((monday - firstJan) / 86400000)
  const week = Math.ceil((diffDays + firstJan.getDay() + 1) / 7)
  return `${monday.getFullYear()}-W${String(week).padStart(2, '0')}`
}

// Rango [inicio, fin] (lunes a domingo) de la semana que contiene "iso".
export function weekRange(iso) {
  const dates = getWeekDates(iso)
  return { desde: dates[0].iso, hasta: dates[6].iso }
}
