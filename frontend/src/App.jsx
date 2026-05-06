import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ChatButton from './components/Chat/ChatButton'
import Home from './pages/Home'
import Listings from './pages/Listings'
import ListingDetail from './pages/ListingDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import MyListings from './pages/MyListings'
import CreateListing from './pages/CreateListing'
import NotFound from './pages/NotFound'

// защита роутов — только для авторизованных
function PrivateRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" />
        </div>
    )
    return user ? children : <Navigate to="/login" />
}

// защита роутов — только для landlord
function LandlordRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" />
        </div>
    )
    if (!user) return <Navigate to="/login" />
    if (user.role !== 'landlord') return <Navigate to="/" />
    return children
}

function App() {
    return (
        <>
            <Navbar />
            <div className="container mt-4">
                <Routes>
                    <Route path="/"                element={<Home />} />
                    <Route path="/listings"        element={<Listings />} />
                    <Route path="/listings/:id"    element={<ListingDetail />} />
                    <Route path="/login"           element={<Login />} />
                    <Route path="/register"        element={<Register />} />
                    <Route path="/profile"         element={
                        <PrivateRoute><Profile /></PrivateRoute>
                    } />
                    <Route path="/my-listings"     element={
                        <LandlordRoute><MyListings /></LandlordRoute>
                    } />
                    <Route path="/listings/create" element={
                        <LandlordRoute><CreateListing /></LandlordRoute>
                    } />
                    <Route path="/listings/:id/edit" element={
                        <LandlordRoute><CreateListing /></LandlordRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </div>
            <ChatButton />
        </>
    )
}

export default App
