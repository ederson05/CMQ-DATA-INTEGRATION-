import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './login.jsx'
import SecretariaPrincipal from './secretaria_principal.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/secretaria" element={<SecretariaPrincipal />} />
      </Routes>
    </BrowserRouter>
  )
}













export default App