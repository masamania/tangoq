import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function makePrisma(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  const pool    = new Pool({ connectionString: url })
  const adapter = new PrismaPg(pool)
  // Prisma 7 requires adapter; cast needed until types stabilize
  return new PrismaClient({ adapter } as unknown as ConstructorParameters<typeof PrismaClient>[0])
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? makePrisma()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
