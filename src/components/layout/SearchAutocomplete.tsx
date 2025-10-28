'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface SearchResult {
  _id: string
  name: string
  slug: string
  price: number
  image: string
  category: string
}

export default function SearchAutocomplete() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Load recent searches
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }

    // Click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length > 1) {
      setLoading(true)
      const timer = setTimeout(() => {
        fetchSuggestions(query)
      }, 300) // Debounce
      return () => clearTimeout(timer)
    } else {
      setResults([])
      setLoading(false)
    }
  }, [query])

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch(`/api/products?search=${searchQuery}&limit=5`)
      const data = await response.json()
      
      if (data.success) {
        const formattedResults = data.data.map((p: any) => ({
          _id: p._id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          image: p.images[0],
          category: typeof p.category === 'string' ? p.category : p.category.name
        }))
        setResults(formattedResults)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      saveRecentSearch(query)
      router.push(`/shop?search=${encodeURIComponent(query)}`)
      setIsOpen(false)
      setQuery('')
    }
  }

  const saveRecentSearch = (searchTerm: string) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const popularSearches = ['Organic', 'Fresh Milk', 'Vegetables', 'Bread', 'Coffee']

  return (
    <div ref={searchRef} className="relative flex-1 max-w-2xl">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for products..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
        />
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {query.length > 1 ? (
            // Search Results
            loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              </div>
            ) : results.length > 0 ? (
              <div>
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase">Products</p>
                </div>
                {results.map((result) => (
                  <Link
                    key={result._id}
                    href={`/products/${result.slug}`}
                    onClick={() => {
                      saveRecentSearch(query)
                      setIsOpen(false)
                      setQuery('')
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <Image
                      src={result.image}
                      alt={result.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{result.name}</p>
                      <p className="text-xs text-gray-500">{result.category}</p>
                    </div>
                    <span className="font-bold text-green-600">${result.price.toFixed(2)}</span>
                  </Link>
                ))}
                <Link
                  href={`/shop?search=${encodeURIComponent(query)}`}
                  onClick={() => {
                    saveRecentSearch(query)
                    setIsOpen(false)
                    setQuery('')
                  }}
                  className="block p-3 text-center text-green-600 hover:bg-green-50 font-medium text-sm"
                >
                  View all results for "{query}"
                </Link>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-600">No products found for "{query}"</p>
              </div>
            )
          ) : (
            // Recent & Popular Searches
            <div>
              {recentSearches.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-600 uppercase">Recent Searches</p>
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(search)
                        router.push(`/shop?search=${encodeURIComponent(search)}`)
                        setIsOpen(false)
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="p-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-600 uppercase">Popular Searches</p>
                </div>
                {popularSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(search)
                      router.push(`/shop?search=${encodeURIComponent(search)}`)
                      setIsOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
