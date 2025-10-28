'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Package,
  Boxes,
  Download,
  Upload,
  Edit,
  Plus,
  Minus,
  Loader2
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import inventoryService, { type InventoryItem, type InventoryStats } from '@/services/inventory.service'
import { toast } from 'react-hot-toast'
import { generatePDFReport } from '@/lib/pdf-utils'

export default function InventoryPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  })
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Adjustment modal state
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [adjustmentData, setAdjustmentData] = useState({
    operation: 'add' as 'add' | 'subtract' | 'set',
    quantity: 0,
    reason: ''
  })
  const [adjusting, setAdjusting] = useState(false)

  useEffect(() => {
    if (isAuthorized) {
      fetchInventory()
    }
  }, [isAuthorized, statusFilter, searchQuery, currentPage])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const result = await inventoryService.getInventory({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
        page: currentPage,
        limit: 20
      })

      setInventory(result.inventory)
      setStats(result.stats)
      setTotalPages(result.pagination.pages)
    } catch (error: any) {
      console.error('Error fetching inventory:', error)
      toast.error(error.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleAdjustStock = async () => {
    if (!selectedItem) return

    try {
      setAdjusting(true)
      await inventoryService.adjustStock(selectedItem._id, {
        productId: selectedItem._id,
        operation: adjustmentData.operation,
        quantity: adjustmentData.quantity,
        reason: adjustmentData.reason
      })

      toast.success('Stock adjusted successfully!')
      setShowAdjustModal(false)
      setSelectedItem(null)
      setAdjustmentData({ operation: 'add', quantity: 0, reason: '' })
      fetchInventory()
    } catch (error: any) {
      console.error('Error adjusting stock:', error)
      toast.error(error.message || 'Failed to adjust stock')
    } finally {
      setAdjusting(false)
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      if (format === 'csv') {
        await inventoryService.exportInventory('csv', statusFilter !== 'all' ? statusFilter : undefined)
        toast.success('CSV exported successfully!')
      } else {
        const result = await inventoryService.exportInventory('pdf', statusFilter !== 'all' ? statusFilter : undefined)
        
        if (result.success && result.data) {
          // Generate PDF using the utility
          const html = `
            <div style="font-family: Arial, sans-serif;">
              <h1 style="color: #10b981; margin-bottom: 20px;">Inventory Report</h1>
              <p style="margin-bottom: 10px;"><strong>Generated:</strong> ${new Date(result.data.generatedAt).toLocaleString()}</p>
              <p style="margin-bottom: 20px;"><strong>Total Items:</strong> ${result.data.inventory.length}</p>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                  <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Product</th>
                    <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">SKU</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">Stock</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">Min</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">Status</th>
                    <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${result.data.inventory.map((item: any, index: number) => `
                    <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 12px; border: 1px solid #e5e7eb;">${item.productName}</td>
                      <td style="padding: 12px; border: 1px solid #e5e7eb;">${item.sku}</td>
                      <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">${item.currentStock}</td>
                      <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">${item.minStock}</td>
                      <td style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">
                        <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; 
                          background-color: ${item.status === 'Out of Stock' ? '#fee2e2' : item.status === 'Low Stock' ? '#fef3c7' : '#d1fae5'};
                          color: ${item.status === 'Out of Stock' ? '#991b1b' : item.status === 'Low Stock' ? '#92400e' : '#065f46'};">
                          ${item.status}
                        </span>
                      </td>
                      <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">$${item.stockValue.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `
          
          await generatePDFReport(html, `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`)
          toast.success('PDF exported successfully!')
        }
      }
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error(error.message || 'Failed to export')
    }
  }

  const openAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item)
    setAdjustmentData({ operation: 'add', quantity: 0, reason: '' })
    setShowAdjustModal(true)
  }

  const columns: ColumnDef<InventoryItem>[] = [
    {
      id: 'image',
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={row.original.image}
              alt={row.original.productName}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.original.productName}</p>
            <p className="text-sm text-gray-500">{row.original.sku}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'currentStock',
      header: 'Current Stock',
      cell: ({ row }) => {
        const stock = row.original.currentStock
        const minStock = row.original.minStock
        const percentage = minStock > 0 ? (stock / minStock) * 100 : 100
        
        return (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold ${
                stock === 0 ? 'text-red-600' :
                stock < minStock ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {stock} units
              </span>
              {stock < minStock && stock > 0 && (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  stock === 0 ? 'bg-red-500' :
                  stock < minStock ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'minStock',
      header: 'Min Stock',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.minStock}</span>
      ),
    },
    {
      accessorKey: 'reorderLevel',
      header: 'Reorder Level',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">{row.original.reorderLevel}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant={
            status === 'in_stock' ? 'default' :
            status === 'low_stock' ? 'secondary' :
            'destructive'
          }>
            {status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => openAdjustModal(row.original)}
        >
          <Edit className="w-4 h-4 mr-1" />
          Adjust
        </Button>
      ),
    },
  ]

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading inventory...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-1">Track and manage stock levels</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.inStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by product name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <DataTable
          columns={columns}
          data={inventory}
          searchPlaceholder="Search inventory by product name or SKU..."
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Adjust Stock Modal */}
        <Dialog open={showAdjustModal} onOpenChange={setShowAdjustModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Stock</DialogTitle>
              <DialogDescription>
                Update stock quantity for {selectedItem?.productName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Current Stock</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl font-bold text-gray-900">
                    {selectedItem?.currentStock} units
                  </span>
                </div>
              </div>

              <div>
                <Label>Operation</Label>
                <Select
                  value={adjustmentData.operation}
                  onValueChange={(value: any) => setAdjustmentData({ ...adjustmentData, operation: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Stock
                      </div>
                    </SelectItem>
                    <SelectItem value="subtract">
                      <div className="flex items-center gap-2">
                        <Minus className="w-4 h-4" />
                        Subtract Stock
                      </div>
                    </SelectItem>
                    <SelectItem value="set">
                      <div className="flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Set Exact Stock
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <Label>Reason</Label>
                <Textarea
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                  placeholder="Explain why you're adjusting the stock..."
                  rows={3}
                />
              </div>

              {/* Preview */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-gray-900 mb-1">New Stock Level:</p>
                <p className="text-2xl font-bold text-blue-600">
                  {adjustmentData.operation === 'add' 
                    ? (selectedItem?.currentStock || 0) + adjustmentData.quantity
                    : adjustmentData.operation === 'subtract'
                    ? Math.max(0, (selectedItem?.currentStock || 0) - adjustmentData.quantity)
                    : adjustmentData.quantity
                  } units
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAdjustModal(false)
                    setSelectedItem(null)
                  }}
                  disabled={adjusting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdjustStock}
                  disabled={adjusting || adjustmentData.quantity === 0}
                >
                  {adjusting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adjusting...
                    </>
                  ) : (
                    'Confirm Adjustment'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
