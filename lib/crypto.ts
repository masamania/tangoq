/**
 * AES-256-GCM encryption/decryption for storing users' API keys in DB.
 * The ENCRYPTION_KEY env var is the master key (base64-encoded 32 bytes).
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALG = 'aes-256-gcm'

function getMasterKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY is not set')
  const buf = Buffer.from(key, 'base64')
  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes (base64-encoded)')
  return buf
}

export function encryptApiKey(plaintext: string): string {
  const iv       = randomBytes(12)              // 96-bit IV for GCM
  const cipher   = createCipheriv(ALG, getMasterKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag      = cipher.getAuthTag()

  // Format: iv(12) + tag(16) + ciphertext — all hex-encoded
  return Buffer.concat([iv, tag, encrypted]).toString('hex')
}

export function decryptApiKey(hexPayload: string): string {
  const buf       = Buffer.from(hexPayload, 'hex')
  const iv        = buf.subarray(0, 12)
  const tag       = buf.subarray(12, 28)
  const encrypted = buf.subarray(28)

  const decipher  = createDecipheriv(ALG, getMasterKey(), iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final('utf8')
}
