import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import ChatPanel from './ChatPanel'

export default function ChatButton() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)

    // скрываем чат для арендодателей
    if (user?.role === 'landlord') return null

    return (
        <>
            <button
                className="chat-btn-float"
                onClick={() => setIsOpen(!isOpen)}
                title="AI помощник"
            >
                {isOpen ? '✕' : '💬'}
            </button>
            <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    )
}