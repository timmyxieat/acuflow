// Prisma 7 singleton pattern for Next.js
// Prevents multiple instances during hot reload in development

import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined
}

function createPrismaClient() {
  // Type assertion needed for Prisma 7's strict typing
  const Client = PrismaClient as unknown as new (options?: {
    log?: Array<'query' | 'info' | 'warn' | 'error'>
  }) => InstanceType<typeof PrismaClient>

  return new Client({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
