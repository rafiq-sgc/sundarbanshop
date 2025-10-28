'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageZoomProps {
  images: string[]
  alt: string
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export default function ImageZoom({ images, alt, currentIndex, onClose, onNavigate }: ImageZoomProps) {
  const [zoom, setZoom] = useState(false)

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1
    onNavigate(newIndex)
  }

  const handleNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0
    onNavigate(newIndex)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 p-2 bg-white bg-opacity-30 hover:bg-opacity-30 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Image */}
      <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center p-8">
        <Image
          src={images[currentIndex]}
          alt={alt}
          width={1200}
          height={1200}
          className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
            zoom ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={() => setZoom(!zoom)}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black bg-opacity-50 p-2 rounded-lg">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => onNavigate(index)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex ? 'border-green-500 ring-2 ring-green-500' : 'border-white border-opacity-30'
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${index + 1}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}
