import { Link } from 'react-router-dom'

export default function NotFound() {
    return (
        <div className="text-center py-5">
            <h1 className="display-1 fw-bold text-primary">404</h1>
            <h4 className="mb-3">Страница не найдена</h4>
            <p className="text-muted mb-4">
                Страница которую вы ищете не существует или была удалена
            </p>
            <Link to="/" className="btn btn-primary">
                На главную
            </Link>
        </div>
    )
}