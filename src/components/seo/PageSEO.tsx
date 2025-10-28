import { Metadata } from 'next'

interface SEOProps {
  title: string
  description: string
  keywords?: string
  ogImage?: string
  canonicalUrl?: string
}

export function generatePageMetadata({
  title,
  description,
  keywords,
  ogImage = '/images/og-default.jpg',
  canonicalUrl
}: SEOProps): Metadata {
  const siteUrl = 'https://sundarbanshop.com' // Replace with your actual domain
  const fullTitle = `${title} | Sundarban Shop - Your Complete Grocery Store`

  return {
    title: fullTitle,
    description,
    keywords: keywords || 'grocery, online shopping, fresh food, delivery, ecommerce',
    authors: [{ name: 'Sundarban Shop Team' }],
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      url: canonicalUrl || siteUrl,
      siteName: 'Sundarban Shop',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage]
    },
    alternates: {
      canonical: canonicalUrl || siteUrl
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

// JSON-LD Structured Data
export function generateProductSchema(product: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Sundarban Shop'
      }
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount
    } : undefined
  }
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sundarban Shop',
    url: 'https://sundarbanshop.com',
    logo: 'https://sundarbanshop.com/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-234-567-8900',
      contactType: 'customer service',
      email: 'sundarbanshop.com@gmail.com'
    },
    sameAs: [
      'https://facebook.com/sundarbanshop',
      'https://twitter.com/sundarbanshop',
      'https://instagram.com/sundarbanshop'
    ]
  }
}
