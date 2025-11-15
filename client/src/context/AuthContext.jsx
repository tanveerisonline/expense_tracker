import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
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
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await api.post(
      '/auth/login',
      { email, password },
      { headers: { 'X-CSRF-Token': csrfToken } }
    )
    setUser(data.user)
  }, [csrfToken])

  const signup = useCallback(async (name, email, password) => {
    const { data } = await api.post(
      '/auth/signup',
      { name, email, password },
      { headers: { 'X-CSRF-Token': csrfToken } }
    )
    setUser(data.user)
  }, [csrfToken])

  const logout = useCallback(async () => {
    await api.post('/auth/logout', {}, { headers: { 'X-CSRF-Token': csrfToken } })
    setUser(null)
  }, [csrfToken])

  const value = useMemo(
    () => ({ user, setUser, loading, login, signup, logout, csrfToken }),
    [user, loading, login, signup, logout, csrfToken]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}