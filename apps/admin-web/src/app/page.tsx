import React from 'react';

export default function AdminHomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
        <h1 style={{ color: '#0F172A', fontSize: '1.875rem' }}>SRYN FinServ — Super Admin Portal</h1>
        <p style={{ color: '#64748B' }}>Dynamic Product Configuration & System Administration</p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0F172A', marginTop: 0 }}>Dynamic Product Engine</h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Configure financial categories, products, eligibility rules, and form schemas.</p>
        </div>
        <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0F172A', marginTop: 0 }}>Pricing & Commissions</h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Manage pricing slabs, fee rules, commission trees, and payout ledgers.</p>
        </div>
        <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ color: '#0F172A', marginTop: 0 }}>RBAC & Governance</h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Control role permissions, audit trails, partner mappings, and SLA workflows.</p>
        </div>
      </section>
    </main>
  );
}
