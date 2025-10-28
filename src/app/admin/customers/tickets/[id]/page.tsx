'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { ArrowLeft, Send, User, Clock, Tag, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ticket, setTicket] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchTicket()
  }, [params.id])

  const fetchTicket = async () => {
    setLoading(true)
    try {
      // Mock data
      const mockTicket = {
        _id: params.id,
        ticketNumber: 'TCK-001',
        customer: { name: 'John Doe', email: 'john@example.com' },
        subject: 'Order delivery issue',
        description: 'I haven\'t received my order yet. The tracking shows it was delivered but I don\'t have it.',
        status: 'open',
        priority: 'high',
        category: 'delivery',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        messages: [
          {
            id: '1',
            sender: 'John Doe',
            message: 'I haven\'t received my order yet. The tracking shows it was delivered but I don\'t have it.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            isAdmin: false
          },
          {
            id: '2',
            sender: 'Support Team',
            message: 'We apologize for the inconvenience. Let me check the delivery status for you.',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            isAdmin: true
          }
        ]
      }
      setTicket(mockTicket)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!reply.trim()) return
    setSending(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setReply('')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/admin/customers/tickets">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tickets
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{ticket.subject}</h1>
              <p className="text-gray-600 mt-2">Ticket #{ticket.ticketNumber}</p>
            </div>
            <Select
              value={ticket.status}
              onValueChange={(value) => setTicket({...ticket, status: value})}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ticket.messages.map((msg: any) => (
                    <div key={msg.id} className={`p-4 rounded-lg ${msg.isAdmin ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{msg.sender}</p>
                        <p className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</p>
                      </div>
                      <p className="text-sm text-gray-700">{msg.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reply Box */}
            <Card>
              <CardHeader>
                <CardTitle>Reply to Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={5}
                    placeholder="Type your reply here..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!reply.trim() || sending}
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Status</p>
                    <Badge variant={
                      ticket.status === 'open' ? 'destructive' :
                      ticket.status === 'in-progress' ? 'default' :
                      ticket.status === 'resolved' ? 'default' :
                      'secondary'
                    } className="mt-1">
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-500">Priority</p>
                    <Badge variant={
                      ticket.priority === 'high' ? 'destructive' :
                      ticket.priority === 'medium' ? 'secondary' :
                      'outline'
                    } className="mt-1">
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-medium text-gray-900 capitalize">{ticket.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium text-gray-900">{new Date(ticket.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-gray-900">{ticket.customer.name}</p>
                  <p className="text-gray-600">{ticket.customer.email}</p>
                  <Button asChild variant="link" size="sm" className="p-0 h-auto">
                    <Link href={`/admin/customers/${ticket.customer.id}`}>
                      View Customer Profile →
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

