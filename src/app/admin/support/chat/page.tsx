'use client'

import { useState, useRef, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { useChat } from '@/store/chat-context'
import {
  Search,
  Send,
  Paperclip,
  User,
  Clock,
  Check,
  CheckCheck,
  Info,
  Archive,
  Star,
  AlertCircle,
  MessageSquare,
  X,
  ArrowLeft
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AdminChatPage() {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    sendMessage,
    markAsRead,
    updateConversationStatus,
    assignConversation
  } = useChat()

  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'resolved'>('all')
  const [showInfo, setShowInfo] = useState(false) // Default to false on mobile
  const [showConversationsList, setShowConversationsList] = useState(true) // Toggle for mobile
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const markedAsReadRef = useRef<Set<string>>(new Set()) // Track which conversations we've marked as read

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages])

  useEffect(() => {
    if (activeConversation && !markedAsReadRef.current.has(activeConversation.id)) {
      markAsRead(activeConversation.id)
      markedAsReadRef.current.add(activeConversation.id)
    }
  }, [activeConversation, markAsRead])

  const handleSendMessage = async () => {
    if (!message.trim() || !activeConversation) return

    await sendMessage(activeConversation.id, message.trim())
    setMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const messageDate = new Date(date)
    const diff = now.getTime() - messageDate.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return messageDate.toLocaleDateString()
  }

  const formatMessageTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'pending': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-4rem)] flex bg-gray-50">
        {/* Conversations List */}
        <div className={`${
          showConversationsList ? 'block' : 'hidden'
        } lg:block w-full lg:w-96 bg-white border-r border-gray-200 flex flex-col absolute lg:relative z-10 h-full`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Live Chat Support</h1>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'active', 'pending', 'resolved'].map((status) => (
                <Button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-sm">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConversation(conv)
                    setShowConversationsList(false) // Hide list on mobile when conversation selected
                  }}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                    activeConversation?.id === conv.id
                      ? 'bg-green-50 border-l-4 border-l-green-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      {conv.customerAvatar ? (
                        <Image
                          src={conv.customerAvatar}
                          alt={conv.customerName}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-green-600" />
                        </div>
                      )}
                      {conv.status === 'active' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{conv.customerName}</h3>
                        <span className="text-xs text-gray-500">{formatTime(conv.lastMessageTime)}</span>
                      </div>
                      
                      <p className="text-sm font-medium text-gray-700 mb-1 truncate">{conv.subject}</p>
                      <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusVariant(conv.status)}>
                            {conv.status}
                          </Badge>
                          <Badge variant={getPriorityVariant(conv.priority)}>
                            {conv.priority}
                          </Badge>
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge className="bg-green-600 text-white">{conv.unreadCount}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <Card className="border-b rounded-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Back button for mobile */}
                  <button
                    onClick={() => setShowConversationsList(true)}
                    className="lg:hidden p-2 hover:bg-gray-100 rounded-lg mr-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center space-x-3 flex-1">
                    {activeConversation.customerAvatar ? (
                      <Image
                        src={activeConversation.customerAvatar}
                        alt={activeConversation.customerName}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-7 h-7 text-green-600" />
                      </div>
                    )}
                    <div>
                      <h2 className="font-semibold text-gray-900">{activeConversation.customerName}</h2>
                      <p className="text-sm text-gray-500">{activeConversation.customerEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Select
                      value={activeConversation.status}
                      onValueChange={(value) => updateConversationStatus(activeConversation.id, value as any)}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInfo(!showInfo)}
                    >
                      <Info className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex-1 flex">
              {/* Messages */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {activeConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-[70%] ${msg.sender === 'admin' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {msg.sender === 'customer' && (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-green-600" />
                          </div>
                        )}
                        
                        <div>
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              msg.sender === 'admin'
                                ? 'bg-green-600 text-white rounded-br-none'
                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.message}</p>
                          </div>
                          
                          <div className={`flex items-center mt-1 space-x-2 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-gray-500">{formatMessageTime(msg.timestamp)}</span>
                            {msg.sender === 'admin' && (
                              msg.read ? (
                                <CheckCheck className="w-3 h-3 text-green-500" />
                              ) : (
                                <Check className="w-3 h-3 text-gray-400" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <Card className="border-t rounded-none">
                  <CardContent className="p-4">
                    <div className="flex items-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      
                      <div className="flex-1">
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        />
                      </div>
                      
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        size="lg"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Avg response time: 2 min</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Info Sidebar */}
              {showInfo && (
                <Card className="hidden md:block w-80 border-l rounded-none overflow-y-auto">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Conversation Details</h3>

                    <div className="space-y-4">
                      {/* Customer Info */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Customer</h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">Name:</span> {activeConversation.customerName}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Email:</span> {activeConversation.customerEmail}
                          </p>
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Subject</h4>
                        <p className="text-sm text-gray-600">{activeConversation.subject}</p>
                      </div>

                      {/* Priority */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Priority</h4>
                        <Select value={activeConversation.priority}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Assigned To */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned To</h4>
                        <Select
                          value={activeConversation.assignedTo || 'unassigned'}
                          onValueChange={(value) => assignConversation(activeConversation.id, value === 'unassigned' ? '' : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            <SelectItem value="Support Agent 1">Support Agent 1</SelectItem>
                            <SelectItem value="Support Agent 2">Support Agent 2</SelectItem>
                            <SelectItem value="Support Agent 3">Support Agent 3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Tags */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {activeConversation.tags?.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                          <Button variant="outline" size="sm">
                            + Add tag
                          </Button>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h4>
                        <div className="space-y-2">
                          <Button variant="ghost" className="w-full justify-start" size="sm">
                            <Star className="w-4 h-4 mr-2" />
                            Mark as Important
                          </Button>
                          <Button variant="ghost" className="w-full justify-start" size="sm">
                            <Archive className="w-4 h-4 mr-2" />
                            Archive Conversation
                          </Button>
                          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700" size="sm">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Report Issue
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
