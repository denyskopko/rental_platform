import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function ListingDetail() {
    const [activeImage, setActiveImage] = useState(0)
    const { id } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [listing, setListing] = useState(null)
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [booking, setBooking] = useState({ check_in: '', check_out: '' })
    const [bookingMsg, setBookingMsg] = useState('')
    const [bookingError, setBookingError] = useState('')

    useEffect(() => {
        // загружаем объявление и отзывы параллельно
        Promise.all([
            api.get(`/listings/${id}/`),
            api.get(`/reviews/?listing=${id}`),
        ])
            .then(([listingRes, reviewsRes]) => {
                setListing(listingRes.data)
                const data = reviewsRes.data.results ?? reviewsRes.data
                setReviews(Array.isArray(data) ? data : [])
            })
            .catch(() => navigate('/listings'))
            .finally(() => setLoading(false))
    }, [id])

    const handleBook = async (e) => {
        e.preventDefault()
        setBookingMsg('')
        setBookingError('')
        try {
            await api.post('/bookings/', {
                listing: id,
                check_in: booking.check_in,
                check_out: booking.check_out,
            })
            setBookingMsg('Бронирование отправлено! Ожидайте подтверждения.')
        } catch (err) {
            const data = err.response?.data
            setBookingError(
                Object.values(data?.errors || data || {}).flat().join(' ') || 'Ошибка бронирования'
            )
        }
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    const renderStars = (rating) => {
        return '⭐'.repeat(rating)
    }

    if (loading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" />
        </div>
    )

    if (!listing) return null

    return (
        <div className="row">
            <div className="col-md-8">
                {/* Фото */}
                {listing.images?.length > 0 ? (
                    <div className="mb-3">
                        {/* Главное фото */}
                        <img
                            src={listing.images[activeImage].image}
                            className="img-fluid rounded"
                            alt={listing.title}
                            style={{ width: '100%', height: '350px', objectFit: 'contain', backgraung: '#f8f9fa' }}
                        />

                        {/* Миниатюры */}
                        {listing.images.length > 1 && (
                            <div className="d-flex gap-2 mt-2 flex-wrap">
                                {listing.images.map((img, i) => (
                                    <img
                                        key={i}
                                        src={img.image}
                                        alt={`фото ${i + 1}`}
                                        onClick={() => setActiveImage(i)}
                                        style={{
                                            width: '80px',
                                            height: '60px',
                                            objectFit: 'cover',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            border: activeImage === i
                                                ? '3px solid #0d6efd'
                                                : '3px solid transparent',
                                            opacity: activeImage === i ? 1 : 0.7,
                                            transition: 'all 0.2s'
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Счётчик */}
                        <small className="text-muted">
                            {activeImage + 1} / {listing.images.length}
                        </small>
                    </div>
                ) : (
                    <div
                        className="bg-secondary rounded mb-3 d-flex align-items-center justify-content-center"
                        style={{ height: '350px' }}
                    >
                        <span className="text-white" style={{ fontSize: '80px' }}>🏠</span>
                    </div>
                )}

                <h3>{listing.title}</h3>
                <p className="text-muted">
                    📍 {listing.city} {listing.district && `· ${listing.district}`}
                    &nbsp;·&nbsp; 👁 {listing.view_count} просмотров
                    &nbsp;·&nbsp; ⭐ {listing.avg_rating > 0 ? listing.avg_rating.toFixed(1) : 'Нет рейтинга'}
                </p>
                <p>{listing.description}</p>
                <div className="d-flex gap-3 mb-4">
                    <span className="badge bg-secondary fs-6">{listing.rooms} комн.</span>
                    <span className="badge bg-info fs-6">{listing.property_type}</span>
                    <span className="badge bg-success fs-6">€{listing.price_per_night}/ночь</span>
                </div>

                {/* Отзывы */}
                <div className="mt-4">
                    <h5 className="mb-3">
                        Отзывы
                        {reviews.length > 0 && (
                            <span className="badge bg-primary ms-2">{reviews.length}</span>
                        )}
                    </h5>

                    {reviews.length === 0 ? (
                        <div className="text-muted py-3 text-center border rounded">
                            <p className="mb-0">😊 Отзывов пока нет</p>
                            <small>Будьте первым кто оставит отзыв!</small>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {reviews.map(review => (
                                <div key={review.id} className="card shadow-sm">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                        <span className="fw-bold">
                          👤 {review.author_name}
                        </span>
                                                <span className="ms-2 text-warning">
                          {renderStars(review.rating)}
                        </span>
                                            </div>
                                            <small className="text-muted">
                                                {formatDate(review.created_at)}
                                            </small>
                                        </div>
                                        <p className="mt-2 mb-0 text-secondary">
                                            {review.comment}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Бронирование */}
            <div className="col-md-4">
                <div className="card shadow-sm sticky-top" style={{ top: '80px' }}>
                    <div className="card-body">
                        <h5>€{listing.price_per_night} / ночь</h5>
                        {user?.role === 'tenant' ? (
                            <form onSubmit={handleBook}>
                                <div className="mb-3">
                                    <label className="form-label">Заезд</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={booking.check_in}
                                        onChange={e => setBooking({...booking, check_in: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Выезд</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={booking.check_out}
                                        onChange={e => setBooking({...booking, check_out: e.target.value})}
                                        required
                                    />
                                </div>
                                {bookingMsg && (
                                    <div className="alert alert-success">{bookingMsg}</div>
                                )}
                                {bookingError && (
                                    <div className="alert alert-danger">{bookingError}</div>
                                )}
                                <button type="submit" className="btn btn-primary w-100">
                                    Забронировать
                                </button>
                            </form>
                        ) : !user ? (
                            <p className="text-muted">
                                <a href="/login">Войдите</a> чтобы забронировать
                            </p>
                        ) : (
                            <p className="text-muted">Арендодатели не могут бронировать</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
