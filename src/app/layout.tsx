// src/app/layout.tsx
import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Universal Form Filler — Simple, Form-First PDF Auto-Fill',
  description: 'Upload blank form first, detect required information and applicant roles, extract and match facts from supporting PDFs, resolve conflicts, validate, and download completed PDF.',
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
