'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Wand2,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { variantService, type ProductAttribute, type ProductVariant } from '@/services/admin'

interface VariantManagerProps {
  productId: string
  categoryId?: string
  onVariantsChange?: (variants: ProductVariant[], attributes: ProductAttribute[]) => void
}

export default function VariantManager({ productId, categoryId, onVariantsChange }: VariantManagerProps) {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [categoryAttributes, setCategoryAttributes] = useState<ProductAttribute[]>([])

  // Attribute input states
  const [newAttributeName, setNewAttributeName] = useState('')
  const [newAttributeValues, setNewAttributeValues] = useState('')

  // Generate variant states
  const [generateAttributes, setGenerateAttributes] = useState<Array<{ name: string; values: string }>>([
    { name: '', values: '' }
  ])
  const [basePrice, setBasePrice] = useState('')
  const [baseStock, setBaseStock] = useState('')
  const [skuPrefix, setSkuPrefix] = useState('')

  useEffect(() => {
    if (productId) {
      fetchVariants()
    }
  }, [productId])

  useEffect(() => {
    if (categoryId) {
      fetchCategoryAttributes()
    }
  }, [categoryId])

  const fetchCategoryAttributes = async () => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}/attributes`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setCategoryAttributes(result.data)
      }
    } catch (error: any) {
      console.error('Error fetching category attributes:', error)
    }
  }

  const fetchVariants = async () => {
    try {
      setLoading(true)
      const result = await variantService.getVariants(productId)
      if (result.success && result.data) {
        setVariants(result.data.variants)
        setAttributes(result.data.attributes)
      }
    } catch (error: any) {
      console.error('Error fetching variants:', error)
      toast.error(error.message || 'Failed to load variants')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadCategoryAttributes = () => {
    if (categoryAttributes.length === 0) {
      toast.error('No attribute templates defined for this category')
      return
    }

    setAttributes(categoryAttributes)
    toast.success(`Loaded ${categoryAttributes.length} attribute(s) from category template`)
  }

  const handleAddAttribute = () => {
    if (!newAttributeName || !newAttributeValues) {
      toast.error('Please enter attribute name and values')
      return
    }

    const values = newAttributeValues.split(',').map(v => v.trim()).filter(v => v)
    if (values.length === 0) {
      toast.error('Please enter at least one value')
      return
    }

    const newAttribute: ProductAttribute = {
      name: newAttributeName,
      values: values,
      isRequired: true
    }

    setAttributes([...attributes, newAttribute])
    setNewAttributeName('')
    setNewAttributeValues('')
    toast.success('Attribute added. Click "Save Attributes" to apply.')
  }

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const handleSaveAttributes = async () => {
    try {
      await variantService.updateAttributes(productId, attributes)
      toast.success('Attributes saved successfully')
      if (onVariantsChange) {
        onVariantsChange(variants, attributes)
      }
    } catch (error: any) {
      console.error('Error saving attributes:', error)
      toast.error(error.message || 'Failed to save attributes')
    }
  }

  const handleGenerateVariants = async () => {
    const validAttributes = generateAttributes.filter(
      attr => attr.name && attr.values
    )

    if (validAttributes.length === 0) {
      toast.error('Please add at least one attribute with values')
      return
    }

    if (!basePrice) {
      toast.error('Please enter base price')
      return
    }

    try {
      setGenerating(true)
      const result = await variantService.generateVariants(productId, {
        attributes: validAttributes.map(attr => ({
          name: attr.name,
          values: attr.values.split(',').map(v => v.trim()).filter(v => v)
        })),
        basePrice: Number(basePrice),
        baseStock: Number(baseStock) || 0,
        skuPrefix: skuPrefix || undefined
      })

      if (result.success && result.data) {
        setVariants(result.data.variants)
        setAttributes(result.data.attributes)
        toast.success(`${result.data.count} variants generated successfully!`)
        setShowGenerateModal(false)
        // Reset form
        setGenerateAttributes([{ name: '', values: '' }])
        setBasePrice('')
        setBaseStock('')
        setSkuPrefix('')
        
        if (onVariantsChange) {
          onVariantsChange(result.data.variants, result.data.attributes)
        }
      }
    } catch (error: any) {
      console.error('Error generating variants:', error)
      toast.error(error.message || 'Failed to generate variants')
    } finally {
      setGenerating(false)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return

    try {
      await variantService.deleteVariant(productId, variantId)
      setVariants(variants.filter(v => v._id !== variantId))
      toast.success('Variant deleted successfully')
      
      if (onVariantsChange) {
        onVariantsChange(variants.filter(v => v._id !== variantId), attributes)
      }
    } catch (error: any) {
      console.error('Error deleting variant:', error)
      toast.error(error.message || 'Failed to delete variant')
    }
  }

  const handleUpdateVariant = async (variantId: string, updates: Partial<ProductVariant>) => {
    try {
      const result = await variantService.updateVariant(productId, variantId, updates)
      if (result.success) {
        await fetchVariants()
        toast.success('Variant updated successfully')
        setEditingVariant(null)
      }
    } catch (error: any) {
      console.error('Error updating variant:', error)
      toast.error(error.message || 'Failed to update variant')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading variants...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Attributes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product Attributes</CardTitle>
            <div className="flex gap-2">
              {categoryId && categoryAttributes.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadCategoryAttributes}
                  className="gap-2"
                >
                  Load from Category
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGenerateModal(true)}
                className="gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Generate Variants
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Attributes */}
          {attributes.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Current Attributes:</Label>
              {attributes.map((attr, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{attr.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {attr.values.map((value, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttribute(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button onClick={handleSaveAttributes} size="sm" className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Attributes
              </Button>
            </div>
          )}

          {/* Add New Attribute */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end pt-4 border-t">
            <div>
              <Label className="text-sm">Attribute Name</Label>
              <Input
                value={newAttributeName}
                onChange={(e) => setNewAttributeName(e.target.value)}
                placeholder="e.g., Size, Color"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Values (comma-separated)</Label>
              <Input
                value={newAttributeValues}
                onChange={(e) => setNewAttributeValues(e.target.value)}
                placeholder="e.g., S, M, L, XL"
                className="mt-1"
              />
            </div>
            <Button onClick={handleAddAttribute} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Attribute
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Variants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Variants ({variants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No variants yet. Generate variants to get started.</p>
              <Button onClick={() => setShowGenerateModal(true)} className="gap-2">
                <Wand2 className="w-4 h-4" />
                Generate Variants
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-semibold">Variant</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Attributes</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">SKU</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => (
                    <tr key={variant._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-sm">{variant.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(variant.attributes).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{variant.sku}</code>
                      </td>
                      <td className="py-3 px-4">
                        {editingVariant === variant._id ? (
                          <Input
                            type="number"
                            defaultValue={variant.price}
                            className="w-24"
                            onBlur={(e) => {
                              handleUpdateVariant(variant._id!, { price: Number(e.target.value) })
                            }}
                          />
                        ) : (
                          <span className="font-semibold text-green-600">৳{variant.price}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingVariant === variant._id ? (
                          <Input
                            type="number"
                            defaultValue={variant.stock}
                            className="w-20"
                            onBlur={(e) => {
                              handleUpdateVariant(variant._id!, { stock: Number(e.target.value) })
                            }}
                          />
                        ) : (
                          <span className={variant.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                            {variant.stock}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={variant.isActive ? 'default' : 'secondary'}>
                          {variant.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {editingVariant === variant._id ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingVariant(null)}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingVariant(variant._id!)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVariant(variant._id!)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Variants Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generate Product Variants</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGenerateModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Attributes */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Define Attributes
                </Label>
                <div className="space-y-3">
                  {generateAttributes.map((attr, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Input
                          placeholder="Attribute name (e.g., Size)"
                          value={attr.name}
                          onChange={(e) => {
                            const updated = [...generateAttributes]
                            updated[index].name = e.target.value
                            setGenerateAttributes(updated)
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Values (comma-separated, e.g., S, M, L)"
                          value={attr.values}
                          onChange={(e) => {
                            const updated = [...generateAttributes]
                            updated[index].values = e.target.value
                            setGenerateAttributes(updated)
                          }}
                        />
                        {generateAttributes.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setGenerateAttributes(
                                generateAttributes.filter((_, i) => i !== index)
                              )
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGenerateAttributes([...generateAttributes, { name: '', values: '' }])
                    }}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Attribute
                  </Button>
                </div>
              </div>

              {/* Base Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Base Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Base Stock</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={baseStock}
                    onChange={(e) => setBaseStock(e.target.value)}
                  />
                </div>
                <div>
                  <Label>SKU Prefix (Optional)</Label>
                  <Input
                    placeholder="e.g., TSH"
                    value={skuPrefix}
                    onChange={(e) => setSkuPrefix(e.target.value)}
                  />
                </div>
              </div>

              {/* Preview */}
              {generateAttributes.some(attr => attr.name && attr.values) && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Preview:</p>
                  <p className="text-sm text-blue-700">
                    This will generate approximately{' '}
                    <strong>
                      {generateAttributes.reduce((total, attr) => {
                        const values = attr.values.split(',').filter(v => v.trim())
                        return total * (values.length || 1)
                      }, 1)}
                    </strong>{' '}
                    variants
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={generating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateVariants}
                  disabled={generating}
                  className="gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate Variants
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

