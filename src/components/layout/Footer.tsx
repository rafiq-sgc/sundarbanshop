import Link from 'next/link'
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Phone, 
  Mail, 
  MapPin,
  Clock
} from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Track Order', href: '/track-order' },
      { name: 'FAQ', href: '/faq' }
    ],
    shop: [
      { name: 'Shop', href: '/shop' },
      { name: 'Compare Products', href: '/compare' },
      { name: 'Wishlist', href: '/dashboard/wishlist' },
      { name: 'My Account', href: '/dashboard' }
    ],
    support: [
      { name: 'FAQ', href: '/faq' },
      { name: 'Shipping Policy', href: '/shipping-policy' },
      { name: 'Return Policy', href: '/return-policy' },
      { name: 'Track Order', href: '/track-order' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Terms & Conditions', href: '/terms' },
      { name: 'Shipping Policy', href: '/shipping-policy' },
      { name: 'Return Policy', href: '/return-policy' }
    ]
  }

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">E</span>
              </div>
              <span className="text-3xl font-bold">Sundarban Shop</span>
            </Link>
            <p className="text-gray-300 mb-6 leading-relaxed text-lg">
              Your one-stop destination for fresh groceries and everyday essentials. 
              We deliver quality products right to your doorstep with fast and reliable service.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-green-600 transition-all duration-300">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-green-600 transition-all duration-300">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-green-600 transition-all duration-300">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-green-600 transition-all duration-300">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* About Company */}
          <div>
            <h3 className="text-xl font-bold mb-6">About Company</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-green-500 mt-1" />
                <div>
                  <p className="text-gray-300 text-sm">123 Grocery Street, City Center</p>
                  <p className="text-gray-300 text-sm">New York, NY 10001</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-gray-300 text-sm">+258 3284 214 85</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-gray-300 text-sm">Mon-Fri: 8:00am - 6:00pm</p>
                  <p className="text-gray-300 text-sm">Sat-Sun: 9:00am - 4:00pm</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h3 className="text-xl font-bold mb-6">Shop Categories</h3>
            <ul className="space-y-3">
              <li><Link href="/shop?category=breakfast-dairy" className="text-gray-300 hover:text-green-400 transition-colors">Breakfast & Dairy</Link></li>
              <li><Link href="/shop?category=meats-seafood" className="text-gray-300 hover:text-green-400 transition-colors">Meats & Seafood</Link></li>
              <li><Link href="/shop?category=breads-bakery" className="text-gray-300 hover:text-green-400 transition-colors">Breads & Bakery</Link></li>
              <li><Link href="/shop?category=chips-snacks" className="text-gray-300 hover:text-green-400 transition-colors">Chips & Snacks</Link></li>
              <li><Link href="/shop?category=medical-healthcare" className="text-gray-300 hover:text-green-400 transition-colors">Medical Healthcare</Link></li>
              <li><Link href="/shop?category=frozen-foods" className="text-gray-300 hover:text-green-400 transition-colors">Frozen Foods</Link></li>
            </ul>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-xl font-bold mb-6">Useful Links</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-gray-300 hover:text-green-400 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-green-400 transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="text-gray-300 hover:text-green-400 transition-colors">FAQ</Link></li>
              <li><Link href="/shipping-policy" className="text-gray-300 hover:text-green-400 transition-colors">Shipping Policy</Link></li>
              <li><Link href="/return-policy" className="text-gray-300 hover:text-green-400 transition-colors">Return Policy</Link></li>
              <li><Link href="/track-order" className="text-gray-300 hover:text-green-400 transition-colors">Track Order</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter & Payment Methods */}
        <div className="border-t border-gray-800 mt-12 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Newsletter */}
            <div>
              <h3 className="text-2xl font-bold mb-4">Our Newsletter</h3>
              <p className="text-gray-300 mb-6 text-lg">
                Subscribe to receive updates on new arrivals and special offers.
              </p>
              <div className="flex max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-l-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-white placeholder-gray-400"
                />
                <button className="px-8 py-4 bg-green-600 text-white rounded-r-xl hover:bg-green-700 transition-all duration-300 font-semibold">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Payment Methods & App Download */}
            <div>
              <h3 className="text-2xl font-bold mb-4">Payment Methods</h3>
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">VISA</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">MC</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">PP</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">AMZ</span>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4">Download App</h3>
              <div className="flex space-x-4">
                <a href="#" className="flex items-center space-x-2 bg-gray-800 px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors">
                  <span className="text-white font-semibold">Google Play</span>
                </a>
                <a href="#" className="flex items-center space-x-2 bg-gray-800 px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors">
                  <span className="text-white font-semibold">App Store</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} Sundarban Shop. All rights reserved.
            </div>
            <div className="flex items-center space-x-8">
              <Link href="/privacy-policy" className="text-gray-400 hover:text-green-400 text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-green-400 text-sm transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/shipping-policy" className="text-gray-400 hover:text-green-400 text-sm transition-colors">
                Shipping Policy
              </Link>
              <Link href="/return-policy" className="text-gray-400 hover:text-green-400 text-sm transition-colors">
                Return Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
