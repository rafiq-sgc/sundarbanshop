'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'

export interface ProductAttribute {
  name: string
  values: string[]
  isRequired: boolean
}

export interface ProductVariant {
  _id?: string
  name: string
  sku: string
  price: number
  comparePrice?: number
  stock: number
  attributes: { [key: string]: string }
  image?: string
  isActive: boolean
}

interface VariantSelectorProps {
  attributes: ProductAttribute[]
  variants: ProductVariant[]
  basePrice: number
  baseStock: number
  onVariantChange: (variant: ProductVariant | null, attributes: { [key: string]: string }) => void
}

export default function VariantSelector({
  attributes,
  variants,
  basePrice,
  baseStock,
  onVariantChange
}: VariantSelectorProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<{ [key: string]: string }>({})
  const [availableOptions, setAvailableOptions] = useState<{ [key: string]: string[] }>({})

  // Initialize available options based on all variants
  useEffect(() => {
    const options: { [key: string]: string[] } = {}
    
    attributes.forEach(attr => {
      options[attr.name] = attr.values
    })
    
    setAvailableOptions(options)
  }, [attributes])

  // Update available options based on current selection
  useEffect(() => {
    if (Object.keys(selectedAttributes).length === 0) {
      // Reset to all options if nothing selected
      const options: { [key: string]: string[] } = {}
      attributes.forEach(attr => {
        options[attr.name] = attr.values
      })
      setAvailableOptions(options)
      return
    }

    const options: { [key: string]: string[] } = {}
    
    attributes.forEach(attr => {
      const possibleValues = new Set<string>()
      
      // Find all possible values for this attribute based on current selection
      variants.forEach(variant => {
        if (!variant.isActive) return
        
        // Check if variant matches currently selected attributes (excluding current attribute)
        const matches = Object.entries(selectedAttributes).every(([key, value]) => {
          if (key === attr.name) return true // Skip current attribute
          return variant.attributes[key] === value
        })
        
        if (matches && variant.attributes[attr.name]) {
          possibleValues.add(variant.attributes[attr.name])
        }
      })
      
      options[attr.name] = Array.from(possibleValues)
    })
    
    setAvailableOptions(options)
  }, [selectedAttributes, variants, attributes])

  // Find matching variant based on selected attributes
  useEffect(() => {
    const allAttributesSelected = attributes.every(attr => 
      attr.isRequired ? selectedAttributes[attr.name] : true
    )

    if (!allAttributesSelected) {
      onVariantChange(null, selectedAttributes)
      return
    }

    // Find exact match
    const matchingVariant = variants.find(variant => {
      if (!variant.isActive) return false
      
      return Object.entries(selectedAttributes).every(([key, value]) => 
        variant.attributes[key] === value
      )
    })

    onVariantChange(matchingVariant || null, selectedAttributes)
  }, [selectedAttributes, variants, attributes, onVariantChange])

  const handleAttributeSelect = (attributeName: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: value
    }))
  }

  const isAttributeDisabled = (attributeName: string, value: string): boolean => {
    return !availableOptions[attributeName]?.includes(value)
  }

  if (!attributes || attributes.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {attributes.map((attribute) => (
        <div key={attribute.name}>
          <Label className="text-base font-semibold mb-3 block">
            {attribute.name}
            {attribute.isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          <div className="flex flex-wrap gap-2">
            {attribute.values.map((value) => {
              const isSelected = selectedAttributes[attribute.name] === value
              const isDisabled = isAttributeDisabled(attribute.name, value)
              
              return (
                <Button
                  key={value}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  className={`
                    relative min-w-[60px] h-12 px-4
                    ${isSelected ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                    ${isDisabled ? 'opacity-40 cursor-not-allowed line-through' : ''}
                  `}
                  onClick={() => !isDisabled && handleAttributeSelect(attribute.name, value)}
                  disabled={isDisabled}
                >
                  {isSelected && (
                    <Check className="w-4 h-4 mr-1" />
                  )}
                  <span className="font-medium">{value}</span>
                </Button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Show selected variant info */}
      {Object.keys(selectedAttributes).length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Selected Options:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedAttributes).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="text-sm">
                {key}: {value}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

