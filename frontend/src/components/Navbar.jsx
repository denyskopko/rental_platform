import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const isActive = (path) => {
        return location.pathname === path ? 'nav-link active' : 'nav-link'
    }

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
            <div className="container">
                <Link className="navbar-brand fw-bold" to="/">
                    🏠 RentalPlatform
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link className={isActive('/')} to="/">Главная</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={isActive('/listings')} to="/listings">
                                Объявления
                            </Link>
                        </li>
                    </ul>

                    <ul className="navbar-nav">
                        {user ? (
                            <>
                                <li className="nav-item">
                  <span className="nav-link text-light">
                    👤 {user.first_name}
                      <span className="badge bg-warning text-dark ms-1">
                      {user.role === 'landlord' ? 'Арендодатель' : 'Арендатор'}
                    </span>
                  </span>
                                </li>
                                {user.role === 'landlord' && (
                                    <li className="nav-item">
                                        <Link className={isActive('/my-listings')} to="/my-listings">
                                            Мои объявления
                                        </Link>
                                    </li>
                                )}
                                <li className="nav-item">
                                    <Link className={isActive('/profile')} to="/profile">
                                        Профиль
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className="btn btn-outline-light btn-sm ms-2 mt-1"
                                        onClick={handleLogout}
                                    >
                                        Выйти
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className={isActive('/login')} to="/login">Войти</Link>
                                </li>
                                <li className="nav-item">
                                    <Link
                                        className="btn btn-light btn-sm ms-2 mt-1"
                                        to="/register"
                                    >
                                        Регистрация
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    )
}