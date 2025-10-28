'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MoreVertical,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  _id: string
  name: string
  slug: string
  price: number
  comparePrice?: number
  stock: number
  images: string[]
  category: string | { name: string; slug: string }
  isActive: boolean
  isFeatured: boolean
  isOnSale: boolean
  createdAt: string
}

export default function ProductsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    outOfStock: 0,
    lowStock: 0
  })
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showBulkMenu, setShowBulkMenu] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchProducts()
    }
  }, [session, status, router])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/products?page=1&limit=100')
      const data = await response.json()
      
      if (data.success) {
        setProducts(data.data)
        
        // Use stats from API response
        if (data.stats) {
          setStats({
            total: data.pagination.totalCount,
            active: data.stats.stock.inStock + data.stats.stock.lowStock,
            outOfStock: data.stats.stock.outOfStock,
            lowStock: data.stats.stock.lowStock
          })
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to deactivate this product?')) return
    
    try {
      const response = await fetch(`/api/admin/products/${productId}?soft=true`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh products list
        fetchProducts()
      } else {
        alert(data.message || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product')
      return
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedProducts.length} product(s)?`
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch('/api/admin/products/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          productIds: selectedProducts
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message)
        setSelectedProducts([])
        setShowBulkMenu(false)
        fetchProducts()
      } else {
        alert(data.message || 'Bulk operation failed')
      }
    } catch (error) {
      console.error('Error in bulk operation:', error)
      alert('Bulk operation failed')
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const toggleAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p._id))
    }
  }

  const columns: ColumnDef<Product>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={selectedProducts.length === products.length && products.length > 0}
          onChange={toggleAllProducts}
          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedProducts.includes(row.original._id)}
          onChange={() => toggleProductSelection(row.original._id)}
          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
      ),
    },
    {
      id: 'image',
      header: 'Image',
      cell: ({ row }) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={row.original.images[0] || '/images/placeholder-product.jpg'}
            alt={row.original.name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.name}</p>
          <p className="text-sm text-gray-500">{row.original.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const category = row.original.category
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            {typeof category === 'string' ? category : category.name}
          </span>
        )
      },
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-gray-900">${row.original.price.toFixed(2)}</p>
          {row.original.comparePrice && (
            <p className="text-sm text-gray-500 line-through">
              ${row.original.comparePrice.toFixed(2)}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => {
        const stock = row.original.stock
        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${
              stock === 0 ? 'text-red-600' : 
              stock < 10 ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {stock}
            </span>
            {stock < 10 && stock > 0 && (
              <TrendingDown className="w-4 h-4 text-yellow-600" />
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
          row.original.isActive
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      id: 'badges',
      header: 'Badges',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.isFeatured && (
            <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded">
              Featured
            </span>
          )}
          {row.original.isOnSale && (
            <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded">
              Sale
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/products/${row.original.slug}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </Link>
          <Link
            href={`/admin/products/${row.original._id}/edit`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-blue-600" />
          </Link>
          <button
            onClick={() => handleDelete(row.original._id)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      ),
    },
  ]

  if (loading || status === 'loading') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">Manage your product inventory</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {selectedProducts.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Bulk ({selectedProducts.length})</span>
                  <span className="xs:hidden">{selectedProducts.length}</span>
                </button>
                
                {showBulkMenu && (
                  <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                    <div className="py-2">
                      <button
                        onClick={() => handleBulkAction('activate')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Activate Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction('deactivate')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Deactivate Selected
                      </button>
                      <button
                        onClick={() => handleBulkAction('feature')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Mark as Featured
                      </button>
                      <button
                        onClick={() => handleBulkAction('unfeature')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Remove Featured
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => handleBulkAction('delete')}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete Selected
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Add Product</span>
              <span className="xs:hidden">Add</span>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Products</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Active Products</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Out of Stock</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.outOfStock}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Package className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Low Stock</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.lowStock}</p>
          </div>
        </div>

        {/* Products Table - Desktop View */}
        <div className="hidden lg:block">
          <DataTable
            columns={columns}
            data={products}
            searchPlaceholder="Search products by name, SKU, or category..."
            onExport={() => {
              // Export to CSV logic
              const csv = products.map(p => ({
                Name: p.name,
                Category: typeof p.category === 'string' ? p.category : p.category.name,
                Price: p.price,
                Stock: p.stock,
                Status: p.isActive ? 'Active' : 'Inactive'
              }))
              console.log('Exporting:', csv)
            }}
          />
        </div>

        {/* Products Table - Tablet View (Scrollable) */}
        <div className="hidden md:block lg:hidden">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={products}
                searchPlaceholder="Search products..."
                onExport={() => {
                  const csv = products.map(p => ({
                    Name: p.name,
                    Category: typeof p.category === 'string' ? p.category : p.category.name,
                    Price: p.price,
                    Stock: p.stock,
                    Status: p.isActive ? 'Active' : 'Inactive'
                  }))
                  console.log('Exporting:', csv)
                }}
              />
            </div>
          </div>
        </div>

        {/* Products Cards - Mobile View */}
        <div className="md:hidden space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Product Cards */}
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={product.images[0] || '/images/placeholder-product.jpg'}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{product.slug}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => toggleProductSelection(product._id)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 mt-1"
                      />
                    </div>

                    {/* Price & Stock */}
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
                        {product.comparePrice && (
                          <p className="text-xs text-gray-500 line-through">
                            ${product.comparePrice.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm font-medium ${
                          product.stock === 0 ? 'text-red-600' : 
                          product.stock < 10 ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {product.stock}
                        </span>
                      </div>
                    </div>

                    {/* Category & Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {typeof product.category === 'string' ? product.category : product.category.name}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        product.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {product.isFeatured && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 rounded">
                          Featured
                        </span>
                      )}
                      {product.isOnSale && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 text-orange-700 rounded">
                          Sale
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <Link
                    href={`/products/${product.slug}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <Link
                    href={`/admin/products/${product._id}/edit`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-1">No products found</p>
              <p className="text-sm text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}