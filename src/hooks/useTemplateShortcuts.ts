import { useState, useEffect, useCallback } from 'react'
import { templatesService, type Template } from '@/services/admin'

interface UseTemplateShortcutsProps {
  enabled?: boolean
}

interface ShortcutSuggestion {
  template: Template
  matchScore: number
}

export function useTemplateShortcuts({ enabled = true }: UseTemplateShortcutsProps = {}) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)

  // Load templates on mount
  useEffect(() => {
    if (enabled) {
      loadTemplates()
    }
  }, [enabled])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const result = await templatesService.getTemplates('all', '')
      
      if (result.success && result.data) {
        // Filter templates that have shortcuts
        const templatesWithShortcuts = result.data.templates.filter(
          (t) => t.shortcut && t.shortcut.length > 0
        )
        setTemplates(templatesWithShortcuts)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get matching templates for a given input
  const getMatchingTemplates = useCallback(
    (input: string): ShortcutSuggestion[] => {
      if (!input.startsWith('/') || input.length < 2) {
        return []
      }

      const searchTerm = input.toLowerCase()
      
      const matches = templates
        .filter((template) => {
          const shortcut = template.shortcut?.toLowerCase() || ''
          return shortcut.startsWith(searchTerm)
        })
        .map((template) => {
          const shortcut = template.shortcut?.toLowerCase() || ''
          // Calculate match score (exact match = 100, partial = based on length)
          const matchScore = shortcut === searchTerm ? 100 : 
            (searchTerm.length / shortcut.length) * 100
          
          return { template, matchScore }
        })
        .sort((a, b) => b.matchScore - a.matchScore)

      return matches
    },
    [templates]
  )

  // Check if input exactly matches a shortcut
  const getExactMatch = useCallback(
    (input: string): Template | null => {
      const normalizedInput = input.toLowerCase().trim()
      const match = templates.find(
        (template) => template.shortcut?.toLowerCase() === normalizedInput
      )
      return match || null
    },
    [templates]
  )

  // Replace variables in template content
  const replaceVariables = useCallback(
    (content: string, context: Record<string, string | undefined>): string => {
      let processedContent = content
      
      // Replace each variable with context value or keep the placeholder
      Object.keys(context).forEach((key) => {
        if (context[key]) {
          const regex = new RegExp(`\\{${key}\\}`, 'g')
          processedContent = processedContent.replace(regex, context[key]!)
        }
      })
      
      return processedContent
    },
    []
  )

  // Increment usage count
  const incrementUsage = useCallback(async (templateId: string) => {
    try {
      await templatesService.incrementUsage(templateId)
    } catch (error) {
      console.error('Error incrementing usage:', error)
    }
  }, [])

  return {
    templates,
    loading,
    getMatchingTemplates,
    getExactMatch,
    replaceVariables,
    incrementUsage,
    refreshTemplates: loadTemplates,
  }
}

