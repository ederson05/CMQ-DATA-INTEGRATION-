import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './login.jsx'
import SecretariaPrincipal from './secretaria_principal.jsx'
import CitasMedicas from './citas_medicas.jsx'
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Login />} />
        <Route path="/secretaria" element={<SecretariaPrincipal />} />
        <Route path="/citas"      element={<CitasMedicas />} />
      </Routes>
    </BrowserRouter>
  )
}













export default App