// src/app/layout.tsx
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { ReactQueryProvider } from '@/contexts/QueryProvider';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'BidReview - Professional Bid Management System',
    template: '%s | BidReview',
  },
  description: 'Streamline your bid management process with AI-powered insights, real-time analytics, and comprehensive workflow management.',
  keywords: ['bid management', 'proposal management', 'tender management', 'business intelligence', 'AI analytics'],
  authors: [{ name: 'BidReview Team' }],
  creator: 'BidReview',
  publisher: 'BidReview',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://bidreview.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bidreview.com',
    title: 'BidReview - Professional Bid Management System',
    description: 'Streamline your bid management process with AI-powered insights and real-time analytics.',
    siteName: 'BidReview',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BidReview - Professional Bid Management System',
    description: 'Streamline your bid management process with AI-powered insights and real-time analytics.',
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <AuthProvider>
          <ReactQueryProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </ReactQueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}