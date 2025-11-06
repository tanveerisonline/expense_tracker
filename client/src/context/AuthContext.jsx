import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState('')

  // Fetch CSRF token and current user on mount
  useEffect(() => {
    const init = async () => {
      try {
        const { data: csrf } = await api.get('/csrf-token')
        setCsrfToken(csrf.csrfToken)
        const { data } = await api.get('/auth/me', {
          headers: { 'X-CSRF-Token': csrf.csrfToken },
        })
        setUser(data.user || null)
      } catch (err) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post(
      '/auth/login',
      { email, password },
      { headers: { 'X-CSRF-Token': csrfToken } }
    )
    setUser(data.user)
  }

  const signup = async (name, email, password) => {
    const { data } = await api.post(
      '/auth/signup',
      { name, email, password },
      { headers: { 'X-CSRF-Token': csrfToken } }
    )
    setUser(data.user)
  }

  const logout = async () => {
    await api.post('/auth/logout', {}, { headers: { 'X-CSRF-Token': csrfToken } })
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, setUser, loading, login, signup, logout, csrfToken }),
    [user, loading, csrfToken]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}