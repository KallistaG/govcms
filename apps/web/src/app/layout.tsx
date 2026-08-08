import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GovCMS | Official Government Portal Engine',
  description: 'Enterprise Content Management System for Government Agencies',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
