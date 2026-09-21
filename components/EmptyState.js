// components/EmptyState.js
import { Inbox } from 'lucide-react';

export default function EmptyState({
  title = 'Belum Ada Data',
  message = 'Tidak ada catatan yang ditemukan untuk filter atau pencarian saat ini.',
  action = null,
  icon: Icon = Inbox,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0056b3] flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-gray-900 font-title">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-sm">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
