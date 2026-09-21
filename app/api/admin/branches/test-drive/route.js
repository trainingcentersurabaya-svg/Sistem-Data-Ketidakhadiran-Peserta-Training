// app/api/admin/branches/test-drive/route.js
import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyDriveFolderAccess } from '@/lib/drive';
import { decryptSecret } from '@/lib/crypto';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin_pusat') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    let { branch_id, folder_id, credentials_json } = body;

    let credsObj = null;

    if (credentials_json && credentials_json.trim()) {
      try {
        credsObj = JSON.parse(credentials_json.trim());
      } catch (e) {
        return NextResponse.json(
          { ok: false, error: 'JSON Service Account tidak valid' },
          { status: 400 }
        );
      }
    } else if (branch_id) {
      const supabase = getSupabaseAdmin();
      const { data: branch, error } = await supabase
        .from('branches')
        .select('drive_credentials, drive_folder_id')
        .eq('id', branch_id)
        .single();

      if (error || !branch || !branch.drive_credentials) {
        return NextResponse.json(
          { ok: false, error: 'Cabang belum memiliki kredensial Google Drive tersimpan' },
          { status: 400 }
        );
      }

      credsObj = JSON.parse(decryptSecret(branch.drive_credentials));
      if (!folder_id) folder_id = branch.drive_folder_id;
    }

    if (!credsObj || !folder_id) {
      return NextResponse.json(
        { ok: false, error: 'Kredensial Service Account dan ID Folder Google Drive wajib diisi' },
        { status: 400 }
      );
    }

    const testRes = await verifyDriveFolderAccess(credsObj, folder_id.trim());

    if (!testRes.ok) {
      return NextResponse.json({ ok: false, error: testRes.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: `Koneksi Google Drive Berhasil! Folder "${testRes.folderName}" dapat diakses.`,
      folderName: testRes.folderName,
    });
  } catch (err) {
    console.error('[Test Drive Error]:', err);
    return NextResponse.json(
      { ok: false, error: 'Gagal menguji koneksi Google Drive: ' + err.message },
      { status: 500 }
    );
  }
}
