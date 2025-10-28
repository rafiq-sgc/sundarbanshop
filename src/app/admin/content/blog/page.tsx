'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { blogService, type BlogPost, type BlogStats } from '@/services/blog.service'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  Archive,
  Search,
  Filter,
  RefreshCcw,
  Loader2,
  Star,
  TrendingUp,
  MoreVertical,
  ExternalLink
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function BlogPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [stats, setStats] = useState<BlogStats>({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0,
    totalViews: 0
  })
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)

  useEffect(() => {
    if (isAuthorized) {
      fetchPosts()
    }
  }, [isAuthorized, statusFilter, categoryFilter])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isAuthorized) {
        fetchPosts()
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const result = await blogService.getBlogPosts({
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      })

      if (result.success && result.data) {
        setPosts(result.data.posts)
        setStats(result.data.stats)
        setCategories(result.data.categories)
      } else {
        toast.error(result.message || 'Failed to load blog posts')
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const result = await blogService.deleteBlogPost(deleteId)

      if (result.success) {
        toast.success('Blog post deleted successfully!')
        setShowDeleteDialog(false)
        setDeleteId(null)
        fetchPosts()
      } else {
        toast.error(result.message || 'Failed to delete blog post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete blog post')
    }
  }

  const handleQuickStatusChange = async (postId: string, newStatus: string) => {
    try {
      const result = await blogService.updateBlogPost(postId, { status: newStatus as any })

      if (result.success) {
        toast.success(`Status changed to ${newStatus}!`)
        fetchPosts()
      } else {
        toast.error(result.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading blog posts...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
              <p className="text-muted-foreground mt-2">
                Create and manage your blog content
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={fetchPosts} variant="outline" size="icon">
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Link href="/admin/content/blog/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Total Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Drafts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Archived
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {blogService.formatViews(stats.totalViews)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search posts by title, excerpt, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading posts...</p>
              </div>
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first blog post'}
                </p>
                {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
                  <Link href="/admin/content/blog/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Post
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post._id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                {/* Post Image */}
                {post.image && (
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {post.featured && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-yellow-500 text-white border-0">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className={blogService.getStatusColor(post.status)}>
                        {post.status === 'published' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {post.status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
                        {post.status === 'archived' && <Archive className="w-3 h-3 mr-1" />}
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                )}

                <CardContent className="pt-4">
                  {/* Category & Date */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="text-xs">
                      {post.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {post.publishedAt 
                        ? format(new Date(post.publishedAt), 'MMM dd, yyyy')
                        : format(new Date(post.createdAt), 'MMM dd, yyyy')}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {post.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{post.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{blogService.formatViews(post.views)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{post.author}</span>
                      </div>
                    </div>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/content/blog/${post._id}/edit`} className="flex items-center">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Post
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/blog/${post.slug}`} target="_blank" className="flex items-center">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Post
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        {post.status !== 'published' && (
                          <DropdownMenuItem onClick={() => handleQuickStatusChange(post._id, 'published')}>
                            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {post.status !== 'draft' && (
                          <DropdownMenuItem onClick={() => handleQuickStatusChange(post._id, 'draft')}>
                            <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                            Move to Draft
                          </DropdownMenuItem>
                        )}
                        {post.status !== 'archived' && (
                          <DropdownMenuItem onClick={() => handleQuickStatusChange(post._id, 'archived')}>
                            <Archive className="w-4 h-4 mr-2 text-gray-600" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setDeleteId(post._id)
                            setShowDeleteDialog(true)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete blog post?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this blog post? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete Post
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}
