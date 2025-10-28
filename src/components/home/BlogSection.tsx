import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, ArrowRight } from 'lucide-react'

// Mock data for blog posts
const blogPosts = [
  {
    _id: '1',
    title: 'Shion Fixation: Fueling Your Passion for All Things Stylish',
    slug: 'shion-fixation-stylish-passion',
    excerpt: 'Discover the latest trends in fashion and style that will transform your wardrobe.',
    featuredImage: '/images/blog/blog-1.jpg',
    author: 'Sarah Johnson',
    category: 'Modern Fashion',
    publishedAt: new Date('2023-09-15'),
    readTime: '5 min read'
  },
  {
    _id: '2',
    title: 'Ashion Fixation: Fueling Your Passion for All Things Stylish',
    slug: 'ashion-fixation-stylish-passion',
    excerpt: 'Explore the world of sustainable fashion and eco-friendly clothing choices.',
    featuredImage: '/images/blog/blog-2.jpg',
    author: 'Mike Chen',
    category: 'Modern Fashion',
    publishedAt: new Date('2023-09-15'),
    readTime: '7 min read'
  },
  {
    _id: '3',
    title: 'Fixation: Fueling Your Passion for All Things Stylish',
    slug: 'fixation-stylish-passion',
    excerpt: 'Learn about the psychology of fashion and how it affects our daily lives.',
    featuredImage: '/images/blog/blog-3.jpg',
    author: 'Emma Wilson',
    category: 'Modern Fashion',
    publishedAt: new Date('2023-09-15'),
    readTime: '4 min read'
  },
  {
    _id: '4',
    title: 'Fashion Fixation: Fueling Your Passion for All Things Stylish',
    slug: 'fashion-fixation-stylish-passion',
    excerpt: 'Get inspired by celebrity fashion and learn how to recreate their looks.',
    featuredImage: '/images/blog/blog-4.jpg',
    author: 'David Brown',
    category: 'Modern Fashion',
    publishedAt: new Date('2023-09-15'),
    readTime: '6 min read'
  }
]

export default function BlogSection() {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <section className="py-20 bg-gradient-to-br from-white to-gray-50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Latest Blog Post Insights</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Stay updated with the latest trends, tips, and insights from our expert team
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.slice(0, 3).map((post) => (
            <article key={post._id} className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group border border-gray-100 hover:border-green-200">
              <div className="relative overflow-hidden">
                <Image
                  src={post.featuredImage || '/images/placeholder-blog.jpg'}
                  alt={post.title}
                  width={400}
                  height={250}
                  className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  {post.category}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <div className="p-8">
                <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{formatDate(post.publishedAt)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{post.author}</span>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-4 line-clamp-2 text-xl leading-tight group-hover:text-green-600 transition-colors">
                  {post.title}
                </h3>

                <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">{post.readTime}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center text-green-600 hover:text-green-700 font-semibold group-hover:translate-x-1 transition-all duration-300"
                  >
                    Read Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link
            href="/blog"
            className="inline-flex items-center px-10 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            View All Blog Posts
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  )
}
