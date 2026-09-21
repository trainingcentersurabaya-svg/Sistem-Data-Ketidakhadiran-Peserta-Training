// lib/validators.js
// Validasi data input pengguna dan pengecekan duplikat di database

import { getSupabaseAdmin } from './supabase.js';
import { parseToIsoDate } from './dates.js';

/**
 * Validasi NIK: hanya huruf dan angka, panjang 3-20 karakter
 */
export function validateNik(nik) {
  if (!nik || typeof nik !== 'string') {
    return 'NIK wajib diisi';
  }
  const clean = nik.trim();
  if (clean.length < 3 || clean.length > 20) {
    return 'NIK harus terdiri dari 3 hingga 20 karakter';
  }
  if (!/^[a-zA-Z0-9]+$/.test(clean)) {
    return 'NIK hanya boleh berisi kombinasi huruf dan angka';
  }
  return null;
}

/**
 * Validasi Nama: minimal 3 karakter
 */
export function validateNama(nama) {
  if (!nama || typeof nama !== 'string') {
    return 'Nama lengkap wajib diisi';
  }
  const clean = nama.trim();
  if (clean.length < 3) {
    return 'Nama lengkap minimal 3 karakter';
  }
  return null;
}

/**
 * Validasi Tanggal: format valid YYYY-MM-DD
 */
export function validateTanggal(tanggal) {
  const iso = parseToIsoDate(tanggal);
  if (!iso) {
    return 'Tanggal training tidak valid atau format salah';
  }
  return null;
}

/**
 * Validasi kelengkapan form input pencatatan ketidakhadiran
 */
export function validateRecordInput({
  branchId,
  nik,
  nama,
  trainingTypeId,
  tanggal,
  reasonId,
  requireFile = true,
  hasFile = false,
}) {
  const errors = {};

  if (!branchId) {
    errors.branchId = 'Cabang wajib dipilih';
  }

  const nikErr = validateNik(nik);
  if (nikErr) errors.nik = nikErr;

  const namaErr = validateNama(nama);
  if (namaErr) errors.nama = namaErr;

  if (!trainingTypeId) {
    errors.trainingTypeId = 'Jenis training wajib dipilih';
  }

  const tglErr = validateTanggal(tanggal);
  if (tglErr) errors.tanggal = tglErr;

  if (!reasonId) {
    errors.reasonId = 'Alasan ketidakhadiran wajib dipilih';
  }

  if (requireFile && !hasFile) {
    errors.evidence = 'File bukti Berita Acara (foto/PDF) wajib diunggah';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Cek apakah kombinasi branch_id + nik + training_type_id + tanggal sudah ada di database
 */
export async function checkDuplicateRecord({
  branchId,
  nik,
  trainingTypeId,
  tanggal,
  excludeRecordId = null,
}) {
  const supabase = getSupabaseAdmin();
  const isoDate = parseToIsoDate(tanggal);

  let query = supabase
    .from('absence_records')
    .select('id')
    .eq('branch_id', branchId)
    .ilike('nik', nik.trim())
    .eq('training_type_id', trainingTypeId)
    .eq('tanggal', isoDate);

  if (excludeRecordId) {
    query = query.neq('id', excludeRecordId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Check Duplicate Error]:', error);
    throw new Error('Gagal memeriksa duplikasi data di database');
  }

  return data && data.length > 0;
}
