import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

export default function Register() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        email: '',
        first_name: '',
        last_name: '',
        role: 'tenant',
        password: '',
        password2: '',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (form.password !== form.password2) {
            setError('Пароли не совпадают')
            return
        }
        setLoading(true)
        try {
            await api.post('/users/register/', form)
            navigate('/login')
        } catch (err) {
            const data = err.response?.data
            if (data) {
                const messages = Object.values(data).flat().join(' ')
                setError(messages)
            } else {
                setError('Ошибка регистрации')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="row justify-content-center">
            <div className="col-md-5">
                <div className="card shadow-sm mt-4">
                    <div className="card-body p-4">
                        <h4 className="mb-4 text-center">Регистрация</h4>
                        {error && <div className="alert alert-danger">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={form.email}
                                    onChange={e => setForm({...form, email: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="row mb-3">
                                <div className="col">
                                    <label className="form-label">Имя</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={form.first_name}
                                        onChange={e => setForm({...form, first_name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="col">
                                    <label className="form-label">Фамилия</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={form.last_name}
                                        onChange={e => setForm({...form, last_name: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Я являюсь</label>
                                <select
                                    className="form-select"
                                    value={form.role}
                                    onChange={e => setForm({...form, role: e.target.value})}
                                >
                                    <option value="tenant">Арендатором</option>
                                    <option value="landlord">Арендодателем</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Пароль</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={form.password}
                                    onChange={e => setForm({...form, password: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Повтори пароль</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={form.password2}
                                    onChange={e => setForm({...form, password2: e.target.value})}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={loading}
                            >
                                {loading ? 'Регистрируемся...' : 'Зарегистрироваться'}
                            </button>
                        </form>
                        <p className="text-center mt-3 mb-0">
                            Уже есть аккаунт? <Link to="/login">Войти</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}