// app/api/records/import/template/route.js
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getSessionFromRequest } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistem Ketidakhadiran Training Indomaret';

    // Sheet 1: Template Data
    const sheet = workbook.addWorksheet('Template Impor', {
      views: [{ showGridLines: true }],
    });

    const headers = [
      'NIK*',
      'Nama Peserta*',
      'Jabatan*',
      'Jenis Training*',
      'Batch*',
      'Tanggal Pelaksanaan (YYYY-MM-DD)*',
      'Cabang (Kode/Nama)*',
      'Alasan Ketidakhadiran*',
      'Keterangan',
    ];

    sheet.getRow(1).values = headers;
    sheet.getRow(1).height = 26;

    sheet.getRow(1).eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0056B3' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'medium', color: { argb: 'FF003366' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });

    // Contoh baris pengisian
    const sampleRows = [
      [
        '2024100123',
        'Budi Santoso',
        'Store Junior Leader',
        'Service Excellence',
        1,
        '2026-09-15',
        'SBY',
        'Sakit (Rawat Jalan)',
        'Surat keterangan dokter menyusul',
      ],
      [
        '2024100456',
        'Siti Rahmawati',
        'Kasir',
        'Basic Store Operation',
        2,
        '2026-09-16',
        'SBY',
        'Izin Keperluan Keluarga',
        'Acara pernikahan keluarga kandung',
      ],
    ];

    sampleRows.forEach((rowValues, idx) => {
      const row = sheet.getRow(2 + idx);
      row.values = rowValues;
      row.height = 20;
      row.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
      });
    });

    sheet.columns = [
      { width: 18 }, // NIK
      { width: 25 }, // Nama
      { width: 22 }, // Jabatan
      { width: 24 }, // Training
      { width: 10 }, // Batch
      { width: 32 }, // Tanggal
      { width: 22 }, // Cabang
      { width: 26 }, // Alasan
      { width: 30 }, // Keterangan
    ];

    // Sheet 2: Petunjuk Pengisian
    const guideSheet = workbook.addWorksheet('Petunjuk Pengisian');
    guideSheet.getColumn(1).width = 30;
    guideSheet.getColumn(2).width = 70;

    const guideRows = [
      ['KOLOM', 'KETENTUAN PENGISIAN'],
      ['NIK*', 'Wajib diisi. Format 8 hingga 16 digit angka (contoh: 2024100123)'],
      ['Nama Peserta*', 'Wajib diisi. Nama lengkap peserta training'],
      ['Jabatan*', 'Wajib diisi. Contoh: Crew Boy, Kasir, Store Junior Leader, dll'],
      ['Jenis Training*', 'Wajib diisi. Nama jenis training harus sesuai dengan yang ada di sistem'],
      ['Batch*', 'Wajib diisi. Angka bilangan bulat positif (contoh: 1, 2, 3)'],
      ['Tanggal Pelaksanaan*', 'Wajib diisi. Format YYYY-MM-DD (contoh: 2026-09-15)'],
      ['Cabang (Kode/Nama)*', 'Wajib diisi. Kode cabang (contoh: SBY, JKT) atau nama cabang'],
      ['Alasan Ketidakhadiran*', 'Wajib diisi. Nama alasan sesuai master alasan di sistem'],
      ['Keterangan', 'Opsional. Catatan tambahan mengenai ketidakhadiran'],
      ['Catatan Berkas Bukti', 'File bukti/berita acara tidak dapat diimpor via Excel, dapat diunggah kemudian melalui menu Rekap Data > Edit.'],
    ];

    guideRows.forEach((r, i) => {
      const row = guideSheet.getRow(i + 1);
      row.values = r;
      if (i === 0) {
        row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0056B3' } };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-impor-ketidakhadiran.xlsx"',
      },
    });
  } catch (err) {
    console.error('[Template Export Error]:', err);
    return NextResponse.json({ ok: false, error: 'Gagal membuat berkas template' }, { status: 500 });
  }
}
