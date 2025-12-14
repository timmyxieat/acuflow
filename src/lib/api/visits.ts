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

/**
 * Mock save function with simulated network delay
 * In production, this will POST to /api/visits/:id
 */
export async function saveVisitSOAP(request: SaveVisitRequest): Promise<SaveVisitResponse> {
  // Simulate network delay (500ms)
  await new Promise(resolve => setTimeout(resolve, 500))

  // In development, just log and return success
  console.log('[Mock API] Saving SOAP note:', {
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
