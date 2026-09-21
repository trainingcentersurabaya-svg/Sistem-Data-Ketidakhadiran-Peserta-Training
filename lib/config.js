// lib/config.js
// Konfigurasi konstan aplikasi

export const LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/4/44/Indomaret.svg';
// Petunjuk: Untuk menggunakan logo lokal tanpa ketergantungan internet, unduh logo ke public/logo.svg
// lalu ganti konstanta di atas menjadi:
// export const LOGO_URL = '/logo.svg';

export const APP_NAME = 'Sistem Data Ketidakhadiran Peserta Training';
export const APP_DESCRIPTION = 'Sistem pencatatan ketidakhadiran peserta training multi-cabang dengan bukti Google Drive per cabang dan database Supabase';
export const FOOTER_TEXT = 'Sistem Data Ketidakhadiran Peserta Training • Bang Ajiib © 2026';

// Batasan kompresi gambar di browser
export const MAX_IMAGE_SIDE = 1280; // Sisi terpanjang foto maksimal 1280px
export const JPEG_QUALITY = 0.7;    // Kualitas kompresi JPEG canvas

// Batasan berkas
export const MAX_PDF_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB untuk file PDF
export const MAX_IMPORT_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB untuk file Excel/CSV
export const MAX_IMPORT_ROWS = 1000;
export const MAX_EXPORT_ROWS = 20000;
export const MAX_PRINT_ITEMS = 400; // Maksimal lembar cetak sekaligus

// Pagination
export const ITEMS_PER_PAGE = 20;

// Durasi sesi JWT
export const SESSION_DURATION_SECONDS = 8 * 60 * 60; // 8 Jam

// Durasi penguncian akun saat gagal login 5 kali berturut-turut
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;
