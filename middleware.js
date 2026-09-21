// middleware.js
// Proteksi rute aplikasi menggunakan verifikasi JWT ringan (kompatibel Edge runtime)
import { NextResponse } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from './lib/session.js';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Lewati file statis, public assets, favicon, dan internal Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const tokenCookie = request.cookies.get(COOKIE_NAME);
  const token = tokenCookie ? tokenCookie.value : null;
  const session = token ? await verifySessionToken(token) : null;

  const isLoginPage = pathname === '/login';

  // 1. Jika belum login dan mencoba mengakses halaman privat
  if (!session) {
    if (isLoginPage) {
      return NextResponse.next();
    }

    // Jika mencoba akses API routes tanpa login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { ok: false, error: 'Sesi login telah berakhir. Silakan masuk kembali.' },
        { status: 401 }
      );
    }

    // Arahkan ke halaman login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Jika sudah login dan mencoba membuka halaman /login
  if (isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Jika pengguna wajib ganti password (must_change_password = true)
  if (session.mustChangePassword) {
    // Izinkan akses ke halaman /akun dan API terkait ganti password / logout
    const isAllowedChangePwd =
      pathname === '/akun' ||
      pathname.startsWith('/api/auth/change-password') ||
      pathname.startsWith('/api/auth/logout') ||
      pathname.startsWith('/api/auth/me');

    if (!isAllowedChangePwd) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Anda wajib mengubah password akun terlebih dahulu.',
            mustChangePassword: true,
          },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/akun?mustChange=1', request.url));
    }
  }

  // 4. Proteksi rute khusus Admin Pusat (/admin/*)
  if (pathname.startsWith('/admin') && session.role !== 'admin_pusat') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.svg (logo)
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};
