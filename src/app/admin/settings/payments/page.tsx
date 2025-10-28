'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CreditCard,
  Wallet,
  DollarSign,
  Save,
  Loader2,
  RotateCcw,
  AlertCircle,
  Smartphone,
  Banknote,
  Shield,
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  TestTube
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { paymentSettingsService, type PaymentSettings, type PaymentGateway } from '@/services/settings'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

export default function PaymentSettingsPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (isAuthorized) {
      fetchSettings()
    }
  }, [isAuthorized])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const result = await paymentSettingsService.getSettings()
      
      if (result.success && result.data) {
        setSettings(result.data)
      } else {
        toast.error(result.message || 'Failed to fetch settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      const result = await paymentSettingsService.updateSettings(settings)
      
      if (result.success) {
        toast.success('Payment settings saved successfully!')
        setHasChanges(false)
      } else {
        toast.error(result.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      const result = await paymentSettingsService.resetSettings()
      
      if (result.success && result.data) {
        toast.success('Settings reset to defaults!')
        setSettings(result.data)
        setHasChanges(false)
        setShowResetDialog(false)
      } else {
        toast.error(result.message || 'Failed to reset settings')
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error('Failed to reset settings')
    }
  }

  const updateGateway = (gatewayName: string, updates: Partial<PaymentGateway>) => {
    if (!settings) return

    const updatedGateways = settings.gateways.map(gateway =>
      gateway.name === gatewayName
        ? { ...gateway, ...updates, config: { ...gateway.config, ...updates.config } }
        : gateway
    )

    setSettings({ ...settings, gateways: updatedGateways })
    setHasChanges(true)
  }

  const toggleGateway = (gatewayName: string, enabled: boolean) => {
    updateGateway(gatewayName, { enabled })
  }

  const setDefaultGateway = (gatewayName: string) => {
    if (!settings) return

    const updatedGateways = settings.gateways.map(gateway => ({
      ...gateway,
      isDefault: gateway.name === gatewayName
    }))

    setSettings({ ...settings, gateways: updatedGateways })
    setHasChanges(true)
  }

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getGatewayIcon = (name: string) => {
    switch (name) {
      case 'bkash':
      case 'nagad':
      case 'rocket':
      case 'upay':
        return <Smartphone className="w-6 h-6" />
      case 'sslcommerz':
        return <CreditCard className="w-6 h-6" />
      case 'cod':
        return <Banknote className="w-6 h-6" />
      default:
        return <Wallet className="w-6 h-6" />
    }
  }

  const getGatewayColor = (name: string) => {
    switch (name) {
      case 'bkash':
        return 'bg-pink-100 text-pink-600'
      case 'nagad':
        return 'bg-orange-100 text-orange-600'
      case 'rocket':
        return 'bg-purple-100 text-purple-600'
      case 'sslcommerz':
        return 'bg-green-100 text-green-600'
      case 'cod':
        return 'bg-blue-100 text-blue-600'
      case 'upay':
        return 'bg-teal-100 text-teal-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading payment settings...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthorized || !settings) {
    return null
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Payment Settings</h1>
              <p className="text-muted-foreground mt-2">
                Configure payment gateways and methods for Bangladesh
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="default">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset all payment settings?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all payment settings to their default values.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>
                      Reset Settings
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                size="default"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  You have unsaved changes. Don't forget to save!
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* General Currency Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Currency Settings</CardTitle>
                  <CardDescription>Configure default currency for Bangladesh</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => {
                      setSettings({ ...settings, currency: value })
                      setHasChanges(true)
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BDT">BDT - Bangladeshi Taka</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Currency Symbol</Label>
                  <Input
                    className="mt-2"
                    value={settings.currencySymbol}
                    onChange={(e) => {
                      setSettings({ ...settings, currencySymbol: e.target.value })
                      setHasChanges(true)
                    }}
                    placeholder="৳"
                  />
                </div>

                <div>
                  <Label>Symbol Position</Label>
                  <Select
                    value={settings.currencyPosition}
                    onValueChange={(value: 'before' | 'after') => {
                      setSettings({ ...settings, currencyPosition: value })
                      setHasChanges(true)
                    }}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before (৳1,000)</SelectItem>
                      <SelectItem value="after">After (1,000৳)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Transaction Prefix</Label>
                  <Input
                    className="mt-2"
                    value={settings.transactionPrefix}
                    onChange={(e) => {
                      setSettings({ ...settings, transactionPrefix: e.target.value })
                      setHasChanges(true)
                    }}
                    placeholder="TXN-"
                  />
                  <p className="text-xs text-gray-500 mt-1">Example: TXN-20250122-001</p>
                </div>

                <div>
                  <Label>Invoice Prefix</Label>
                  <Input
                    className="mt-2"
                    value={settings.invoicePrefix}
                    onChange={(e) => {
                      setSettings({ ...settings, invoicePrefix: e.target.value })
                      setHasChanges(true)
                    }}
                    placeholder="INV-"
                  />
                  <p className="text-xs text-gray-500 mt-1">Example: INV-20250122-001</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Banking */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Smartphone className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <CardTitle>Mobile Banking (MFS)</CardTitle>
                  <CardDescription>
                    Configure mobile financial services for Bangladesh
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">Enable Mobile Banking</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to pay with bKash, Nagad, Rocket, Upay
                  </p>
                </div>
                <Switch
                  checked={settings.mobileBankingEnabled}
                  onCheckedChange={(checked) => {
                    setSettings({ ...settings, mobileBankingEnabled: checked })
                    setHasChanges(true)
                  }}
                />
              </div>

              {settings.mobileBankingEnabled && (
                <div>
                  <Label>Mobile Banking Note (Bengali)</Label>
                  <Textarea
                    className="mt-2"
                    value={settings.mobileBankingNote || ''}
                    onChange={(e) => {
                      setSettings({ ...settings, mobileBankingNote: e.target.value })
                      setHasChanges(true)
                    }}
                    placeholder="নগদ, বিকাশ, রকেট সব ধরনের মোবাইল ব্যাংকিং সুবিধা উপলব্ধ"
                    rows={2}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Gateways */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Wallet className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Payment Gateways</CardTitle>
                  <CardDescription>
                    Configure Bangladeshi payment methods
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {settings.gateways
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                  .map((gateway) => (
                  <AccordionItem key={gateway.name} value={gateway.name}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${getGatewayColor(gateway.name)}`}>
                            {getGatewayIcon(gateway.name)}
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{gateway.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                              {gateway.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {gateway.isDefault && (
                            <Badge variant="default" className="bg-green-600">Default</Badge>
                          )}
                          {gateway.enabled ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 space-y-6 bg-gray-50 rounded-lg">
                        {/* Enable/Disable */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-base">Enable {gateway.displayName}</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow customers to use this payment method
                            </p>
                          </div>
                          <Switch
                            checked={gateway.enabled}
                            onCheckedChange={(checked) => toggleGateway(gateway.name, checked)}
                          />
                        </div>

                        {/* Set as Default */}
                        {gateway.enabled && (
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-base">Set as Default</Label>
                              <p className="text-sm text-muted-foreground">
                                Pre-select this method at checkout
                              </p>
                            </div>
                            <Switch
                              checked={gateway.isDefault}
                              onCheckedChange={(checked) => {
                                if (checked) setDefaultGateway(gateway.name)
                              }}
                            />
                          </div>
                        )}

                        <Separator />

                        {/* Gateway-specific configuration */}
                        {gateway.name === 'bkash' && (
                          <div className="space-y-4">
                            <h4 className="font-medium text-sm">bKash Configuration</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>App Key</Label>
                                <div className="relative mt-2">
                                  <Input
                                    type={showSecrets['bkash-key'] ? 'text' : 'password'}
                                    value={gateway.config.bkashAppKey || ''}
                                    onChange={(e) => updateGateway(gateway.name, {
                                      config: { bkashAppKey: e.target.value }
                                    })}
                                    placeholder="Enter bKash App Key"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0"
                                    onClick={() => toggleSecretVisibility('bkash-key')}
                                  >
                                    {showSecrets['bkash-key'] ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <Label>App Secret</Label>
                                <div className="relative mt-2">
                                  <Input
                                    type={showSecrets['bkash-secret'] ? 'text' : 'password'}
                                    value={gateway.config.bkashAppSecret || ''}
                                    onChange={(e) => updateGateway(gateway.name, {
                                      config: { bkashAppSecret: e.target.value }
                                    })}
                                    placeholder="Enter bKash App Secret"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0"
                                    onClick={() => toggleSecretVisibility('bkash-secret')}
                                  >
                                    {showSecrets['bkash-secret'] ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <Label>Username</Label>
                                <Input
                                  className="mt-2"
                                  value={gateway.config.bkashUsername || ''}
                                  onChange={(e) => updateGateway(gateway.name, {
                                    config: { bkashUsername: e.target.value }
                                  })}
                                  placeholder="Enter bKash Username"
                                />
                              </div>

                              <div>
                                <Label>Password</Label>
                                <div className="relative mt-2">
                                  <Input
                                    type={showSecrets['bkash-password'] ? 'text' : 'password'}
                                    value={gateway.config.bkashPassword || ''}
                                    onChange={(e) => updateGateway(gateway.name, {
                                      config: { bkashPassword: e.target.value }
                                    })}
                                    placeholder="Enter bKash Password"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0"
                                    onClick={() => toggleSecretVisibility('bkash-password')}
                                  >
                                    {showSecrets['bkash-password'] ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              <div className="md:col-span-2">
                                <Label>Base URL</Label>
                                <Input
                                  className="mt-2"
                                  value={gateway.config.bkashBaseURL || ''}
                                  onChange={(e) => updateGateway(gateway.name, {
                                    config: { bkashBaseURL: e.target.value }
                                  })}
                                  placeholder="https://checkout.sandbox.bka.sh/v1.2.0-beta"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Use sandbox URL for testing, production URL for live
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {gateway.name === 'nagad' && (
                          <div className="space-y-4">
                            <h4 className="font-medium text-sm">Nagad Configuration</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Merchant ID</Label>
                                <Input
                                  className="mt-2"
                                  value={gateway.config.nagadMerchantId || ''}
                                  onChange={(e) => updateGateway(gateway.name, {
                                    config: { nagadMerchantId: e.target.value }
                                  })}
                                  placeholder="Enter Nagad Merchant ID"
                                />
                              </div>

                              <div>
                                <Label>Merchant Key</Label>
                                <div className="relative mt-2">
                                  <Input
                                    type={showSecrets['nagad-key'] ? 'text' : 'password'}
                                    value={gateway.config.nagadMerchantKey || ''}
                                    onChange={(e) => updateGateway(gateway.name, {
                                      config: { nagadMerchantKey: e.target.value }
                                    })}
                                    placeholder="Enter Nagad Merchant Key"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0"
                                    onClick={() => toggleSecretVisibility('nagad-key')}
                                  >
                                    {showSecrets['nagad-key'] ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              <div className="md:col-span-2">
                                <Label>Base URL</Label>
                                <Input
                                  className="mt-2"
                                  value={gateway.config.nagadBaseURL || ''}
                                  onChange={(e) => updateGateway(gateway.name, {
                                    config: { nagadBaseURL: e.target.value }
                                  })}
                                  placeholder="http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {gateway.name === 'sslcommerz' && (
                          <div className="space-y-4">
                            <h4 className="font-medium text-sm">SSLCommerz Configuration</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Store ID</Label>
                                <Input
                                  className="mt-2"
                                  value={gateway.config.sslcommerzStoreId || ''}
                                  onChange={(e) => updateGateway(gateway.name, {
                                    config: { sslcommerzStoreId: e.target.value }
                                  })}
                                  placeholder="Enter SSLCommerz Store ID"
                                />
                              </div>

                              <div>
                                <Label>Store Password</Label>
                                <div className="relative mt-2">
                                  <Input
                                    type={showSecrets['ssl-password'] ? 'text' : 'password'}
                                    value={gateway.config.sslcommerzStorePassword || ''}
                                    onChange={(e) => updateGateway(gateway.name, {
                                      config: { sslcommerzStorePassword: e.target.value }
                                    })}
                                    placeholder="Enter Store Password"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0"
                                    onClick={() => toggleSecretVisibility('ssl-password')}
                                  >
                                    {showSecrets['ssl-password'] ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              <div className="md:col-span-2">
                                <Label>Base URL</Label>
                                <Input
                                  className="mt-2"
                                  value={gateway.config.sslcommerzBaseURL || ''}
                                  onChange={(e) => updateGateway(gateway.name, {
                                    config: { sslcommerzBaseURL: e.target.value }
                                  })}
                                  placeholder="https://sandbox.sslcommerz.com"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {gateway.name === 'cod' && (
                          <div className="space-y-4">
                            <h4 className="font-medium text-sm">Cash on Delivery Configuration</h4>
                            <div className="space-y-4">
                              <div>
                                <Label>Instructions</Label>
                                <Textarea
                                  className="mt-2"
                                  value={gateway.config.codInstructions || ''}
                                  onChange={(e) => updateGateway(gateway.name, {
                                    config: { codInstructions: e.target.value }
                                  })}
                                  placeholder="Pay with cash when you receive your order"
                                  rows={2}
                                />
                              </div>

                              <div>
                                <Label>Maximum Order Amount (৳)</Label>
                                <Input
                                  className="mt-2"
                                  type="number"
                                  value={gateway.config.codMaxAmount || ''}
                                  onChange={(e) => updateGateway(gateway.name, {
                                    config: { codMaxAmount: parseFloat(e.target.value) || 0 }
                                  })}
                                  placeholder="10000"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Maximum amount allowed for COD orders
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <Separator />

                        {/* Transaction Limits & Fees */}
                        <div className="space-y-4">
                          <h4 className="font-medium text-sm">Transaction Limits & Fees</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Minimum Amount (৳)</Label>
                              <Input
                                className="mt-2"
                                type="number"
                                value={gateway.minimumAmount || ''}
                                onChange={(e) => updateGateway(gateway.name, {
                                  minimumAmount: parseFloat(e.target.value) || 0
                                })}
                                placeholder="10"
                              />
                            </div>

                            <div>
                              <Label>Maximum Amount (৳)</Label>
                              <Input
                                className="mt-2"
                                type="number"
                                value={gateway.maximumAmount || ''}
                                onChange={(e) => updateGateway(gateway.name, {
                                  maximumAmount: parseFloat(e.target.value) || 0
                                })}
                                placeholder="25000"
                              />
                            </div>

                            <div>
                              <Label>Fixed Fee (৳)</Label>
                              <Input
                                className="mt-2"
                                type="number"
                                step="0.01"
                                value={gateway.fees?.fixed || ''}
                                onChange={(e) => updateGateway(gateway.name, {
                                  fees: { ...gateway.fees, fixed: parseFloat(e.target.value) || 0 }
                                })}
                                placeholder="0"
                              />
                            </div>

                            <div>
                              <Label>Percentage Fee (%)</Label>
                              <Input
                                className="mt-2"
                                type="number"
                                step="0.1"
                                value={gateway.fees?.percentage || ''}
                                onChange={(e) => updateGateway(gateway.name, {
                                  fees: { ...gateway.fees, percentage: parseFloat(e.target.value) || 0 }
                                })}
                                placeholder="1.5"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Payment Options */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <SettingsIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Payment Options</CardTitle>
                  <CardDescription>General payment preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">Require Billing Address</Label>
                  <p className="text-sm text-muted-foreground">
                    Ask customers for billing address
                  </p>
                </div>
                <Switch
                  checked={settings.requireBillingAddress}
                  onCheckedChange={(checked) => {
                    setSettings({ ...settings, requireBillingAddress: checked })
                    setHasChanges(true)
                  }}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">Require Phone Number</Label>
                  <p className="text-sm text-muted-foreground">
                    Mandatory phone number for payment confirmation
                  </p>
                </div>
                <Switch
                  checked={settings.requirePhoneNumber}
                  onCheckedChange={(checked) => {
                    setSettings({ ...settings, requirePhoneNumber: checked })
                    setHasChanges(true)
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Refund Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <CardTitle>Refund Settings</CardTitle>
                  <CardDescription>Configure refund policies</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">Auto Refund</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically process approved refunds
                  </p>
                </div>
                <Switch
                  checked={settings.autoRefundEnabled}
                  onCheckedChange={(checked) => {
                    setSettings({ ...settings, autoRefundEnabled: checked })
                    setHasChanges(true)
                  }}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">Partial Refunds</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow refunding part of the order amount
                  </p>
                </div>
                <Switch
                  checked={settings.partialRefundAllowed}
                  onCheckedChange={(checked) => {
                    setSettings({ ...settings, partialRefundAllowed: checked })
                    setHasChanges(true)
                  }}
                />
              </div>

              <div>
                <Label>Refund Processing Days</Label>
                <Input
                  className="mt-2"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.refundProcessingDays}
                  onChange={(e) => {
                    setSettings({ ...settings, refundProcessingDays: parseInt(e.target.value) || 7 })
                    setHasChanges(true)
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of days to process refunds (1-30 days)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Payment security and fraud prevention</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">SSL Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Require HTTPS for payment pages
                  </p>
                </div>
                <Switch
                  checked={settings.sslEnabled}
                  onCheckedChange={(checked) => {
                    setSettings({ ...settings, sslEnabled: checked })
                    setHasChanges(true)
                  }}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">Fraud Detection</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable automatic fraud detection
                  </p>
                </div>
                <Switch
                  checked={settings.fraudDetectionEnabled}
                  onCheckedChange={(checked) => {
                    setSettings({ ...settings, fraudDetectionEnabled: checked })
                    setHasChanges(true)
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4 pt-6">
            {hasChanges && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Unsaved changes
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => {
                fetchSettings()
                setHasChanges(false)
              }}
              disabled={!hasChanges || saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save All Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
