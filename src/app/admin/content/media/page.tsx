'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import AdminLayout from '@/components/admin/AdminLayout'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { mediaService, type MediaAsset, type MediaStats } from '@/services/media.service'
import {
  Upload,
  Loader2,
  Search,
  Grid3x3,
  LayoutList,
  ImageIcon,
  Video,
  FileText,
  File,
  Trash2,
  Edit,
  Copy,
  Check,
  X,
  Download,
  Eye,
  RefreshCcw,
  Folder,
  Tag,
  HardDrive,
  Save
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import Image from 'next/image'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Validation schemas
const uploadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  folder: z.string().optional(),
  tags: z.string().optional(),
  altText: z.string().max(200, 'Alt text too long').optional(),
})

const editSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  folder: z.string().optional(),
  tags: z.string().optional(),
  altText: z.string().max(200, 'Alt text too long').optional(),
})

type UploadFormData = z.infer<typeof uploadSchema>
type EditFormData = z.infer<typeof editSchema>

export default function MediaGalleryPage() {
  const { isAuthorized, loading: authLoading } = useAdminAuth()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [stats, setStats] = useState<MediaStats>({
    total: 0,
    images: 0,
    videos: 0,
    documents: 0,
    totalSize: 0
  })
  const [folders, setFolders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [folderFilter, setFolderFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editTags, setEditTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showEditFolderInput, setShowEditFolderInput] = useState(false)
  const [editNewFolderName, setEditNewFolderName] = useState('')

  const uploadForm = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      name: '',
      folder: 'uncategorized',
      tags: '',
      altText: ''
    }
  })

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema)
  })

  useEffect(() => {
    if (isAuthorized) {
      fetchAssets()
    }
  }, [isAuthorized, folderFilter, typeFilter])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isAuthorized) {
        fetchAssets()
      }
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const result = await mediaService.getMediaAssets({
        search: searchTerm || undefined,
        folder: folderFilter !== 'all' ? folderFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined
      })

      if (result.success && result.data) {
        setAssets(result.data.assets)
        setStats(result.data.stats)
        setFolders(result.data.folders)
      } else {
        toast.error(result.message || 'Failed to load media')
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
      toast.error('Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedFiles(files)
      uploadForm.setValue('name', files[0].name.replace(/\.[^/.]+$/, ''))
      setShowUploadDialog(true)
    }
  }

  const handleUpload = async (data: UploadFormData) => {
    if (selectedFiles.length === 0) return

    try {
      setUploading(true)

      for (const file of selectedFiles) {
        const validation = mediaService.validateImageFile(file)
        if (!validation.valid) {
          toast.error(validation.error || 'Invalid file')
          continue
        }

        const base64 = await mediaService.fileToBase64(file)
        const dimensions = await mediaService.getImageDimensions(file)

        const result = await mediaService.uploadMediaAsset({
          name: data.name || file.name,
          filename: file.name,
          url: base64,
          mimeType: file.type,
          size: file.size,
          width: dimensions.width,
          height: dimensions.height,
          folder: data.folder || 'uncategorized',
          tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          altText: data.altText
        })

        if (result.success) {
          toast.success(`${file.name} uploaded successfully!`)
        } else {
          toast.error(result.message || `Failed to upload ${file.name}`)
        }
      }

      setShowUploadDialog(false)
      setSelectedFiles([])
      uploadForm.reset()
      fetchAssets()
    } catch (error) {
      console.error('Error uploading:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (asset: MediaAsset) => {
    setSelectedAsset(asset)
    setEditTags(asset.tags || [])
    editForm.reset({
      name: asset.name,
      folder: asset.folder || 'uncategorized',
      tags: asset.tags?.join(', ') || '',
      altText: asset.altText || ''
    })
    setShowEditDialog(true)
  }

  const handleUpdate = async (data: EditFormData) => {
    if (!selectedAsset) return

    try {
      const result = await mediaService.updateMediaAsset(selectedAsset._id, {
        name: data.name,
        folder: data.folder,
        tags: editTags,
        altText: data.altText
      })

      if (result.success) {
        toast.success('Media updated successfully!')
        setShowEditDialog(false)
        setSelectedAsset(null)
        fetchAssets()
      } else {
        toast.error(result.message || 'Failed to update media')
      }
    } catch (error) {
      console.error('Error updating:', error)
      toast.error('Failed to update media')
    }
  }

  const handleDelete = async () => {
    if (!selectedAsset) return

    try {
      const result = await mediaService.deleteMediaAsset(selectedAsset._id)

      if (result.success) {
        toast.success('Media deleted successfully!')
        setShowDeleteDialog(false)
        setSelectedAsset(null)
        fetchAssets()
      } else {
        toast.error(result.message || 'Failed to delete media')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Failed to delete media')
    }
  }

  const handleCopyUrl = async (url: string, id: string) => {
    const success = await mediaService.copyToClipboard(url)
    if (success) {
      setCopiedId(id)
      toast.success('URL copied to clipboard!')
      setTimeout(() => setCopiedId(null), 2000)
    } else {
      toast.error('Failed to copy URL')
    }
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !editTags.includes(trimmedTag)) {
      const newTags = [...editTags, trimmedTag]
      setEditTags(newTags)
      editForm.setValue('tags', newTags.join(', '))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = editTags.filter(tag => tag !== tagToRemove)
    setEditTags(newTags)
    editForm.setValue('tags', newTags.join(', '))
  }

  if (authLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading media gallery...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!isAuthorized) {
    return null
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchTerm || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.filename.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Media Gallery</h1>
              <p className="text-muted-foreground mt-2">
                Manage your images, videos, and documents
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={fetchAssets} variant="outline" size="icon">
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </label>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <File className="w-4 h-4" />
                Total Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.images}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Video className="w-4 h-4" />
                Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">{stats.videos}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.documents}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Total Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-green-600">
                {mediaService.formatFileSize(stats.totalSize)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & View Mode */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or filename..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="application">Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={folderFilter} onValueChange={setFolderFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Folders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Folders</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder} value={folder}>
                        {folder}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Grid/List */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading media...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredAssets.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {searchTerm || folderFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Upload your first media file to get started'}
                </p>
                {!searchTerm && folderFilter === 'all' && typeFilter === 'all' && (
                  <label htmlFor="file-upload">
                    <Button asChild>
                      <span className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Files
                      </span>
                    </Button>
                  </label>
                )}
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredAssets.map((asset) => (
              <Card key={asset._id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                {/* Preview */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {asset.mimeType.startsWith('image/') ? (
                    <Image
                      src={asset.url}
                      alt={asset.altText || asset.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {asset.mimeType.startsWith('video/') ? (
                        <Video className="w-16 h-16 text-purple-400" />
                      ) : (
                        <FileText className="w-16 h-16 text-red-400" />
                      )}
                    </div>
                  )}
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => {
                        setSelectedAsset(asset)
                        setShowDetailsDialog(true)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleEdit(asset)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleCopyUrl(asset.url, asset._id)}
                    >
                      {copiedId === asset._id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => {
                        setSelectedAsset(asset)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate" title={asset.name}>
                    {asset.name}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{mediaService.formatFileSize(asset.size)}</span>
                    {asset.width && asset.height && (
                      <span>{asset.width}×{asset.height}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredAssets.map((asset) => (
                  <div key={asset._id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Preview */}
                      <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {asset.mimeType.startsWith('image/') ? (
                          <Image
                            src={asset.url}
                            alt={asset.altText || asset.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {asset.mimeType.startsWith('video/') ? (
                              <Video className="w-8 h-8 text-purple-400" />
                            ) : (
                              <FileText className="w-8 h-8 text-red-400" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{asset.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{mediaService.formatFileSize(asset.size)}</span>
                          {asset.width && asset.height && (
                            <span>{asset.width}×{asset.height}</span>
                          )}
                          <span>{format(new Date(asset.createdAt), 'MMM dd, yyyy')}</span>
                          {asset.folder && (
                            <Badge variant="outline" className="text-xs">
                              {asset.folder}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedAsset(asset)
                            setShowDetailsDialog(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(asset)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopyUrl(asset.url, asset._id)}
                        >
                          {copiedId === asset._id ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedAsset(asset)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Media Files</DialogTitle>
              <DialogDescription>
                {selectedFiles.length} file(s) selected
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={uploadForm.handleSubmit(handleUpload)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upload-name">File Name</Label>
                <Input
                  id="upload-name"
                  {...uploadForm.register('name')}
                  placeholder="Enter a descriptive name"
                />
                {uploadForm.formState.errors.name && (
                  <p className="text-sm text-red-500">{uploadForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-folder">Folder</Label>
                {showNewFolderInput ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="New folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (newFolderName.trim()) {
                          uploadForm.setValue('folder', newFolderName.trim().toLowerCase())
                          setShowNewFolderInput(false)
                          setNewFolderName('')
                          toast.success(`Folder "${newFolderName}" will be created`)
                        }
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowNewFolderInput(false)
                        setNewFolderName('')
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Select
                      defaultValue="uncategorized"
                      onValueChange={(value) => {
                        if (value === 'new') {
                          setShowNewFolderInput(true)
                        } else {
                          uploadForm.setValue('folder', value)
                        }
                      }}
                    >
                      <SelectTrigger id="upload-folder">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uncategorized">Uncategorized</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder} value={folder}>
                            {folder.charAt(0).toUpperCase() + folder.slice(1)}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">
                          <div className="flex items-center gap-2 text-primary">
                            <Folder className="w-4 h-4" />
                            + Create New Folder
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select a folder or create a new one
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-tags">Tags</Label>
                <Input
                  id="upload-tags"
                  {...uploadForm.register('tags')}
                  placeholder="product, banner, organic (comma-separated)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-altText">Alt Text (for SEO)</Label>
                <Textarea
                  id="upload-altText"
                  {...uploadForm.register('altText')}
                  placeholder="Describe the image for accessibility"
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowUploadDialog(false)
                    setSelectedFiles([])
                    uploadForm.reset()
                  }}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Media Asset</DialogTitle>
              <DialogDescription>
                Update media information
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">File Name</Label>
                <Input
                  id="edit-name"
                  {...editForm.register('name')}
                  placeholder="Enter a descriptive name"
                />
                {editForm.formState.errors.name && (
                  <p className="text-sm text-red-500">{editForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-folder">Folder</Label>
                {showEditFolderInput ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="New folder name"
                      value={editNewFolderName}
                      onChange={(e) => setEditNewFolderName(e.target.value)}
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (editNewFolderName.trim()) {
                          editForm.setValue('folder', editNewFolderName.trim().toLowerCase())
                          setShowEditFolderInput(false)
                          setEditNewFolderName('')
                          toast.success(`Folder "${editNewFolderName}" will be created`)
                        }
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowEditFolderInput(false)
                        setEditNewFolderName('')
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Select
                    defaultValue={selectedAsset?.folder || 'uncategorized'}
                    onValueChange={(value) => {
                      if (value === 'new') {
                        setShowEditFolderInput(true)
                      } else {
                        editForm.setValue('folder', value)
                      }
                    }}
                  >
                    <SelectTrigger id="edit-folder">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">Uncategorized</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder} value={folder}>
                          {folder.charAt(0).toUpperCase() + folder.slice(1)}
                        </SelectItem>
                      ))}
                      <SelectItem value="new">
                        <div className="flex items-center gap-2 text-primary">
                          <Folder className="w-4 h-4" />
                          + Create New Folder
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
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
                {editTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editTags.map((tag) => (
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-altText">Alt Text</Label>
                <Textarea
                  id="edit-altText"
                  {...editForm.register('altText')}
                  placeholder="Describe the image for accessibility"
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false)
                    setSelectedAsset(null)
                    setEditTags([])
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Media Details</DialogTitle>
            </DialogHeader>

            {selectedAsset && (
              <div className="space-y-6">
                {/* Preview */}
                <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden">
                  {selectedAsset.mimeType.startsWith('image/') ? (
                    <Image
                      src={selectedAsset.url}
                      alt={selectedAsset.altText || selectedAsset.name}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {selectedAsset.mimeType.startsWith('video/') ? (
                        <Video className="w-24 h-24 text-purple-400" />
                      ) : (
                        <FileText className="w-24 h-24 text-red-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Information */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">File Name</p>
                    <p className="font-medium">{selectedAsset.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">File Size</p>
                    <p className="font-medium">{mediaService.formatFileSize(selectedAsset.size)}</p>
                  </div>
                  {selectedAsset.width && selectedAsset.height && (
                    <div>
                      <p className="text-muted-foreground mb-1">Dimensions</p>
                      <p className="font-medium">{selectedAsset.width} × {selectedAsset.height}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground mb-1">Type</p>
                    <p className="font-medium">{selectedAsset.mimeType}</p>
                  </div>
                  {selectedAsset.folder && (
                    <div>
                      <p className="text-muted-foreground mb-1">Folder</p>
                      <Badge variant="outline">{selectedAsset.folder}</Badge>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground mb-1">Uploaded By</p>
                    <p className="font-medium">{selectedAsset.uploadedBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Upload Date</p>
                    <p className="font-medium">{format(new Date(selectedAsset.createdAt), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Used In</p>
                    <p className="font-medium">{selectedAsset.usedIn?.length || 0} places</p>
                  </div>
                </div>

                {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAsset.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">#{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAsset.altText && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Alt Text</p>
                    <p className="text-sm">{selectedAsset.altText}</p>
                  </div>
                )}

                {/* URL */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">URL</p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-muted px-3 py-2 rounded overflow-x-auto">
                      {selectedAsset.url}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyUrl(selectedAsset.url, selectedAsset._id)}
                    >
                      {copiedId === selectedAsset._id ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete media asset?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedAsset?.name}"? This action cannot be undone.
                {selectedAsset?.usedIn && selectedAsset.usedIn.length > 0 && (
                  <span className="block mt-2 text-red-600 font-medium">
                    Warning: This media is used in {selectedAsset.usedIn.length} place(s).
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedAsset(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
}
