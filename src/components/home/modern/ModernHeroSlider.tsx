'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ArrowRight, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { bannerService } from '@/services/banner.service'
import { frontendCategoryService } from '@/services/frontend/product.service'

interface Banner {
  _id: string
  title: string
  description?: string
  image: string
  mobileImage?: string
  link?: string
  linkText?: string
  position: string
  isActive: boolean
}

// Mock carousel slides for main banner
const mainBannerSlides = [
  {
    id: 1,
    tag: 'New Arrivals Of 2025',
    title: 'Where Fashion',
    subtitle: 'Meets Individuality',
    image: '/images/hero/hero-1.jpg',
    link: '/shop?collection=new-arrivals',
    buttonText: 'Shop Now'
  },
  {
    id: 2,
    tag: 'Exclusive Collection',
    title: 'Discover Your',
    subtitle: 'Unique Style',
    image: '/images/hero/hero-2.jpg',
    link: '/shop?collection=exclusive',
    buttonText: 'Shop Now'
  },
  {
    id: 3,
    tag: 'Trending Now',
    title: 'Fashion Forward',
    subtitle: 'Be Yourself',
    image: '/images/hero/hero-3.jpg',
    link: '/shop?collection=trending',
    buttonText: 'Shop Now'
  }
]

// Side banner data
const sideBanner = {
  tag: 'Summer Collection',
  title: 'Make Your Fashion Story',
  subtitle: 'Unique Every Day',
  image: '/images/hero/hero-4.jpg',
  link: '/shop?collection=summer',
  buttonText: 'Shop Now'
}

interface Category {
  _id: string
  name: string
  slug: string
  icon?: string
}

const defaultIcons = ["👗", "👔", "💻", "🏠", "💊", "⚽", "🍼", "🛒", "💄", "📱", "🎮", "👕", "👖", "👟", "👜", "⌚"]

export default function ModernHeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [banners, setBanners] = useState<Banner[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    fetchBanners()
    fetchCategories()
  }, [])

  // Auto-play carousel with smooth transitions
  useEffect(() => {
    if (!isPaused && mainBannerSlides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % mainBannerSlides.length)
      }, 6000) // Change slide every 6 seconds to allow users to read content
      return () => clearInterval(timer)
    }
  }, [isPaused, mainBannerSlides.length])

  const fetchBanners = async () => {
    try {
      const result = await bannerService.getBanners({ position: 'hero', status: 'active' })
      if (result.success && result.data) {
        setBanners(result.data.banners)
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
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
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % mainBannerSlides.length)
    setIsPaused(false) // Resume auto-play after manual navigation
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + mainBannerSlides.length) % mainBannerSlides.length)
    setIsPaused(false) // Resume auto-play after manual navigation
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsPaused(false) // Resume auto-play after manual navigation
  }

  if (loading) {
    return (
      <section className="relative h-[600px] bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-12 w-48 bg-gray-300 rounded mx-auto mb-4"></div>
          <div className="h-6 w-96 bg-gray-300 rounded mx-auto"></div>
        </div>
      </section>
    )
  }

  const currentBanner = mainBannerSlides[currentSlide]

  return (
    <section className="relative bg-gray-50 py-4 sm:py-6">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-3 sm:gap-4">
          {/* Left Column - Category Sidebar */}
          <div className="lg:col-span-3 hidden lg:block">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <Button className="w-full bg-orange-600 text-white hover:bg-orange-700 mb-4">
                <span className="flex items-center gap-2">
                  <Menu className="w-5 h-5" />
                  Browse Categories
                </span>
                <ChevronRight className="w-4 h-4 rotate-90" />
              </Button>
              <ul className="space-y-1">
                {categories.map((category, index) => (
                  <li key={category._id}>
                    <Link
                      href={`/shop?category=${category.slug}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition-colors text-gray-700 hover:text-orange-600 group"
                    >
                      <span className="text-xl">{category.icon || defaultIcons[index % defaultIcons.length]}</span>
                      <span className="flex-1 text-sm font-medium">{category.name}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
                    </Link>
                  </li>
                ))}
                <li className="pt-2 border-t border-gray-200 mt-2">
                  <Link
                    href="/shop"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition-colors text-orange-600 font-semibold text-sm"
                  >
                    <span>View All Categories</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Middle Column - Main Hero Banner with Carousel */}
          <div className="lg:col-span-6 order-2 lg:order-none">
            <div
              className="relative h-[300px] sm:h-[400px] md:h-[450px] lg:h-[500px] overflow-hidden rounded-lg bg-gray-100 shadow-sm group"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-4 left-4 w-20 h-20 bg-gray-800 rounded-full"></div>
                <div className="absolute top-10 left-16 w-12 h-12 bg-gray-800 rounded-full"></div>
                <div className="absolute bottom-8 left-6 w-16 h-16 bg-gray-800 rounded-full"></div>
                <div className="absolute bottom-12 left-20 w-10 h-10 bg-gray-800 rounded-full"></div>
              </div>

              {/* Slide Content with Smooth Fade Transition */}
              <div className="relative h-full overflow-hidden">
                {mainBannerSlides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 flex items-center px-4 sm:px-6 md:px-8 transition-all duration-700 ease-in-out ${
                      index === currentSlide 
                        ? 'opacity-100 z-10 translate-x-0' 
                        : 'opacity-0 z-0 translate-x-4 pointer-events-none'
                    }`}
                  >
                    <div className={`flex-1 transition-all duration-700 ease-in-out ${
                      index === currentSlide 
                        ? 'translate-y-0 opacity-100' 
                        : 'translate-y-4 opacity-0'
                    }`}>
                      <div className="mb-2 sm:mb-3">
                        <Badge className="bg-orange-600 text-white border-0">
                          {slide.tag}
                        </Badge>
                      </div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">
                        {slide.title}
                      </h2>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                        {slide.subtitle}
                      </h2>
                      <Button
                        asChild
                        className="bg-orange-600 text-white hover:bg-orange-700"
                      >
                        <Link href={slide.link}>
                          {slide.buttonText}
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                    
                    {/* Hero Image */}
                    <div className={`relative w-0 sm:w-40 md:w-64 lg:w-80 h-0 sm:h-40 md:h-64 lg:h-80 hidden sm:block transition-all duration-700 ease-in-out ${
                      index === currentSlide 
                        ? 'translate-x-0 opacity-100 scale-100' 
                        : 'translate-x-8 opacity-0 scale-95'
                    }`}>
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-contain transition-transform duration-700"
                        priority={index === 0}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <Button
                onClick={prevSlide}
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 rounded-full"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                onClick={nextSlide}
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 rounded-full"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>

              {/* Pagination Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {mainBannerSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'bg-orange-600 w-6'
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Side Banner */}
          <div className="lg:col-span-3 order-3 lg:order-none">
            <div className="relative h-[250px] sm:h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden rounded-lg bg-gray-100 shadow-sm group">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-6 right-6 w-16 h-16 bg-gray-800 rounded-full"></div>
                <div className="absolute bottom-8 right-12 w-12 h-12 bg-gray-800 rounded-full"></div>
              </div>

              <div className="relative h-full flex flex-col justify-between p-4 sm:p-6">
                <div>
                  <div className="mb-2 sm:mb-4">
                    <Badge variant="outline" className="bg-gray-200 text-orange-600 border-0">
                      {sideBanner.tag}
                    </Badge>
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                    {sideBanner.title}
                  </h3>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                    {sideBanner.subtitle}
                  </h3>
                </div>

                {/* Hero Image */}
                <div className="relative w-full h-32 sm:h-40 md:h-48 lg:h-64 mt-auto">
                  <Image
                    src={sideBanner.image}
                    alt={sideBanner.title}
                    fill
                    className="object-contain object-bottom"
                  />
                </div>

                <Button
                  asChild
                  className="bg-orange-600 text-white hover:bg-orange-700 mt-2 sm:mt-4"
                >
                  <Link href={sideBanner.link}>
                    {sideBanner.buttonText}
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

