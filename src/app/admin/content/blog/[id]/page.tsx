'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { blogService } from '@/services/blog.service'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Tag,
  Folder,
  Loader2,
  ExternalLink,
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  Archive
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'

export default function BlogPostDetailPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const router = useRouter()
  const params = useParams()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

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
        setPost(result.data)
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

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const result = await blogService.deleteBlogPost(params.id as string)

      if (result.success) {
        toast.success('Blog post deleted successfully!')
        router.push('/admin/content/blog')
      } else {
        toast.error(result.message || 'Failed to delete blog post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete blog post')
    } finally {
      setDeleting(false)
    }
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

  if (!isAuthorized || !post) {
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

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
                {post.featured && (
                  <Badge className="bg-yellow-500 text-white border-0">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {post.author}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.publishedAt 
                    ? format(new Date(post.publishedAt), 'MMM dd, yyyy')
                    : format(new Date(post.createdAt), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {blogService.formatViews(post.views)} views
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/blog/${post.slug}`} target="_blank">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Live
                </Button>
              </Link>
              <Link href={`/admin/content/blog/${post._id}/edit`}>
                <Button size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={deleting}>
                    <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete blog post?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{post.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Delete Post
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Featured Image */}
            {post.image && (
              <Card className="overflow-hidden">
                <div className="relative h-96">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </Card>
            )}

            {/* Excerpt */}
            <Card>
              <CardHeader>
                <CardTitle>Excerpt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{post.excerpt}</p>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </CardContent>
            </Card>

            {/* SEO Information */}
            {(post.metaTitle || post.metaDescription) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    SEO Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {post.metaTitle && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Meta Title</p>
                      <p className="text-sm">{post.metaTitle}</p>
                    </div>
                  )}
                  {post.metaDescription && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Meta Description</p>
                      <p className="text-sm">{post.metaDescription}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={blogService.getStatusColor(post.status)}>
                  {post.status === 'published' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {post.status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
                  {post.status === 'archived' && <Archive className="w-3 h-3 mr-1" />}
                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                </Badge>
                {post.publishedAt && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Published on {format(new Date(post.publishedAt), 'MMM dd, yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">{post.category}</Badge>
              </CardContent>
            </Card>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(post.tags) ? post.tags : [post.tags]).map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Views
                  </span>
                  <span className="text-sm font-semibold">
                    {post.views.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created
                  </span>
                  <span className="text-sm">
                    {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Updated
                      </span>
                      <span className="text-sm">
                        {format(new Date(post.updatedAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* URL */}
            <Card>
              <CardHeader>
                <CardTitle>URL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Slug</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded block">
                    {post.slug}
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">Full URL</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                    /blog/{post.slug}
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
