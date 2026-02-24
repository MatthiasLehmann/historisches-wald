import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'

const LoginPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  if (typeof window !== 'undefined' && localStorage.getItem('authToken')) {
    return <Navigate to="/submit" replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (form.username === 'HistorischesWald' && form.password === '2wsx§EDC') {
      localStorage.setItem('authToken', 'historisches-token')
      navigate('/submit', { replace: true })
    } else {
      setError('Ungültige Zugangsdaten.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white border border-parchment-dark rounded-sm shadow-lg p-6 space-y-4"
      >
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-accent">Login</p>
          <h1 className="text-3xl font-serif font-bold text-ink">Willkommen</h1>
        </div>

        <label className="text-sm font-medium text-ink/80 space-y-1 block">
          Benutzername
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full border border-parchment-dark rounded-sm px-3 py-2"
            required
          />
        </label>

        <label className="text-sm font-medium text-ink/80 space-y-1 block">
          Passwort
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border border-parchment-dark rounded-sm px-3 py-2"
            required
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          className="w-full bg-accent text-white font-semibold rounded-sm py-3 hover:bg-accent-dark transition-colors"
        >
          Anmelden
        </button>
      </form>
    </div>
  )
}

export default LoginPage
