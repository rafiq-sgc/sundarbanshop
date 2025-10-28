import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { WishlistProvider } from '@/store/wishlist-context'
import { CompareProvider } from '@/store/compare-context'
import { ChatProvider } from '@/store/chat-context'
import { CartProvider } from '@/store/cart-api-context'
import ChatButton from '@/components/chat/ChatButton'
import CustomerChat from '@/components/chat/CustomerChat'
import { Toaster } from 'react-hot-toast'
import TopPromoBar from '@/components/layout/TopPromoBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ekomart - Your Complete Grocery Store',
  description: 'Shop fresh groceries online with fast delivery and great prices',
  keywords: 'grocery, online shopping, fresh food, delivery',
  authors: [{ name: 'Ekomart Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <ChatProvider>
                  <TopPromoBar />
                  {children}
                  <ChatButton />
                  <CustomerChat />
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                    }}
                  />
                </ChatProvider>
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </Providers>
      </body>
    </html>
  )
}
