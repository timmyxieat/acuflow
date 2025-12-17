// =============================================================================
// Mock Billing Data Layer
// Centralized billing data for demonstrating varied billing scenarios
// =============================================================================

// =============================================================================
// Type Definitions
// =============================================================================

export interface PaymentMethod {
  id: string
  type: 'card' | 'hsa' | 'bank'
  brand?: string // Visa, Mastercard, Amex, etc.
  last4: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

export interface PatientPaymentProfile {
  patientId: string
  paymentMethods: PaymentMethod[]
  defaultMethodId: string | null
  autoPay: boolean
}

export interface InvoiceLineItem {
  id: string
  cptCode: string
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'void'
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'failed' | 'no_charges'

export interface PaymentTransaction {
  id: string
  invoiceId: string
  amount: number
  method: string
  cardLast4?: string
  cardBrand?: string
  status: 'completed' | 'failed' | 'refunded'
  timestamp: Date
  failureReason?: string
}

export interface Invoice {
  id: string
  appointmentId: string
  status: InvoiceStatus
  lineItems: InvoiceLineItem[]
  subtotal: number
  tax: number
  total: number
  amountPaid: number
  amountDue: number
  createdAt: Date
  sentAt?: Date
  paidAt?: Date
}

export interface InsuranceInfo {
  company: string
  memberId: string
  groupNumber?: string
}

export interface BillingData {
  charges: InvoiceLineItem[]
  subtotal: number
  tax: number
  totalCharges: number
  amountPaid: number
  balanceDue: number
  status: PaymentStatus
  invoiceStatus: InvoiceStatus
  transactions: PaymentTransaction[]
  paymentMethod?: PaymentMethod
  autoPay?: boolean
  insurance?: InsuranceInfo
}

// =============================================================================
// Mock Data - Payment Profiles
// =============================================================================

const mockPaymentProfiles: Record<string, PatientPaymentProfile> = {
  // Emily Johnson - Visa card, auto-pay enabled
  'patient_001': {
    patientId: 'patient_001',
    paymentMethods: [
      {
        id: 'pm_emily_001',
        type: 'card',
        brand: 'Visa',
        last4: '4242',
        expiryMonth: 8,
        expiryYear: 2026,
        isDefault: true,
      },
    ],
    defaultMethodId: 'pm_emily_001',
    autoPay: true,
  },

  // Michael Chen - No card on file
  'patient_002': {
    patientId: 'patient_002',
    paymentMethods: [],
    defaultMethodId: null,
    autoPay: false,
  },

  // Sarah Williams - Mastercard, auto-pay enabled (will show failed payment)
  'patient_003': {
    patientId: 'patient_003',
    paymentMethods: [
      {
        id: 'pm_sarah_001',
        type: 'card',
        brand: 'Mastercard',
        last4: '5555',
        expiryMonth: 3,
        expiryYear: 2025,
        isDefault: true,
      },
    ],
    defaultMethodId: 'pm_sarah_001',
    autoPay: true,
  },

  // David Park - HSA card
  'patient_004': {
    patientId: 'patient_004',
    paymentMethods: [
      {
        id: 'pm_david_001',
        type: 'hsa',
        brand: 'HSA',
        last4: '1234',
        isDefault: true,
      },
    ],
    defaultMethodId: 'pm_david_001',
    autoPay: false,
  },

  // Lisa Thompson - Amex card, no auto-pay
  'patient_005': {
    patientId: 'patient_005',
    paymentMethods: [
      {
        id: 'pm_lisa_001',
        type: 'card',
        brand: 'Amex',
        last4: '3782',
        expiryMonth: 12,
        expiryYear: 2027,
        isDefault: true,
      },
    ],
    defaultMethodId: 'pm_lisa_001',
    autoPay: false,
  },

  // Robert Kim - Multiple cards
  'patient_006': {
    patientId: 'patient_006',
    paymentMethods: [
      {
        id: 'pm_robert_001',
        type: 'card',
        brand: 'Visa',
        last4: '9876',
        expiryMonth: 6,
        expiryYear: 2026,
        isDefault: true,
      },
      {
        id: 'pm_robert_002',
        type: 'hsa',
        brand: 'HSA',
        last4: '5432',
        isDefault: false,
      },
    ],
    defaultMethodId: 'pm_robert_001',
    autoPay: true,
  },
}

// =============================================================================
// Mock Data - Insurance Info
// =============================================================================

const mockInsurance: Record<string, InsuranceInfo | undefined> = {
  'patient_001': {
    company: 'Blue Cross Blue Shield',
    memberId: 'XYZ123456789',
    groupNumber: 'GRP-001',
  },
  'patient_002': undefined, // Self-pay
  'patient_003': {
    company: 'Aetna',
    memberId: 'AET987654321',
    groupNumber: 'GRP-456',
  },
  'patient_004': {
    company: 'United Healthcare',
    memberId: 'UHC456789123',
  },
  'patient_005': undefined, // Self-pay
  'patient_006': {
    company: 'Cigna',
    memberId: 'CIG111222333',
    groupNumber: 'GRP-789',
  },
}

// =============================================================================
// Mock Data - Invoices by Appointment
// Scenarios vary based on which patient is selected
// =============================================================================

// Standard acupuncture charges
function createStandardCharges(usedEstim: boolean = false): InvoiceLineItem[] {
  const charges: InvoiceLineItem[] = [
    {
      id: 'chg_001',
      cptCode: usedEstim ? '97813' : '97810',
      description: usedEstim ? 'Acupuncture with e-stim, initial 15 min' : 'Acupuncture, initial 15 min',
      quantity: 1,
      unitPrice: usedEstim ? 95 : 85,
      lineTotal: usedEstim ? 95 : 85,
    },
    {
      id: 'chg_002',
      cptCode: usedEstim ? '97814' : '97811',
      description: usedEstim ? 'Acupuncture with e-stim, additional 15 min' : 'Acupuncture, additional 15 min',
      quantity: usedEstim ? 2 : 1,
      unitPrice: usedEstim ? 40 : 35,
      lineTotal: usedEstim ? 80 : 35,
    },
  ]
  return charges
}

// =============================================================================
// Billing Scenario Functions
// Each patient demonstrates a different billing scenario
// =============================================================================

type BillingScenario = 'paid_auto' | 'unpaid_no_card' | 'failed_payment' | 'partial_payment' | 'unpaid_with_card' | 'paid_manual'

function getPatientScenario(patientId: string): BillingScenario {
  const scenarios: Record<string, BillingScenario> = {
    'patient_001': 'paid_auto',        // Emily Johnson - Happy path, auto-pay worked
    'patient_002': 'unpaid_no_card',   // Michael Chen - Needs to add card and pay
    'patient_003': 'failed_payment',   // Sarah Williams - Card declined
    'patient_004': 'partial_payment',  // David Park - Partial payment made
    'patient_005': 'unpaid_with_card', // Lisa Thompson - Card on file but unpaid
    'patient_006': 'paid_manual',      // Robert Kim - Paid manually with card
  }
  return scenarios[patientId] || 'unpaid_with_card'
}

function createBillingDataForScenario(
  scenario: BillingScenario,
  patientId: string,
  appointmentId: string,
  usedEstim: boolean = false
): BillingData {
  const charges = createStandardCharges(usedEstim)
  const subtotal = charges.reduce((sum, c) => sum + c.lineTotal, 0)
  const tax = 0 // No tax for medical services
  const total = subtotal + tax

  const profile = mockPaymentProfiles[patientId]
  const insurance = mockInsurance[patientId]
  const paymentMethod = profile?.paymentMethods.find(pm => pm.id === profile.defaultMethodId)

  const now = new Date()

  switch (scenario) {
    case 'paid_auto':
      return {
        charges,
        subtotal,
        tax,
        totalCharges: total,
        amountPaid: total,
        balanceDue: 0,
        status: 'paid',
        invoiceStatus: 'paid',
        transactions: [
          {
            id: `tx_${appointmentId}_001`,
            invoiceId: `inv_${appointmentId}`,
            amount: total,
            method: paymentMethod?.brand || 'Card',
            cardLast4: paymentMethod?.last4,
            cardBrand: paymentMethod?.brand,
            status: 'completed',
            timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 min ago
          },
        ],
        paymentMethod,
        autoPay: true,
        insurance,
      }

    case 'unpaid_no_card':
      return {
        charges,
        subtotal,
        tax,
        totalCharges: total,
        amountPaid: 0,
        balanceDue: total,
        status: 'pending',
        invoiceStatus: 'sent',
        transactions: [],
        paymentMethod: undefined,
        autoPay: false,
        insurance,
      }

    case 'failed_payment':
      return {
        charges,
        subtotal,
        tax,
        totalCharges: total,
        amountPaid: 0,
        balanceDue: total,
        status: 'failed',
        invoiceStatus: 'sent',
        transactions: [
          {
            id: `tx_${appointmentId}_001`,
            invoiceId: `inv_${appointmentId}`,
            amount: total,
            method: paymentMethod?.brand || 'Card',
            cardLast4: paymentMethod?.last4,
            cardBrand: paymentMethod?.brand,
            status: 'failed',
            timestamp: new Date(now.getTime() - 2 * 60 * 1000), // 2 min ago
            failureReason: 'Card declined - insufficient funds',
          },
        ],
        paymentMethod,
        autoPay: true,
        insurance,
      }

    case 'partial_payment':
      const partialAmount = 50
      return {
        charges,
        subtotal,
        tax,
        totalCharges: total,
        amountPaid: partialAmount,
        balanceDue: total - partialAmount,
        status: 'partial',
        invoiceStatus: 'partial',
        transactions: [
          {
            id: `tx_${appointmentId}_001`,
            invoiceId: `inv_${appointmentId}`,
            amount: partialAmount,
            method: paymentMethod?.brand || 'HSA',
            cardLast4: paymentMethod?.last4,
            cardBrand: paymentMethod?.brand,
            status: 'completed',
            timestamp: new Date(now.getTime() - 10 * 60 * 1000), // 10 min ago
          },
        ],
        paymentMethod,
        autoPay: false,
        insurance,
      }

    case 'unpaid_with_card':
      return {
        charges,
        subtotal,
        tax,
        totalCharges: total,
        amountPaid: 0,
        balanceDue: total,
        status: 'pending',
        invoiceStatus: 'sent',
        transactions: [],
        paymentMethod,
        autoPay: false,
        insurance,
      }

    case 'paid_manual':
      return {
        charges,
        subtotal,
        tax,
        totalCharges: total,
        amountPaid: total,
        balanceDue: 0,
        status: 'paid',
        invoiceStatus: 'paid',
        transactions: [
          {
            id: `tx_${appointmentId}_001`,
            invoiceId: `inv_${appointmentId}`,
            amount: total,
            method: paymentMethod?.brand || 'Card',
            cardLast4: paymentMethod?.last4,
            cardBrand: paymentMethod?.brand,
            status: 'completed',
            timestamp: new Date(now.getTime() - 3 * 60 * 1000), // 3 min ago
          },
        ],
        paymentMethod,
        autoPay: true,
        insurance,
      }

    default:
      return {
        charges: [],
        subtotal: 0,
        tax: 0,
        totalCharges: 0,
        amountPaid: 0,
        balanceDue: 0,
        status: 'no_charges',
        invoiceStatus: 'draft',
        transactions: [],
        paymentMethod,
        autoPay: profile?.autoPay ?? false,
        insurance,
      }
  }
}

// =============================================================================
// Helper Functions - Public API
// =============================================================================

/**
 * Get the payment profile for a patient
 */
export function getPatientPaymentProfile(patientId: string): PatientPaymentProfile | null {
  return mockPaymentProfiles[patientId] || null
}

/**
 * Get the insurance info for a patient
 */
export function getPatientInsurance(patientId: string): InsuranceInfo | undefined {
  return mockInsurance[patientId]
}

/**
 * Get billing data for an appointment
 * Varies the scenario based on the patient to demonstrate different UX states
 */
export function getBillingDataForAppointment(
  appointmentId: string,
  patientId: string,
  isCompleted: boolean,
  usedEstim: boolean = false
): BillingData {
  // If appointment is not completed, return empty/draft state
  if (!isCompleted) {
    const profile = mockPaymentProfiles[patientId]
    const insurance = mockInsurance[patientId]
    const paymentMethod = profile?.paymentMethods.find(pm => pm.id === profile.defaultMethodId)

    return {
      charges: [],
      subtotal: 0,
      tax: 0,
      totalCharges: 0,
      amountPaid: 0,
      balanceDue: 0,
      status: 'no_charges',
      invoiceStatus: 'draft',
      transactions: [],
      paymentMethod,
      autoPay: profile?.autoPay ?? false,
      insurance,
    }
  }

  // For completed appointments, return scenario-based billing data
  const scenario = getPatientScenario(patientId)
  return createBillingDataForScenario(scenario, patientId, appointmentId, usedEstim)
}

/**
 * Get payment transactions for an invoice
 */
export function getPaymentTransactions(invoiceId: string): PaymentTransaction[] {
  // This would query by invoiceId in a real implementation
  // For mock, we return empty since transactions are embedded in BillingData
  return []
}

// =============================================================================
// Status Preview Helpers
// =============================================================================

export interface BillingStatusPreview {
  text: string
  color: string
}

/**
 * Get a short status preview for the billing tab bar
 */
export function getBillingStatusPreview(billingData: BillingData): BillingStatusPreview {
  const { totalCharges, balanceDue, status } = billingData

  if (status === 'no_charges' || totalCharges === 0) {
    return { text: 'No charges', color: 'text-muted-foreground' }
  }

  if (status === 'paid') {
    return { text: `$${totalCharges.toFixed(0)} · Paid`, color: 'text-green-600' }
  }

  if (status === 'failed') {
    return { text: `$${totalCharges.toFixed(0)} · Failed`, color: 'text-red-600' }
  }

  if (status === 'partial') {
    return { text: `$${balanceDue.toFixed(0)} · Due`, color: 'text-amber-600' }
  }

  // pending
  return { text: `$${totalCharges.toFixed(0)} · Due`, color: 'text-amber-600' }
}

// =============================================================================
// All Billing History Types & Functions
// =============================================================================

export interface BillingHistoryInvoice {
  id: string
  date: Date
  appointmentType: string
  total: number
  status: InvoiceStatus
  amountPaid: number
  amountDue: number
}

export interface PatientBillingHistory {
  invoices: BillingHistoryInvoice[]
  totalOutstanding: number
  totalPaid: number
  packageCredits: number
}

/**
 * Get all billing history for a patient (for "All" view)
 */
export function getPatientBillingHistory(patientId: string): PatientBillingHistory {
  // Mock historical invoices for each patient
  const now = new Date()
  const mockHistories: Record<string, PatientBillingHistory> = {
    'patient_001': {
      invoices: [
        { id: 'inv_001_1', date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), appointmentType: 'Follow-up Treatment', total: 120, status: 'paid', amountPaid: 120, amountDue: 0 },
        { id: 'inv_001_2', date: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000), appointmentType: 'Follow-up Treatment', total: 120, status: 'paid', amountPaid: 120, amountDue: 0 },
        { id: 'inv_001_3', date: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), appointmentType: 'Initial Consultation', total: 175, status: 'paid', amountPaid: 175, amountDue: 0 },
      ],
      totalOutstanding: 0,
      totalPaid: 415,
      packageCredits: 0,
    },
    'patient_002': {
      invoices: [
        { id: 'inv_002_1', date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), appointmentType: 'Follow-up Treatment', total: 120, status: 'sent', amountPaid: 0, amountDue: 120 },
        { id: 'inv_002_2', date: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000), appointmentType: 'Initial Consultation', total: 175, status: 'partial', amountPaid: 75, amountDue: 100 },
      ],
      totalOutstanding: 220,
      totalPaid: 75,
      packageCredits: 0,
    },
    'patient_003': {
      invoices: [
        { id: 'inv_003_1', date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), appointmentType: 'Follow-up Treatment', total: 120, status: 'paid', amountPaid: 120, amountDue: 0 },
        { id: 'inv_003_2', date: new Date(now.getTime() - 24 * 24 * 60 * 60 * 1000), appointmentType: 'Follow-up Treatment', total: 120, status: 'paid', amountPaid: 120, amountDue: 0 },
      ],
      totalOutstanding: 0,
      totalPaid: 240,
      packageCredits: 5,
    },
    'patient_004': {
      invoices: [
        { id: 'inv_004_1', date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), appointmentType: 'Follow-up Treatment', total: 120, status: 'partial', amountPaid: 50, amountDue: 70 },
        { id: 'inv_004_2', date: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000), appointmentType: 'Initial Consultation', total: 175, status: 'paid', amountPaid: 175, amountDue: 0 },
      ],
      totalOutstanding: 70,
      totalPaid: 225,
      packageCredits: 3,
    },
    'patient_005': {
      invoices: [],
      totalOutstanding: 0,
      totalPaid: 0,
      packageCredits: 0,
    },
    'patient_006': {
      invoices: [
        { id: 'inv_006_1', date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), appointmentType: 'Brief Follow-up', total: 85, status: 'paid', amountPaid: 85, amountDue: 0 },
        { id: 'inv_006_2', date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), appointmentType: 'Follow-up Treatment', total: 120, status: 'paid', amountPaid: 120, amountDue: 0 },
        { id: 'inv_006_3', date: new Date(now.getTime() - 26 * 24 * 60 * 60 * 1000), appointmentType: 'Follow-up Treatment', total: 120, status: 'paid', amountPaid: 120, amountDue: 0 },
        { id: 'inv_006_4', date: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000), appointmentType: 'Initial Consultation', total: 175, status: 'paid', amountPaid: 175, amountDue: 0 },
      ],
      totalOutstanding: 0,
      totalPaid: 500,
      packageCredits: 8,
    },
  }

  return mockHistories[patientId] || {
    invoices: [],
    totalOutstanding: 0,
    totalPaid: 0,
    packageCredits: 0,
  }
}
