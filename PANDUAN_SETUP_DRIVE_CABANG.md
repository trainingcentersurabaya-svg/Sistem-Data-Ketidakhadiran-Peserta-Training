# Panduan Setup Google Drive Bridge Cabang

Panduan ini ditujukan bagi **Pemilik Akun Google / Penanggung Jawab Cabang** untuk menghubungkan Google Drive cabang ke **Sistem Data Ketidakhadiran Peserta Training**.

---

## Mengapa Cara Ini Digunakan?
Setiap cabang menyimpan foto & dokumen bukti Berita Acara (BA) ketidakhadiran langsung ke akun Google Drive milik cabangnya sendiri. Hal ini menjaga privasi file, menghemat kapasitas sistem pusat, dan tidak memerlukan biaya langganan tambahan.

---

## Langkah-Langkah Setup (Hanya Dilakukan Sekali)

### Langkah 1: Buat Folder Bukti di Google Drive Cabang
1. Buka [https://drive.google.com](https://drive.google.com) dengan akun Google resmi cabang.
2. Klik tombol **+ Baru (New)** > **Folder Baru**.
3. Beri nama folder, contoh: `Bukti Training - Cabang Surabaya`.
4. Buka folder yang baru dibuat tersebut.
5. Perhatikan URL di bilah alamat browser Anda. URL akan berbentuk seperti:
   ```text
   https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
   ```
6. Salin bagian kode acak di ujung URL tersebut (setelah `/folders/`).
   Contoh ID: `1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`.
   Simpan kode ini sebagai **ROOT_FOLDER_ID**.

---

### Langkah 2: Buat Proyek Google Apps Script
1. Buka [https://script.google.com](https://script.google.com) (pastikan tetap memakai akun Google cabang).
2. Klik tombol **Proyek Baru (New Project)** di kiri atas.
3. Di kiri atas, klik "Untitled project" lalu ubah namanya menjadi: `Drive Bridge - Cabang Surabaya`.
4. Pada editor kode di bagian tengah, hapus semua kode bawaan (`function myFunction() { ... }`).
5. Buka file `Code.gs` yang diberikan oleh Admin Pusat (atau salin dari repository).
6. Tempelkan (paste) seluruh kode `Code.gs` ke editor Google Apps Script tersebut.
7. Tekan tombol **Simpan (ikon disket)** atau `Ctrl + S`.

---

### Langkah 3: Atur Script Properties (Folder ID & Secret)
1. Di menu samping kiri editor Apps Script, klik ikon gerigi **Pengaturan Proyek (Project Settings)**.
2. Gulir ke bawah hingga bagian **Properti Script (Script Properties)**.
3. Klik tombol **Tambahkan properti script (Add script property)**.
4. Buat 2 properti berikut:
   - Properti 1:
     - **Properti:** `ROOT_FOLDER_ID`
     - **Nilai:** Tempelkan ID folder Drive dari Langkah 1 (contoh: `1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`)
   - Properti 2:
     - **Properti:** `BRIDGE_SECRET`
     - **Nilai:** Buat kata sandi acak yang kuat (minimal 24 karakter, gabungan huruf besar, huruf kecil, dan angka). Simpan kata sandi ini.
5. Klik **Simpan properti script (Save script properties)**.

---

### Langkah 4: Terapkan Sebagai Web App (Deploy)
1. Di pojok kanan atas, klik tombol biru **Terapkan (Deploy)** > **Penerapan Baru (New deployment)**.
2. Pada jendela popup, klik ikon gerigi di samping *Select type* lalu pilih **Aplikasi web (Web app)**.
3. Isi konfigurasi berikut:
   - **Deskripsi:** `v1 - Drive Bridge Cabang`
   - **Jalankan sebagai (Execute as):** `Saya (alamat_email_cabang@gmail.com)` *(PILIHAN INI SANGAT PENTING)*
   - **Yang memiliki akses (Who has access):** `Siapa saja (Anyone)` *(Sistem Next.js akan memverifikasi lewat Secret)*
4. Klik tombol **Terapkan (Deploy)**.
5. Klik **Otorisasi akses (Authorize access)** jika diminta Google:
   - Pilih akun Google cabang Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik tautan kecil bertuliskan **Advanced** (di kiri bawah).
   - Klik **Go to Drive Bridge - Cabang Surabaya (unsafe)**.
   - Gulir ke bawah dan klik tombol biru **Allow**.
6. Google Apps Script akan menampilkan **URL Aplikasi Web (Web app URL)**.
   URL akan berbentuk:
   ```text
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
7. Salin URL tersebut.

---

### Langkah 5: Kirimkan Data ke Admin Pusat
Kirimkan 2 data berikut kepada **Admin Pusat**:
1. **URL Aplikasi Web:** `https://script.google.com/macros/s/AKfycbx.../exec`
2. **BRIDGE_SECRET:** Kata sandi rahasia yang Anda buat di Langkah 3.

> **PENTING TENTANG KEAMANAN:**  
> Kirimkan data ini melalui jalur privat (misalnya pesan langsung atau password manager), **JANGAN kirim ke grup umum**. Admin Pusat akan memasukkan data ini ke menu **Admin > Cabang** dan menekan tombol **Tes Koneksi**. Setelah berwarna hijau, sistem cabang Anda siap digunakan!

---

### Catatan Pembaruan (Jika Kode Diperbarui di Masa Mendatang)
Jika suatu saat Admin Pusat memberikan pembaruan kode `Code.gs`:
1. Buka kembali proyek di `script.google.com`.
2. Tempelkan kode baru.
3. Klik **Terapkan (Deploy)** > **Kelola penerapan (Manage deployments)**.
4. Klik ikon pensil (Edit), pada bagian Versi pilih **Versi baru (New version)**.
5. Klik **Terapkan (Deploy)**. URL Web App **tidak akan berubah** sehingga tidak perlu setup ulang!
