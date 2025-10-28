'use client'

import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import BlogPostForm from '@/components/admin/BlogPostForm'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { blogService } from '@/services/blog.service'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function NewBlogPostPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const router = useRouter()

  const handleSubmit = async (data: any) => {
    const result = await blogService.createBlogPost(data)

    if (result.success) {
      toast.success(`Blog post ${data.status === 'published' ? 'published' : 'saved as draft'} successfully!`)
      router.push('/admin/content/blog')
    } else {
      toast.error(result.message || 'Failed to create blog post')
      throw new Error(result.message)
    }
  }

  const handleCancel = () => {
    router.push('/admin/content/blog')
  }

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/content/blog"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog Posts
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Blog Post</h1>
            <p className="text-muted-foreground mt-2">
              Write and publish engaging content for your audience
            </p>
          </div>
        </div>

        <BlogPostForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Create Post"
        />
      </div>
    </AdminLayout>
  )
}
