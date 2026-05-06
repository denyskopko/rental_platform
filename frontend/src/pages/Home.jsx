import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import ListingCard from '../components/ListingCard'

export default function Home() {
    const [popular, setPopular] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/chat/analytics/popular-listings/')
            .then(res => {
                const data = res.data.results ?? res.data
                setPopular(Array.isArray(data) ? data : [])
            })
            .catch(() => setPopular([]))
            .finally(() => setLoading(false))
    }, [])

    return (
        <div>
            {/* Hero */}
            <div className="p-5 mb-4 bg-primary text-white rounded-3 text-center">
                <h1 className="display-5 fw-bold">Найди жильё в Германии</h1>
                <p className="fs-5">Квартиры, дома, студии — по всей Германии</p>
                <Link to="/listings" className="btn btn-light btn-lg mt-2">
                    Смотреть объявления
                </Link>
            </div>

            {/* Популярные объявления */}
            <h4 className="mb-3">🔥 Популярные объявления</h4>
            {loading ? (
                <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status" />
                </div>
            ) : popular.length === 0 ? (
                <p className="text-muted">Пока нет объявлений</p>
            ) : (
                <div className="row g-3">
                    {popular.map(listing => (
                        <div className="col-md-4" key={listing.id}>
                            <ListingCard listing={listing} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}