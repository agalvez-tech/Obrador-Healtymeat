import { useState } from 'react'
import PedidosView from './PedidosView.jsx'
import ProduccionView from './ProduccionView.jsx'
import RepartoView from './RepartoView.jsx'
import ClientesView from './ClientesView.jsx'
import ExportView from './ExportView.jsx'

const TABS = [
  { key: 'pedidos', label: 'Pedidos' },
  { key: 'produccion', label: 'Producción' },
  { key: 'reparto', label: 'Reparto' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'exportar', label: 'Exportar' },
]

export default function OfficeShell({ onChangeRole }) {
  const [tab, setTab] = useState('pedidos')

  return (
    <div className="app office-view">
      <header className="app-header">
        <div className="brand">
          <img src="/logo.jpg" alt="HealthyMeat" className="brand-logo" />
          <span className="brand-name">Oficina</span>
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
        {tab === 'pedidos' && <PedidosView />}
        {tab === 'produccion' && <ProduccionView />}
        {tab === 'reparto' && <RepartoView />}
        {tab === 'clientes' && <ClientesView />}
        {tab === 'exportar' && <ExportView />}
      </div>
    </div>
  )
}
