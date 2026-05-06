// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login             from './login'
import SecretariaPrincipal from './secretaria_principal'
import CitasMedicas      from './citas_medicas'
import MedicoPrincipal   from './medico_principal'
import RutaProtegida     from './RutaProtegida'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública — limpia la sesión al montarse */}
        <Route path="/" element={<Login />} />

        {/* Rutas protegidas — redirigen al login si no hay sesión */}
        <Route path="/secretaria" element={
          <RutaProtegida rol="SECRETARIA">
            <SecretariaPrincipal />
          </RutaProtegida>
        } />

        <Route path="/citas" element={
          <RutaProtegida rol="SECRETARIA">
            <CitasMedicas />
          </RutaProtegida>
        } />

        <Route path="/medico" element={
          <RutaProtegida rol="MEDICO">
            <MedicoPrincipal />
          </RutaProtegida>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App