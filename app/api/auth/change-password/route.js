// app/api/auth/change-password/route.js
import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase';
import { comparePassword, hashPassword, validatePasswordStrength } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Sesi Anda telah berakhir. Silakan login kembali.' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { ok: false, error: 'Password saat ini dan password baru wajib diisi' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { ok: false, error: 'Konfirmasi password baru tidak cocok' },
        { status: 400 }
      );
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        { ok: false, error: strength.message },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', session.userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { ok: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { ok: false, error: 'Password saat ini yang Anda masukkan salah' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: newHash,
        must_change_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.userId);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: 'Gagal memperbarui password di database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Password berhasil diperbarui',
    });
  } catch (err) {
    console.error('[Change Password Error]:', err);
    return NextResponse.json(
      { ok: false, error: 'Terjadi kesalahan sistem saat memperbarui password' },
      { status: 500 }
    );
  }
}
