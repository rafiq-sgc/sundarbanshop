'use client'

import { ChevronDown } from 'lucide-react'

interface ProductSortProps {
  sort: string
  order: string
  onSortChange: (sort: string, order: string) => void
}

const sortOptions = [
  { value: 'createdAt', label: 'Newest First', order: 'desc' },
  { value: 'createdAt', label: 'Oldest First', order: 'asc' },
  { value: 'price', label: 'Price: Low to High', order: 'asc' },
  { value: 'price', label: 'Price: High to Low', order: 'desc' },
  { value: 'name', label: 'Name: A to Z', order: 'asc' },
  { value: 'name', label: 'Name: Z to A', order: 'desc' },
  { value: 'rating', label: 'Highest Rated', order: 'desc' },
  { value: 'rating', label: 'Lowest Rated', order: 'asc' }
]

export default function ProductSort({ sort, order, onSortChange }: ProductSortProps) {
  const currentOption = sortOptions.find(
    option => option.value === sort && option.order === order
  ) || sortOptions[0]

  const handleSortChange = (value: string, sortOrder: string) => {
    onSortChange(value, sortOrder)
  }

  return (
    <div className="relative">
      <select
        value={`${sort}-${order}`}
        onChange={(e) => {
          const [sortValue, orderValue] = e.target.value.split('-')
          handleSortChange(sortValue, orderValue)
        }}
        className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:ring-primary-500 focus:border-primary-500"
      >
        {sortOptions.map((option, index) => (
          <option key={index} value={`${option.value}-${option.order}`}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  )
}
