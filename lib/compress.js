// lib/compress.js
// Utilitas kompresi gambar di browser & penamaan berkas bukti
import { MAX_IMAGE_SIDE, JPEG_QUALITY, MAX_PDF_SIZE_BYTES } from './config.js';

/**
 * Format ukuran byte menjadi teks ramah pengguna (misal: "240 KB" atau "3,2 MB")
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toLocaleString('id-ID', { maximumFractionDigits: 1 })} ${sizes[i]}`;
}

/**
 * Format tanggal YYYY-MM-DD menjadi YYYYMMDD untuk nama file
 */
export function sanitizeDateForFilename(dateStr) {
  if (!dateStr) return 'TANGGAL';
  return dateStr.replace(/[^0-9]/g, '').slice(0, 8);
}

/**
 * Membersihkan nama agar aman untuk sistem file
 */
export function sanitizeName(name) {
  if (!name) return 'NAMA';
  return name
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 30);
}

/**
 * Membuat nama file standar: {NIK}_BA_{Nama}_{yyyyMMdd}.{ext}
 */
export function generateEvidenceFileName(nik, nama, tanggal, extension) {
  const cleanNik = (nik || 'NIK').trim().replace(/[^a-zA-Z0-9]/g, '');
  const cleanNama = sanitizeName(nama);
  const cleanTgl = sanitizeDateForFilename(tanggal);
  const ext = extension.startsWith('.') ? extension.slice(1) : extension;
  return `${cleanNik}_BA_${cleanNama}_${cleanTgl}.${ext}`;
}

/**
 * Kompresi gambar client-side dengan perbaikan orientasi EXIF dan resize canvas
 * @param {File} file - Berkas gambar mentah dari input file
 * @returns {Promise<{ blob: Blob, base64: string, originalSize: number, compressedSize: number, mimeType: string }>}
 */
export async function compressImage(file) {
  // Gunakan createImageBitmap dengan opsi orientasi EXIF otomatis
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (err) {
    // Fallback jika browser versi lama tidak mendukung opsi orientasi
    bitmap = await createImageBitmap(file);
  }

  let width = bitmap.width;
  let height = bitmap.height;

  // Hitung penskalaan agar sisi terpanjang tidak melebihi MAX_IMAGE_SIDE (1280px)
  if (width > height) {
    if (width > MAX_IMAGE_SIDE) {
      height = Math.round((height * MAX_IMAGE_SIDE) / width);
      width = MAX_IMAGE_SIDE;
    }
  } else {
    if (height > MAX_IMAGE_SIDE) {
      width = Math.round((width * MAX_IMAGE_SIDE) / height);
      height = MAX_IMAGE_SIDE;
    }
  }

  // Gambar ke elemen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  // Berikan latar belakang putih jika ada transparansi PNG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Kompres menjadi JPEG dengan kualitas terstandar
  const compressedBlob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      'image/jpeg',
      JPEG_QUALITY
    );
  });

  // Konversi blob ke base64 (tanpa prefix data URI untuk kemudahan kirim ke Drive)
  const arrayBuffer = await compressedBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    blob: compressedBlob,
    base64,
    originalSize: file.size,
    compressedSize: compressedBlob.size,
    mimeType: 'image/jpeg',
  };
}

/**
 * Proses file PDF (validasi ukuran, tanpa kompresi)
 * @param {File} file
 * @returns {Promise<{ blob: Blob, base64: string, originalSize: number, compressedSize: number, mimeType: string }>}
 */
export async function processPdfFile(file) {
  if (file.size > MAX_PDF_SIZE_BYTES) {
    throw new Error(
      `Ukuran dokumen PDF melebihi batas maksimal 1 MB (Ukuran Anda: ${formatBytes(file.size)}). Silakan perkecil ukuran dokumen terlebih dahulu.`
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    blob: file,
    base64,
    originalSize: file.size,
    compressedSize: file.size,
    mimeType: 'application/pdf',
  };
}
