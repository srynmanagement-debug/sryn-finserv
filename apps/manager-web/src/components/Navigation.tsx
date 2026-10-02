'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sryn_mgr_token');
      localStorage.removeItem('sryn_mgr_user');
    }
    router.push('/login');
  };

  if (pathname === '/login') return null;

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Team Leaders', href: '/team-leaders' },
    { label: 'Agents & Partners', href: '/agents-partners' },
    { label: 'Applications Oversight', href: '/applications' },
    { label: 'Onboarding Queue', href: '/onboarding-reviews' },
    { label: 'Management Reports', href: '/reports' },
  ];

  return (
    <header style={{ backgroundColor: '#0F172A', color: '#FFFFFF', borderBottom: '1px solid #1E293B' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ backgroundColor: '#0EA5E9', color: '#FFFFFF', fontWeight: 'bold', padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.9rem' }}>
              SRYN
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.025em' }}>
              Manager Portal
            </span>
          </div>

          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '0.5rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    backgroundColor: isActive ? '#1E293B' : 'transparent',
                    textDecoration: 'none',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#E2E8F0' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              RM
            </div>
            <span>Regional Manager</span>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid #334155',
              backgroundColor: 'transparent',
              color: '#F8FAFC',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
