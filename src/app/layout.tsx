import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'CupWatch | World Cup 2026 Companion',
  description: 'A fast, clean, mobile-first companion for World Cup 2026 matches, standings, bracket, and news.',
};

export const viewport: Viewport = {
  themeColor: '#059669',
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
      </body>
    </html>
  );
}
