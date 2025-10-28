'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { chatService } from '@/services/chat.service'
import toast from 'react-hot-toast'

export interface Message {
  id: string
  conversationId: string
  sender: 'customer' | 'admin'
  senderName: string
  senderAvatar?: string
  message: string
  timestamp: Date
  read: boolean
  attachments?: string[]
}

export interface Conversation {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  customerAvatar?: string
  status: 'active' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  subject: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  assignedTo?: string
  messages: Message[]
  tags?: string[]
}

interface ChatContextType {
  conversations: Conversation[]
  activeConversation: Conversation | null
  unreadCount: number
  isOpen: boolean
  loading: boolean
  setIsOpen: (open: boolean) => void
  setActiveConversation: (conversation: Conversation | null) => void
  sendMessage: (conversationId: string, message: string) => Promise<void>
  createConversation: (customerData: { name?: string; email?: string; subject: string; message: string }) => Promise<string>
  markAsRead: (conversationId: string) => Promise<void>
  updateConversationStatus: (conversationId: string, status: 'active' | 'pending' | 'resolved' | 'closed') => Promise<void>
  assignConversation: (conversationId: string, adminName: string) => Promise<void>
  refreshConversations: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const activeConversationRef = useRef<Conversation | null>(null)
  
  // Keep ref in sync with state
  useEffect(() => {
    activeConversationRef.current = activeConversation
  }, [activeConversation])

  const refreshConversations = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!session) {
      return
    }

    try {
      const result = await chatService.getConversations()
      if (result.success && result.data) {
        setConversations(result.data)
        
        // Update active conversation if it exists - CRITICAL for real-time updates
        const currentActive = activeConversationRef.current
        if (currentActive) {
          const updated = result.data.find((c: Conversation) => c.id === currentActive.id)
          if (updated) {
            // Check if messages actually changed to avoid unnecessary re-renders
            const currentMessageCount = currentActive.messages.length
            const newMessageCount = updated.messages.length
            
            if (newMessageCount !== currentMessageCount || 
                JSON.stringify(updated.messages) !== JSON.stringify(currentActive.messages)) {
              
              // Deep clone to force re-render and show new messages in real-time
              setActiveConversation({
                ...updated,
                messages: [...updated.messages] // Force new array reference
              })
            }
          }
        }
      } else if (result.message === 'Unauthorized') {
        // Silently handle unauthorized - don't redirect automatically
        console.log('Unauthorized: User not authenticated')
      }
    } catch (error) {
      console.error('Error refreshing conversations:', error)
    }
  }, [session])

  // Fetch conversations on mount and when session changes
  useEffect(() => {
    if (session) {
      refreshConversations()
    }
  }, [session, refreshConversations])

  // Poll for new messages only when chat is open AND user is authenticated
  useEffect(() => {
    if (!session || !isOpen) {
      return
    }
    
    // Poll for new messages every 10 seconds when chat is open (reduced from 5s)
    const interval = setInterval(() => {
      refreshConversations()
    }, 10000)

    return () => clearInterval(interval)
  }, [session, isOpen, refreshConversations])

  // Calculate unread count
  useEffect(() => {
    const total = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
    setUnreadCount(total)
  }, [conversations])

  const sendMessage = async (conversationId: string, message: string) => {
    try {
      setLoading(true)
      const result = await chatService.sendMessage(conversationId, message)
      
      if (result.success && result.data) {
        // Update conversations list
        setConversations(prev => prev.map(conv =>
          conv.id === conversationId ? result.data : conv
        ))
        
        // Update active conversation with deep clone to force re-render
        if (activeConversation?.id === conversationId) {
          setActiveConversation({
            ...result.data,
            messages: [...result.data.messages] // Force new array reference
          })
        }
        
        toast.success('Message sent')
        
        // Refresh after sending message to get latest updates
        setTimeout(() => {
          refreshConversations()
        }, 1000)
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error(error.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const createConversation = async (customerData: { 
    name?: string
    email?: string
    subject: string
    message: string 
  }): Promise<string> => {
    try {
      setLoading(true)
      const result = await chatService.createConversation({
        subject: customerData.subject,
        message: customerData.message,
        customerName: customerData.name,
        customerEmail: customerData.email
      })
      
      if (result.success && result.data) {
        setConversations(prev => [result.data, ...prev])
        setActiveConversation(result.data)
        toast.success('Conversation created')
        return result.data.id
      }
      
      throw new Error('Failed to create conversation')
    } catch (error: any) {
      console.error('Error creating conversation:', error)
      toast.error(error.message || 'Failed to create conversation')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (conversationId: string) => {
    try {
      // Only mark as read if there are unread messages
      const conversation = conversations.find(c => c.id === conversationId)
      if (!conversation || conversation.unreadCount === 0) {
        return // No need to mark as read
      }

      await chatService.markAsRead(conversationId)
      
      // Update local state
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            unreadCount: 0,
            messages: conv.messages.map(msg => ({ ...msg, read: true }))
          }
        }
        return conv
      }))
      
      // Update active conversation
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => prev ? {
          ...prev,
          unreadCount: 0,
          messages: prev.messages.map(msg => ({ ...msg, read: true }))
        } : null)
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const updateConversationStatus = async (
    conversationId: string, 
    status: 'active' | 'pending' | 'resolved' | 'closed'
  ) => {
    try {
      const result = await chatService.updateConversation(conversationId, { status })
      
      if (result.success) {
        setConversations(prev => prev.map(conv =>
          conv.id === conversationId ? { ...conv, status } : conv
        ))
        
        if (activeConversation?.id === conversationId) {
          setActiveConversation(prev => prev ? { ...prev, status } : null)
        }
        
        toast.success('Status updated')
      }
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error(error.message || 'Failed to update status')
    }
  }

  const assignConversation = async (conversationId: string, adminName: string) => {
    try {
      const result = await chatService.updateConversation(conversationId, { 
        assignedTo: adminName || undefined 
      })
      
      if (result.success) {
        setConversations(prev => prev.map(conv =>
          conv.id === conversationId ? { ...conv, assignedTo: adminName } : conv
        ))
        
        if (activeConversation?.id === conversationId) {
          setActiveConversation(prev => prev ? { ...prev, assignedTo: adminName } : null)
        }
        
        toast.success('Assignment updated')
      }
    } catch (error: any) {
      console.error('Error assigning conversation:', error)
      toast.error(error.message || 'Failed to assign conversation')
    }
  }

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversation,
      unreadCount,
      isOpen,
      loading,
      setIsOpen,
      setActiveConversation,
      sendMessage,
      createConversation,
      markAsRead,
      updateConversationStatus,
      assignConversation,
      refreshConversations
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

