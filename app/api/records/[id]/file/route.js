// app/api/records/[id]/file/route.js
import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getFileStreamFromDrive } from '@/lib/drive';
import { decryptSecret } from '@/lib/crypto';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const supabase = getSupabaseAdmin();

    const { data: record, error } = await supabase
      .from('absence_records')
      .select('id, branch_id, drive_file_id, drive_file_name, file_mime_type, branches ( id, drive_credentials )')
      .eq('id', id)
      .single();

    if (error || !record || !record.drive_file_id) {
      return NextResponse.json({ ok: false, error: 'Berkas bukti tidak ditemukan' }, { status: 404 });
    }

    if (session.role !== 'admin_pusat' && record.branch_id !== session.branchId) {
      return NextResponse.json({ ok: false, error: 'Akses ditolak' }, { status: 403 });
    }

    if (!record.branches?.drive_credentials) {
      return NextResponse.json({ ok: false, error: 'Kredensial Drive belum dikonfigurasi' }, { status: 400 });
    }

    const credentials = JSON.parse(decryptSecret(record.branches.drive_credentials));
    const { stream, mimeType } = await getFileStreamFromDrive(credentials, record.drive_file_id);

    const headers = new Headers();
    headers.set('Content-Type', mimeType || record.file_mime_type || 'application/octet-stream');
    headers.set('Content-Disposition', `inline; filename="${record.drive_file_name || 'bukti-berita-acara'}"`);
    headers.set('Cache-Control', 'public, max-age=3600');

    return new Response(stream, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error('[File Stream Error]:', err);
    return NextResponse.json({ ok: false, error: 'Gagal mengambil berkas bukti dari Google Drive' }, { status: 500 });
  }
}
