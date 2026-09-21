// lib/auth.js
// Autentikasi pengguna, hashing password bcryptjs, dan verifikasi izin peran/cabang
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from './supabase.js';
import { verifySessionToken, getTokenFromRequest } from './session.js';
import { MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MINUTES } from './config.js';

/**
 * Hash password baru dengan bcryptjs cost 10
 */
export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Membandingkan plain password dengan hash
 */
export async function comparePassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Mendapatkan data pengguna yang sedang login beserta verifikasi keaktifan di database
 */
export async function getAuthenticatedUser(request) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload || !payload.userId) {
    return null;
  }

  // Verifikasi langsung ke database untuk memastikan status pengguna masih aktif
  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, full_name, role, branch_id, is_active, must_change_password')
    .eq('id', payload.userId)
    .single();

  if (error || !user || !user.is_active) {
    return null;
  }

  return user;
}

/**
 * Memverifikasi apakah akun sedang terkunci karena salah password berulang
 */
export function isAccountLocked(user) {
  if (!user.locked_until) return false;
  const lockedTime = new Date(user.locked_until).getTime();
  const now = Date.now();
  return lockedTime > now;
}

/**
 * Mencatat kegagalan login dan mengunci akun jika mencapai batas 5 kali
 */
export async function handleFailedLogin(userId, currentFailedCount) {
  const supabase = getSupabaseAdmin();
  const newCount = (currentFailedCount || 0) + 1;

  if (newCount >= MAX_LOGIN_ATTEMPTS) {
    const lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
    await supabase
      .from('users')
      .update({
        failed_login_count: newCount,
        locked_until: lockUntil,
      })
      .eq('id', userId);

    return {
      locked: true,
      remainingMinutes: LOCKOUT_DURATION_MINUTES,
    };
  }

  await supabase
    .from('users')
    .update({
      failed_login_count: newCount,
    })
    .eq('id', userId);

  return {
    locked: false,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - newCount,
  };
}

/**
 * Reset counter kegagalan login saat berhasil masuk
 */
export async function resetFailedLogin(userId) {
  const supabase = getSupabaseAdmin();
  await supabase
    .from('users')
    .update({
      failed_login_count: 0,
      locked_until: null,
    })
    .eq('id', userId);
}

/**
 * Validasi kekuatan password (minimal 8 karakter)
 */
export function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password wajib diisi' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password minimal 8 karakter' };
  }
  return { valid: true };
}

