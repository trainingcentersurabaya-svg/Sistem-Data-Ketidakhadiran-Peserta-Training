// components/FilePreviewModal.js
'use client';

import { useState } from 'react';
import { X, ExternalLink, Download, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function FilePreviewModal({
  isOpen,
  onClose,
  recordId,
  fileName,
  mimeType,
}) {
  const [loading, setLoading] = useState(true);

  if (!isOpen || !recordId) return null;

  const fileUrl = `/api/records/${recordId}/file`;
  const isPdf = mimeType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header Bar Indomaret */}
        <div className="indomaret-bar">
          <div className="indomaret-bar-blue" />
          <div className="indomaret-bar-yellow" />
          <div className="indomaret-bar-red" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-blue-50 text-[#0056b3]">
              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate font-title">
                {fileName || 'Bukti Berita Acara'}
              </h3>
              <p className="text-xs text-gray-500">
                {isPdf ? 'Dokumen PDF' : 'Foto Bukti Berita Acara'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-[#0056b3] hover:bg-blue-50 rounded-xl transition-colors"
              title="Buka di Tab Baru"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content / Viewer */}
        <div className="flex-1 bg-gray-900/5 relative overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#0056b3]" />
              <p className="text-xs text-gray-500 mt-2">Mengambil berkas dari Google Drive...</p>
            </div>
          )}

          {isPdf ? (
            <iframe
              src={fileUrl}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
              title="Pratinjau PDF"
            />
          ) : (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              <img
                src={fileUrl}
                alt={fileName || 'Bukti Foto'}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
