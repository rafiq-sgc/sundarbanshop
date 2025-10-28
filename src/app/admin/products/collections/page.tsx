'use client'

import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Image as ImageIcon,
  Tag,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface Collection {
  _id: string
  name: string
  slug: string
  description: string
  image?: string
  productCount: number
  totalValue: number
  discount?: number
  isActive: boolean
  isFeatured: boolean
  createdAt: string
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([
    {
      _id: '1',
      name: 'Summer Essentials Bundle',
      slug: 'summer-essentials',
      description: 'Everything you need for a perfect summer',
      image: '/images/collections/summer.jpg',
      productCount: 8,
      totalValue: 199.99,
      discount: 15,
      isActive: true,
      isFeatured: true,
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      name: 'Breakfast Combo Pack',
      slug: 'breakfast-combo',
      description: 'Start your day right with this combo',
      image: '/images/collections/breakfast.jpg',
      productCount: 5,
      totalValue: 49.99,
      discount: 10,
      isActive: true,
      isFeatured: false,
      createdAt: new Date().toISOString()
    },
    {
      _id: '3',
      name: 'Organic Starter Kit',
      slug: 'organic-starter',
      description: 'Begin your organic journey',
      productCount: 12,
      totalValue: 299.99,
      discount: 20,
      isActive: true,
      isFeatured: true,
      createdAt: new Date().toISOString()
    }
  ])
  const [searchTerm, setSearchTerm] = useState('')

  const stats = {
    total: collections.length,
    active: collections.filter(c => c.isActive).length,
    featured: collections.filter(c => c.isFeatured).length,
    totalProducts: collections.reduce((sum, c) => sum + c.productCount, 0)
  }

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Collections & Bundles</h1>
            <p className="text-gray-600 mt-2">
              Create and manage product collections and bundle deals
            </p>
          </div>
          <Link
            href="/admin/products/collections/new"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Collection
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Collections</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-green-600 mt-2">{stats.active} active</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Tag className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Featured</p>
            <p className="text-3xl font-bold text-purple-600">{stats.featured}</p>
            <p className="text-xs text-gray-500 mt-2">On homepage</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Value</p>
            <p className="text-3xl font-bold text-green-600">
              ${collections.reduce((sum, c) => sum + c.totalValue, 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-2">All collections</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Products in Collections</p>
            <p className="text-3xl font-bold text-orange-600">{stats.totalProducts}</p>
            <p className="text-xs text-gray-500 mt-2">Total items</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection) => (
            <div
              key={collection._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-100">
                {collection.image ? (
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                {collection.isFeatured && (
                  <div className="absolute top-3 right-3 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                    Featured
                  </div>
                )}
                {collection.discount && collection.discount > 0 && (
                  <div className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                    {collection.discount}% OFF
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{collection.name}</h3>
                    <p className="text-sm text-gray-500">{collection.slug}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      collection.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {collection.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{collection.description}</p>

                {/* Stats */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Products</p>
                    <p className="text-lg font-bold text-gray-900">{collection.productCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Value</p>
                    <p className="text-lg font-bold text-green-600">
                      ${collection.totalValue.toFixed(2)}
                    </p>
                  </div>
                  {collection.discount && collection.discount > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">Savings</p>
                      <p className="text-lg font-bold text-red-600">{collection.discount}%</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center justify-center">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCollections.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No collections found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search' : 'Create your first collection'}
            </p>
            {!searchTerm && (
              <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Plus className="w-5 h-5 inline mr-2" />
                Create Collection
              </button>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            💡 About Collections & Bundles
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Collections:</strong> Group related products together for easier discovery</li>
            <li>• <strong>Bundles:</strong> Offer multiple products at a discounted price</li>
            <li>• <strong>Increase AOV:</strong> Encourage customers to buy more with bundle deals</li>
            <li>• <strong>Featured Collections:</strong> Showcase on homepage for maximum visibility</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  )
}

