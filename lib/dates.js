// lib/dates.js
// Pengelolaan dan format tanggal zona waktu Asia/Jakarta (WIB)

const JAKARTA_TIMEZONE = 'Asia/Jakarta';

/**
 * Format string tanggal YYYY-MM-DD atau Date objek menjadi DD/MM/YYYY
 */
export function formatDateDisplay(dateInput) {
  if (!dateInput) return '-';

  try {
    let dateObj;
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split('-').map(Number);
      dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    } else {
      dateObj = new Date(dateInput);
    }

    if (isNaN(dateObj.getTime())) return '-';

    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: JAKARTA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return formatter.format(dateObj);
  } catch (err) {
    return '-';
  }
}

/**
 * Format tanggal dan waktu menjadi DD/MM/YYYY HH:mm WIB
 */
export function formatDateTimeDisplay(dateInput) {
  if (!dateInput) return '-';
  try {
    const dateObj = new Date(dateInput);
    if (isNaN(dateObj.getTime())) return '-';

    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: JAKARTA_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return formatter.format(dateObj) + ' WIB';
  } catch (err) {
    return '-';
  }
}

/**
 * Parsing input tanggal dari berbagai format (yyyy-MM-dd, dd/MM/yyyy, dd-MM-yyyy, atau serial Excel)
 * Mengembalikan string ISO date 'YYYY-MM-DD' atau null jika tidak valid
 */
export function parseToIsoDate(rawInput) {
  if (!rawInput && rawInput !== 0) return null;

  // 1. Jika serial number dari Excel (contoh: 45198)
  if (typeof rawInput === 'number' || (!isNaN(rawInput) && !String(rawInput).includes('-') && !String(rawInput).includes('/'))) {
    const serial = Number(rawInput);
    if (serial > 1000 && serial < 100000) {
      // Excel epoch dimulai 30 Des 1899 karena leap year bug 1900
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const targetDate = new Date(excelEpoch.getTime() + serial * 86400000);
      const y = targetDate.getUTCFullYear();
      const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
      const d = String(targetDate.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(rawInput).trim();

  // 2. Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    if (isValidDateParts(y, m, d)) return str;
    return null;
  }

  // 3. Format DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/').map(Number);
    if (isValidDateParts(y, m, d)) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return null;
  }

  // 4. Format DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const [d, m, y] = str.split('-').map(Number);
    if (isValidDateParts(y, m, d)) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return null;
  }

  // 5. JavaScript Date object
  if (rawInput instanceof Date && !isNaN(rawInput.getTime())) {
    const y = rawInput.getFullYear();
    const m = String(rawInput.getMonth() + 1).padStart(2, '0');
    const d = String(rawInput.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

function isValidDateParts(year, month, day) {
  if (year < 1990 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const testDate = new Date(Date.UTC(year, month - 1, day));
  return (
    testDate.getUTCFullYear() === year &&
    testDate.getUTCMonth() === month - 1 &&
    testDate.getUTCDate() === day
  );
}

/**
 * Mendapatkan tahun dan bulan saat ini dalam zona Asia/Jakarta
 */
export function getCurrentJakartaDate() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // 'en-CA' menghasilkan format YYYY-MM-DD
  const parts = formatter.format(now).split('-');
  return {
    year: Number(parts[0]),
    month: Number(parts[1]),
    day: Number(parts[2]),
    isoDate: `${parts[0]}-${parts[1]}-${parts[2]}`,
  };
}
