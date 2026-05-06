import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('access')
        if (token) {
            fetchMe()
        } else {
            setLoading(false)
        }
    }, [])

    const fetchMe = async () => {
        try {
            const res = await api.get('/users/me/')
            setUser(res.data)
        } catch {
            localStorage.removeItem('access')
            localStorage.removeItem('refresh')
        } finally {
            setLoading(false)
        }
    }

    const login = async (email, password) => {
        const res = await api.post('/users/login/', { email, password })
        localStorage.setItem('access', res.data.access)
        localStorage.setItem('refresh', res.data.refresh)
        await fetchMe()
    }

    const logout = () => {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}