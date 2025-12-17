/**
 * Patient Context Data (Layer 1 - Background Info for display)
 */

// =============================================================================
// PATIENT CONTEXT DATA TYPE
// =============================================================================

export interface PatientContextData {
  occupation?: string
  maritalStatus?: string
  children?: string
  stressLevel?: 'Low' | 'Moderate' | 'High'
  emotionalState?: string
  pastSurgeries?: string[]
  priorDiagnoses?: string[]
  familyHistory?: string[]
  currentMedications?: string[]
  allergies?: string[]
}

// =============================================================================
// MOCK PATIENT CONTEXT DATA
// =============================================================================

const mockPatientContextData: Record<string, PatientContextData> = {
  patient_001: {
    occupation: 'Marketing Manager',
    maritalStatus: 'Married',
    children: '2 kids (8, 5)',
    stressLevel: 'High',
    emotionalState: 'Anxious about work deadlines',
    pastSurgeries: ['Appendectomy (2015)'],
    priorDiagnoses: ['Migraines', 'TMJ'],
    familyHistory: ['Mother: Hypertension', 'Father: Type 2 Diabetes'],
    currentMedications: ['Sumatriptan PRN', 'Vitamin D 2000IU'],
    allergies: ['Penicillin'],
  },
  patient_002: {
    occupation: 'Software Engineer',
    maritalStatus: 'Single',
    stressLevel: 'Moderate',
    emotionalState: 'Generally positive, some work stress',
    pastSurgeries: ['Knee arthroscopy (2020)'],
    priorDiagnoses: ['Chronic low back pain', 'Sciatica'],
    familyHistory: ['Father: Heart disease'],
    currentMedications: ['Ibuprofen PRN'],
    allergies: [],
  },
  patient_003: {
    occupation: 'Yoga Instructor',
    maritalStatus: 'Married',
    children: '1 child (3)',
    stressLevel: 'Low',
    emotionalState: 'Calm, focused on wellness',
    pastSurgeries: [],
    priorDiagnoses: ['Hypothyroidism'],
    familyHistory: ['Mother: Thyroid issues', 'Grandmother: Osteoporosis'],
    currentMedications: ['Levothyroxine 50mcg'],
    allergies: [],
  },
  patient_004: {
    occupation: 'Retired Teacher',
    maritalStatus: 'Widowed',
    stressLevel: 'Moderate',
    emotionalState: 'Processing grief, finding purpose',
    pastSurgeries: ['Hip replacement (2022)', 'Cataract surgery (2021)'],
    priorDiagnoses: ['Osteoarthritis', 'Hypertension'],
    familyHistory: ['Both parents: Arthritis'],
    currentMedications: ['Lisinopril 10mg', 'Glucosamine'],
    allergies: ['Sulfa drugs'],
  },
  patient_005: {
    occupation: 'Executive Chef',
    maritalStatus: 'Divorced',
    children: '1 teen (16)',
    stressLevel: 'High',
    emotionalState: 'Stressed, irregular sleep from work hours',
    pastSurgeries: [],
    priorDiagnoses: ['GERD', 'Insomnia'],
    familyHistory: ['Father: GERD'],
    currentMedications: ['Omeprazole 20mg', 'Melatonin 5mg'],
    allergies: [],
  },
  patient_006: {
    occupation: 'College Student',
    maritalStatus: 'Single',
    stressLevel: 'Moderate',
    emotionalState: 'Anxious about finals',
    pastSurgeries: [],
    priorDiagnoses: ['Anxiety', 'Tension headaches'],
    familyHistory: ['Mother: Anxiety disorder'],
    currentMedications: [],
    allergies: ['Latex'],
  },
  patient_007: {
    occupation: 'Accountant',
    maritalStatus: 'Married',
    children: '3 kids',
    stressLevel: 'Moderate',
    emotionalState: 'Balanced but busy',
    pastSurgeries: ['C-section x2'],
    priorDiagnoses: ['Chronic neck pain', 'Carpal tunnel'],
    familyHistory: ['Father: Diabetes', 'Mother: Breast cancer (survivor)'],
    currentMedications: ['Prenatal vitamin'],
    allergies: [],
  },
  patient_008: {
    occupation: 'Construction Worker',
    maritalStatus: 'Married',
    children: '1 child (10)',
    stressLevel: 'Low',
    emotionalState: 'Easygoing',
    pastSurgeries: ['Rotator cuff repair (2019)'],
    priorDiagnoses: ['Chronic shoulder pain', 'Low back strain'],
    familyHistory: [],
    currentMedications: ['Fish oil'],
    allergies: [],
  },
  patient_009: {
    occupation: 'Nurse',
    maritalStatus: 'Single',
    stressLevel: 'High',
    emotionalState: 'Compassion fatigue, needs self-care',
    pastSurgeries: [],
    priorDiagnoses: ['Plantar fasciitis', 'Varicose veins'],
    familyHistory: ['Mother: Varicose veins'],
    currentMedications: ['Iron supplement'],
    allergies: ['Codeine'],
  },
  patient_010: {
    occupation: 'Entrepreneur',
    maritalStatus: 'Engaged',
    stressLevel: 'High',
    emotionalState: 'Excited but overwhelmed with wedding planning',
    pastSurgeries: [],
    priorDiagnoses: ['IBS', 'Stress-related tension'],
    familyHistory: ['Father: Heart disease', 'Mother: IBS'],
    currentMedications: ['Probiotics'],
    allergies: [],
  },
}

/**
 * Get patient context data for display in Patient Context panel
 */
export function getPatientContextData(patientId: string): PatientContextData | undefined {
  return mockPatientContextData[patientId]
}
