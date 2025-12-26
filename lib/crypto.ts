import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const secret = process.env.NEXT_RUNTIME_SECRET;
  if (!secret) {
    throw new Error(
      'NEXT_RUNTIME_SECRET is not set. Set it to a strong, random secret (recommended: 32+ bytes) to enable cookie encryption.'
    );
  }

  // Derive a fixed 32-byte key from an arbitrary-length secret.
  // (Avoids weak padding/truncation when the secret is short.)
  return createHash('sha256').update(secret, 'utf8').digest();
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // IV:AuthTag:EncryptedData の形式で返す
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(text: string): string {
  const [ivHex, authTagHex, encryptedHex] = text.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
