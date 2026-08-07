import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/auth-context';

export const metadata: Metadata = {
  title: 'GovCMS | Official Government Management System',
  description: 'Enterprise Content Management System for Government Agencies',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
