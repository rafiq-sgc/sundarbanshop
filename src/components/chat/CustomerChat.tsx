'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useChat } from '@/store/chat-context'
import {
  X,
  Send,
  Paperclip,
  Smile,
  Minimize2,
  Maximize2,
  User,
  Clock,
  Check,
  CheckCheck,
  Loader2
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function CustomerChat() {
  const { data: session, status } = useSession()
  const { 
    isOpen, 
    setIsOpen, 
    activeConversation, 
    setActiveConversation,
    conversations, 
    sendMessage, 
    createConversation, 
    loading 
  } = useChat()
  const [message, setMessage] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [showNewChatForm, setShowNewChatForm] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    subject: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check if user has any conversations
  const userConversations = conversations.filter(conv => 
    session?.user?.email ? conv.customerEmail === session.user.email : false
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages])

  // Set user info if logged in
  useEffect(() => {
    if (session?.user) {
      setCustomerInfo({
        name: session.user.name || '',
        email: session.user.email || '',
        subject: ''
      })
    }
  }, [session])

  // Show active conversation or list for logged-in users
  useEffect(() => {
    if (status === 'authenticated' && userConversations.length > 0 && !activeConversation) {
      // Don't automatically select, let user choose
      setShowNewChatForm(false)
    } else if (status === 'authenticated' && userConversations.length === 0) {
      setShowNewChatForm(true)
    } else if (status === 'unauthenticated') {
      setShowNewChatForm(true)
    }
  }, [status, userConversations, activeConversation])

  const handleSendMessage = async () => {
    if (!message.trim()) return

    try {
      setIsSubmitting(true)

      if (!activeConversation) {
        // Create new conversation
        if (!customerInfo.subject) {
          toast.error('Please enter a subject')
          return
        }

        // For logged-in users, name and email come from session
        // For guests, they must provide them
        if (status !== 'authenticated') {
          if (!customerInfo.name || !customerInfo.email) {
            toast.error('Please fill in all required fields')
            return
          }
        }

        await createConversation({
          name: customerInfo.name,
          email: customerInfo.email,
          subject: customerInfo.subject,
          message: message.trim()
        })
      } else {
        // Send message in existing conversation
        await sendMessage(activeConversation.id, message.trim())
      }

      setMessage('')
      setCustomerInfo(prev => ({ ...prev, subject: '' }))
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (!isOpen) return null

  // Show conversation list for logged-in users with existing conversations
  const showConversationList = status === 'authenticated' && userConversations.length > 0 && !activeConversation && !showNewChatForm

  return (
    <div className={`fixed bottom-20 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
      isMinimized ? 'h-16' : 'h-[600px]'
    } w-96 max-w-[calc(100vw-3rem)]`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {activeConversation && (
            <button
              onClick={() => {
                setActiveConversation(null)
                setShowNewChatForm(false)
              }}
              className="p-1 hover:bg-green-500 rounded transition-colors mr-2"
            >
              ← Back
            </button>
          )}
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold">
              {activeConversation ? activeConversation.subject : 'Customer Support'}
            </h3>
            <p className="text-xs text-green-100">
              {status === 'authenticated' ? `Hi, ${session?.user?.name}` : 'We\'re here to help'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-green-500 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-green-500 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="h-[440px] overflow-y-auto p-4 bg-gray-50">
            {/* Show conversation list for logged-in users */}
            {showConversationList ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Your Conversations</h4>
                  <button
                    onClick={() => setShowNewChatForm(true)}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    + New Chat
                  </button>
                </div>
                
                {userConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:border-green-500 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h5 className="font-medium text-gray-900 text-sm">{conv.subject}</h5>
                      {conv.unreadCount > 0 && (
                        <span className="bg-green-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{conv.lastMessage}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        conv.status === 'active' ? 'bg-green-100 text-green-700' :
                        conv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {conv.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(conv.lastMessageTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : showNewChatForm && !activeConversation ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Start a Conversation</h4>
                  <p className="text-sm text-gray-600">Fill in the details below to chat with our support team</p>
                </div>

                {/* Only show name and email for guest users */}
                {status !== 'authenticated' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter your name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Show logged-in user info */}
                {status === 'authenticated' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Chatting as:</span> {session?.user?.name}
                    </p>
                    <p className="text-xs text-gray-600">{session?.user?.email}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    value={customerInfo.subject}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="What can we help you with?"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {activeConversation?.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${msg.sender === 'customer' ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          msg.sender === 'customer'
                            ? 'bg-green-600 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'
                        }`}
                      >
                        {msg.sender === 'admin' && (
                          <p className="text-xs font-medium mb-1 text-gray-600">{msg.senderName}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      <div className={`flex items-center mt-1 space-x-2 ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                        {msg.sender === 'customer' && (
                          msg.read ? (
                            <CheckCheck className="w-3 h-3 text-green-500" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-400" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={showNewChatForm ? "Type your message..." : "Type a message..."}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isSubmitting}
                className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

