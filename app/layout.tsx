import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ReClaim — Digital Lost & Found',
    template: '%s | ReClaim',
  },
  description:
    'ReClaim helps students and community members report lost items and recover what others have discovered. Smart matching connects losers and finders instantly.',
  keywords: ['lost and found', 'report lost item', 'found item', 'campus lost found', 'digital lost found', 'reclaim'],
  authors: [{ name: 'ReClaim Team' }],
  creator: 'ReClaim',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    title: 'ReClaim — Digital Lost & Found',
    description: 'Smart lost-and-found for campuses, malls, airports & more.',
    siteName: 'ReClaim',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ReClaim — Digital Lost & Found Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReClaim — Digital Lost & Found',
    description: 'Smart lost-and-found for campuses, malls, airports & more.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4F46E5' },
    { media: '(prefers-color-scheme: dark)', color: '#312e81' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
