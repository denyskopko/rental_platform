import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function ChatPanel({ isOpen, onClose }) {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [sessionId, setSessionId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [searching, setSearching] = useState(false)

    const sendMessage = async () => {
        if (!input.trim() || loading) return
        if (!user) {
            alert('Войдите чтобы использовать чат')
            return
        }

        const userMsg = { role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const body = { message: input }
            if (sessionId) body.session_id = sessionId

            const res = await api.post('/chat/message/', body)
            setSessionId(res.data.session_id)
            setMessages(prev => [...prev, {
                role: 'model',
                content: res.data.reply
            }])
        } catch (err) {
            console.log('Ошибка:', err.response?.data)
            setMessages(prev => [...prev, {
                role: 'model',
                content: 'Ошибка соединения. Попробуй снова.'
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async () => {
        if (!sessionId) return
        setSearching(true)
        try {
            // извлекаем параметры из диалога
            await api.post('/chat/extract/', { session_id: sessionId })
            // ищем объявления
            const res = await api.post('/chat/search/', { session_id: sessionId })
            const count = res.data.count
            const params = res.data.params_used

            setMessages(prev => [...prev, {
                role: 'model',
                content: count > 0
                    ? `Нашёл ${count} объявлений! Перехожу к результатам...`
                    : 'К сожалению ничего не найдено. Попробуй изменить критерии.'
            }])

            if (count > 0) {
                // формируем параметры для страницы listings
                const query = new URLSearchParams()
                if (params.city)          query.set('city', params.city)
                if (params.price_min)     query.set('price_min', params.price_min)
                if (params.price_max)     query.set('price_max', params.price_max)
                if (params.rooms_min)     query.set('rooms_min', params.rooms_min)
                if (params.rooms_max)     query.set('rooms_max', params.rooms_max)
                if (params.property_type) query.set('property_type', params.property_type)
                if (params.district)      query.set('district', params.district)

                // через 1.5 секунды переходим на страницу с фильтрами
                setTimeout(() => {
                    navigate(`/listings?${query.toString()}`)
                    onClose()
                }, 1500)
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'model',
                content: 'Не удалось выполнить поиск. Попробуй снова.'
            }])
        } finally {
            setSearching(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const handleReset = () => {
        setMessages([])
        setSessionId(null)
        setInput('')
    }

    return (
        <div className={`chat-panel ${isOpen ? 'open' : ''}`}>

            {/* Шапка */}
            <div className="d-flex align-items-center justify-content-between p-3 bg-primary text-white">
                <span className="fw-bold">💬 AI Помощник</span>
                <div className="d-flex gap-2">
                    {messages.length > 0 && (
                        <button
                            className="btn btn-sm btn-outline-light"
                            onClick={handleReset}
                            title="Новый диалог"
                        >
                            🔄
                        </button>
                    )}
                    <button
                        className="btn btn-sm btn-outline-light"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Сообщения */}
            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="text-center text-muted mt-4 px-3">
                        <p className="fs-5">👋 Привет!</p>
                        <p className="small">
                            Я помогу найти жильё в Германии.
                            Расскажи что ищешь — город, даты, бюджет, количество комнат.
                        </p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className={`chat-bubble ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {loading && (
                    <div className="chat-bubble model">
                        <span className="spinner-border spinner-border-sm me-2" />
                        Думаю...
                    </div>
                )}
            </div>

            {/* Кнопка поиска — появляется после 4 сообщений */}
            {sessionId && messages.length >= 4 && (
                <div className="px-3 pb-2">
                    <button
                        className="btn btn-success w-100 btn-sm"
                        onClick={handleSearch}
                        disabled={searching}
                    >
                        {searching
                            ? <><span className="spinner-border spinner-border-sm me-2" />Ищем...</>
                            : '🔍 Найти объявления по параметрам'
                        }
                    </button>
                </div>
            )}

            {/* Ввод */}
            <div className="p-3 border-top">
                <div className="input-group">
          <textarea
              className="form-control"
              rows={2}
              placeholder="Напиши сообщение..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
          />
                    <button
                        className="btn btn-primary"
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                    >
                        ➤
                    </button>
                </div>
                <small className="text-muted">Enter — отправить · Shift+Enter — новая строка</small>
            </div>
        </div>
    )
}