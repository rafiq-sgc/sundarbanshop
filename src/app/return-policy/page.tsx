import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { RotateCcw } from 'lucide-react'
import Link from 'next/link'

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-12">
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li className="text-gray-900">Return Policy</li>
          </ol>
        </nav>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">
          <div className="text-center mb-8">
            <RotateCcw className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Return Policy</h1>
            <p className="text-gray-600">30-day hassle-free returns</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>Our Return Promise</h2>
            <p>We want you to be completely satisfied with your purchase. If you're not happy, we offer a 30-day return policy on most items.</p>

            <h2>Return Eligibility</h2>
            <p>To be eligible for a return, items must:</p>
            <ul>
              <li>Be returned within 30 days of delivery</li>
              <li>Be unused and in original condition</li>
              <li>Include original packaging and tags</li>
              <li>Have proof of purchase (order number or receipt)</li>
            </ul>

            <h2>Non-Returnable Items</h2>
            <p>Some items cannot be returned for health and safety reasons:</p>
            <ul>
              <li>Perishable goods (fresh produce, dairy, meat)</li>
              <li>Personal care items that have been opened</li>
              <li>Gift cards and downloadable products</li>
            </ul>

            <h2>How to Return</h2>
            <ol>
              <li>Log in to your account and go to Order History</li>
              <li>Select the order and click "Request Return"</li>
              <li>Choose items and provide a reason</li>
              <li>Print the prepaid return label</li>
              <li>Package items securely and ship back</li>
            </ol>

            <h2>Refund Process</h2>
            <p>Once we receive your return:</p>
            <ul>
              <li>We'll inspect the items within 2-3 business days</li>
              <li>If approved, refund will be processed to original payment method</li>
              <li>Refunds typically appear within 5-7 business days</li>
            </ul>

            <h2>Exchanges</h2>
            <p>We currently don't offer direct exchanges. Please return the item for a refund and place a new order.</p>

            <h2>Return Shipping</h2>
            <p>Return shipping is FREE for defective or incorrect items. For other returns, a $5.99 return shipping fee will be deducted from your refund.</p>

            <h2>Questions?</h2>
            <p>Contact our support team at returns@ekomart.com or call +1 (234) 567-8900</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
