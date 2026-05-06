import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const STATUS_LABELS = {
    pending:   { label: 'Ожидает',      color: 'warning' },
    confirmed: { label: 'Подтверждено', color: 'success' },
    cancelled: { label: 'Отменено',     color: 'danger' },
    completed: { label: 'Завершено',    color: 'secondary' },
}

export default function Profile() {
    const { user } = useAuth()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [reviewForms, setReviewForms] = useState({})  // {booking_id: {rating, comment}}
    const [reviewSent, setReviewSent] = useState({})    // {booking_id: true}

    useEffect(() => {
        Promise.all([
            api.get('/bookings/'),
            api.get('/reviews/?author=me'),
        ])
            .then(([bookingsRes, reviewsRes]) => {
                setBookings(bookingsRes.data.results || bookingsRes.data)
                // собираем id бронирований у которых уже есть отзыв
                const reviewed = {}
                const reviews = reviewsRes.data.results || reviewsRes.data
                if (Array.isArray(reviews)) {
                    reviews.forEach(r => {
                        reviewed[r.booking] = true
                    })
                }
                setReviewSent(reviewed)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const handleCancel = async (id) => {
        try {
            await api.post(`/bookings/${id}/cancel/`)
            setBookings(prev => prev.map(b =>
                b.id === id ? { ...b, status: 'cancelled' } : b
            ))
        } catch {
            alert('Ошибка отмены')
        }
    }

    const handleReviewChange = (bookingId, field, value) => {
        setReviewForms(prev => ({
            ...prev,
            [bookingId]: { ...prev[bookingId], [field]: value }
        }))
    }

    const handleReviewSubmit = async (booking) => {
        const form = reviewForms[booking.id]
        if (!form?.rating || !form?.comment) {
            alert('Заполни рейтинг и комментарий')
            return
        }
        console.log('booking object:', booking)
        console.log('listing value:', booking.listing)
        try {
            await api.post('/reviews/', {
                listing: booking.listing,
                booking: booking.id,
                rating:  form.rating,
                comment: form.comment,
            })
            setReviewSent(prev => ({ ...prev, [booking.id]: true }))
        }catch (err) {
            const data = err.response?.data
            console.log('Ошибка отзыва:', data)

            if (data?.errors) {
                const messages = Object.values(data.errors).flat().join('\n')
                alert(messages)
            } else if (typeof data === 'object') {
                const messages = Object.values(data).flat().join('\n')
                alert(messages)
            } else {
                alert('Ошибка отправки отзыва')
            }
        }
    }

    if (!user) return (
        <div className="text-center py-5">
            <p>Войдите чтобы видеть профиль</p>
        </div>
    )

    return (
        <div>
            {/* Профиль */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <h4>👤 {user.first_name} {user.last_name}</h4>
                    <p className="text-muted mb-1">{user.email}</p>
                    <span className="badge bg-primary">
            {user.role === 'landlord' ? 'Арендодатель' : 'Арендатор'}
          </span>
                </div>
            </div>

            {/* Мои бронирования */}
            <h5 className="mb-3">Мои бронирования</h5>
            {loading ? (
                <div className="text-center py-3">
                    <div className="spinner-border text-primary" />
                </div>
            ) : bookings.length === 0 ? (
                <p className="text-muted">Бронирований нет</p>
            ) : (
                <div className="row g-3">
                    {bookings.map(b => {
                        const s = STATUS_LABELS[b.status] || { label: b.status, color: 'secondary' }
                        const canReview = b.status === 'completed' &&
                            !reviewSent[b.id] &&
                            user.role === 'tenant'  //  только арендатор

                        return (
                            <div className="col-md-6" key={b.id}>
                                <div className="card shadow-sm">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between">
                                            <h6>{b.listing_info?.title || `Объявление #${b.listing}`}</h6>
                                            <span className={`badge bg-${s.color}`}>{s.label}</span>
                                        </div>
                                        <p className="text-muted small mb-1">
                                            📅 {b.check_in} → {b.check_out}
                                        </p>

                                        {/* Кнопка отмены */}
                                        {(b.status === 'pending' || b.status === 'confirmed') && (
                                            <button
                                                className="btn btn-outline-danger btn-sm mt-2"
                                                onClick={() => handleCancel(b.id)}
                                            >
                                                Отменить
                                            </button>
                                        )}

                                        {/* Форма отзыва — только для завершённых */}
                                        {canReview && (
                                            <div className="mt-3 border-top pt-3">
                                                <p className="fw-bold small mb-2">✍️ Оставить отзыв:</p>
                                                <div className="mb-2">
                                                    <label className="form-label small">Рейтинг</label>
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={reviewForms[b.id]?.rating || ''}
                                                        onChange={e => handleReviewChange(b.id, 'rating', e.target.value)}
                                                    >
                                                        <option value="">Выбери рейтинг</option>
                                                        <option value="5">⭐⭐⭐⭐⭐ Отлично</option>
                                                        <option value="4">⭐⭐⭐⭐ Хорошо</option>
                                                        <option value="3">⭐⭐⭐ Нормально</option>
                                                        <option value="2">⭐⭐ Плохо</option>
                                                        <option value="1">⭐ Ужасно</option>
                                                    </select>
                                                </div>
                                                <div className="mb-2">
                                                    <label className="form-label small">Комментарий</label>
                                                    <textarea
                                                        className="form-control form-control-sm"
                                                        rows={3}
                                                        placeholder="Расскажи о своём опыте..."
                                                        value={reviewForms[b.id]?.comment || ''}
                                                        onChange={e => handleReviewChange(b.id, 'comment', e.target.value)}
                                                    />
                                                </div>
                                                <button
                                                    className="btn btn-primary btn-sm w-100"
                                                    onClick={() => handleReviewSubmit(b)}
                                                >
                                                    Отправить отзыв
                                                </button>
                                            </div>
                                        )}

                                        {/* Отзыв отправлен */}
                                        {reviewSent[b.id] && (
                                            <div className="alert alert-success mt-2 mb-0 py-2">
                                                ✅ Отзыв отправлен!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}