-- ==============================================================================
-- SQL MIGRATION: GANTI GOOGLE SERVICE ACCOUNT MENJADI DRIVE BRIDGE
-- ==============================================================================
-- Jalankan skrip ini langsung di Supabase Dashboard > SQL Editor
-- Skrip ini TIDAK AKAN menghapus data cabang atau rekap ketidakhadiran yang ada.
-- ==============================================================================

-- 1. Tambahkan kolom baru untuk konfigurasi Drive Bridge (Google Apps Script)
ALTER TABLE branches ADD COLUMN IF NOT EXISTS drive_bridge_url text;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS drive_bridge_secret_enc text;

-- 2. Hapus kolom lama peninggalan Google Service Account
ALTER TABLE branches DROP COLUMN IF EXISTS drive_folder_id;
ALTER TABLE branches DROP COLUMN IF EXISTS drive_credentials;
ALTER TABLE branches DROP COLUMN IF EXISTS service_account_json_enc;
ALTER TABLE branches DROP COLUMN IF EXISTS service_account_json;

-- 3. Verifikasi struktur tabel branches
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'branches'
ORDER BY ordinal_position;
