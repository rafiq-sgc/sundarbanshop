'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const articles = [
  {
    id: 1,
    title: 'How to Style Your Summer Outfits',
    author: 'Jane Doe',
    date: 'March 15, 2024',
    image: '/images/blog/blog-1.jpg',
    comments: 12
  },
  {
    id: 2,
    title: '10 Must-Have Accessories for Men',
    author: 'John Smith',
    date: 'March 12, 2024',
    image: '/images/blog/blog-2.jpg',
    comments: 8
  },
  {
    id: 3,
    title: 'The Best Fabrics for Hot Weather',
    author: 'Sarah Johnson',
    date: 'March 10, 2024',
    image: '/images/blog/blog-3.jpg',
    comments: 15
  },
  {
    id: 4,
    title: '5 Tips for Shopping Online Safety',
    author: 'Mike Wilson',
    date: 'March 8, 2024',
    image: '/images/blog/blog-4.jpg',
    comments: 20
  }
]

export default function NewsArticlesSection() {
  return (
    <section className="py-4 sm:py-6 bg-gray-50">
      <div className="container">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">Our News & Articles</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {articles.map((article) => (
            <Link href={`/blog/${article.title.toLowerCase().replace(/\s+/g, '-')}`} key={article.id}>
              <Card className="group hover:shadow-lg transition-all duration-300">
                {/* Article Image */}
                <div className="relative h-48 bg-gray-200">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-lg"></div>
                </div>

                {/* Article Content */}
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <span className="font-semibold">{article.author}</span>
                    <span>•</span>
                    <span>{article.date}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-green-600 transition-colors">
                    {article.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MessageCircle className="w-4 h-4" />
                      <span>{article.comments} Comments</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 font-semibold group-hover:gap-2 transition-all">
                      Read More
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

