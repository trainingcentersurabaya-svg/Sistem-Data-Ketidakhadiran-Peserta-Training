// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import { deleteSessionCookie } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ ok: true, message: 'Berhasil keluar' });
  deleteSessionCookie(response);
  return response;
}
