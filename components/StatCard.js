// components/StatCard.js
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue', // 'blue', 'yellow', 'red', 'gray'
}) {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50 text-[#0056b3]',
      border: 'border-blue-100',
    },
    yellow: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
    red: {
      bg: 'bg-red-50 text-[#ED1C24]',
      border: 'border-red-100',
    },
    gray: {
      bg: 'bg-gray-100 text-gray-700',
      border: 'border-gray-200',
    },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100 flex items-center gap-4 transition-transform hover:-translate-y-0.5">
      {Icon && (
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
          {title}
        </p>
        <p className="text-2xl font-black text-gray-900 font-title mt-0.5">
          {value !== undefined && value !== null ? Number(value).toLocaleString('id-ID') : '0'}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
