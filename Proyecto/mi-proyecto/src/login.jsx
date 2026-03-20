import { useState } from 'react'
import { useNavigate } from 'react-router-dom'  // ← 1. Importar useNavigate
import './login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()  // ← 2. Inicializar navigate

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // ← 3. Lógica de autenticación simple
    if (email === 'maria@gmail.com' && password === 'maria776') {
      console.log('✅ Login exitoso')
      navigate('/secretaria')  // ← 4. Redirigir a secretaria
    } else {
      console.log('❌ Credenciales incorrectas')
      alert('Email o contraseña incorrectos')  // ← 5. Mensaje de error
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <h1>Centro Médico</h1>
          <p>Ingresa a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-login">
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login