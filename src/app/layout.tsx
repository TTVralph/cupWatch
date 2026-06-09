import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { PwaRegistration } from '@/components/PwaRegistration';
import './globals.css';

export const metadata: Metadata = {
  applicationName: 'CupWatch',
  title: {
    default: 'CupWatch | World Cup 2026 Companion',
    template: '%s | CupWatch',
  },
  description: 'A calm midnight-stadium World Cup 2026 command center.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }],
  },
  appleWebApp: {
    capable: true,
    title: 'CupWatch',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <BottomNav />
        <PwaRegistration />
      </body>
    </html>
  );
}
