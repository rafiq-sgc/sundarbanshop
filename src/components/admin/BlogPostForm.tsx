'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { blogService } from '@/services/blog.service'
import {
  Upload,
  Save,
  Loader2,
  ImageIcon,
  FileText,
  Tag,
  Folder,
  Calendar,
  Star,
  Globe,
  X
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// Validation schema
const blogPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  slug: z.string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  excerpt: z.string()
    .min(1, 'Excerpt is required')
    .max(500, 'Excerpt must be less than 500 characters'),
  content: z.string()
    .min(1, 'Content is required'),
  image: z.string().optional(),
  category: z.string()
    .min(1, 'Category is required'),
  tags: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  featured: z.boolean().optional(),
  metaTitle: z.string()
    .max(60, 'Meta title must be less than 60 characters')
    .optional(),
  metaDescription: z.string()
    .max(160, 'Meta description must be less than 160 characters')
    .optional(),
})

type BlogPostFormData = {
  title: string
  slug: string
  excerpt: string
  content: string
  image?: string
  category: string
  tags?: string
  status: 'draft' | 'published' | 'archived'
  featured?: boolean
  metaTitle?: string
  metaDescription?: string
}

const categories = [
  'General',
  'Health',
  'Tips',
  'Recipes',
  'News',
  'Guides',
  'Nutrition',
  'Lifestyle',
  'Sustainability',
  'Organic'
]

interface BlogPostFormProps {
  initialData?: Partial<BlogPostFormData>
  postId?: string
  onSubmit: (data: BlogPostFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export default function BlogPostForm({
  initialData,
  postId,
  onSubmit,
  onCancel,
  submitLabel = 'Save Post'
}: BlogPostFormProps) {
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      excerpt: initialData?.excerpt || '',
      content: initialData?.content || '',
      image: initialData?.image || '',
      category: initialData?.category || 'General',
      tags: initialData?.tags || '',
      status: initialData?.status || 'draft',
      featured: initialData?.featured || false,
      metaTitle: initialData?.metaTitle || '',
      metaDescription: initialData?.metaDescription || ''
    }
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = form

  const title = watch('title')
  const slug = watch('slug')
  const excerpt = watch('excerpt')
  const content = watch('content')
  const status = watch('status')
  const metaTitle = watch('metaTitle')
  const metaDescription = watch('metaDescription')

  // Initialize tags from initialData
  useEffect(() => {
    if (initialData?.tags) {
      const tagsArray = typeof initialData.tags === 'string' 
        ? initialData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : initialData.tags
      setTags(tagsArray)
    }
  }, [initialData?.tags])

  // Transliterate Bangla to English for slug
  const transliterateBanglaToEnglish = (text: string): string => {
    const banglaToEnglish: Record<string, string> = {
      'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'r',
      'ে': 'e', 'ৈ': 'ai', 'ো': 'o', 'ৌ': 'ou',
      'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
      'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
      'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
      'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
      'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
      'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh',
      'স': 's', 'হ': 'h', 'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
      'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
      'অ': 'a', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u',
      'ঋ': 'r', 'এ': 'e', 'ঐ': 'ai', 'ও': 'o', 'ঔ': 'ou',
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
      '্': '',
    }

    let transliterated = ''
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      transliterated += banglaToEnglish[char] || char
    }
    
    return transliterated
  }

  const generateSlugFromTitle = (title: string): string => {
    const transliterated = transliterateBanglaToEnglish(title)
    return transliterated
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (value: string) => {
    setValue('title', value)
    if (!postId && (!slug || slug === generateSlugFromTitle(title))) {
      setValue('slug', generateSlugFromTitle(value))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        setValue('image', reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag]
      setTags(newTags)
      setValue('tags', newTags.join(','))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    setValue('tags', newTags.join(','))
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleFormSubmit = async (data: BlogPostFormData) => {
    setSaving(true)
    try {
      await onSubmit({
        ...data,
        tags: tags
      } as any)
    } catch (error) {
      console.error('Error submitting form:', error)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Post Details
              </CardTitle>
              <CardDescription>
                Essential information about your blog post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter an engaging post title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {title.length}/200 characters
                </p>
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">
                  URL Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="post-url-slug"
                  className={`font-mono text-sm ${errors.slug ? 'border-red-500' : ''}`}
                />
                {errors.slug && (
                  <p className="text-sm text-red-500">{errors.slug.message}</p>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  /blog/{slug || 'post-url-slug'}
                </p>
              </div>

              {/* Excerpt */}
              <div className="space-y-2">
                <Label htmlFor="excerpt">
                  Excerpt <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="excerpt"
                  {...register('excerpt')}
                  placeholder="Write a brief summary (2-3 sentences)"
                  rows={4}
                  className={errors.excerpt ? 'border-red-500' : ''}
                />
                {errors.excerpt && (
                  <p className="text-sm text-red-500">{errors.excerpt.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {excerpt.length}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                Write your blog post content with full formatting support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <RichTextEditor
                  value={content}
                  onChange={(value) => setValue('content', value)}
                  placeholder="Start writing your blog post here..."
                  height="500px"
                />
                {errors.content && (
                  <p className="text-sm text-red-500">{errors.content.message}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Rich text editor with formatting tools</span>
                  <span>{content.replace(/<[^>]*>/g, '').length} characters</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Featured Image
              </CardTitle>
              <CardDescription>
                Upload an eye-catching image for your post
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImagePreview('')
                          setValue('image', '')
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-replace"
                      />
                      <Button type="button" variant="outline" size="sm" asChild>
                        <label htmlFor="image-replace" className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Replace
                        </label>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a featured image (max 5MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button type="button" variant="outline" asChild>
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Image
                      </label>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                SEO Settings
              </CardTitle>
              <CardDescription>
                Optimize your post for search engines (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  {...register('metaTitle')}
                  placeholder="SEO-friendly title"
                  className={errors.metaTitle ? 'border-red-500' : ''}
                />
                {errors.metaTitle && (
                  <p className="text-sm text-red-500">{errors.metaTitle.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {(metaTitle || '').length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  {...register('metaDescription')}
                  placeholder="SEO-friendly description"
                  rows={3}
                  className={errors.metaDescription ? 'border-red-500' : ''}
                />
                {errors.metaDescription && (
                  <p className="text-sm text-red-500">{errors.metaDescription.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {(metaDescription || '').length}/160 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right Side (1 column) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                defaultValue={initialData?.category || 'General'}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Press Enter or click Add to add tags
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Publish
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        Draft
                      </div>
                    </SelectItem>
                    <SelectItem value="published">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Published
                      </div>
                    </SelectItem>
                    <SelectItem value="archived">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-500" />
                        Archived
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="featured" className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Featured
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Highlight this post
                  </p>
                </div>
                <Switch
                  id="featured"
                  defaultChecked={initialData?.featured}
                  onCheckedChange={(checked) => setValue('featured', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {submitLabel}
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full"
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}

