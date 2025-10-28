'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { ChevronDown, Search } from 'lucide-react'
import Link from 'next/link'

const faqs = [
  {
    category: 'Orders & Shipping',
    questions: [
      {
        q: 'How long does shipping take?',
        a: 'Standard shipping typically takes 3-5 business days. Express shipping is available for 1-2 day delivery.'
      },
      {
        q: 'Do you ship internationally?',
        a: 'Currently, we ship within the United States. International shipping will be available soon.'
      },
      {
        q: 'How can I track my order?',
        a: 'You can track your order using the tracking link in your shipping confirmation email, or visit our Track Order page.'
      }
    ]
  },
  {
    category: 'Returns & Refunds',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 30-day return policy for most items. Products must be unused and in original packaging.'
      },
      {
        q: 'How do I initiate a return?',
        a: 'Go to your order history, select the order, and click "Request Return". Follow the instructions to complete the process.'
      },
      {
        q: 'When will I receive my refund?',
        a: 'Refunds are processed within 5-7 business days after we receive your return.'
      }
    ]
  },
  {
    category: 'Payments',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and Cash on Delivery.'
      },
      {
        q: 'Is it safe to use my credit card?',
        a: 'Yes! We use industry-standard SSL encryption to protect your payment information.'
      }
    ]
  },
  {
    category: 'Products',
    questions: [
      {
        q: 'Are your products organic?',
        a: 'Many of our products are organic and clearly labeled. Look for the "Organic" badge on product pages.'
      },
      {
        q: 'How fresh are the products?',
        a: 'We source directly from local farmers and restock daily to ensure maximum freshness.'
      }
    ]
  }
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const toggleQuestion = (key: string) => {
    setOpenIndex(openIndex === key ? null : key)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-12">
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li className="text-gray-900">FAQ</li>
          </ol>
        </nav>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-gray-600">Find answers to common questions about our products and services</p>
          </div>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-8">
            {faqs.map((category, catIndex) => (
              <div key={catIndex}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.category}</h2>
                <div className="space-y-3">
                  {category.questions.map((faq, qIndex) => {
                    const key = `${catIndex}-${qIndex}`
                    const isOpen = openIndex === key
                    
                    return (
                      <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => toggleQuestion(key)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`} />
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-4 text-gray-600">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
            <p className="text-gray-600 mb-4">Can't find the answer you're looking for? Please contact our support team.</p>
            <Link href="/contact" className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
