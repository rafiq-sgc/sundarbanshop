'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import BlogPostForm from '@/components/admin/BlogPostForm'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { blogService } from '@/services/blog.service'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function EditBlogPostPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [postData, setPostData] = useState<any>(null)

  useEffect(() => {
    if (isAuthorized && params.id) {
      fetchPost()
    }
  }, [isAuthorized, params.id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const result = await blogService.getBlogPostById(params.id as string)

      if (result.success && result.data) {
        setPostData(result.data)
      } else {
        toast.error(result.message || 'Failed to load blog post')
        router.push('/admin/content/blog')
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      toast.error('Failed to load blog post')
      router.push('/admin/content/blog')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    const result = await blogService.updateBlogPost(params.id as string, data)

    if (result.success) {
      toast.success('Blog post updated successfully!')
      router.push('/admin/content/blog')
    } else {
      toast.error(result.message || 'Failed to update blog post')
      throw new Error(result.message)
    }
  }

  const handleCancel = () => {
    router.push('/admin/content/blog')
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading blog post...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthorized || !postData) {
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Blog Post</h1>
            <p className="text-muted-foreground mt-2">
              Update your blog post content
            </p>
          </div>
        </div>

        <BlogPostForm
          initialData={postData}
          postId={params.id as string}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Update Post"
        />
      </div>
    </AdminLayout>
  )
}
