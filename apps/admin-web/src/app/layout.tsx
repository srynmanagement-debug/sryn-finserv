import React from 'react';

export const metadata = {
  title: 'SRYN FinServ — Super Admin Portal',
  description: 'Super Admin Business Configuration & Financial Platform Management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#F8FAFC' }}>
        {children}
      </body>
    </html>
  );
}
