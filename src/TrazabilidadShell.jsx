import { useState } from 'react'
import ProveedoresView from './ProveedoresView.jsx'
import ProduccionTrazabilidadView from './ProduccionTrazabilidadView.jsx'

const TABS = [
  { key: 'proveedores', label: 'Proveedores' },
  { key: 'produccion', label: 'Producción para trazabilidad' },
]

export default function TrazabilidadShell({ onChangeRole }) {
  const [tab, setTab] = useState('proveedores')

  return (
    <div className="app office-view">
      <header className="app-header">
        <div className="brand">
          <img src="/logo.jpg" alt="HealthyMeat" className="brand-logo" />
          <span className="brand-name">Trazabilidad</span>
        </div>
        <button className="btn-ghost" onClick={onChangeRole}>Cambiar modo</button>
      </header>

      <nav className="main-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`main-tab ${tab === t.key ? 'main-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="office-scroll">
        {tab === 'proveedores' && <ProveedoresView />}
        {tab === 'produccion' && <ProduccionTrazabilidadView />}
      </div>
    </div>
  )
}
