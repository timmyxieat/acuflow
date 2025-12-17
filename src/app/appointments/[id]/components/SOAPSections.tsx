'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { BUTTON_POP_ANIMATION } from '@/lib/animations'
import { getVisitById } from '@/data/mock-data'

// =============================================================================
// Types
// =============================================================================

export type SOAPKey = 'subjective' | 'objective' | 'assessment' | 'plan'

export interface SOAPData {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export interface SOAPSectionsProps {
  selectedVisitId: string | null
  soapData: SOAPData
  onSoapChange: (key: SOAPKey, value: string) => void
  onUsePastTreatment?: () => void
  isZoneFocused: boolean
  focusedIndex: number
  isEditing: boolean
  textareaRefs: React.MutableRefObject<(HTMLTextAreaElement | null)[]>
  onTextareaFocus: (index: number) => void
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  previewSlideDirection: 'up' | 'down' | null
  isReadOnly?: boolean
  signedBy?: string
  signedAt?: Date
}

// =============================================================================
// SOAP Sections Component
// =============================================================================

export function SOAPSections({
  selectedVisitId,
  soapData,
  onSoapChange,
  onUsePastTreatment,
  isZoneFocused,
  focusedIndex,
  isEditing,
  textareaRefs,
  onTextareaFocus,
  saveStatus,
  previewSlideDirection,
}: SOAPSectionsProps) {
  // Get the selected past visit for preview
  const selectedVisit = selectedVisitId ? getVisitById(selectedVisitId) : null

  // Extract raw text from visit SOAP fields
  const getVisitSoapContent = (key: SOAPKey): string | null => {
    if (!selectedVisit) return null
    const field = selectedVisit[key] as { raw?: string } | null
    return field?.raw || null
  }

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
        const previewContent = getVisitSoapContent(section.key)
        const isPlan = section.key === 'plan'
        const isFocused = isZoneFocused && focusedIndex === index && !isEditing

        return (
          <div key={section.key} className="flex flex-col gap-2">
            {/* Section header with optional action button */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{section.label}</h3>
              <AnimatePresence>
                {isPlan && selectedVisit && onUsePastTreatment && (
                  <motion.button
                    onClick={onUsePastTreatment}
                    className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                    initial={BUTTON_POP_ANIMATION.initial}
                    animate={BUTTON_POP_ANIMATION.animate}
                    exit={BUTTON_POP_ANIMATION.exit}
                  >
                    Use past treatment
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Textarea for current note */}
            <textarea
              ref={(el) => { textareaRefs.current[index] = el }}
              value={soapData[section.key]}
              onChange={(e) => onSoapChange(section.key, e.target.value)}
              onFocus={() => onTextareaFocus(index)}
              placeholder={`Enter ${section.label.toLowerCase()} notes...`}
              className={`w-full rounded-lg border bg-background p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20 focus:border-primary transition-colors field-sizing-content ${
                isFocused ? 'border-primary ring-2 ring-inset ring-primary/50' : 'border-border'
              }`}
              rows={2}
            />

            {/* Preview from selected past visit */}
            <div className="relative">
              <AnimatePresence mode="popLayout">
                {previewContent && (
                  <motion.div
                    key={`${selectedVisitId}-${section.key}`}
                    initial={{
                      y: previewSlideDirection === 'up' ? -20 : 20,
                      opacity: 0,
                    }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      transition: { duration: 0.2, delay: index * 0.03 },
                    }}
                    exit={{
                      y: previewSlideDirection === 'up' ? 20 : -20,
                      opacity: 0,
                      transition: { duration: 0.15 },
                    }}
                  >
                    <p className="rounded bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground italic">
                      {previewContent}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )
      })}
    </div>
  )
}
