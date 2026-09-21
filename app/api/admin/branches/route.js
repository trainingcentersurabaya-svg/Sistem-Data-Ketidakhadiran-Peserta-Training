// app/api/admin/branches/route.js
import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase';
import { encryptSecret } from '@/lib/crypto';
import { auditLog } from '@/lib/audit';

export const runtime = 'nodejs';

// GET: Daftar semua cabang
export async function GET(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin_pusat') {
      return NextResponse.json({ ok: false, error: 'Akses khusus Admin Pusat' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data: branches, error } = await supabase
      .from('branches')
      .select('id, name, code, drive_folder_id, is_active, created_at, drive_credentials')
      .order('name');

    if (error) {
      return NextResponse.json({ ok: false, error: 'Gagal mengambil data cabang' }, { status: 500 });
    }

    // Jangan kirim isi kunci terenkripsi ke frontend demi keamanan, cukup boolean has_drive_credentials
    const safeBranches = (branches || []).map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      drive_folder_id: b.drive_folder_id,
      is_active: b.is_active,
      created_at: b.created_at,
      has_drive_credentials: Boolean(b.drive_credentials),
    }));

    return NextResponse.json({ ok: true, data: safeBranches });
  } catch (err) {
    console.error('[Admin Branches GET Error]:', err);
    return NextResponse.json({ ok: false, error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

// POST: Tambah cabang baru
export async function POST(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin_pusat') {
      return NextResponse.json({ ok: false, error: 'Akses khusus Admin Pusat' }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, drive_folder_id, drive_credentials_json, is_active = true } = body;

    if (!name || !code) {
      return NextResponse.json({ ok: false, error: 'Nama dan Kode Cabang wajib diisi' }, { status: 400 });
    }

    let encryptedCreds = null;
    if (drive_credentials_json && drive_credentials_json.trim()) {
      try {
        JSON.parse(drive_credentials_json.trim());
        encryptedCreds = encryptSecret(drive_credentials_json.trim());
      } catch (jsonErr) {
        return NextResponse.json(
          { ok: false, error: 'Format JSON kredensial Service Account tidak valid' },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseAdmin();
    const { data: newBranch, error } = await supabase
      .from('branches')
      .insert({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        drive_folder_id: drive_folder_id ? drive_folder_id.trim() : null,
        drive_credentials: encryptedCreds,
        is_active: Boolean(is_active),
      })
      .select('id, name, code, drive_folder_id, is_active, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ ok: false, error: 'Kode cabang sudah terdaftar di sistem' }, { status: 400 });
      }
      return NextResponse.json({ ok: false, error: 'Gagal menambahkan cabang: ' + error.message }, { status: 500 });
    }

    await auditLog(session.userId, 'CREATE_BRANCH', { branchId: newBranch.id, code: newBranch.code });

    return NextResponse.json({ ok: true, message: 'Cabang berhasil ditambahkan', data: newBranch });
  } catch (err) {
    console.error('[Admin Branches POST Error]:', err);
    return NextResponse.json({ ok: false, error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
