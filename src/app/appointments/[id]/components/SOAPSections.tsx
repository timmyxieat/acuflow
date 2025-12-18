'use client'

import { Check } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export type SOAPKey = 'subjective' | 'objective' | 'assessment' | 'plan'
export type FocusedSection = 'subjective' | 'objective' | 'assessment' | 'plan' | null

export interface SOAPData {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export interface SOAPSectionsProps {
  soapData: SOAPData
  onSoapChange: (key: SOAPKey, value: string) => void
  isZoneFocused: boolean
  focusedIndex: number
  isEditing: boolean
  textareaRefs: React.MutableRefObject<(HTMLTextAreaElement | null)[]>
  onTextareaFocus: (index: number) => void
  onSectionFocus?: (section: FocusedSection) => void
  onSectionBlur?: () => void
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
}

// =============================================================================
// SOAP Sections Component
// =============================================================================

export function SOAPSections({
  soapData,
  onSoapChange,
  isZoneFocused,
  focusedIndex,
  isEditing,
  textareaRefs,
  onTextareaFocus,
  onSectionFocus,
  onSectionBlur,
  saveStatus,
}: SOAPSectionsProps) {
  const sections: { key: SOAPKey; label: string }[] = [
    { key: 'subjective', label: 'Subjective' },
    { key: 'objective', label: 'Objective' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'plan', label: 'Plan' },
  ]

  // Render save status indicator
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="text-xs text-muted-foreground animate-pulse">
            Saving...
          </span>
        )
      case 'saved':
        return (
          <span className="text-xs text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )
      case 'error':
        return (
          <span className="text-xs text-destructive">
            Save failed
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Save status */}
      {saveStatus !== 'idle' && (
        <div className="flex justify-end">
          {renderSaveStatus()}
        </div>
      )}

      {sections.map((section, index) => {
        const isFocused = isZoneFocused && focusedIndex === index && !isEditing

        return (
          <div key={section.key} className="flex flex-col gap-2">
            {/* Section header */}
            <h3 className="text-sm font-semibold">{section.label}</h3>

            {/* Textarea for current note */}
            <textarea
              ref={(el) => { textareaRefs.current[index] = el }}
              value={soapData[section.key]}
              onChange={(e) => onSoapChange(section.key, e.target.value)}
              onFocus={() => {
                onTextareaFocus(index)
                onSectionFocus?.(section.key)
              }}
              onBlur={() => {
                onSectionBlur?.()
              }}
              placeholder={`Enter ${section.label.toLowerCase()} notes...`}
              className={`w-full rounded-lg border bg-background p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20 focus:border-primary transition-colors field-sizing-content ${
                isFocused ? 'border-primary ring-2 ring-inset ring-primary/50' : 'border-border'
              }`}
              rows={2}
            />
          </div>
        )
      })}
    </div>
  )
}
