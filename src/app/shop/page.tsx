'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Product as ProductType } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { frontendProductService, frontendCategoryService, ProductFilters, Category, Product } from '@/services/frontend/product.service'
import { useCart } from '@/store/cart-context'
import { useCartAPI } from '@/store/cart-api-context'
import { useSession } from 'next-auth/react'
import { cartService } from '@/services/dashboard'
import toast from 'react-hot-toast'
import { 
  ShoppingCart, 
  Star, 
  Grid3X3, 
  List,
  ChevronDown,
  SlidersHorizontal,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Package
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'


import { Suspense } from 'react'

function ShopPageInner() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    category: '',
    search: '',
    minPrice: 0,
    maxPrice: 5000,
    featured: false,
    onSale: false,
    sort: '-createdAt',
    limit: 12
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { addItem: addToCartLocal, getItemQuantity } = useCart()
  const { refreshCart } = useCartAPI()

  const fetchProducts = async (customFilters?: ProductFilters) => {
    setLoading(true)
    try {
      const activeFilters = customFilters || filters
      const response = await frontendProductService.getProductsWithPagination(activeFilters)
      
      if (response.success && response.data) {
        setProducts(response.data)
        if (response.pagination) {
          setPagination(response.pagination)
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
      setPagination(prev => ({ ...prev, total: 0, pages: 0 }))
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await frontendCategoryService.getCategories('root')
      if (response.success && response.data) {
        setCategories(response.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    if (addingToCart === product._id) return
    
    setAddingToCart(product._id)
    
    try {
      if (session) {
        // User is authenticated - use API
        await cartService.addToCart(product._id, quantity)
        // Refresh cart to update count
        await refreshCart()
        toast.success(`${product.name} added to cart!`)
      } else {
        // Guest user - use local cart
        addToCartLocal(product, quantity)
        toast.success(`${product.name} added to cart!`)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add item to cart. Please try again.')
    } finally {
      setAddingToCart(null)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Handle URL parameters for category filtering
  useEffect(() => {
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const featured = searchParams.get('featured')
    const onSale = searchParams.get('onSale')
    const sort = searchParams.get('sort')
    const page = searchParams.get('page')

    const urlFilters: ProductFilters = {
      page: page ? parseInt(page) : 1,
      category: category || '',
      search: search || '',
      minPrice: minPrice ? parseInt(minPrice) : 0,
      maxPrice: maxPrice ? parseInt(maxPrice) : 5000,
      featured: featured === 'true',
      onSale: onSale === 'true',
      sort: sort || '-createdAt',
      limit: 12
    }

    setFilters(urlFilters)
    fetchProducts(urlFilters)
  }, [searchParams])

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    const updated = { ...filters, ...newFilters, page: 1 }
    setFilters(updated)
    
    // Update URL parameters
    const params = new URLSearchParams()
    if (updated.category) params.set('category', updated.category)
    if (updated.search) params.set('search', updated.search)
    if (updated.minPrice && updated.minPrice > 0) params.set('minPrice', updated.minPrice.toString())
    if (updated.maxPrice && updated.maxPrice < 5000) params.set('maxPrice', updated.maxPrice.toString())
    if (updated.featured) params.set('featured', 'true')
    if (updated.onSale) params.set('onSale', 'true')
    if (updated.sort && updated.sort !== '-createdAt') params.set('sort', updated.sort)
    if (updated.page && updated.page > 1) params.set('page', updated.page.toString())
    
    const newUrl = params.toString() ? `?${params.toString()}` : '/shop'
    router.push(newUrl)
    
    fetchProducts(updated)
  }

  const handlePageChange = (page: number) => {
    const updated = { ...filters, page }
    setFilters(updated)
    
    // Update URL parameters
    const params = new URLSearchParams()
    if (updated.category) params.set('category', updated.category)
    if (updated.search) params.set('search', updated.search)
    if (updated.minPrice && updated.minPrice > 0) params.set('minPrice', updated.minPrice.toString())
    if (updated.maxPrice && updated.maxPrice < 5000) params.set('maxPrice', updated.maxPrice.toString())
    if (updated.featured) params.set('featured', 'true')
    if (updated.onSale) params.set('onSale', 'true')
    if (updated.sort && updated.sort !== '-createdAt') params.set('sort', updated.sort)
    if (page > 1) params.set('page', page.toString())
    
    const newUrl = params.toString() ? `?${params.toString()}` : '/shop'
    router.push(newUrl)
    
    fetchProducts(updated)
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container py-6 md:py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Card className="bg-white">
            <CardContent className="p-4">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
                <li>
                  <Link href="/" className="flex items-center gap-1 hover:text-green-600 transition-colors">
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                </li>
            <li>/</li>
                <li className="flex items-center gap-1 text-gray-900 font-medium">
                  <Package className="w-4 h-4" />
                  Shop
                </li>
          </ol>
            </CardContent>
          </Card>
        </nav>

        {/* Search and Filter Header */}
        <div className="mb-6">
          <Card className="bg-white">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search products..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange({ search: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Desktop Controls */}
                <div className="hidden lg:flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sort" className="text-sm font-medium">Sort by:</Label>
                    <Select
                      value={filters.sort}
                      onValueChange={(value) => {
                        handleFilterChange({ sort: value })
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-createdAt">Latest</SelectItem>
                        <SelectItem value="price">Price: Low to High</SelectItem>
                        <SelectItem value="-price">Price: High to Low</SelectItem>
                        <SelectItem value="name">Name: A to Z</SelectItem>
                        <SelectItem value="-name">Name: Z to A</SelectItem>
                        <SelectItem value="-rating">Rating: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile Filter Button */}
                <div className="lg:hidden">
                  <Sheet open={showFilters} onOpenChange={setShowFilters}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 space-y-6">
                        {/* Price Filter */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range</h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="mobile-minPrice" className="text-sm font-medium">Min Price</Label>
                                <Input
                                  id="mobile-minPrice"
                                  type="number"
                                  value={filters.minPrice || ''}
                                  onChange={(e) => handleFilterChange({ minPrice: parseFloat(e.target.value) || 0 })}
                                  placeholder="0"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="mobile-maxPrice" className="text-sm font-medium">Max Price</Label>
                                <Input
                                  id="mobile-maxPrice"
                                  type="number"
                                  value={filters.maxPrice || ''}
                                  onChange={(e) => handleFilterChange({ maxPrice: parseFloat(e.target.value) || 1000 })}
                                  placeholder="1000"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            
                            <Button
                              onClick={() => handleFilterChange({ minPrice: 0, maxPrice: 1000 })}
                              variant="outline"
                              className="w-full"
                            >
                              Reset Price
                            </Button>
                          </div>
                        </div>

                        <Separator />

                        {/* Categories */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                          <div className="space-y-3">
                            {categories.map((category) => (
                              <div key={category._id} className="flex items-center space-x-3">
                                <Checkbox
                                  id={`mobile-category-${category._id}`}
                                  checked={filters.category === category.slug}
                                  onCheckedChange={(checked) => handleFilterChange({ 
                                    category: checked ? category.slug : '' 
                                  })}
                                />
                                <Label 
                                  htmlFor={`mobile-category-${category._id}`}
                                  className="flex-1 cursor-pointer text-sm text-gray-700"
                                >
                                  {category.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Brands */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Brands</h3>
                          <div className="space-y-3">
                            {[
                              'Frito Lay',
                              'Nespresso', 
                              'Oreo',
                              'Quaker',
                              'Welch\'s'
                            ].map((brand) => (
                              <div key={brand} className="flex items-center space-x-3">
                                <Checkbox id={`mobile-brand-${brand}`} />
                                <Label 
                                  htmlFor={`mobile-brand-${brand}`}
                                  className="flex-1 cursor-pointer text-sm text-gray-700"
                                >
                                  {brand}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Clear Filters */}
                        <Button
                          onClick={() => {
                            handleFilterChange({
                              category: '',
                              search: '',
                              minPrice: 0,
                              maxPrice: 1000,
                              featured: false,
                              onSale: false
                            })
                            setShowFilters(false)
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <Card className="sticky top-6">
              <CardContent className="p-6">
              {/* Price Filter */}
              <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="minPrice" className="text-sm font-medium">Min Price</Label>
                        <Input
                          id="minPrice"
                        type="number"
                          value={filters.minPrice || ''}
                          onChange={(e) => handleFilterChange({ minPrice: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                          className="mt-1"
                      />
                    </div>
                      <div>
                        <Label htmlFor="maxPrice" className="text-sm font-medium">Max Price</Label>
                        <Input
                          id="maxPrice"
                        type="number"
                          value={filters.maxPrice || ''}
                          onChange={(e) => handleFilterChange({ maxPrice: parseFloat(e.target.value) || 1000 })}
                          placeholder="1000"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleFilterChange({ minPrice: 0, maxPrice: 1000 })}
                      variant="outline"
                      className="w-full"
                    >
                      Reset Price
                    </Button>
                  </div>
                </div>

                <Separator className="my-6" />

              {/* Product Categories */}
              <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-3">
                    {categories.map((category) => (
                      <div key={category._id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`category-${category._id}`}
                          checked={filters.category === category.slug}
                          onCheckedChange={(checked) => handleFilterChange({ 
                            category: checked ? category.slug : '' 
                          })}
                        />
                        <Label 
                          htmlFor={`category-${category._id}`}
                          className="flex-1 cursor-pointer text-sm text-gray-700"
                        >
                          {category.name}
                        </Label>
                      </div>
                  ))}
                </div>
              </div>

                <Separator className="my-6" />

              {/* Brands */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Brands</h3>
                <div className="space-y-3">
                  {[
                    'Frito Lay',
                    'Nespresso', 
                    'Oreo',
                    'Quaker',
                    'Welch\'s'
                  ].map((brand) => (
                      <div key={brand} className="flex items-center space-x-3">
                        <Checkbox id={`brand-${brand}`} />
                        <Label 
                          htmlFor={`brand-${brand}`}
                          className="flex-1 cursor-pointer text-sm text-gray-700"
                        >
                          {brand}
                        </Label>
                      </div>
                  ))}
                </div>
              </div>

                <Separator className="my-6" />

                {/* Clear Filters */}
                <Button
                  onClick={() => handleFilterChange({
                    category: '',
                    search: '',
                    minPrice: 0,
                    maxPrice: 1000,
                    featured: false,
                    onSale: false
                  })}
                  variant="outline"
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {/* Results Header */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{products.length}</span> of <span className="font-semibold">{pagination.total}</span> products
              </div>
              
                  {/* Mobile Controls */}
                  <div className="lg:hidden flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="mobile-sort" className="text-sm font-medium">Sort:</Label>
                      <Select
                        value={filters.sort}
                        onValueChange={(value) => {
                          handleFilterChange({ sort: value })
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-createdAt">Latest</SelectItem>
                          <SelectItem value="price">Price: Low to High</SelectItem>
                          <SelectItem value="-price">Price: High to Low</SelectItem>
                          <SelectItem value="name">Name: A to Z</SelectItem>
                          <SelectItem value="-name">Name: Z to A</SelectItem>
                          <SelectItem value="-rating">Rating: High to Low</SelectItem>
                        </SelectContent>
                      </Select>
                </div>

                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                    onClick={() => setViewMode('grid')}
                        className="rounded-r-none"
                  >
                    <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                    onClick={() => setViewMode('list')}
                        className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            {loading ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2 mb-4" />
                      <div className="flex items-center justify-between mb-3">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 flex-1" />
                        <Skeleton className="h-8 w-20" />
                  </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {products.map((product) => (
                  <Card key={product._id} className={`group hover:shadow-lg transition-all duration-300 overflow-hidden ${
                    viewMode === 'list' ? 'flex flex-row' : ''
                  }`}>
                    {/* Product Image */}
                    <div className={`relative ${viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'w-full h-48'}`}>
                      <Link href={`/products/${product._id}`}>
                        <Image
                          src={product.images[0] || '/images/placeholder-product.jpg'}
                          alt={product.name}
                          width={viewMode === 'list' ? 192 : 300}
                          height={viewMode === 'list' ? 192 : 200}
                          className={`object-cover group-hover:scale-105 transition-transform duration-300 ${
                            viewMode === 'list' ? 'w-full h-full' : 'w-full h-48'
                          }`}
                        />
                      </Link>
                      
                      {/* Discount Badge */}
                      {(() => {
                        // Calculate discount percentage from price difference if not provided
                        const currentPrice = product.currentPrice || product.salePrice || product.price;
                        const comparePrice = product.comparePrice;
                        let discountPercentage = product.discountPercentage || 0;
                        
                        // If no discount percentage but we have compare price, calculate it
                        if (discountPercentage === 0 && comparePrice && comparePrice > currentPrice) {
                          discountPercentage = Math.round(((comparePrice - currentPrice) / comparePrice) * 100);
                        }
                        
                        return discountPercentage > 0 ? (
                          <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-500 text-white font-bold text-xs px-2 py-1 shadow-lg">
                            -{discountPercentage}%
                          </Badge>
                        ) : null;
                      })()}
                    </div>
                    
                    {/* Product Details */}
                    <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
                      <div>
                        <Link href={`/products/${product._id}`}>
                          <h3 className={`font-bold text-gray-900 mb-2 hover:text-orange-600 transition-colors ${
                            viewMode === 'list' ? 'text-lg' : 'text-sm line-clamp-2'
                          }`}>
                          {product.name}
                        </h3>
                      </Link>
                      
                      {/* Product Description */}
                      {product.shortDescription && (
                        <p className={`text-gray-600 mb-2 ${
                          viewMode === 'list' ? 'text-sm' : 'text-xs line-clamp-2'
                        }`}>
                          {product.shortDescription}
                        </p>
                      )}
                      
                      {/* SKU */}
                      <p className={`text-gray-500 mb-2 ${
                        viewMode === 'list' ? 'text-sm' : 'text-xs'
                      }`}>
                        SKU: {product.sku}
                      </p>
                      
                        {/* Rating */}
                        {/* {product.rating && (
                          <div className="flex items-center gap-1 mb-3">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`${
                                    viewMode === 'list' ? 'w-4 h-4' : 'w-3 h-3'
                                  } ${
                                    i < Math.floor(product.rating!)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : i < product.rating!
                                      ? 'fill-yellow-200 text-yellow-200'
                                      : 'fill-gray-200 text-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className={`text-gray-500 ml-1 ${
                              viewMode === 'list' ? 'text-sm' : 'text-xs'
                            }`}>
                              ({product.reviewCount || 10} Reviews)
                            </span>
                          </div>
                        )} */}
                        
                        {/* Pricing */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`font-bold text-orange-500 ${
                            viewMode === 'list' ? 'text-2xl' : 'text-lg'
                          }`}>
                            ৳{(product.currentPrice || product.salePrice || product.price).toFixed(2)}
                          </span>
                          {(() => {
                            const currentPrice = product.currentPrice || product.salePrice || product.price;
                            const shouldShowComparePrice = product.comparePrice && 
                                                         product.comparePrice > 0 && 
                                                         product.comparePrice > currentPrice;
                            
                            return shouldShowComparePrice && product.comparePrice ? (
                              <span className={`text-gray-500 line-through ${
                                viewMode === 'list' ? 'text-lg' : 'text-sm'
                              }`}>
                                ৳{product.comparePrice.toFixed(2)}
                              </span>
                            ) : null;
                          })()}
                        </div>
                        
                        {/* Stock Status */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-sm ${
                            product.stock > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                          </span>
                          {product.isOnSale && (
                            <Badge variant="secondary" className="text-xs">
                              On Sale
                            </Badge>
                          )}
                          {/* {product.isFeatured && (
                            <Badge variant="outline" className="text-xs">
                              Featured
                            </Badge>
                          )} */}
                        </div>
                        
                        {/* Description */}
                        {viewMode === 'list' && product.shortDescription && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {product.shortDescription}
                          </p>
                        )}
                        
                        {/* Color Options (for list view) */}
                        {viewMode === 'list' && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm text-gray-600">Color:</span>
                            <div className="flex gap-2">
                              <div className="w-6 h-6 rounded-full bg-black border-2 border-gray-300 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                              <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-gray-300"></div>
                              <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-gray-300"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className={`flex items-center gap-2 ${viewMode === 'list' ? 'mt-auto' : ''}`}>
                        {viewMode === 'list' ? (
                          <>
                            <Button 
                              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 flex items-center gap-2"
                              onClick={() => handleAddToCart(product)}
                              disabled={addingToCart === product._id || product.stock === 0}
                            >
                              {addingToCart === product._id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  Add to Cart
                                  <ShoppingCart className="w-4 h-4" />
                                </>
                              )}
                            </Button>
                            <Button variant="outline" size="icon" className="w-10 h-10">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </Button>
                            <Button variant="outline" size="icon" className="w-10 h-10">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Select 
                              defaultValue="1" 
                              onValueChange={(value) => {
                                const quantity = parseInt(value)
                                handleAddToCart(product, quantity)
                              }}
                            >
                              <SelectTrigger className="flex-1 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              size="sm" 
                              className="h-8 px-3 text-xs"
                              onClick={() => handleAddToCart(product)}
                              disabled={addingToCart === product._id || product.stock === 0}
                            >
                              {addingToCart === product._id ? (
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <ShoppingCart className="w-3 h-3 mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                <div className="text-gray-400 mb-4">
                    <Package className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                  <Button
                  onClick={() => handleFilterChange({
                    category: '',
                    search: '',
                      minPrice: 0,
                      maxPrice: 1000,
                    featured: false,
                    onSale: false
                  })}
                    variant="outline"
                >
                  Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {!loading && products.length > 0 && pagination.pages > 1 && (
              <Card className="mt-8">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.pages}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={!pagination.hasPrev}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(pagination.pages)].map((_, i) => {
                          const page = i + 1
                          const isCurrentPage = page === pagination.page
                          const isNearCurrentPage = Math.abs(page - pagination.page) <= 2
                          const isFirstPage = page === 1
                          const isLastPage = page === pagination.pages
                          
                          if (isFirstPage || isLastPage || isNearCurrentPage) {
                            return (
                              <Button
                                key={page}
                                variant={isCurrentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className="w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                            )
                          } else if (page === 2 || page === pagination.pages - 1) {
                            return <span key={page} className="text-gray-400">...</span>
                          }
                          return null
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={!pagination.hasNext}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
              </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div>Loading shop...</div>}>
      <ShopPageInner />
    </Suspense>
  )
}