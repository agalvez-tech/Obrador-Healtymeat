import { useState } from 'react'
import OfficeShell from './OfficeShell.jsx'
import DriverView from './DriverView.jsx'
import TrazabilidadShell from './TrazabilidadShell.jsx'
import { getRole, setRole as persistRole, clearRole } from './utils/role.js'

export default function App() {
  const [role, setRoleState] = useState(getRole())

  function chooseRole(r) {
    persistRole(r)
    setRoleState(r)
  }

  function changeRole() {
    clearRole()
    setRoleState(null)
  }

  if (!role) {
    return <RoleScreen onChoose={chooseRole} />
  }

  if (role === 'oficina') return <OfficeShell onChangeRole={changeRole} />
  if (role === 'trazabilidad') return <TrazabilidadShell onChangeRole={changeRole} />
  return <DriverView onChangeRole={changeRole} />
}

function RoleScreen({ onChoose }) {
  return (
    <div className="role-screen">
      <img src="/logo.jpg" alt="HealthyMeat" className="role-logo" />
      <p className="role-app-name">HealthyMeat Obrador</p>
      <h1>¿Cómo vas a usar este dispositivo?</h1>
      <button className="btn-primary" onClick={() => onChoose('oficina')}>
        OBRADOR — pedidos, producción y reparto
      </button>
      <button className="btn-primary btn-primary--alt" onClick={() => onChoose('repartidor')}>
        Soy repartidor — reparto hoy
      </button>
      <button className="btn-primary btn-primary--alt" onClick={() => onChoose('trazabilidad')}>
        TRAZABILIDAD — proveedores y producción
      </button>
      <p className="role-hint">
        Esto se recuerda en este dispositivo. Puedes cambiarlo luego desde "Cambiar modo" arriba.
      </p>
    </div>
  )
}
