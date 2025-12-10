// Prisma 7 Configuration
// https://www.prisma.io/docs/orm/reference/prisma-config-reference

import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // Schema location
  schema: 'prisma/schema.prisma',

  // Migrations configuration
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },

  // Database connection (AWS RDS PostgreSQL)
  datasource: {
    url: env('DATABASE_URL'),
    // Shadow database for migrations (optional, for dev)
    // shadowDatabaseUrl: env('SHADOW_DATABASE_URL'),
  },
})
