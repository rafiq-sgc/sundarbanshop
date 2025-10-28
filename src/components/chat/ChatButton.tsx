'use client'

import { useChat } from '@/store/chat-context'
import { MessageCircle, X } from 'lucide-react'

export default function ChatButton() {
  const { isOpen, setIsOpen, unreadCount } = useChat()

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-full shadow-2xl hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-110 group"
      aria-label="Chat with support"
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <>
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </>
      )}
    </button>
  )
}

