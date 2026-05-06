import { Link } from 'react-router-dom'

const PROPERTY_LABELS = {
    apartment: 'Квартира',
    house: 'Дом',
    studio: 'Студия',
    room: 'Комната',
}

export default function ListingCard({ listing }) {
    return (
        <div className="card h-100 shadow-sm">
            {listing.main_image ? (
                <img
                    src={listing.main_image}
                    className="card-img-top"
                    alt={listing.title}
                    style={{ height: '180px', objectFit: 'cover' }}
                />
            ) : (
                <div
                    className="card-img-top bg-secondary d-flex align-items-center justify-content-center"
                    style={{ height: '180px' }}
                >
                    <span className="text-white fs-1">🏠</span>
                </div>
            )}
            <div className="card-body">
                <h6 className="card-title">{listing.title}</h6>
                <p className="text-muted small mb-1">
                    📍 {listing.city} {listing.district && `· ${listing.district}`}
                </p>
                <p className="text-muted small mb-2">
                    {PROPERTY_LABELS[listing.property_type]} · {listing.rooms} комн.
                </p>
                <div className="d-flex justify-content-between align-items-center">
          <span className="fw-bold text-primary">
            €{listing.price_per_night}/ночь
          </span>
                    <span className="text-warning small">
            ⭐ {listing.avg_rating > 0 ? listing.avg_rating.toFixed(1) : 'Нет'}
          </span>
                </div>
            </div>
            <div className="card-footer bg-white border-0">
                <Link
                    to={`/listings/${listing.id}`}
                    className="btn btn-outline-primary btn-sm w-100"
                >
                    Подробнее
                </Link>
            </div>
        </div>
    )
}