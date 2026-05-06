// RutaProtegida.jsx
// Envuelve las rutas que requieren sesión activa.
// Si no hay usuario en localStorage, redirige al login.
// Úsalo en main.jsx o App.jsx así:
//
//   <Route path="/secretaria" element={
//     <RutaProtegida rol="SECRETARIA"><SecretariaPrincipal /></RutaProtegida>
//   } />
//   <Route path="/medico" element={
//     <RutaProtegida rol="MEDICO"><MedicoPrincipal /></RutaProtegida>
//   } />

import { Navigate } from 'react-router-dom'

function RutaProtegida({ children, rol }) {
  // Intenta leer la sesión guardada
  let usuario = null
  try {
    usuario = JSON.parse(localStorage.getItem('usuario'))
  } catch {
    usuario = null
  }

  // Sin sesión → login
  if (!usuario) {
    return <Navigate to="/" replace />
  }

  // Con sesión pero rol incorrecto → login
  // (evita que una secretaria entre a /medico manualmente)
  if (rol && usuario.rol?.toUpperCase() !== rol) {
    return <Navigate to="/" replace />
  }

  return children
}

export default RutaProtegida