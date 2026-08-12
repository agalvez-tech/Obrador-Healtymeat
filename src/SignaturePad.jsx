import { useEffect, useRef, useState } from 'react'

export default function SignaturePad({ onCancel, onConfirm, confirmLabel = 'Confirmar firma' }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const hasDrawn = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#171513'
  }, [])

  function getPos(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const point = e.touches ? e.touches[0] : e
    return { x: point.clientX - rect.left, y: point.clientY - rect.top }
  }

  function start(e) {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function move(e) {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!hasDrawn.current) {
      hasDrawn.current = true
      setIsEmpty(false)
    }
  }

  function end(e) {
    e.preventDefault()
    drawing.current = false
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasDrawn.current = false
    setIsEmpty(true)
  }

  function confirm() {
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onConfirm(dataUrl)
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal signature-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Firma del cliente</h3>
        <p className="signature-hint">Que firme aquí con el dedo para confirmar la entrega.</p>
        <div className="signature-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="signature-canvas"
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
          />
          {isEmpty && <span className="signature-placeholder">Firma aquí</span>}
        </div>
        <div className="modal-actions modal-actions--spread">
          <button type="button" className="btn-link" onClick={clear}>Borrar</button>
          <div className="modal-actions">
            <button type="button" className="btn-ghost btn-ghost--dark" onClick={onCancel}>Cancelar</button>
            <button type="button" className="btn-primary btn-primary--small" onClick={confirm} disabled={isEmpty}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
