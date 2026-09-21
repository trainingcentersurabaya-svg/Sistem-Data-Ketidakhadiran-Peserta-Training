// lib/audit.js
import { getSupabaseAdmin } from './supabase';

/**
 * Mencatat aktivitas pengguna ke tabel audit_logs jika tersedia,
 * atau mencatat ke console jika tabel belum dibuat.
 * Fungsi ini tidak akan melempar exception agar alur utama tidak terganggu.
 *
 * @param {string} userId - ID pengguna yang melakukan aksi
 * @param {string} action - Nama aksi, contoh: 'CREATE_BRANCH', 'DELETE_RECORD'
 * @param {object} details - Rincian metadata atau payload aksi
 */
export async function auditLog(userId, action, details = {}) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('audit_logs').insert({
      user_id: userId || null,
      action,
      details: typeof details === 'object' ? details : { info: details },
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Graceful fallback jika tabel audit_logs belum dibuat di Supabase
    console.warn(`[AuditLog] ${action} by user ${userId}:`, details);
  }
}
