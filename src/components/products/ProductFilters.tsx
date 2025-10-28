'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface ProductFiltersProps {
  filters: {
    category: string
    search: string
    minPrice: string
    maxPrice: string
    featured: boolean
    onSale: boolean
  }
  onFilterChange: (filters: any) => void
}

const categories = [
  { name: 'All Categories', value: '' },
  { name: 'Breakfast & Dairy', value: 'breakfast-dairy' },
  { name: 'Meats & Seafood', value: 'meats-seafood' },
  { name: 'Breads & Bakery', value: 'breads-bakery' },
  { name: 'Chips & Snacks', value: 'chips-snacks' },
  { name: 'Medical Healthcare', value: 'medical-healthcare' },
  { name: 'Frozen Foods', value: 'frozen-foods' },
  { name: 'Grocery & Staples', value: 'grocery-staples' },
  { name: 'Other Items', value: 'other-items' }
]

export default function ProductFilters({ filters, onFilterChange }: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      search: '',
      minPrice: '',
      maxPrice: '',
      featured: false,
      onSale: false
    }
    setLocalFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== false
  )

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            value={localFilters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search products..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={localFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={localFilters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              placeholder="Min"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            <input
              type="number"
              value={localFilters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              placeholder="Max"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Special Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.featured}
                onChange={(e) => handleFilterChange('featured', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Featured</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localFilters.onSale}
                onChange={(e) => handleFilterChange('onSale', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">On Sale</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
