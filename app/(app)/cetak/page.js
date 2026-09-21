// app/(app)/cetak/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Printer, Filter, ArrowLeft, Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { LOGO_URL, formatDateIndo } from '@/lib/config';

export default function CetakPage() {
  const [meta, setMeta] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [branchId, setBranchId] = useState('');
  const [trainingId, setTrainingId] = useState('');
  const [batch, setBatch] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [trainerName, setTrainerName] = useState('Budi Setiawan');
  const [managerName, setManagerName] = useState('Hendra Wijaya');

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/meta');
        const json = await res.json();
        if (json.ok) {
          setMeta(json.data);
          if (json.data.userRole !== 'admin_pusat' && json.data.userBranchId) {
            setBranchId(json.data.userBranchId);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMeta();
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (branchId) params.set('branch_id', branchId);
      if (trainingId) params.set('training_id', trainingId);
      if (batch) params.set('batch', batch);
      if (tanggal) params.set('year', tanggal.substring(0, 4));

      const res = await fetch(`/api/records?${params.toString()}`);
      const json = await res.json();
      if (json.ok) {
        setRecords(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [branchId, trainingId, batch, tanggal]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  function handlePrint() {
    window.print();
  }

  const selectedBranchObj = meta?.branches?.find((b) => b.id === branchId);
  const selectedTrainingObj = meta?.trainings?.find((t) => t.id === trainingId);

  return (
    <div className="space-y-6">
      {/* Control Panel (Hidden on print) */}
      <div className="no-print bg-white p-5 rounded-2xl border border-gray-100 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/rekap"
              className="p-2 text-gray-500 hover:text-[#0056b3] hover:bg-blue-50 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-gray-900 font-title">
                Cetak Berita Acara Ketidakhadiran
              </h1>
              <p className="text-xs text-gray-500">
                Pratinjau format cetak resmi berkas berita acara (A4 Landscape).
              </p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-sm font-bold shadow-md transition-all min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>

        {/* Filters */}
        <div className="pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {meta?.userRole === 'admin_pusat' && (
            <div>
              <label className="block font-bold text-gray-600 mb-1">Cabang</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 font-medium"
              >
                <option value="">Semua Cabang</option>
                {meta?.branches?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-600 mb-1">Jenis Training</label>
            <select
              value={trainingId}
              onChange={(e) => setTrainingId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 font-medium"
            >
              <option value="">Semua Training</option>
              {meta?.trainings?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-600 mb-1">Nama Trainer</label>
            <input
              type="text"
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-600 mb-1">Pimpinan / Manager</label>
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Printable Sheet Area */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-md max-w-5xl mx-auto print:p-0 print:border-0 print:shadow-none">
        {/* Kop Surat Berita Acara */}
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4">
          <div className="flex items-center gap-4">
            <img src={LOGO_URL} alt="Logo Indomaret" className="h-14 w-auto object-contain" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-wide font-title uppercase">
                PT INDOMARCO PRISMATAMA
              </h2>
              <p className="text-xs font-bold text-gray-600 uppercase">
                TRAINING & DEVELOPMENT DEPARTMENT
              </p>
              <p className="text-[11px] text-gray-500">
                Cabang: {selectedBranchObj?.name || 'Nasional'} &bull; Kode: {selectedBranchObj?.code || 'PST'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-mono text-gray-500 block">FORM-TRN-ABS-01</span>
            <span className="text-xs font-bold text-gray-800 mt-1 block">
              Tanggal: {formatDateIndo(new Date())}
            </span>
          </div>
        </div>

        {/* Judul Dokumen */}
        <div className="text-center my-6">
          <h1 className="text-base sm:text-lg font-black uppercase text-gray-900 tracking-wider underline font-title">
            BERITA ACARA KETIDAKHADIRAN PESERTA PELATIHAN
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Modul: {selectedTrainingObj?.name || 'Semua Jenis Pelatihan'} &bull; Periode Tahun {new Date().getFullYear()}
          </p>
        </div>

        {/* Tabel Data Ketidakhadiran */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-gray-800 text-[11px]">
            <thead>
              <tr className="bg-gray-100 text-gray-900 font-bold uppercase text-center border-b border-gray-800">
                <th className="border border-gray-800 p-2 w-8">No</th>
                <th className="border border-gray-800 p-2 w-28">NIK</th>
                <th className="border border-gray-800 p-2">Nama Peserta</th>
                <th className="border border-gray-800 p-2 w-32">Jabatan</th>
                <th className="border border-gray-800 p-2 w-28">Batch & Tgl</th>
                <th className="border border-gray-800 p-2 w-36">Alasan</th>
                <th className="border border-gray-800 p-2 w-28 text-center">Status Bukti</th>
                <th className="border border-gray-800 p-2 w-32">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((r, i) => (
                  <tr key={r.id} className="border-b border-gray-400">
                    <td className="border border-gray-800 p-2 text-center font-bold">{i + 1}</td>
                    <td className="border border-gray-800 p-2 font-mono font-bold text-center">
                      {r.nik}
                    </td>
                    <td className="border border-gray-800 p-2 font-semibold text-gray-900">
                      {r.nama_peserta}
                    </td>
                    <td className="border border-gray-800 p-2">{r.jabatan}</td>
                    <td className="border border-gray-800 p-2 text-center">
                      B-{r.batch} ({r.tanggal_pelaksanaan})
                    </td>
                    <td className="border border-gray-800 p-2 font-medium">
                      {r.absence_reasons?.name || '-'}
                    </td>
                    <td className="border border-gray-800 p-2 text-center">
                      {r.drive_file_id ? (
                        <span className="font-bold text-teal-800">Ada (Google Drive)</span>
                      ) : (
                        <span className="text-gray-400 italic">Belum Ada</span>
                      )}
                    </td>
                    <td className="border border-gray-800 p-2 text-gray-600">{r.keterangan || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500 italic">
                    Tidak ada catatan ketidakhadiran untuk kriteria ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Kolom Tanda Tangan Resmi */}
        <div className="mt-12 pt-4 grid grid-cols-2 gap-8 text-center text-xs print-break-avoid">
          <div className="space-y-16">
            <p className="font-bold text-gray-800 uppercase">Dibuat & Diverifikasi Oleh,</p>
            <div>
              <p className="font-bold text-gray-900 underline">{trainerName}</p>
              <p className="text-[11px] text-gray-500">Instructor / Trainer Pelaksana</p>
            </div>
          </div>

          <div className="space-y-16">
            <p className="font-bold text-gray-800 uppercase">Mengetahui & Menyetujui,</p>
            <div>
              <p className="font-bold text-gray-900 underline">{managerName}</p>
              <p className="text-[11px] text-gray-500">Branch Training Manager</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
