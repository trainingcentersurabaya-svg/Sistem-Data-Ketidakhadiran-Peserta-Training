// components/ConfirmDialog.js
'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Konfirmasi Tindakan',
  message,
  recordDetails = null,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  danger = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 transform transition-all animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar Indomaret Tricolor */}
        <div className="indomaret-bar">
          <div className="indomaret-bar-blue" />
          <div className="indomaret-bar-yellow" />
          <div className="indomaret-bar-red" />
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-full shrink-0 ${
                danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 font-title">{title}</h3>
              {message && <p className="mt-1 text-sm text-gray-600 leading-relaxed">{message}</p>}

              {/* Rincian data yang akan dihapus jika ada */}
              {recordDetails && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-700 space-y-1 border border-gray-200/60">
                  {recordDetails.nik && (
                    <div>
                      <span className="font-semibold text-gray-500">NIK:</span> {recordDetails.nik}
                    </div>
                  )}
                  {recordDetails.nama && (
                    <div>
                      <span className="font-semibold text-gray-500">Nama:</span> {recordDetails.nama}
                    </div>
                  )}
                  {recordDetails.training && (
                    <div>
                      <span className="font-semibold text-gray-500">Training:</span> {recordDetails.training}
                    </div>
                  )}
                  {recordDetails.tanggal && (
                    <div>
                      <span className="font-semibold text-gray-500">Tanggal:</span> {recordDetails.tanggal}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-gray-200 transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                danger
                  ? 'bg-[#ED1C24] hover:bg-red-700 focus:ring-2 focus:ring-red-300'
                  : 'bg-[#0056b3] hover:bg-blue-700 focus:ring-2 focus:ring-blue-300'
              } disabled:opacity-50`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
