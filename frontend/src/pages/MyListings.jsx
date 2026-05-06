import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

export default function MyListings() {
    const [listings, setListings] = useState([])
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('listings')

    useEffect(() => {
        Promise.all([
            api.get('/listings/my/'),
            api.get('/bookings/'),
        ]).then(([l, b]) => {
            setListings(l.data)
            setBookings(b.data.results || b.data)
        }).catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const handleToggle = async (id) => {
        try {
            const res = await api.post(`/listings/${id}/toggle_active/`)
            setListings(prev => prev.map(l =>
                l.id === id ? { ...l, is_active: res.data.is_active } : l
            ))
        } catch {
            alert('Ошибка изменения статуса')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить объявление?')) return
        try {
            await api.delete(`/listings/${id}/`)
            setListings(prev => prev.filter(l => l.id !== id))
        } catch {
            alert('Ошибка удаления')
        }
    }

    const handleConfirm = async (id) => {
        try {
            await api.post(`/bookings/${id}/confirm/`)
            setBookings(prev => prev.map(b =>
                b.id === id ? { ...b, status: 'confirmed' } : b
            ))
        } catch {
            alert('Ошибка подтверждения')
        }
    }

    const handleReject = async (id) => {
        try {
            await api.post(`/bookings/${id}/reject/`)
            setBookings(prev => prev.map(b =>
                b.id === id ? { ...b, status: 'cancelled' } : b
            ))
        } catch {
            alert('Ошибка отклонения')
        }
    }

    if (loading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" />
        </div>
    )

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Мои объявления</h4>
                <Link to="/listings/create" className="btn btn-primary">
                    + Добавить
                </Link>
            </div>

            {/* Табы */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'listings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('listings')}
                    >
                        Объявления ({listings.length})
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'bookings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bookings')}
                    >
                        Запросы ({bookings.filter(b => b.status === 'pending').length})
                    </button>
                </li>
            </ul>

            {/* Объявления */}
            {activeTab === 'listings' && (
                listings.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <p className="fs-5">Нет объявлений</p>
                        <Link to="/listings/create" className="btn btn-primary">
                            Создать первое объявление
                        </Link>
                    </div>
                ) : (
                    <div className="row g-3">
                        {listings.map(l => (
                            <div className="col-md-6" key={l.id}>
                                <div className="card shadow-sm h-100">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <h6 className="mb-1">{l.title}</h6>
                                            <span className={`badge ${l.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {l.is_active ? 'Активно' : 'Скрыто'}
                      </span>
                                        </div>
                                        <p className="text-muted small mb-1">
                                            📍 {l.city} {l.district && `· ${l.district}`}
                                        </p>
                                        <p className="text-muted small mb-1">
                                            💶 €{l.price_per_night}/ночь · 🛏 {l.rooms} комн.
                                        </p>
                                        <p className="text-muted small mb-2">
                                            👁 {l.view_count} просмотров
                                            · ⭐ {l.avg_rating > 0 ? l.avg_rating.toFixed(1) : 'Нет рейтинга'}
                                        </p>
                                        <div className="d-flex gap-2 flex-wrap mt-2">
                                            <Link
                                                to={`/listings/${l.id}`}
                                                className="btn btn-outline-primary btn-sm"
                                            >
                                                👁 Открыть
                                            </Link>
                                            <Link
                                                to={`/listings/${l.id}/edit`}
                                                className="btn btn-outline-warning btn-sm"
                                            >
                                                ✏️ Редактировать
                                            </Link>
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={() => handleToggle(l.id)}
                                            >
                                                {l.is_active ? '🙈 Скрыть' : '👁 Активировать'}
                                            </button>
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => handleDelete(l.id)}
                                            >
                                                🗑 Удалить
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Бронирования */}
            {activeTab === 'bookings' && (
                bookings.length === 0 ? (
                    <p className="text-muted text-center py-4">Нет запросов на бронирование</p>
                ) : (
                    <div className="row g-3">
                        {bookings.map(b => (
                            <div className="col-md-6" key={b.id}>
                                <div className="card shadow-sm">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6 className="mb-0">
                                                {b.listing_info?.title || `Объявление #${b.listing}`}
                                            </h6>
                                            <span className={`badge bg-${
                                                b.status === 'pending'   ? 'warning'   :
                                                    b.status === 'confirmed' ? 'success'   :
                                                        b.status === 'completed' ? 'secondary' : 'danger'
                                            }`}>
                        {b.status === 'pending'   ? 'Ожидает'      :
                            b.status === 'confirmed' ? 'Подтверждено' :
                                b.status === 'completed' ? 'Завершено'    : 'Отменено'}
                      </span>
                                        </div>
                                        <p className="text-muted small mb-1">
                                            👤 {b.tenant_email}
                                        </p>
                                        <p className="text-muted small mb-2">
                                            📅 {b.check_in} → {b.check_out}
                                        </p>
                                        {b.status === 'pending' && (
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handleConfirm(b.id)}
                                                >
                                                    ✅ Подтвердить
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleReject(b.id)}
                                                >
                                                    ❌ Отклонить
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    )
}