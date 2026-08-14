// Calcula la próxima fecha (a partir de hoy) que coincide con alguno de los
// días habituales del cliente. "dias" es un texto tipo "L", "X", "LJ", "LMXJV"...
// L=lunes M=martes X=miércoles J=jueves V=viernes S=sábado D=domingo.
const DAY_CODES = { D: 0, L: 1, M: 2, X: 3, J: 4, V: 5, S: 6 }

export function nextDeliveryDate(dias, from = new Date()) {
  const codes = (dias || '')
    .toUpperCase()
    .split('')
    .map((c) => DAY_CODES[c])
    .filter((n) => n !== undefined)

  const base = new Date(from)
  base.setHours(0, 0, 0, 0)

  if (codes.length === 0) {
    // Sin días habituales conocidos: por defecto, el día siguiente.
    base.setDate(base.getDate() + 1)
    return toISO(base)
  }

  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(base)
    d.setDate(d.getDate() + offset)
    if (codes.includes(d.getDay())) {
      return toISO(d)
    }
  }
  return toISO(base)
}

function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
