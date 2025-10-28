'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function NewsletterWithImage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Newsletter subscription:', email)
    setSubmitted(true)
    setEmail('')
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <section className="py-6 sm:py-8 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>

      <div className="container relative z-10">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
          {/* Left Side - Content */}
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
              Newsletter
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Get Upto 70% Off
              <span className="block text-orange-600">Discount Coupon</span>
            </h2>
            
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
              by Subscribe our Newsletter
            </p>

            {submitted ? (
              <div className="bg-green-100 border border-green-300 text-green-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl">
                <p className="font-semibold text-sm sm:text-base">Thank you for subscribing!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 py-4 sm:py-6 text-base sm:text-lg"
                />
                <Button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold"
                >
                  Subscribe
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </form>
            )}
          </div>

          {/* Right Side - Image */}
          <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="/images/hero/hero-4.jpg"
              alt="Newsletter"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

