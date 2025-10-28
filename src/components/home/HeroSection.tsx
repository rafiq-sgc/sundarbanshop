'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const heroSlides = [
  {
    id: 1,
    title: "Fresh Groceries Delivered to Your Door",
    subtitle: "Get up to 40% off + FREE delivery on your first order",
    image: "/images/hero/hero-1.jpg",
    buttonText: "Shop Now",
    buttonLink: "/shop"
  },
  {
    id: 2,
    title: "Premium Quality Fresh Produce",
    subtitle: "Hand-picked organic fruits & vegetables daily",
    image: "/images/hero/hero-2.jpg",
    buttonText: "Explore Fresh",
    buttonLink: "/shop?category=breakfast-dairy"
  },
  {
    id: 3,
    title: "Best Deals on Grocery Essentials",
    subtitle: "Save big on your weekly grocery shopping",
    image: "/images/hero/hero-3.jpg",
    buttonText: "View Deals",
    buttonLink: "/shop?featured=true"
  }
]

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <section className="relative h-[600px] overflow-hidden">
      {/* Slides */}
      <div className="relative h-full">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div 
              className="h-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${slide.image})`
              }}
            >
              <div className="container h-full flex items-center">
                <div className="max-w-2xl text-white">
                  <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                    {slide.title}
                  </h1>
                  <p className="text-xl md:text-2xl mb-8 text-gray-200">
                    {slide.subtitle}
                  </p>
                  <Link
                    href={slide.buttonLink}
                    className="inline-flex items-center px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl text-lg transform hover:scale-105"
                  >
                    {slide.buttonText}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-green-600/80 hover:bg-green-700 text-white p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-green-600/80 hover:bg-green-700 text-white p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 hidden lg:block">
        <div className="bg-orange-500/90 backdrop-blur-sm rounded-2xl p-6 text-white shadow-xl">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">30%</div>
            <div className="text-sm">Discount</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-20 left-20 hidden lg:block">
        <div className="bg-green-500/90 backdrop-blur-sm rounded-2xl p-6 text-white shadow-xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">Free</div>
            <div className="text-sm">Delivery</div>
          </div>
        </div>
      </div>
    </section>
  )
}
