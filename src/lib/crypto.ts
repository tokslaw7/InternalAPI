import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

function getEncryptionKey() {
  const secret = process.env.APP_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('APP_ENCRYPTION_KEY is required');
  }

  return createHash('sha256').update(secret).digest();
}

export function encryptSecret(value: string) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decryptSecret(encryptedValue: string) {
  const key = getEncryptionKey();
  const payload = Buffer.from(encryptedValue, 'base64');
  const iv = payload.subarray(0, 12);
  const authTag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}