'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/admin/AdminLayout'
import { DataTable } from '@/components/admin/DataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Folder,
  FolderOpen,
  Package,
  MoreHorizontal,
  Grid3x3
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  image?: string
  parent?: string
  productCount: number
  isActive: boolean
  sortOrder: number
  createdAt: string
}

export default function CategoriesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/auth/signin')
    } else {
      fetchCategories()
    }
  }, [session, status, router])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/categories?page=1&limit=100')
      const data = await response.json()
      
      if (data.success) {
        // Add product count to each category (will come from API later)
        const categoriesWithCount = data.data.map((cat: any) => ({
          ...cat,
          productCount: 0 // TODO: Get from API
        }))
        setCategories(categoriesWithCount)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}?soft=true`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Category deleted successfully')
        fetchCategories()
      } else {
        toast.error(data.message || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  const columns: ColumnDef<Category>[] = [
    {
      id: 'image',
      header: 'Image',
      cell: ({ row }) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
          {row.original.image ? (
            <Image
              src={row.original.image}
              alt={row.original.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Folder className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Category Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-gray-900">{row.original.name}</p>
          <p className="text-sm text-gray-500">{row.original.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <p className="text-sm text-gray-600 max-w-xs truncate">
          {row.original.description || 'No description'}
        </p>
      ),
    },
    {
      accessorKey: 'productCount',
      header: 'Products',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-gray-900">{row.original.productCount}</span>
        </div>
      ),
    },
    {
      accessorKey: 'sortOrder',
      header: 'Order',
      cell: ({ row }) => (
        <span className="text-sm text-gray-600">#{row.original.sortOrder}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/shop?category=${row.original.slug}`} className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                View in Shop
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/categories/${row.original._id}/edit`} className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Category
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDelete(row.original._id)}
              className="text-red-600 focus:text-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Category
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-1">Manage product categories</p>
          </div>
          <Button asChild>
            <Link href="/admin/categories/new" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Category
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Categories</CardTitle>
              <Grid3x3 className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Categories</CardTitle>
              <Folder className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {categories.filter(c => c.isActive).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
              <Package className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {categories.reduce((sum, c) => sum + c.productCount, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Table */}
        <DataTable
          columns={columns}
          data={categories}
          searchPlaceholder="Search categories by name or slug..."
          pageSize={15}
        />
      </div>
    </AdminLayout>
  )
}
