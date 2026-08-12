import { useRef, useState } from 'react'

// Lista reordenable "pulsar y arrastrar": se agarra por el icono de asa
// (⠿) y se mueve verticalmente; al cruzar el punto medio de la fila vecina,
// se intercambian de sitio. Funciona con ratón y con dedo (Pointer Events).
export default function DragReorderList({ items, keyField = 'id', onReorder, renderItem, className = '' }) {
  const [localItems, setLocalItems] = useState(items)
  const [draggingId, setDraggingId] = useState(null)
  const [dragY, setDragY] = useState(0)
  const itemRefs = useRef({})
  const startYRef = useRef(0)
  const draggingIdRef = useRef(null)
  const localItemsRef = useRef(items)

  // Si la lista cambia desde fuera (se añade/quita una línea) y no estamos
  // arrastrando, resincronizamos el orden local con el que llega por props.
  const idsProp = items.map((it) => it[keyField]).join(',')
  const idsLocal = localItemsRef.current.map((it) => it[keyField]).join(',')
  if (idsProp !== idsLocal && !draggingIdRef.current) {
    localItemsRef.current = items
    setLocalItems(items)
  }

  function handlePointerDown(id, e) {
    e.preventDefault()
    e.stopPropagation()
    startYRef.current = e.clientY
    draggingIdRef.current = id
    setDraggingId(id)
    setDragY(0)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  function handlePointerMove(e) {
    const id = draggingIdRef.current
    if (!id) return
    setDragY(e.clientY - startYRef.current)

    const current = localItemsRef.current
    const idx = current.findIndex((it) => it[keyField] === id)
    if (idx === -1) return

    if (idx < current.length - 1) {
      const belowEl = itemRefs.current[current[idx + 1][keyField]]
      if (belowEl) {
        const rect = belowEl.getBoundingClientRect()
        if (e.clientY > rect.top + rect.height / 2) {
          const next = [...current]
          ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
          localItemsRef.current = next
          setLocalItems(next)
          return
        }
      }
    }
    if (idx > 0) {
      const aboveEl = itemRefs.current[current[idx - 1][keyField]]
      if (aboveEl) {
        const rect = aboveEl.getBoundingClientRect()
        if (e.clientY < rect.top + rect.height / 2) {
          const next = [...current]
          ;[next[idx], next[idx - 1]] = [next[idx - 1], next[idx]]
          localItemsRef.current = next
          setLocalItems(next)
        }
      }
    }
  }

  function handlePointerUp() {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    draggingIdRef.current = null
    setDraggingId(null)
    setDragY(0)
    onReorder(localItemsRef.current)
  }

  return (
    <div className={className}>
      {localItems.map((item) => {
        const isDragging = draggingId === item[keyField]
        return (
          <div
            key={item[keyField]}
            ref={(el) => { itemRefs.current[item[keyField]] = el }}
            className={`drag-reorder-item ${isDragging ? 'drag-reorder-item--dragging' : ''}`}
            style={isDragging ? { transform: `translateY(${dragY}px)` } : undefined}
          >
            {renderItem(item, (e) => handlePointerDown(item[keyField], e))}
          </div>
        )
      })}
    </div>
  )
}
