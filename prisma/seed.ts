/**
 * Prisma Seed Script
 *
 * Seeds the database with default data for new clinics.
 * Run with: npx prisma db seed
 *
 * Configure in package.json:
 * "prisma": {
 *   "seed": "npx ts-node prisma/seed.ts"
 * }
 */

// Note: Import will be available after Prisma client is generated
// import { PrismaClient } from '@prisma/client'
// const prisma = new PrismaClient()

/**
 * Default Fee Schedule Items for Acupuncture
 *
 * These are standard CPT codes used in acupuncture billing.
 * Fees are suggested defaults - clinics should adjust to their rates.
 */
export const defaultFeeScheduleItems = [
  // Acupuncture codes
  {
    cptCode: '97810',
    description: 'Acupuncture, 1 or more needles, without electrical stimulation, initial 15 minutes',
    fee: 75.00,
  },
  {
    cptCode: '97811',
    description: 'Acupuncture, 1 or more needles, without electrical stimulation, each additional 15 minutes',
    fee: 35.00,
  },
  {
    cptCode: '97813',
    description: 'Acupuncture, 1 or more needles, with electrical stimulation, initial 15 minutes',
    fee: 85.00,
  },
  {
    cptCode: '97814',
    description: 'Acupuncture, 1 or more needles, with electrical stimulation, each additional 15 minutes',
    fee: 40.00,
  },

  // Manual therapy / adjunct codes commonly used
  {
    cptCode: '97140',
    description: 'Manual therapy techniques (e.g., mobilization/manipulation, manual lymphatic drainage, manual traction), 1 or more regions, each 15 minutes',
    fee: 45.00,
  },
  {
    cptCode: '97112',
    description: 'Neuromuscular reeducation, each 15 minutes',
    fee: 45.00,
  },

  // Evaluation codes
  {
    cptCode: '99203',
    description: 'Office visit, new patient, low complexity (30-44 minutes)',
    fee: 150.00,
  },
  {
    cptCode: '99204',
    description: 'Office visit, new patient, moderate complexity (45-59 minutes)',
    fee: 200.00,
  },
  {
    cptCode: '99213',
    description: 'Office visit, established patient, low complexity (20-29 minutes)',
    fee: 85.00,
  },
  {
    cptCode: '99214',
    description: 'Office visit, established patient, moderate complexity (30-39 minutes)',
    fee: 120.00,
  },

  // Cupping (if billed separately)
  {
    cptCode: '97039',
    description: 'Unlisted modality (cupping therapy)',
    fee: 35.00,
  },

  // Moxibustion
  {
    cptCode: '97039',
    description: 'Unlisted modality (moxibustion)',
    fee: 25.00,
  },
]

/**
 * Default Appointment Types
 */
export const defaultAppointmentTypes = [
  {
    name: 'Initial Consultation',
    durationMinutes: 90,
    description: 'New patient intake, health history review, and first treatment',
    isDefault: true,
  },
  {
    name: 'Follow-up Treatment',
    durationMinutes: 60,
    description: 'Returning patient treatment session',
    isDefault: true,
  },
  {
    name: 'Brief Follow-up',
    durationMinutes: 30,
    description: 'Quick check-in or maintenance treatment',
    isDefault: false,
  },
]

/**
 * Seed function to populate a new clinic with defaults
 *
 * Usage example:
 * await seedClinicDefaults(prisma, clinicId)
 */
export async function seedClinicDefaults(prisma: any, clinicId: string) {
  // Seed fee schedule items
  for (const item of defaultFeeScheduleItems) {
    await prisma.feeScheduleItem.upsert({
      where: {
        clinicId_cptCode: {
          clinicId,
          cptCode: item.cptCode,
        },
      },
      update: {},
      create: {
        clinicId,
        cptCode: item.cptCode,
        description: item.description,
        fee: item.fee,
      },
    })
  }

  // Seed appointment types
  for (const type of defaultAppointmentTypes) {
    await prisma.appointmentType.upsert({
      where: {
        id: `${clinicId}-${type.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        clinicId,
        name: type.name,
        durationMinutes: type.durationMinutes,
        description: type.description,
        isDefault: type.isDefault,
      },
    })
  }

  console.log(`Seeded defaults for clinic: ${clinicId}`)
}

/**
 * Main seed function for development database
 */
async function main() {
  // This will be implemented when we have the Prisma client
  console.log('Seed data definitions exported.')
  console.log('Use seedClinicDefaults(prisma, clinicId) to seed a new clinic.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
