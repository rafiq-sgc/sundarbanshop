'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Loader2,
  Package,
  Truck,
  Shield,
  Heart,
  Share2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Copy,
  RotateCcw,
  Award,
  Clock,
  GitCompare
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { cartService } from '@/services/dashboard'
import { frontendProductService, type Product } from '@/services/frontend'
import { useCartAPI } from '@/store/cart-api-context'
import { Label } from '@/components/ui/label'
import VariantSelector, { type ProductVariant, type ProductAttribute } from '@/components/product/VariantSelector'

export default function ProductDetailPage() {
  const { data: session, status } = useSession()
  const { refreshCart } = useCartAPI()
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRelated, setLoadingRelated] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showImageZoom, setShowImageZoom] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (params?.id) {
      fetchProduct()
    }
  }, [params?.id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const result = await frontendProductService.getProduct(params?.id as string)
      
      if (result.success && result.data) {
        setProduct(result.data)
        // Fetch related products
        fetchRelatedProducts(result.data.category)
      } else {
        toast.error('Product not found')
        router.push('/products')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
      router.push('/products')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedProducts = async (category?: string) => {
    try {
      setLoadingRelated(true)
      const result = await frontendProductService.getProducts({ 
        limit: 8,
        category: category || undefined 
      })
      
      if (result.success && result.data) {
        // Filter out current product
        const filtered = result.data.filter(p => p._id !== params?.id)
        setRelatedProducts(filtered.slice(0, 7))
      }
    } catch (error) {
      console.error('Error fetching related products:', error)
    } finally {
      setLoadingRelated(false)
    }
  }

  const handleAddRelatedToCart = async (productId: string) => {
    try {
      if (status === 'authenticated') {
        const result = await cartService.addToCart(productId, 1)
        if (result.success) {
          toast.success('Added to cart!')
          await refreshCart()
        }
      } else {
        const relatedProduct = relatedProducts.find(p => p._id === productId)
        if (!relatedProduct) return

        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
        const existingIndex = guestCart.findIndex((item: any) => item.productId === productId)
        
        if (existingIndex > -1) {
          guestCart[existingIndex].quantity += 1
        } else {
          guestCart.push({
            productId: relatedProduct._id,
            name: relatedProduct.name,
            price: relatedProduct.price,
            image: relatedProduct.images?.[0] || '/placeholder.png',
            quantity: 1,
            stock: relatedProduct.stock
          })
        }
        
        localStorage.setItem('guestCart', JSON.stringify(guestCart))
        toast.success('Added to cart!')
        await refreshCart()
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      toast.error(error.message || 'Failed to add to cart')
    }
  }

  const handleAddToCart = async () => {
    if (!product) return

    // Check if product has variants and required attributes are selected
    if (product.attributes && product.attributes.length > 0) {
      const requiredAttributes = product.attributes.filter(attr => attr.isRequired)
      const hasAllRequiredAttributes = requiredAttributes.every(attr => 
        selectedAttributes[attr.name]
      )
      
      if (!hasAllRequiredAttributes) {
        toast.error('Please select all required options')
        return
      }
      
      if (!selectedVariant) {
        toast.error('Selected variant is not available')
        return
      }
      
      if (selectedVariant.stock === 0) {
        toast.error('Selected variant is out of stock')
        return
      }
    }

    try {
      setAddingToCart(true)
      
      const variantData = selectedVariant ? {
        variantId: selectedVariant._id,
        name: selectedVariant.name,
        attributes: selectedAttributes,
        sku: selectedVariant.sku
      } : undefined
      
      if (status === 'authenticated') {
        // User is logged in - use database cart
        const result = await cartService.addToCart(product._id, quantity, variantData)
        if (result.success) {
          toast.success(`Added ${quantity} item(s) to cart!`)
          setQuantity(1)
          await refreshCart()
        }
      } else {
        // Guest user - use localStorage cart
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]')
        
        // Check if same product + variant combination exists
        const existingIndex = guestCart.findIndex((item: any) => {
          if (item.productId !== product._id) return false
          if (!variantData && !item.variant) return true
          if (variantData && item.variant && item.variant.variantId === variantData.variantId) return true
          return false
        })
        
        const effectivePrice = selectedVariant ? selectedVariant.price : product.price
        const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock
        
        if (existingIndex > -1) {
          guestCart[existingIndex].quantity += quantity
        } else {
          guestCart.push({
            productId: product._id,
            name: product.name,
            price: effectivePrice,
            image: product.images?.[0] || '/placeholder.png',
            quantity: quantity,
            stock: effectiveStock,
            variant: variantData
          })
        }
        
        localStorage.setItem('guestCart', JSON.stringify(guestCart))
        toast.success(`Added ${quantity} item(s) to cart!`)
        setQuantity(1)
        await refreshCart()
      }
    } catch (error: any) {
      console.error('Error adding to cart:', error)
      toast.error(error.message || 'Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist!')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleVariantChange = (variant: ProductVariant | null, attributes: { [key: string]: string }) => {
    setSelectedVariant(variant)
    setSelectedAttributes(attributes)
    
    // Update price display if variant is selected
    if (variant) {
      // Optionally switch main image if variant has a specific image
      if (variant.image) {
        const variantImageIndex = product?.images?.indexOf(variant.image) ?? -1
        if (variantImageIndex !== -1) {
          setSelectedImage(variantImageIndex)
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container py-4 md:py-8">
          <div className="animate-pulse">
            {/* Breadcrumb skeleton */}
            <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
              {/* Image skeleton */}
              <div className="space-y-4">
                <div className="aspect-square bg-gray-200 rounded-2xl"></div>
                <div className="grid grid-cols-5 gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
              
              {/* Details skeleton */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-10 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-14 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!product) {
    return null
  }

  const stockStatus = product.stock > 10 
    ? { icon: CheckCircle2, text: 'In Stock', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
    : product.stock > 0 
    ? { icon: AlertCircle, text: `Only ${product.stock} left!`, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' }
    : { icon: XCircle, text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }

  const StockIcon = stockStatus.icon

  // Calculate discount percentage if applicable
  const originalPrice = product.comparePrice || (product.price * 1.35)
  const discountPercentage = product.comparePrice 
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : Math.round(((originalPrice - product.price) / originalPrice) * 100)

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="container py-6 md:py-10 px-4">
        {/* Breadcrumb */}
        <nav className="mb-4 sm:mb-6">
          <ol className="flex items-center space-x-2 text-xs sm:text-sm">
            <li>
              <Link href="/" className="text-gray-600 hover:text-green-600 transition-colors">
                Home
              </Link>
            </li>
            <li><ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" /></li>
            <li>
              <Link href="/products" className="text-gray-600 hover:text-green-600 transition-colors">
                Products
              </Link>
            </li>
            <li><ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" /></li>
            <li className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-none">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_0.8fr] gap-6 lg:gap-8">
          {/* Product Images - Left Side with Vertical Thumbnails */}
          <div className="flex gap-3 sm:gap-4 items-start">
            {/* Vertical Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex flex-col gap-2 sm:gap-3 flex-shrink-0">
                {product.images.map((image, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 p-0 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-orange-500 shadow-md ring-2 ring-orange-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.png'
                      }}
                    />
                  </Button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <Card className="flex-1 overflow-hidden border border-gray-200 shadow-md group">
              <CardContent className="p-0">
                <div className="aspect-square relative bg-white">
                  <img
                    src={product.images?.[selectedImage] || '/placeholder.png'}
                    alt={product.name}
                    className="w-full h-full object-contain p-3 sm:p-4 transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.png'
                    }}
                  />
                  
                  {/* Discount Badge */}
                  {discountPercentage > 0 && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded-full">
                        -{discountPercentage}%
                      </Badge>
                    </div>
                  )}

                  {/* Featured Badge */}
                  {product.isFeatured && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-0.5 text-xs font-bold rounded-full">
                        ⭐ Featured
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Details - Center */}
          <div className="space-y-4">
            {/* Category Badge */}
            {product.category && (
              <Badge variant="secondary" className="text-xs px-3 py-1 bg-gray-100 text-gray-600 font-normal">
                {typeof product.category === 'string' && product.category.length > 20 
                  ? 'Category' 
                  : product.category.toString().toUpperCase()}
              </Badge>
            )}

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            
            {/* Rating & Reviews */}
            <div className="flex items-center gap-2">
              {product.rating ? (
                <>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating!)
                            ? 'fill-orange-400 text-orange-400'
                            : i < product.rating!
                            ? 'fill-orange-200 text-orange-200'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    ({product.reviewCount || 20} Reviews)
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500">No reviews yet</span>
              )}
            </div>

            {/* Price Section */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                ৳{(selectedVariant ? selectedVariant.price : product.price).toFixed(2)}
              </span>
              {((selectedVariant && selectedVariant.comparePrice) || (product.comparePrice && discountPercentage > 0)) && (
                <span className="text-lg text-gray-400 line-through">
                  ৳{(selectedVariant?.comparePrice || product.comparePrice || originalPrice).toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            {product.shortDescription && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Stock Status */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              (selectedVariant ? selectedVariant.stock : product.stock) > 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              {(selectedVariant ? selectedVariant.stock : product.stock) > 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-600">In Stock</p>
                    <p className="text-xs text-gray-600">
                      {(selectedVariant ? selectedVariant.stock : product.stock)} items available
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-600">Out of Stock</p>
                    <p className="text-xs text-gray-600">This item is currently unavailable</p>
                  </div>
                </>
              )}
            </div>

            {/* Product Meta Info */}
            {product.sku || product.category || (product.tags && product.tags.length > 0) ? (
              <div className="space-y-3 pt-2 border-t border-gray-200">
                {product.sku && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 font-medium min-w-[80px]">SKU:</span>
                    <span className="font-semibold text-gray-900">{product.sku}</span>
                  </div>
                )}
                {product.category && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 font-medium min-w-[80px]">Category:</span>
                    <span className="font-semibold text-gray-900">
                      {typeof product.category === 'string' && product.category.length > 20 
                        ? 'General' 
                        : product.category}
                    </span>
                  </div>
                )}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-gray-500 font-medium min-w-[80px] pt-1">Tags:</span>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Variant Selector */}
            {product.attributes && product.attributes.length > 0 && product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                <VariantSelector
                  attributes={product.attributes as ProductAttribute[]}
                  variants={product.variants as ProductVariant[]}
                  basePrice={product.price}
                  baseStock={product.stock}
                  onVariantChange={handleVariantChange}
                />
              </div>
            )}

            {/* Quantity Selector & Action Buttons */}
            {((selectedVariant && selectedVariant.stock > 0) || (!selectedVariant && product.stock > 0 && (!product.attributes || product.attributes.length === 0))) && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden bg-white">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-10 w-10 rounded-none hover:bg-gray-100 disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="w-12 h-10 flex items-center justify-center border-x border-gray-300 bg-white">
                      <span className="text-sm font-semibold text-gray-900">{quantity}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const maxStock = selectedVariant ? selectedVariant.stock : product.stock
                        setQuantity(Math.min(maxStock, quantity + 1))
                      }}
                      disabled={quantity >= (selectedVariant ? selectedVariant.stock : product.stock)}
                      className="h-10 w-10 rounded-none hover:bg-gray-100 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    size="lg"
                    className="flex-1 gap-2 h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md"
                    onClick={handleAddToCart}
                    disabled={(selectedVariant ? selectedVariant.stock : product.stock) === 0 || addingToCart}
                  >
                    {addingToCart ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="lg"
                    className="flex-1 gap-2 h-12 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md"
                  >
                    <Package className="w-5 h-5" />
                    Buy Now
                  </Button>
                </div>
              </div>
            )}

            {/* Wishlist & Compare */}
            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={handleWishlist}
                className="flex items-center gap-1.5 text-gray-600 hover:text-red-500 transition-colors"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                <span>Add to Wishlist</span>
              </button>
              <button className="flex items-center gap-1.5 text-gray-600 hover:text-orange-500 transition-colors">
                <GitCompare className="w-4 h-4" />
                <span>Compare</span>
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center gap-1.5 text-gray-600 hover:text-blue-500 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Ask a question</span>
              </button>
            </div>


            {/* Share Icons */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Share:</span>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-sky-50 hover:text-sky-600">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-50 hover:text-red-600">
                  <Linkedin className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600">
                  <Instagram className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Additional Information */}
          <div className="space-y-4">
            {/* Shipping & Payment Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Shipping worldwide</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Always Authentic</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Cash on Delivery available</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <RotateCcw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Return & Warranty</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">14 Days returns</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Payments not available</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Sold By</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    Chat Now
                  </Button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Ekomart Store</p>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>Positive Seller Ratings 100%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    <span>Shop Now 100%</span>
                  </div>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white h-9">
                  Go To Store
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs - Full Width Below */}
        <div className="mt-8 sm:mt-12">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-gray-200 overflow-x-auto">
              <TabsTrigger 
                value="details" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold whitespace-nowrap"
              >
                Product Details
              </TabsTrigger>
              <TabsTrigger 
                value="info" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold whitespace-nowrap"
              >
                Additional Information
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold whitespace-nowrap"
              >
                Customer Reviews ({product.reviewCount || 10})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-6 sm:mt-8">
              <div className="max-w-4xl">
                <div 
                  className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700"
                  dangerouslySetInnerHTML={{ 
                    __html: product.description || 'Uninhibited carnally hired played in whimpered dear gorilla koala depending and much yikes off far quetzal goodness and from for grimaced goodness unaccountably and meadowlark near unblushingly crucial scallop tightly neurotic hungrily some and dear furiously this apart.' 
                  }}
                />
                
                <Card className="bg-gray-50 border border-gray-200 mt-4 sm:mt-6">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-gray-900">Premium Quality Product</h4>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3 sm:mb-4">
                      Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend.
                    </p>
                    <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
                      <li className="flex items-start gap-2.5 sm:gap-3">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>High-quality ingredients sourced from trusted suppliers</span>
                      </li>
                      <li className="flex items-start gap-2.5 sm:gap-3">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Carefully packaged to maintain freshness and quality</span>
                      </li>
                      <li className="flex items-start gap-2.5 sm:gap-3">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Meets all safety and quality standards</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="info" className="mt-6 sm:mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex py-2.5 sm:py-3 border-b border-gray-200">
                  <span className="text-sm sm:text-base font-semibold text-gray-700 min-w-[140px] sm:min-w-[150px]">Weight</span>
                  <span className="text-sm sm:text-base text-gray-600">{product.weight ? `${product.weight}g` : 'N/A'}</span>
                </div>
                <div className="flex py-2.5 sm:py-3 border-b border-gray-200">
                  <span className="text-sm sm:text-base font-semibold text-gray-700 min-w-[140px] sm:min-w-[150px]">Color</span>
                  <span className="text-sm sm:text-base text-gray-600">Natural</span>
                </div>
                <div className="flex py-2.5 sm:py-3 border-b border-gray-200">
                  <span className="text-sm sm:text-base font-semibold text-gray-700 min-w-[140px] sm:min-w-[150px]">Type</span>
                  <span className="text-sm sm:text-base text-gray-600">Original</span>
                </div>
                <div className="flex py-2.5 sm:py-3 border-b border-gray-200">
                  <span className="text-sm sm:text-base font-semibold text-gray-700 min-w-[140px] sm:min-w-[150px]">Category</span>
                  <span className="text-sm sm:text-base text-gray-600">{product.category || 'Beverages, Dairy & Bakery'}</span>
                </div>
                <div className="flex py-2.5 sm:py-3 border-b border-gray-200">
                  <span className="text-sm sm:text-base font-semibold text-gray-700 min-w-[140px] sm:min-w-[150px]">Stock Status</span>
                  <span className={`text-sm sm:text-base font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? 'Available In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <div className="flex py-2.5 sm:py-3 border-b border-gray-200">
                  <span className="text-sm sm:text-base font-semibold text-gray-700 min-w-[140px] sm:min-w-[150px]">Tags</span>
                  <span className="text-sm sm:text-base text-gray-600">{product.tags && product.tags.length > 0 ? product.tags.join(', ') : 'N/A'}</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6 sm:mt-8">
              <div className="max-w-4xl">
                {/* Reviews Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-200">
                  <div className="md:col-span-1">
                    <Card className="text-center bg-gray-50">
                      <CardContent className="p-4 sm:p-6">
                        <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
                          {product.rating?.toFixed(1) || '4.5'}
                        </div>
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                i < Math.floor(product.rating || 4.5)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-200 text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">Based on {product.reviewCount || 10} reviews</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="md:col-span-2">
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <div className="space-y-2 sm:space-y-3">
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="flex items-center gap-2 sm:gap-3">
                              <span className="text-xs sm:text-sm font-medium text-gray-700 w-10 sm:w-12">{rating} star</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2.5 rounded-full transition-all" 
                                  style={{ width: rating === 5 ? '70%' : rating === 4 ? '20%' : '10%' }}
                                />
                              </div>
                              <span className="text-xs sm:text-sm text-gray-600 w-6 sm:w-8 font-medium">
                                {rating === 5 ? '7' : rating === 4 ? '2' : '1'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Review 1 */}
                  <Card className="bg-gray-50">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
                          J
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-sm sm:text-base font-bold text-gray-900">John Doe</h4>
                              <p className="text-xs text-gray-500">Verified Purchase</p>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500">2 days ago</span>
                          </div>
                          <div className="flex items-center gap-0.5 sm:gap-1 mb-2 sm:mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          </div>
                          <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3">
                            Excellent product! The quality exceeded my expectations. Fast delivery and great packaging. Highly recommend to anyone looking for quality products.
                          </p>
                          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-gray-600 hover:text-green-600"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                              <span>Helpful (12)</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Review 2 */}
                  <Card className="bg-gray-50">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
                          S
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="text-sm sm:text-base font-bold text-gray-900">Sarah Miller</h4>
                              <p className="text-xs text-gray-500">Verified Purchase</p>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500">5 days ago</span>
                          </div>
                          <div className="flex items-center gap-0.5 sm:gap-1 mb-2 sm:mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                                  i < 4
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-gray-200 text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-2 sm:mb-3">
                            Good product overall. The quality is nice and it arrived on time. Would buy again.
                          </p>
                          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-gray-600 hover:text-green-600"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                              <span>Helpful (5)</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Add Review Button */}
                  <div className="pt-2 sm:pt-4">
                    <Button variant="outline" size="default" className="w-full sm:w-auto gap-2">
                      <Star className="w-4 h-4" />
                      Write a Review
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 sm:mt-16 pb-8 sm:pb-12">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Related Products</h2>
              <Link href="/products">
                <Button variant="outline" size="sm" className="gap-2">
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {loadingRelated ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {relatedProducts.map((relatedProduct) => {
                  const relatedOriginalPrice = relatedProduct.price * 1.35
                  const relatedDiscount = Math.round(((relatedOriginalPrice - relatedProduct.price) / relatedOriginalPrice) * 100)
                  
                  return (
                    <Card key={relatedProduct._id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                      <CardContent className="p-0">
                        {/* Product Image */}
                        <Link href={`/products/${relatedProduct._id}`}>
                          <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                            <img
                              src={relatedProduct.images?.[0] || '/placeholder.png'}
                              alt={relatedProduct.name}
                              className="w-full h-full object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.png'
                              }}
                            />
                            {relatedDiscount > 0 && (
                              <Badge className="absolute top-2 left-2 bg-rose-500 hover:bg-rose-600 text-white text-xs px-1.5 py-0.5">
                                {relatedDiscount}% Off
                              </Badge>
                            )}
                            {relatedProduct.isFeatured && (
                              <Badge className="absolute top-2 right-2 bg-green-600 hover:bg-green-700 text-white text-xs px-1.5 py-0.5">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </Link>

                        {/* Product Info */}
                        <div className="p-3">
                          <Link href={`/products/${relatedProduct._id}`}>
                            <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 min-h-[2.5rem] hover:text-green-600 transition-colors">
                              {relatedProduct.name}
                            </h3>
                          </Link>

                          {/* Price */}
                          <div className="flex items-baseline gap-2 mb-2.5">
                            <span className="text-base sm:text-lg font-bold text-green-600">
                              ৳{relatedProduct.price.toFixed(2)}
                            </span>
                            {relatedDiscount > 0 && (
                              <span className="text-xs sm:text-sm text-gray-400 line-through">
                                ৳{relatedOriginalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Add Button */}
                          <Button
                            size="sm"
                            className="w-full gap-1.5 bg-green-600 hover:bg-green-700 h-9 text-xs font-semibold"
                            onClick={() => handleAddRelatedToCart(relatedProduct._id)}
                            disabled={relatedProduct.stock === 0}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

