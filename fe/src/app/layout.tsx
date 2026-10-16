import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GitHub Library Hub - Curated AI Repositories',
  description: 'Katalog repositori GitHub AI terkurasi dengan Physical Glassmorphism, 3D Backdrop, dan Live GitHub Explorer.',
  icons: {
    icon: '/logo-neural-vault.svg',
    shortcut: '/logo-neural-vault.svg',
    apple: '/logo-neural-vault.svg',
  },
};

import { LanguageProvider } from '@/lib/i18n';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <head>
        <meta name="referrer" content="no-referrer" />
        <link rel="icon" href="/logo-neural-vault.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-screen overflow-hidden flex flex-col antialiased select-none relative font-sans">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}

