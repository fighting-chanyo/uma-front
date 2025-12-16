import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// 開発用の固定キー（本番では環境変数 NEXT_RUNTIME_SECRET を使用すること）
const SECRET_KEY = process.env.NEXT_RUNTIME_SECRET || 'dev-secret-key-32-bytes-long-string!!';
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  // キー長を32バイトに調整
  const key = Buffer.from(SECRET_KEY.padEnd(32).slice(0, 32));
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
  const key = Buffer.from(SECRET_KEY.padEnd(32).slice(0, 32));
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
