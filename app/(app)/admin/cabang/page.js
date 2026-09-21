// app/(app)/admin/cabang/page.js
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Building2,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  HardDrive,
  Loader2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Play,
} from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function AdminCabangPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formFolderId, setFormFolderId] = useState('');
  const [formCredsJson, setFormCredsJson] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingDrive, setTestingDrive] = useState(false);

  // Delete State
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, branch: null, loading: false });

  async function loadBranches() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/branches');
      const json = await res.json();
      if (json.ok) {
        setBranches(json.data || []);
      } else {
        toast.error(json.error || 'Gagal memuat data cabang');
      }
    } catch (e) {
      toast.error('Gagal mengambil data cabang');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  function openCreateModal() {
    setEditingBranch(null);
    setFormName('');
    setFormCode('');
    setFormFolderId('');
    setFormCredsJson('');
    setFormIsActive(true);
    setIsModalOpen(true);
  }

  function openEditModal(branch) {
    setEditingBranch(branch);
    setFormName(branch.name);
    setFormCode(branch.code);
    setFormFolderId(branch.drive_folder_id || '');
    setFormCredsJson(''); // demi keamanan tidak ditampilkan
    setFormIsActive(branch.is_active);
    setIsModalOpen(true);
  }

  async function handleTestDrive() {
    if (!formFolderId.trim()) {
      toast.error('ID Folder Google Drive wajib diisi');
      return;
    }

    if (!formCredsJson.trim() && !editingBranch?.has_drive_credentials) {
      toast.error('JSON Service Account wajib diisi untuk menguji koneksi');
      return;
    }

    setTestingDrive(true);
    try {
      const res = await fetch('/api/admin/branches/test-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: editingBranch?.id,
          folder_id: formFolderId.trim(),
          credentials_json: formCredsJson.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        toast.success(json.message);
      } else {
        toast.error(json.error || 'Uji koneksi Google Drive gagal');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan saat menguji Drive');
    } finally {
      setTestingDrive(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      toast.error('Nama dan kode cabang wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const url = editingBranch ? `/api/admin/branches/${editingBranch.id}` : '/api/admin/branches';
      const method = editingBranch ? 'PUT' : 'POST';

      const payload = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        drive_folder_id: formFolderId.trim(),
        is_active: formIsActive,
      };

      if (formCredsJson.trim()) {
        payload.drive_credentials_json = formCredsJson.trim();
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        toast.success(json.message);
        setIsModalOpen(false);
        loadBranches();
      } else {
        toast.error(json.error || 'Gagal menyimpan cabang');
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    const branch = deleteDialog.branch;
    if (!branch) return;

    setDeleteDialog((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`/api/admin/branches/${branch.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.ok) {
        toast.success('Cabang berhasil dihapus');
        setDeleteDialog({ isOpen: false, branch: null, loading: false });
        loadBranches();
      } else {
        toast.error(json.error || 'Gagal menghapus cabang');
        setDeleteDialog((prev) => ({ ...prev, loading: false }));
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan');
      setDeleteDialog((prev) => ({ ...prev, loading: false }));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-title tracking-tight">
            Master Cabang & Integrasi Drive
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Kelola daftar cabang Indomaret se-Indonesia beserta konfigurasi Google Drive per cabang untuk pengarsipan bukti berita acara.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0056b3] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors min-h-[42px] shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tambah Cabang Baru</span>
        </button>
      </div>

      {/* Table Cabang */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0056b3]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Cabang</th>
                  <th className="py-3 px-4">Folder ID Google Drive</th>
                  <th className="py-3 px-4 text-center">Status Drive</th>
                  <th className="py-3 px-4 text-center">Status Aktif</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {branches.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">{b.code}</td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">{b.name}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-500 truncate max-w-[200px]">
                      {b.drive_folder_id || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {b.has_drive_credentials ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Terhubung
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                          Belum Diatur
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {b.is_active ? (
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-gray-500 hover:text-[#0056b3] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Cabang"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteDialog({
                              isOpen: true,
                              branch: b,
                              loading: false,
                            })
                          }
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Cabang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            <div className="indomaret-bar">
              <div className="indomaret-bar-blue" />
              <div className="indomaret-bar-yellow" />
              <div className="indomaret-bar-red" />
            </div>

            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <h3 className="text-base font-bold text-gray-900 font-title">
                {editingBranch ? 'Edit Data Cabang' : 'Tambah Cabang Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Kode Cabang *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="SBY"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono uppercase font-bold focus:bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-gray-700 uppercase mb-1">
                    Nama Cabang *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Surabaya"
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  ID Folder Google Drive Cabang
                </label>
                <input
                  type="text"
                  value={formFolderId}
                  onChange={(e) => setFormFolderId(e.target.value)}
                  placeholder="Contoh: 1a2B3c4D5e6F7g8H9..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono focus:bg-white"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Dapatkan dari tautan folder Drive: drive.google.com/drive/folders/<b>[ID_FOLDER]</b>
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-700 uppercase">
                    JSON Service Account Google Drive
                  </label>
                  {editingBranch?.has_drive_credentials && (
                    <span className="text-[11px] text-teal-700 font-semibold">
                      (Kredensial tersimpan aman terenkripsi AES-256-GCM)
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={formCredsJson}
                  onChange={(e) => setFormCredsJson(e.target.value)}
                  placeholder={
                    editingBranch?.has_drive_credentials
                      ? 'Kosongkan jika tidak ingin mengubah kunci JSON yang sudah tersimpan...'
                      : 'Tempel seluruh isi file service_account.json di sini...'
                  }
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px] focus:bg-white"
                />
              </div>

              {/* Tombol Uji Koneksi Google Drive */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#0056b3]" />
                  <span className="font-semibold text-gray-700 text-xs">Uji Akses Google Drive:</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestDrive}
                  disabled={testingDrive}
                  className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-[#0056b3] font-bold text-xs hover:bg-blue-50 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {testingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>Tes Koneksi</span>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="cabangActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#0056b3] rounded-sm focus:ring-[#0056b3]"
                />
                <label htmlFor="cabangActive" className="font-bold text-gray-700">
                  Status Cabang Aktif
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl font-semibold text-gray-700 bg-white hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#0056b3] hover:bg-blue-700 font-bold text-white shadow-xs flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan Cabang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Hapus Cabang"
        message={`Apakah Anda yakin ingin menghapus cabang "${deleteDialog.branch?.name}"? Tindakan ini hanya dapat dilakukan jika belum ada data ketidakhadiran yang tercatat di cabang ini.`}
        confirmText="Ya, Hapus Cabang"
        cancelText="Batal"
        danger={true}
        isLoading={deleteDialog.loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ isOpen: false, branch: null, loading: false })}
      />
    </div>
  );
}
