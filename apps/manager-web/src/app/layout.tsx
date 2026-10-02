import React from 'react';

export const metadata = {
  title: 'SRYN FinServ — Operations Manager Portal',
  description: 'Operations Management, Application Approval & Portfolio Oversight',
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
