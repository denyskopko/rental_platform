import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api/axios'
import ListingCard from '../components/ListingCard'
import Pagination from '../components/Pagination'

const PROPERTY_TYPES = [
    { value: '', label: 'Все типы' },
    { value: 'apartment', label: 'Квартира' },
    { value: 'house', label: 'Дом' },
    { value: 'studio', label: 'Студия' },
    { value: 'room', label: 'Комната' },
]

export default function Listings() {
    const location = useLocation()
    const urlParams = new URLSearchParams(location.search)

    const [listings, setListings] = useState([])
    const [loading, setLoading] = useState(true)
    const [count, setCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 12

    const [filters, setFilters] = useState({
        search:        urlParams.get('search')        || '',
        city:          urlParams.get('city')          || '',
        property_type: urlParams.get('property_type') || '',
        price_min:     urlParams.get('price_min')     || '',
        price_max:     urlParams.get('price_max')     || '',
        rooms_min:     urlParams.get('rooms_min')     || '',
        rooms_max:     urlParams.get('rooms_max')     || '',
        ordering:      '-created_at',
    })

    const fetchListings = async (currentFilters, page = 1) => {
        setLoading(true)
        try {
            const params = Object.fromEntries(
                Object.entries(currentFilters).filter(([, v]) => v !== '')
            )
            params.page = page

            const res = await api.get('/listings/', { params })
            setListings(res.data.results ?? [])
            setCount(res.data.count ?? 0)
        } catch {
            setListings([])
            setCount(0)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const newFilters = {
            search:        params.get('search')        || '',
            city:          params.get('city')          || '',
            property_type: params.get('property_type') || '',
            price_min:     params.get('price_min')     || '',
            price_max:     params.get('price_max')     || '',
            rooms_min:     params.get('rooms_min')     || '',
            rooms_max:     params.get('rooms_max')     || '',
            ordering:      '-created_at',
        }
        setFilters(newFilters)
        setCurrentPage(1)
        fetchListings(newFilters, 1)
    }, [location.search])

    const handleSearch = (e) => {
        e.preventDefault()
        setCurrentPage(1)
        fetchListings(filters, 1)
    }

    const handlePageChange = (page) => {
        setCurrentPage(page)
        fetchListings(filters, page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleReset = () => {
        const empty = {
            search: '', city: '', property_type: '',
            price_min: '', price_max: '',
            rooms_min: '', rooms_max: '',
            ordering: '-created_at',
        }
        setFilters(empty)
        setCurrentPage(1)
        fetchListings(empty, 1)
    }

    return (
        <div>
            <h4 className="mb-3">Объявления</h4>

            {/* Фильтры */}
            <div className="card mb-4 shadow-sm">
                <div className="card-body">
                    <form onSubmit={handleSearch}>
                        <div className="row g-2">
                            <div className="col-md-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Поиск..."
                                    value={filters.search}
                                    onChange={e => setFilters({...filters, search: e.target.value})}
                                />
                            </div>
                            <div className="col-md-2">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Город"
                                    value={filters.city}
                                    onChange={e => setFilters({...filters, city: e.target.value})}
                                />
                            </div>
                            <div className="col-md-2">
                                <select
                                    className="form-select"
                                    value={filters.property_type}
                                    onChange={e => setFilters({...filters, property_type: e.target.value})}
                                >
                                    {PROPERTY_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-1">
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="€ от"
                                    value={filters.price_min}
                                    onChange={e => setFilters({...filters, price_min: e.target.value})}
                                />
                            </div>
                            <div className="col-md-1">
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="€ до"
                                    value={filters.price_max}
                                    onChange={e => setFilters({...filters, price_max: e.target.value})}
                                />
                            </div>
                            <div className="col-md-1">
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Комн."
                                    value={filters.rooms_min}
                                    onChange={e => setFilters({...filters, rooms_min: e.target.value})}
                                />
                            </div>
                            <div className="col-md-2">
                                <select
                                    className="form-select"
                                    value={filters.ordering}
                                    onChange={e => setFilters({...filters, ordering: e.target.value})}
                                >
                                    <option value="-created_at">Новые</option>
                                    <option value="created_at">Старые</option>
                                    <option value="price_per_night">Цена ↑</option>
                                    <option value="-price_per_night">Цена ↓</option>
                                    <option value="-view_count">Популярные</option>
                                    <option value="-avg_rating">По рейтингу</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-2 d-flex gap-2">
                            <button type="submit" className="btn btn-primary">
                                Найти
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={handleReset}
                            >
                                Сбросить
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Активные фильтры из чата */}
            {location.search && (
                <div className="alert alert-info d-flex align-items-center mb-3">
                    <span>🤖 Результаты поиска от AI помощника</span>
                    <button
                        className="btn btn-sm btn-outline-info ms-auto"
                        onClick={handleReset}
                    >
                        Сбросить
                    </button>
                </div>
            )}

            {/* Результаты */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                </div>
            ) : listings.length === 0 ? (
                <div className="text-center py-5 text-muted">
                    <p className="fs-5">😔 Ничего не найдено</p>
                    <p>Попробуй изменить параметры поиска</p>
                    <button
                        className="btn btn-outline-primary"
                        onClick={handleReset}
                    >
                        Показать все объявления
                    </button>
                </div>
            ) : (
                <>
                    <p className="text-muted mb-3">
                        Найдено: <strong>{count}</strong> объявлений
                    </p>
                    <div className="row g-3">
                        {listings.map(listing => (
                            <div className="col-md-4" key={listing.id}>
                                <ListingCard listing={listing} />
                            </div>
                        ))}
                    </div>

                    <Pagination
                        count={count}
                        pageSize={PAGE_SIZE}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    )
}