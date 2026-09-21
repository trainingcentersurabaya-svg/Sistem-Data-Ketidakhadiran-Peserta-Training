// app/api/meta/route.js
import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase';
import { POSITIONS, MONTHS } from '@/lib/config';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const [branchesRes, trainingsRes, reasonsRes] = await Promise.all([
      supabase.from('branches').select('id, name, code, is_active').order('name'),
      supabase.from('training_types').select('id, name, is_active').order('name'),
      supabase.from('absence_reasons').select('id, name, is_active').order('name'),
    ]);

    const branches = branchesRes.data || [];
    const trainings = trainingsRes.data || [];
    const reasons = reasonsRes.data || [];

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
    const batches = Array.from({ length: 50 }, (_, i) => i + 1);

    return NextResponse.json({
      ok: true,
      data: {
        branches,
        trainings,
        reasons,
        positions: POSITIONS,
        months: MONTHS,
        years,
        batches,
        userRole: session.role,
        userBranchId: session.branchId,
      },
    });
  } catch (err) {
    console.error('[Meta API Error]:', err);
    return NextResponse.json(
      { ok: false, error: 'Gagal mengambil metadata sistem' },
      { status: 500 }
    );
  }
}
