/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: DRIVE BRIDGE PER CABANG
 * ==============================================================================
 * Script ini dipasang pada akun Google milik masing-masing Cabang.
 * Berfungsi sebagai jembatan penyimpanan bukti file (foto/PDF) di Google Drive cabang.
 * 
 * Script Properties yang WAJIB diatur di Project Settings (ikon gerigi):
 * 1. ROOT_FOLDER_ID : ID folder di Google Drive tempat menyimpan bukti cabang
 * 2. BRIDGE_SECRET   : Kata sandi rahasia cabang (minimal 24 karakter acak)
 * ==============================================================================
 */

// Batas ukuran base64 (~3.5 MB sebelum decode menjadi ~2.5 MB file mentah)
const MAX_BASE64_LENGTH = 5 * 1024 * 1024;

// MIME Types yang diizinkan untuk bukti Berita Acara
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf'
];

/**
 * Handle GET: untuk verifikasi status dasar di browser
 */
function doGet(e) {
  return ContentService.createTextOutput('Drive Bridge aktif')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Handle POST: memproses ping, upload, get, dan trash
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJson({ ok: false, error: 'Data permintaan kosong' });
    }

    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return responseJson({ ok: false, error: 'Format JSON tidak valid' });
    }

    // Ambil konfigurasi dari Script Properties
    const scriptProps = PropertiesService.getScriptProperties();
    const configuredSecret = scriptProps.getProperty('BRIDGE_SECRET');
    const rootFolderId = scriptProps.getProperty('ROOT_FOLDER_ID');

    if (!configuredSecret || !rootFolderId) {
      return responseJson({
        ok: false,
        error: 'Drive Bridge belum dikonfigurasi lengkap (BRIDGE_SECRET atau ROOT_FOLDER_ID kosong)'
      });
    }

    // 1. Verifikasi Keamanan Secret
    if (!payload.secret || payload.secret !== configuredSecret) {
      return responseJson({ ok: false, error: 'Unauthorized: Secret tidak cocok' });
    }

    // Dapatkan Root Folder Drive Cabang
    let rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(rootFolderId);
    } catch (fErr) {
      return responseJson({
        ok: false,
        error: 'ROOT_FOLDER_ID tidak ditemukan atau akun tidak memiliki izin akses folder'
      });
    }

    const action = payload.action;

    // -------------------------------------------------------------
    // AKSI 1: PING (Tes Koneksi & Nama Folder)
    // -------------------------------------------------------------
    if (action === 'ping') {
      return responseJson({
        ok: true,
        folderName: rootFolder.getName()
      });
    }

    // -------------------------------------------------------------
    // AKSI 2: UPLOAD (Simpan Berkas Baru ke Root Folder Cabang)
    // -------------------------------------------------------------
    if (action === 'upload') {
      const { fileName, mimeType, base64 } = payload;

      if (!fileName || !mimeType || !base64) {
        return responseJson({ ok: false, error: 'Parameter upload tidak lengkap' });
      }

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return responseJson({ ok: false, error: 'Format file ditolak. Hanya JPG, PNG, atau PDF yang diizinkan' });
      }

      if (base64.length > MAX_BASE64_LENGTH) {
        return responseJson({ ok: false, error: 'Ukuran file terlalu besar (maksimal ~3 MB)' });
      }

      const decodedBytes = Utilities.base64Decode(base64);
      const blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
      const createdFile = rootFolder.createFile(blob);

      return responseJson({
        ok: true,
        fileId: createdFile.getId()
      });
    }

    // -------------------------------------------------------------
    // AKSI 3: GET (Ambil Konten Berkas Bukti)
    // -------------------------------------------------------------
    if (action === 'get') {
      const { fileId } = payload;
      if (!fileId) {
        return responseJson({ ok: false, error: 'fileId wajib diisi' });
      }

      let file;
      try {
        file = DriveApp.getFileById(fileId);
      } catch (notFound) {
        return responseJson({ ok: false, error: 'File tidak ditemukan di Google Drive cabang' });
      }

      // Validasi keamanan: Pastikan file merupakan anak langsung dari ROOT_FOLDER_ID
      if (!isInRoot(file, rootFolderId)) {
        return responseJson({ ok: false, error: 'Akses ditolak: File berada di luar folder bukti cabang' });
      }

      const blob = file.getBlob();
      const base64Content = Utilities.base64Encode(blob.getBytes());

      return responseJson({
        ok: true,
        name: file.getName(),
        mimeType: blob.getContentType(),
        base64: base64Content
      });
    }

    // -------------------------------------------------------------
    // AKSI 4: TRASH (Pindahkan Berkas Bukti ke Sampah Drive)
    // -------------------------------------------------------------
    if (action === 'trash') {
      const { fileId } = payload;
      if (!fileId) {
        return responseJson({ ok: false, error: 'fileId wajib diisi' });
      }

      let file;
      try {
        file = DriveApp.getFileById(fileId);
      } catch (notFound) {
        // Jika file sudah tidak ada, anggap operasi selesai
        return responseJson({ ok: true, message: 'File sudah tidak ada' });
      }

      // Validasi keamanan: Pastikan file merupakan anak langsung dari ROOT_FOLDER_ID
      if (!isInRoot(file, rootFolderId)) {
        return responseJson({ ok: false, error: 'Akses ditolak: File berada di luar folder bukti cabang' });
      }

      file.setTrashed(true);
      return responseJson({ ok: true });
    }

    return responseJson({ ok: false, error: 'Aksi tidak dikenal: ' + action });

  } catch (globalErr) {
    return responseJson({
      ok: false,
      error: 'Terjadi kesalahan internal pada Google Apps Script: ' + globalErr.toString()
    });
  }
}

/**
 * Validasi apakah file berada langsung di dalam ROOT_FOLDER_ID
 */
function isInRoot(file, rootFolderId) {
  try {
    const parents = file.getParents();
    while (parents.hasNext()) {
      const parent = parents.next();
      if (parent.getId() === rootFolderId) {
        return true;
      }
    }
  } catch (err) {
    return false;
  }
  return false;
}

/**
 * Helper untuk mengembalikan respons JSON aman
 */
function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
