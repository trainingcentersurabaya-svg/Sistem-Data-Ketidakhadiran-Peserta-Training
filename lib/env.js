// lib/env.js
// Validasi ketat environment variable di sisi server (Node.js)

let cachedEnv = null;

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SESSION_SECRET,
    ENCRYPTION_KEY,
  } = process.env;

  const errors = [];

  if (!SUPABASE_URL || !SUPABASE_URL.startsWith('http')) {
    errors.push('SUPABASE_URL belum diatur atau formatnya bukan URL valid.');
  }

  if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.length < 20) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY belum diatur atau terlalu pendek.');
  }

  if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
    errors.push('SESSION_SECRET belum diatur atau kurang dari 32 karakter.');
  }

  if (!ENCRYPTION_KEY) {
    errors.push('ENCRYPTION_KEY belum diatur.');
  } else if (!/^[0-9a-fA-F]{64}$/.test(ENCRYPTION_KEY)) {
    errors.push(
      'ENCRYPTION_KEY harus berupa 64 karakter heksadesimal (0-9, a-f) yang setara dengan 32 byte.'
    );
  }

  if (errors.length > 0) {
    const errorMsg = `[Konfigurasi Error] Kesalahan Environment Variable:\n- ${errors.join('\n- ')}\nSilakan periksa file .env.local atau pengaturan Vercel.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  cachedEnv = {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SESSION_SECRET,
    ENCRYPTION_KEY,
  };

  return cachedEnv;
}
