'use client'

import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter subscription
    console.log('Newsletter subscription:', email)
    setSubmitted(true)
    setEmail('')
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <section className="py-16 bg-gray-900">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left Side - Content */}
              <div className="text-white">
                <div className="mb-6">
                  <Mail className="w-12 h-12 mb-4" />
                  <h2 className="text-3xl md:text-4xl font-bold mb-3">
                    Subscribe to Our Newsletter
                  </h2>
                  <p className="text-lg text-white/90">
                    Get the latest updates on new products, special offers, and exclusive deals delivered to your inbox.
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-white/90">Exclusive deals & discounts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-white/90">New product announcements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-white/90">Weekly fresh produce updates</span>
                  </div>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="bg-white rounded-2xl border-0 p-6 md:p-8">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Thank You!
                    </h3>
                    <p className="text-gray-600">
                      You've successfully subscribed to our newsletter.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                        Enter Your Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="text-lg py-6"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold"
                    >
                      Subscribe Now
                      <Send className="w-5 h-5 ml-2" />
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      We respect your privacy. Unsubscribe at any time.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

