import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Shield } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-12">
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li className="text-gray-900">Privacy Policy</li>
          </ol>
        </nav>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-600">Last updated: September 30, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This includes:</p>
            <ul>
              <li>Name and contact information (email, phone, address)</li>
              <li>Payment information (processed securely by our payment partners)</li>
              <li>Order history and preferences</li>
              <li>Communications with our customer service team</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your orders and account</li>
              <li>Improve our products and services</li>
              <li>Send you marketing communications (with your consent)</li>
              <li>Prevent fraud and enhance security</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul>
              <li>Service providers who help us operate our business</li>
              <li>Payment processors and shipping carriers</li>
              <li>Legal authorities when required by law</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information, including SSL encryption and secure payment processing.</p>

            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>

            <h2>6. Cookies</h2>
            <p>We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content.</p>

            <h2>7. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at:</p>
            <p>Email: privacy@ekomart.com<br />Phone: +1 (234) 567-8900</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
