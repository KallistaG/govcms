import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Official Government Public Services Portal | GovCMS',
  description: 'Access official press releases, government services, executive orders, and public notices.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
