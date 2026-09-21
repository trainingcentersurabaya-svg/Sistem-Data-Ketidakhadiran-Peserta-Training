/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: DRIVE BRIDGE CABANG
 * SISTEM DATA KETIDAKHADIRAN PESERTA TRAINING INDOMARET
 * ============================================================================
 *
 * Petunjuk Singkat:
 * 1. Buat folder baru di Google Drive akun cabang Anda (misal: "BUKTI_TRAINING_SBY").
 * 2. Salin ID Folder tersebut ke variabel ROOT_FOLDER_ID di bawah ini.
 * 3. Tentukan kata sandi rahasia cabang Anda pada variabel SHARED_SECRET.
 * 4. Klik "Deploy" > "New deployment" > Pilih jenis "Web app".
 *    - Execute as: "Me" (email cabang Anda)
 *    - Who has access: "Anyone"
 * 5. Salin URL Web App yang dihasilkan ke aplikasi web di Menu Admin > Cabang.
 * ============================================================================
 */

// 1. ID Folder Google Drive khusus penyimpanan bukti pelatihan cabang Anda.
//    Dapatkan dari tautan folder: drive.google.com/drive/folders/[ID_FOLDER]
var ROOT_FOLDER_ID = 'MASUKKAN_ID_FOLDER_GOOGLE_DRIVE_CABANG_DI_SINI';

// 2. Kata sandi rahasia penghubung (Secret Key).
//    Pastikan sama persis dengan yang dimasukkan di menu Admin Cabang aplikasi web.
var SHARED_SECRET = 'MASUKKAN_SECRET_RAHASIA_CABANG_DI_SINI';

/**
 * Handler HTTP GET untuk pengujian cepat di browser
 */
function doGet(e) {
  return createJsonResponse({
    ok: true,
    message: 'Drive Bridge Aktif. Gunakan metode POST dari server aplikasi web.',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handler HTTP POST utama untuk melayani permintaan dari server aplikasi web
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ ok: false, error: 'Bad Request: Data POST kosong' }, 400);
    }

    var payload = JSON.parse(e.postData.contents);
    var secret = payload.secret;
    var action = payload.action;

    // 1. Verifikasi Secret Key
    if (!secret || secret !== getEffectiveSecret()) {
      return createJsonResponse({ ok: false, error: 'Akses Ditolak: Secret Key Drive Bridge tidak cocok' }, 401);
    }

    // 2. Ambil Folder Root
    var folderId = getEffectiveFolderId();
    if (!folderId || folderId.indexOf('MASUKKAN_') === 0) {
      return createJsonResponse({ ok: false, error: 'Konfigurasi Error: ROOT_FOLDER_ID belum diatur pada Code.gs' }, 500);
    }

    var rootFolder;
    try {
      rootFolder = DriveApp.getFolderById(folderId);
    } catch (fErr) {
      return createJsonResponse({ ok: false, error: 'Folder Google Drive tidak ditemukan atau tidak dapat diakses' }, 404);
    }

    // 3. Eksekusi Aksi
    switch (action) {
      case 'ping':
        return handlePing(rootFolder);

      case 'upload':
        return handleUpload(rootFolder, payload);

      case 'get':
        return handleGet(rootFolder, payload);

      case 'trash':
        return handleTrash(rootFolder, payload);

      default:
        return createJsonResponse({ ok: false, error: 'Aksi "' + action + '" tidak dikenali' }, 400);
    }
  } catch (err) {
    return createJsonResponse({ ok: false, error: 'Terjadi kesalahan pada script: ' + err.toString() }, 500);
  }
}

/**
 * Aksi: PING (Cek koneksi dan ambil nama folder)
 */
function handlePing(folder) {
  return createJsonResponse({
    ok: true,
    folderName: folder.getName(),
    folderId: folder.getId(),
  });
}

/**
 * Aksi: UPLOAD (Simpan file baru ke dalam root folder cabang)
 */
function handleUpload(folder, payload) {
  var fileName = payload.fileName;
  var mimeType = payload.mimeType || 'application/octet-stream';
  var base64Data = payload.base64;

  if (!fileName || !base64Data) {
    return createJsonResponse({ ok: false, error: 'Parameter fileName dan base64 wajib diisi' }, 400);
  }

  var bytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(bytes, mimeType, fileName);
  var file = folder.createFile(blob);

  return createJsonResponse({
    ok: true,
    fileId: file.getId(),
    fileName: file.getName(),
    webViewLink: file.getUrl(),
    mimeType: file.getMimeType(),
    size: file.getSize(),
  });
}

/**
 * Aksi: GET (Mengambil file dengan validasi keamanan folder)
 */
function handleGet(rootFolder, payload) {
  var fileId = payload.fileId;
  if (!fileId) {
    return createJsonResponse({ ok: false, error: 'fileId wajib diisi' }, 400);
  }

  var file;
  try {
    file = DriveApp.getFileById(fileId);
  } catch (err) {
    return createJsonResponse({ ok: false, error: 'Berkas bukti tidak ditemukan di Google Drive' }, 404);
  }

  // Validasi Keamanan: Pastikan berkas benar berada di dalam ROOT_FOLDER_ID cabang ini
  if (!isFileInsideFolder(file, rootFolder.getId())) {
    return createJsonResponse({ ok: false, error: 'Akses Ditolak: Berkas berada di luar folder yang diizinkan' }, 403);
  }

  var blob = file.getBlob();
  var base64 = Utilities.base64Encode(blob.getBytes());

  return createJsonResponse({
    ok: true,
    name: file.getName(),
    mimeType: file.getMimeType(),
    size: file.getSize(),
    base64: base64,
  });
}

/**
 * Aksi: TRASH (Pindahkan file ke sampah Google Drive)
 */
function handleTrash(rootFolder, payload) {
  var fileId = payload.fileId;
  if (!fileId) {
    return createJsonResponse({ ok: false, error: 'fileId wajib diisi' }, 400);
  }

  var file;
  try {
    file = DriveApp.getFileById(fileId);
  } catch (err) {
    return createJsonResponse({ ok: true, message: 'Berkas sudah tidak ada atau telah dihapus' });
  }

  // Validasi Keamanan: Pastikan berkas benar berada di dalam ROOT_FOLDER_ID cabang ini
  if (!isFileInsideFolder(file, rootFolder.getId())) {
    return createJsonResponse({ ok: false, error: 'Akses Ditolak: Berkas berada di luar folder yang diizinkan' }, 403);
  }

  file.setTrashed(true);

  return createJsonResponse({
    ok: true,
    message: 'Berkas berhasil dipindahkan ke tempat sampah Google Drive',
  });
}

/**
 * Pemeriksaan keamanan apakah file berada dalam folder yang diizinkan
 */
function isFileInsideFolder(file, allowedFolderId) {
  var parents = file.getParents();
  while (parents.hasNext()) {
    var parent = parents.next();
    if (parent.getId() === allowedFolderId) {
      return true;
    }
  }
  return false;
}

/**
 * Mengambil Secret (mendukung Script Properties atau konstanta di atas)
 */
function getEffectiveSecret() {
  var prop = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  return prop || SHARED_SECRET;
}

/**
 * Mengambil Folder ID (mendukung Script Properties atau konstanta di atas)
 */
function getEffectiveFolderId() {
  var prop = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
  return prop || ROOT_FOLDER_ID;
}

/**
 * Helper menghasilkan response JSON standar
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
