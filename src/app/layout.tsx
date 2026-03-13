import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'History Alive Today — Why We are What We are',
  description:
    'A fun way to learn the history that matters in small bites. Discover how everyday objects, sayings, behaviors, and traditions stem from human experience across millennia.',
  openGraph: {
    title: 'History Alive Today',
    description: 'Why We are What We are',
    siteName: 'History Alive Today',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-white text-[#333333]`}>
        <Header />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
