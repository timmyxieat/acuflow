/**
 * Mock Clinic and Practitioners Data
 */

import type { Clinic, Practitioner } from "./types";
import {
  SubscriptionTier,
  SubscriptionStatus,
  PractitionerRole,
} from "./types";

// =============================================================================
// MOCK CLINIC
// =============================================================================

export const mockClinic: Clinic = {
  id: "clinic_dev_001",
  name: "Harmony Acupuncture & Wellness",
  phone: "(555) 123-4567",
  email: "info@harmonyacu.com",
  website: "https://harmonyacu.com",
  addressLine1: "123 Wellness Way",
  addressLine2: "Suite 200",
  city: "San Francisco",
  state: "CA",
  zip: "94102",
  taxId: "12-3456789",
  bookingSlug: "harmony-acupuncture",
  subscriptionTier: SubscriptionTier.BASIC,
  subscriptionStatus: SubscriptionStatus.ACTIVE,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

// =============================================================================
// MOCK PRACTITIONERS
// =============================================================================

export const mockPractitioners: Practitioner[] = [
  {
    id: "pract_dev_001",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    email: "dr.chen@harmonyacu.com",
    firstName: "Sarah",
    lastName: "Chen",
    credentials: "L.Ac., DAOM",
    npiNumber: "1234567890",
    licenseNumber: "AC12345",
    licenseState: "CA",
    role: PractitionerRole.OWNER,
    slug: "dr-chen",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "pract_dev_002",
    clinicId: "clinic_dev_001",
    cognitoUserId: null,
    email: "mike.wong@harmonyacu.com",
    firstName: "Michael",
    lastName: "Wong",
    credentials: "L.Ac.",
    npiNumber: "0987654321",
    licenseNumber: "AC67890",
    licenseState: "CA",
    role: PractitionerRole.PRACTITIONER,
    slug: "mike-wong",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Current logged-in practitioner (for development)
export const currentPractitioner = mockPractitioners[0];
