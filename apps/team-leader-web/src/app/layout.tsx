import React from 'react';

export const metadata = {
  title: 'SRYN FinServ — Team Leader Portal',
  description: 'Field Agent Performance & Lead Distribution Portal',
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
