// lib/drive.js
// Komunikasi Server Next.js ke Google Drive (Google Drive API v3 & Drive Bridge)
import crypto from 'node:crypto';
import { decryptSecret } from './crypto.js';

const TIMEOUT_MS = 25000; // 25 detik timeout Apps Script

/**
 * Validasi file bukti upload (MIME type dan ukuran)
 */
export function validateEvidenceFile(file) {
  if (!file) return { valid: false, error: 'Berkas bukti tidak ditemukan' };
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
  if (!allowedMime.includes(file.type)) {
    return { valid: false, error: 'Format berkas bukti harus berupa Gambar (JPG/PNG) atau Dokumen PDF' };
  }
  const maxBytes = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxBytes) {
    return { valid: false, error: 'Ukuran berkas bukti melebihi batas maksimal (10 MB)' };
  }
  return { valid: true };
}

/**
 * Mendapatkan Access Token Google Drive via Service Account JWT assertion
 */
async function getGoogleDriveAccessToken(credentials) {
  const { client_email, private_key } = credentials || {};
  if (!client_email || !private_key) {
    throw new Error('Kredensial Service Account tidak valid (memerlukan client_email dan private_key)');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaimSet = Buffer.from(JSON.stringify(claimSet)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(private_key, 'base64url');
  const jwt = `${signatureInput}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Gagal mengotentikasi Google Service Account');
  }

  return data.access_token;
}

/**
 * Memverifikasi akses ke folder Google Drive dengan kredensial Service Account
 */
export async function verifyDriveFolderAccess(credentials, folderId) {
  try {
    const accessToken = await getGoogleDriveAccessToken(credentials);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=id,name,mimeType,trashed`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: data.error?.message || 'Folder Google Drive tidak ditemukan atau tidak dapat diakses oleh Service Account',
      };
    }

    if (data.trashed) {
      return { ok: false, error: 'Folder Google Drive yang dipilih berada di tempat sampah (Trash)' };
    }

    return {
      ok: true,
      folderName: data.name || folderId,
    };
  } catch (err) {
    return {
      ok: false,
      error: err.message || 'Gagal memverifikasi folder Google Drive',
    };
  }
}

/**
 * Mengunggah file ke folder Google Drive via Google Drive API v3 Multipart Upload
 */
export async function uploadFileToDrive({ credentials, folderId, file, customMetadata }) {
  const accessToken = await getGoogleDriveAccessToken(credentials);

  const ext = file.name ? file.name.split('.').pop() : (file.type === 'application/pdf' ? 'pdf' : 'jpg');
  const nik = customMetadata?.nik || 'NIK';
  const cleanNama = (customMetadata?.nama_peserta || 'PESERTA').replace(/[^a-zA-Z0-9_-]/g, '_');
  const tgl = (customMetadata?.tanggal_pelaksanaan || '').replace(/[^0-9]/g, '');
  const fileName = `${nik}_BA_${cleanNama}_${tgl || 'TGL'}.${ext}`;

  const metadata = {
    name: fileName,
    parents: [folderId],
    description: `Catatan Ketidakhadiran - NIK: ${nik}, Nama: ${customMetadata?.nama_peserta || '-'}, Tgl: ${customMetadata?.tanggal_pelaksanaan || '-'}`,
  };

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const mimeType = file.type || 'application/octet-stream';

  const multipartRequestBody = Buffer.concat([
    Buffer.from(
      delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n`
    ),
    fileBuffer,
    Buffer.from(closeDelimiter),
  ]);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,mimeType,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Gagal mengunggah berkas ke Google Drive');
  }

  return {
    fileId: data.id,
    fileName: data.name,
    webViewLink: data.webViewLink || data.webContentLink,
    mimeType: data.mimeType || mimeType,
    fileSize: data.size ? parseInt(data.size, 10) : file.size,
  };
}

/**
 * Menghapus file dari Google Drive
 */
export async function deleteFileFromDrive(credentials, fileId) {
  if (!fileId) return { ok: true };
  const accessToken = await getGoogleDriveAccessToken(credentials);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok && res.status !== 404) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || `Gagal menghapus file dari Google Drive (status ${res.status})`);
  }

  return { ok: true };
}

/**
 * Mengambil file stream dari Google Drive
 */
export async function getFileStreamFromDrive(credentials, fileId) {
  if (!fileId) throw new Error('ID file Google Drive wajib disertakan');
  const accessToken = await getGoogleDriveAccessToken(credentials);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Gagal mengunduh file dari Google Drive (status ${res.status})`);
  }

  return {
    stream: res.body,
    mimeType: res.headers.get('content-type'),
  };
}


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
