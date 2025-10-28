'use client'

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

interface ApiKey {
  _id: string
  name: string
  key: string
  service: string
  status: 'active' | 'inactive' | 'revoked'
  lastUsed?: string
  createdAt: string
  expiresAt?: string
  permissions: string[]
}

interface Integration {
  _id: string
  name: string
  description: string
  category: 'payment' | 'shipping' | 'marketing' | 'analytics' | 'other'
  isConnected: boolean
  logo?: string
  config?: any
}

export default function IntegrationsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      _id: '1',
      name: 'Production API',
      key: 'dfdfdfdfdfdfdf',
      service: 'Main Website',
      status: 'active',
      lastUsed: new Date().toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      permissions: ['read', 'write', 'delete']
    },
    {
      _id: '2',
      name: 'Mobile App API',
      key: 'dfdfdfdfdf',
      service: 'iOS & Android App',
      status: 'active',
      lastUsed: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      permissions: ['read']
    },
    {
      _id: '3',
      name: 'Test Environment',
      key: 'sk_test_yz567abc890def123ghi456',
      service: 'Development',
      status: 'inactive',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      permissions: ['read', 'write']
    }
  ])

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      _id: '1',
      name: 'Stripe',
      description: 'Accept payments online',
      category: 'payment',
      isConnected: true
    },
    {
      _id: '2',
      name: 'PayPal',
      description: 'PayPal payment gateway',
      category: 'payment',
      isConnected: true
    },
    {
      _id: '3',
      name: 'Mailchimp',
      description: 'Email marketing platform',
      category: 'marketing',
      isConnected: false
    },
    {
      _id: '4',
      name: 'Google Analytics',
      description: 'Track website traffic',
      category: 'analytics',
      isConnected: true
    },
    {
      _id: '5',
      name: 'Shippo',
      description: 'Shipping label API',
      category: 'shipping',
      isConnected: false
    }
  ])

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev)
      if (next.has(keyId)) {
        next.delete(keyId)
      } else {
        next.add(keyId)
      }
      return next
    })
  }

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('API key copied to clipboard')
  }

  const deleteApiKey = (keyId: string) => {
    if (confirm('Are you sure you want to delete this API key?')) {
      setApiKeys(apiKeys.filter(k => k._id !== keyId))
      toast.success('API key deleted')
    }
  }

  const toggleIntegration = (integrationId: string) => {
    setIntegrations(integrations.map(i =>
      i._id === integrationId ? { ...i, isConnected: !i.isConnected } : i
    ))
    toast.success('Integration updated')
  }

  const maskKey = (key: string) => {
    return key.substring(0, 12) + '••••••••••••••••' + key.substring(key.length - 4)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations & API Keys</h1>
          <p className="text-gray-600 mt-1">Manage third-party integrations and API access</p>
        </div>

        {/* API Keys Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Generate New Key
            </Button>
          </div>

          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey._id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Key className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                          <p className="text-sm text-gray-500">{apiKey.service}</p>
                        </div>
                        <Badge variant={apiKey.status === 'active' ? 'default' : 'secondary'}>
                          {apiKey.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 font-mono text-sm">
                        <code className="flex-1">
                          {visibleKeys.has(apiKey._id) ? apiKey.key : maskKey(apiKey.key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey._id)}
                        >
                          {visibleKeys.has(apiKey._id) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyApiKey(apiKey.key)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <span>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                          {apiKey.lastUsed && (
                            <span>Last used: {new Date(apiKey.lastUsed).toLocaleString()}</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {apiKey.permissions.map(perm => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteApiKey(apiKey._id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Integrations Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Available Integrations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <Card key={integration._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{integration.category}</Badge>
                      {integration.isConnected ? (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Connected
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <XCircle className="w-4 h-4" />
                          Not Connected
                        </div>
                      )}
                    </div>
                    
                    <Button
                      className="w-full"
                      variant={integration.isConnected ? 'outline' : 'default'}
                      onClick={() => toggleIntegration(integration._id)}
                    >
                      {integration.isConnected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
