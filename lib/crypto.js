// lib/crypto.js
// Enkripsi dan dekripsi AES-256-GCM menggunakan modul crypto bawaan Node.js
import crypto from 'node:crypto';
import { getEnv } from './env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes rekomendasi GCM

/**
 * Mendapatkan Buffer 32-byte dari ENCRYPTION_KEY (64 karakter heksadesimal)
 */
function getKeyBuffer() {
  const { ENCRYPTION_KEY } = getEnv();
  return Buffer.from(ENCRYPTION_KEY, 'hex');
}

/**
 * Mengenkripsi plain text rahasia Drive Bridge
 * Mengembalikan format string: "iv_base64:authTag_base64:ciphertext_base64"
 */
export function encryptSecret(plainText) {
  if (!plainText) return null;

  const key = getKeyBuffer();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plainText, 'utf8', 'base64');
  ciphertext += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext}`;
}

/**
 * Mendekripsi string rahasia terenkripsi dari database
 */
export function decryptSecret(encryptedString) {
  if (!encryptedString) return null;

  try {
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
      throw new Error('Format string terenkripsi tidak valid');
    }

    const [ivB64, tagB64, cipherB64] = parts;
    const key = getKeyBuffer();
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('[Crypto Decrypt Error]:', err.message);
    throw new Error(
      'Secret Drive cabang tidak bisa dibaca, isi ulang di Menu Admin > Cabang'
    );
  }
}
