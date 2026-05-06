import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const PROPERTY_TYPES = [
    { value: 'apartment', label: 'Квартира' },
    { value: 'house',     label: 'Дом' },
    { value: 'studio',    label: 'Студия' },
    { value: 'room',      label: 'Комната' },
]

export default function CreateListing() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { id } = useParams()  // если есть id — режим редактирования
    const isEdit = Boolean(id)

    const [loading, setLoading] = useState(false)
    const [fetchLoading, setFetchLoading] = useState(isEdit)
    const [error, setError] = useState('')
    const [images, setImages] = useState([])
    const [form, setForm] = useState({
        title:           '',
        description:     '',
        city:            '',
        district:        '',
        property_type:   'apartment',
        price_per_night: '',
        rooms:           '',
    })

    // загружаем данные если редактирование
    useEffect(() => {
        if (isEdit) {
            api.get(`/listings/${id}/`)
                .then(res => {
                    const d = res.data
                    setForm({
                        title:           d.title,
                        description:     d.description,
                        city:            d.city,
                        district:        d.district || '',
                        property_type:   d.property_type,
                        price_per_night: d.price_per_night,
                        rooms:           d.rooms,
                    })
                })
                .catch(() => navigate('/my-listings'))
                .finally(() => setFetchLoading(false))
        }
    }, [id])

    if (!user || user.role !== 'landlord') {
        return (
            <div className="text-center py-5">
                <p className="text-muted">Доступно только арендодателям</p>
            </div>
        )
    }

    if (fetchLoading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" />
        </div>
    )

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleImages = (e) => {
        setImages([...e.target.files])
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const formData = new FormData()
            Object.entries(form).forEach(([key, val]) => {
                formData.append(key, val)
            })
            images.forEach(img => {
                formData.append('uploaded_images', img)
            })

            if (isEdit) {
                await api.patch(`/listings/${id}/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            } else {
                await api.post('/listings/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
            }

            navigate('/my-listings')
        } catch (err) {
            const data = err.response?.data
            if (data?.errors) {
                const messages = Object.values(data.errors).flat().join(' ')
                setError(messages)
            } else {
                setError('Ошибка сохранения объявления')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="row justify-content-center">
            <div className="col-md-8">
                <div className="card shadow-sm">
                    <div className="card-body p-4">
                        <h4 className="mb-4">
                            {isEdit ? '✏️ Редактировать объявление' : '➕ Новое объявление'}
                        </h4>

                        {error && <div className="alert alert-danger">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Заголовок *</label>
                                <input
                                    type="text"
                                    name="title"
                                    className="form-control"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="Уютная квартира в центре Берлина"
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Описание *</label>
                                <textarea
                                    name="description"
                                    className="form-control"
                                    rows={4}
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Подробное описание жилья..."
                                    required
                                />
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label">Город *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        className="form-control"
                                        value={form.city}
                                        onChange={handleChange}
                                        placeholder="Berlin"
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Район</label>
                                    <input
                                        type="text"
                                        name="district"
                                        className="form-control"
                                        value={form.district}
                                        onChange={handleChange}
                                        placeholder="Mitte"
                                    />
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label">Тип жилья *</label>
                                    <select
                                        name="property_type"
                                        className="form-select"
                                        value={form.property_type}
                                        onChange={handleChange}
                                    >
                                        {PROPERTY_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Количество комнат *</label>
                                    <input
                                        type="number"
                                        name="rooms"
                                        className="form-control"
                                        value={form.rooms}
                                        onChange={handleChange}
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Цена за ночь (€) *</label>
                                <div className="input-group">
                                    <span className="input-group-text">€</span>
                                    <input
                                        type="number"
                                        name="price_per_night"
                                        className="form-control"
                                        value={form.price_per_night}
                                        onChange={handleChange}
                                        min="1"
                                        step="0.01"
                                        placeholder="85.00"
                                        required
                                    />
                                    <span className="input-group-text">/ночь</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label">
                                    {isEdit ? 'Новые фотографии' : 'Фотографии'}
                                </label>
                                <input
                                    type="file"
                                    className="form-control"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImages}
                                />
                                <small className="text-muted">
                                    Можно выбрать несколько фото
                                </small>
                                {images.length > 0 && (
                                    <div className="d-flex gap-2 mt-2 flex-wrap">
                                        {images.map((img, i) => (
                                            <img
                                                key={i}
                                                src={URL.createObjectURL(img)}
                                                alt={`preview-${i}`}
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            {isEdit ? 'Сохраняем...' : 'Создаём...'}
                                        </>
                                    ) : (
                                        isEdit ? 'Сохранить изменения' : 'Создать объявление'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => navigate('/my-listings')}
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}