import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { FileText } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container py-12">
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center space-x-2">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li className="text-gray-900">Terms & Conditions</li>
          </ol>
        </nav>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">
          <div className="text-center mb-8">
            <FileText className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
            <p className="text-gray-600">Last updated: September 30, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>1. Agreement to Terms</h2>
            <p>By accessing and using Ekomart, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.</p>

            <h2>2. Use of Service</h2>
            <p>You must be at least 18 years old to use this service. You agree to provide accurate information and maintain the security of your account.</p>

            <h2>3. Products and Pricing</h2>
            <p>All prices are in USD and subject to change without notice. We strive to display accurate product information but cannot guarantee complete accuracy.</p>

            <h2>4. Orders and Payment</h2>
            <p>All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason.</p>

            <h2>5. Shipping and Delivery</h2>
            <p>Delivery times are estimates and not guaranteed. Risk of loss passes to you upon delivery to the carrier.</p>

            <h2>6. Returns and Refunds</h2>
            <p>Please refer to our Return Policy for detailed information about returns and refunds.</p>

            <h2>7. Intellectual Property</h2>
            <p>All content on this website, including text, graphics, logos, and images, is the property of Ekomart and protected by copyright laws.</p>

            <h2>8. Limitation of Liability</h2>
            <p>Ekomart shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our service.</p>

            <h2>9. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.</p>

            <h2>10. Contact Information</h2>
            <p>For questions about these Terms, contact us at legal@ekomart.com</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
