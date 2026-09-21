// lib/drive.js
// Komunikasi Server Next.js ke Google Apps Script (Drive Bridge) tiap cabang
import { decryptSecret } from './crypto.js';

const TIMEOUT_MS = 25000; // 25 detik timeout Apps Script

/**
 * Panggil Google Apps Script Drive Bridge dengan aman dari server
 */
async function callBridge(url, payload) {
  if (!url || !url.startsWith('https://script.google.com/')) {
    throw new Error('URL Google Apps Script tidak valid.');
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (netErr) {
    if (netErr.name === 'TimeoutError' || netErr.name === 'AbortError') {
      throw new Error(
        'Koneksi ke Google Drive cabang timeout (melebihi 25 detik). Silakan coba lagi.'
      );
    }
    throw new Error(`Gagal menghubungi Drive Bridge cabang: ${netErr.message}`);
  }

  if (!response.ok) {
    throw new Error(`Google Apps Script merespons status ${response.status}`);
  }

  let jsonResult;
  try {
    jsonResult = await response.json();
  } catch (err) {
    const textOutput = await response.text();
    console.error('[Drive Bridge Non-JSON Output]:', textOutput);
    throw new Error('Respon dari Drive Bridge bukan format JSON yang valid.');
  }

  if (!jsonResult.ok) {
    throw new Error(jsonResult.error || 'Terjadi kesalahan pada Drive Bridge cabang');
  }

  return jsonResult;
}

/**
 * Mengecek dan mengekstrak URL dan Secret dari objek cabang
 */
function extractBranchCredentials(branch) {
  if (!branch || !branch.drive_bridge_url || !branch.drive_bridge_secret_enc) {
    throw new Error('Google Drive cabang ini belum dikonfigurasi. Hubungi Admin Pusat.');
  }

  const secret = decryptSecret(branch.drive_bridge_secret_enc);
  if (!secret) {
    throw new Error('Google Drive cabang ini belum dikonfigurasi. Hubungi Admin Pusat.');
  }

  return {
    url: branch.drive_bridge_url,
    secret,
  };
}

/**
 * Tes koneksi ke Drive Bridge (aksi: ping)
 * Menerima objek { url, secret }
 */
export async function drivePing({ url, secret }) {
  if (!url || !secret) {
    throw new Error('URL dan Secret Drive Bridge wajib diisi untuk pengujian.');
  }

  const result = await callBridge(url, {
    action: 'ping',
    secret,
  });

  return {
    ok: true,
    folderName: result.folderName,
  };
}

/**
 * Mengunggah file bukti ke Google Drive cabang
 */
export async function driveUpload(branch, { fileName, mimeType, base64 }) {
  const { url, secret } = extractBranchCredentials(branch);

  const result = await callBridge(url, {
    action: 'upload',
    secret,
    fileName,
    mimeType,
    base64,
  });

  return {
    ok: true,
    fileId: result.fileId,
  };
}

/**
 * Mengambil konten file bukti dari Google Drive cabang
 */
export async function driveGetFile(branch, fileId) {
  if (!fileId) {
    throw new Error('ID file bukti tidak ditemukan');
  }

  const { url, secret } = extractBranchCredentials(branch);

  const result = await callBridge(url, {
    action: 'get',
    secret,
    fileId,
  });

  return {
    ok: true,
    name: result.name,
    mimeType: result.mimeType,
    base64: result.base64,
  };
}

/**
 * Memindahkan file bukti ke tempat sampah Google Drive cabang
 */
export async function driveTrash(branch, fileId) {
  if (!fileId) return { ok: true };

  const { url, secret } = extractBranchCredentials(branch);

  const result = await callBridge(url, {
    action: 'trash',
    secret,
    fileId,
  });

  return {
    ok: true,
    message: result.message || 'File berhasil dipindahkan ke sampah',
  };
}
