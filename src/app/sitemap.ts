import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://sundarbanshop.com' // Replace with your actual domain

  // Static pages
  const staticPages = [
    '',
    '/shop',
    '/about',
    '/contact',
    '/faq',
    '/privacy-policy',
    '/terms',
    '/shipping-policy',
    '/return-policy',
    '/track-order',
    '/compare'
  ]

  // You can fetch dynamic product/category URLs from your database
  // For now, using static examples
  const productPages = [
    '/products/details-profitable-business',
    '/products/firebase-business-profit',
    '/products/netlyfy-business-profit',
    '/products/fresh-organic-milk'
  ]

  const categoryPages = [
    '/shop?category=breakfast-dairy',
    '/shop?category=meats-seafood',
    '/shop?category=breads-bakery',
    '/shop?category=chips-snacks'
  ]

  const allPages = [
    ...staticPages.map(page => ({
      url: `${baseUrl}${page}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1 : 0.8,
    })),
    ...productPages.map(page => ({
      url: `${baseUrl}${page}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
    ...categoryPages.map(page => ({
      url: `${baseUrl}${page}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ]

  return allPages
}
