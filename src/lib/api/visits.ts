/**
 * Mock API for visit/SOAP note operations
 * Will be replaced with real API calls when backend is ready
 */

export interface SOAPData {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export interface SaveVisitRequest {
  appointmentId: string
  soap: SOAPData
}

export interface SaveVisitResponse {
  success: boolean
  savedAt: Date
}

// localStorage key prefix for SOAP notes
const SOAP_STORAGE_KEY = 'acuflow_soap_'

/**
 * Get localStorage key for a specific appointment
 */
function getStorageKey(appointmentId: string): string {
  return `${SOAP_STORAGE_KEY}${appointmentId}`
}

/**
 * Load SOAP data from localStorage
 * Returns null if no saved data exists
 */
export function loadVisitSOAP(appointmentId: string): SOAPData | null {
  if (typeof window === 'undefined') return null

  try {
    const key = getStorageKey(appointmentId)
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    return {
      subjective: parsed.subjective || '',
      objective: parsed.objective || '',
      assessment: parsed.assessment || '',
      plan: parsed.plan || '',
    }
  } catch (error) {
    console.error('[loadVisitSOAP] Failed to load:', error)
    return null
  }
}

/**
 * Save SOAP data to localStorage with simulated network delay
 * In production, this will POST to /api/visits/:id
 */
export async function saveVisitSOAP(request: SaveVisitRequest): Promise<SaveVisitResponse> {
  // Simulate network delay (300ms - reduced for better UX)
  await new Promise(resolve => setTimeout(resolve, 300))

  // Save to localStorage for persistence
  if (typeof window !== 'undefined') {
    try {
      const key = getStorageKey(request.appointmentId)
      localStorage.setItem(key, JSON.stringify(request.soap))
    } catch (error) {
      console.error('[saveVisitSOAP] Failed to save to localStorage:', error)
      throw error
    }
  }

  // In development, also log for debugging
  console.log('[Mock API] Saved SOAP note:', {
    appointmentId: request.appointmentId,
    soap: {
      subjective: request.soap.subjective.slice(0, 50) + (request.soap.subjective.length > 50 ? '...' : ''),
      objective: request.soap.objective.slice(0, 50) + (request.soap.objective.length > 50 ? '...' : ''),
      assessment: request.soap.assessment.slice(0, 50) + (request.soap.assessment.length > 50 ? '...' : ''),
      plan: request.soap.plan.slice(0, 50) + (request.soap.plan.length > 50 ? '...' : ''),
    },
  })

  return {
    success: true,
    savedAt: new Date(),
  }
}
