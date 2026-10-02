import React from 'react';
import { Navigation } from '../components/Navigation';

export const metadata = {
  title: 'SRYN FinServ — Regional Manager Portal',
  description: 'Team Leaders, Partner Onboarding Review & Regional Operations Portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#F8FAFC', color: '#0F172A' }}>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
