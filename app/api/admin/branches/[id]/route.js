// app/api/admin/branches/[id]/route.js
import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase';
import { encryptSecret } from '@/lib/crypto';
import { auditLog } from '@/lib/audit';

export const runtime = 'nodejs';

export async function PUT(request, { params }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin_pusat') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, code, drive_folder_id, drive_credentials_json, is_active } = body;

    const supabase = getSupabaseAdmin();

    const updatePayload = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updatePayload.name = name.trim();
    if (code !== undefined) updatePayload.code = code.trim().toUpperCase();
    if (drive_folder_id !== undefined) updatePayload.drive_folder_id = drive_folder_id ? drive_folder_id.trim() : null;
    if (is_active !== undefined) updatePayload.is_active = Boolean(is_active);

    if (drive_credentials_json && drive_credentials_json.trim()) {
      try {
        JSON.parse(drive_credentials_json.trim());
        updatePayload.drive_credentials = encryptSecret(drive_credentials_json.trim());
      } catch (jsonErr) {
        return NextResponse.json(
          { ok: false, error: 'Format JSON kredensial Service Account tidak valid' },
          { status: 400 }
        );
      }
    }

    const { data: updated, error } = await supabase
      .from('branches')
      .update(updatePayload)
      .eq('id', id)
      .select('id, name, code, drive_folder_id, is_active, created_at')
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: 'Gagal memperbarui cabang: ' + error.message }, { status: 500 });
    }

    await auditLog(session.userId, 'UPDATE_BRANCH', { branchId: id });

    return NextResponse.json({ ok: true, message: 'Cabang berhasil diperbarui', data: updated });
  } catch (err) {
    console.error('[Branch PUT Error]:', err);
    return NextResponse.json({ ok: false, error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin_pusat') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    const supabase = getSupabaseAdmin();

    // Cek apakah ada catatan ketidakhadiran di cabang ini
    const { count, error: countErr } = await supabase
      .from('absence_records')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', id);

    if (count > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Cabang tidak dapat dihapus karena masih memiliki ${count} data ketidakhadiran terkait. Anda dapat menonaktifkan cabang ini.`,
        },
        { status: 400 }
      );
    }

    const { error: delErr } = await supabase.from('branches').delete().eq('id', id);

    if (delErr) {
      return NextResponse.json({ ok: false, error: 'Gagal menghapus cabang' }, { status: 500 });
    }

    await auditLog(session.userId, 'DELETE_BRANCH', { branchId: id });

    return NextResponse.json({ ok: true, message: 'Cabang berhasil dihapus' });
  } catch (err) {
    console.error('[Branch DELETE Error]:', err);
    return NextResponse.json({ ok: false, error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
