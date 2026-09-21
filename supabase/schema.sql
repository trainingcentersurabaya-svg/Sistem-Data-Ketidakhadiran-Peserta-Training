-- ==============================================================================
-- SCHEMA DATABASE SUPABASE: SISTEM DATA KETIDAKHADIRAN PESERTA TRAINING
-- ==============================================================================
-- Petunjuk:
-- 1. Buka Supabase Dashboard > SQL Editor
-- 2. Tempel seluruh isi script ini
-- 3. PENTING: GANTI teks 'GANTI_PASSWORD_INI' pada bagian SEED ADMIN PUSAT
--    dengan password awal pilihan Anda sebelum menekan tombol RUN!
-- ==============================================================================

-- 1. Aktifkan ekstensi pgcrypto untuk UUID dan hashing password
create extension if not exists pgcrypto;

-- 2. Tabel Cabang (Branches)
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  drive_bridge_url text,
  drive_bridge_secret_enc text,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

-- 3. Tabel Pengguna (Users)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  full_name text not null,
  role text not null check (role in ('admin_pusat', 'admin_cabang')),
  branch_id uuid references branches(id) on delete set null,
  is_active boolean default true not null,
  must_change_password boolean default false not null,
  failed_login_count int default 0 not null,
  locked_until timestamptz,
  created_at timestamptz default now() not null,
  constraint check_branch_role check (
    (role = 'admin_cabang' and branch_id is not null) or
    (role = 'admin_pusat')
  )
);

-- 4. Tabel Master Jenis Training (Training Types)
create table if not exists training_types (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int default 0 not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

-- 5. Tabel Master Alasan Ketidakhadiran (Absence Reasons)
create table if not exists absence_reasons (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int default 0 not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

-- 6. Tabel Rekap Data Ketidakhadiran (Absence Records)
create table if not exists absence_records (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references branches(id) on delete restrict,
  nik text not null,
  nama text not null,
  training_type_id uuid not null references training_types(id) on delete restrict,
  tanggal date not null,
  reason_id uuid not null references absence_reasons(id) on delete restrict,
  evidence_file_id text,
  evidence_mime text,
  evidence_name text,
  created_by uuid references users(id) on delete set null,
  updated_by uuid references users(id) on delete set null,
  updated_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- 7. Index Unik untuk Mencegah Data Ganda pada cabang + nik + training + tanggal
create unique index if not exists idx_absence_records_unique_entry 
  on absence_records (branch_id, nik, training_type_id, tanggal);

-- 8. Index Performa Pencarian dan Filter
create index if not exists idx_absence_records_branch_id on absence_records(branch_id);
create index if not exists idx_absence_records_tanggal on absence_records(tanggal);
create index if not exists idx_absence_records_nik on absence_records(nik);
create index if not exists idx_absence_records_training_type_id on absence_records(training_type_id);
create index if not exists idx_absence_records_reason_id on absence_records(reason_id);

-- 9. Row Level Security (RLS) Diaktifkan di SEMUA Tabel
-- Tidak ada Policy publik/anon; semua akses data wajib melewati backend Next.js memakai Service Role Key
alter table branches enable row level security;
alter table users enable row level security;
alter table training_types enable row level security;
alter table absence_reasons enable row level security;
alter table absence_records enable row level security;

-- ==============================================================================
-- SEED DATA AWAL
-- ==============================================================================

-- Seed 16 Jenis Training Standar
insert into training_types (name, sort_order, is_active) values
  ('Fried Food', 1, true),
  ('Fresh', 2, true),
  ('Say Burger', 3, true),
  ('Say Bread', 4, true),
  ('PcDel', 5, true),
  ('Special Store', 6, true),
  ('YCCG', 7, true),
  ('Eva SC', 8, true),
  ('Barista', 9, true),
  ('Leader Barista', 10, true),
  ('Soft Skill', 11, true),
  ('Idel', 12, true),
  ('CIF', 13, true),
  ('SSL', 14, true),
  ('SJL', 15, true),
  ('Training DC', 16, true)
on conflict (name) do nothing;

-- Seed 10 Alasan Tidak Hadir Standar
insert into absence_reasons (name, sort_order, is_active) values
  ('Cuti', 1, true),
  ('Bencana alam', 2, true),
  ('Keluarga inti sakit', 3, true),
  ('Musibah/kecelakaan', 4, true),
  ('Menggantikan personil lain', 5, true),
  ('Mangkir', 6, true),
  ('Mutasi', 7, true),
  ('Toko tidak jual prodsus', 8, true),
  ('Sakit', 9, true),
  ('Resign', 10, true)
on conflict (name) do nothing;

-- ==============================================================================
-- SEED AKUN ADMIN PUSAT AWAL
-- ==============================================================================
-- PERHATIAN:
-- GANTI teks 'GANTI_PASSWORD_INI' di bawah ini menjadi password pilihan Anda
-- sebelum mengeksekusi script ini di Supabase SQL Editor.
-- Akun ini diset 'must_change_password = true' sehingga saat login pertama kali,
-- sistem akan meminta perubahan password demi keamanan.
-- ==============================================================================

insert into users (
  username,
  password_hash,
  full_name,
  role,
  branch_id,
  is_active,
  must_change_password
) values (
  'admin',
  crypt('admin123', gen_salt('bf', 10)),
  'Admin Pusat Utama',
  'admin_pusat',
  null,
  true,
  true
)
on conflict (username) do nothing;
