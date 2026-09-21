// app/layout.js
import { Montserrat, Nunito } from 'next/font/google';
import { Toaster } from 'sonner';
import { LOGO_URL, APP_NAME, APP_DESCRIPTION } from '@/lib/config';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  icons: {
    icon: LOGO_URL,
    shortcut: LOGO_URL,
    apple: LOGO_URL,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${montserrat.variable} ${nunito.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href={LOGO_URL} type="image/svg+xml" />
      </head>
      <body className="antialiased min-h-screen bg-[#F4F7F6] text-gray-800" suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={3500}
        />
      </body>
    </html>
  );
}
