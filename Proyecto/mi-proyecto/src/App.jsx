// App.jsx — agrega la ruta /medico al router existente
// Asegúrate de que ya tienes react-router-dom instalado

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './login'
import SecretariaPrincipal from './secretaria_principal'
import CitasMedicas from './citas_medicas'       // si ya existe
import MedicoPrincipal from './medico_principal'  // ← NUEVO

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Login />} />
        <Route path="/secretaria" element={<SecretariaPrincipal />} />
        <Route path="/citas"      element={<CitasMedicas />} />     {/* si ya existe */}
        <Route path="/medico"     element={<MedicoPrincipal />} />  {/* ← NUEVO */}
      </Routes>
    </BrowserRouter>
  )
}

export default App