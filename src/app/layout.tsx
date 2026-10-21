// src/app/layout.tsx
import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Universal AI Document Platform - Enterprise Automation & Compliance',
  description: 'Universal multi-tenant AI PDF document automation, verification lineage, AcroForm & coordinate mapping, and regulatory compliance platform for Mortgage, Legal Conveyancing, and Real Estate.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
