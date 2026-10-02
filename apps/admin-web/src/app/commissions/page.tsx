'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../lib/api-client';
import { CommissionTreeCalculationResult } from '@sryn/types';

export default function CommissionsPage() {
  const [disbursalAmount, setDisbursalAmount] = useState<number>(100000);
  const [productId, setProductId] = useState<string>('00000000-0000-0000-0000-000000000001');
  const [result, setResult] = useState<CommissionTreeCalculationResult | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);

  const handleCalculateTree = async () => {
    setCalculating(true);
    const res = await fetchApi<CommissionTreeCalculationResult>('/commissions/preview', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        disbursalAmountPaise: Math.round(disbursalAmount * 100),
        beneficiaries: [
          { userId: '00000000-0000-0000-0000-000000000002', role: 'AGENT' },
          { userId: '00000000-0000-0000-0000-000000000003', role: 'RETAILER' },
          { userId: '00000000-0000-0000-0000-000000000004', role: 'DISTRIBUTOR' },
          { userId: '00000000-0000-0000-0000-000000000005', role: 'TEAM_LEADER' },
          { userId: '00000000-0000-0000-0000-000000000006', role: 'MANAGER' },
        ],
      }),
    });
    setCalculating(false);

    if (res.success && res.data) {
      setResult(res.data);
    } else {
      alert(`Commission tree preview failed: ${res.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link href="/products" style={{ color: '#0284C7', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Products</Link>
          <h1 style={{ color: '#0F172A', fontSize: '1.875rem', margin: '0.25rem 0 0 0' }}>Multi-Tier Commission Engine</h1>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Tier Config Outline */}
        <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#0F172A', marginTop: 0 }}>Attribution Hierarchy Tiers</h2>
          <div style={{ fontSize: '0.875rem', color: '#334155' }}>
            <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.375rem', marginBottom: '0.5rem' }}>
              <strong>1. AGENT / Field Employee:</strong> 1.50% (150 bps)
            </div>
            <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.375rem', marginBottom: '0.5rem' }}>
              <strong>2. RETAILER:</strong> 1.00% (100 bps)
            </div>
            <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.375rem', marginBottom: '0.5rem' }}>
              <strong>3. DISTRIBUTOR Override:</strong> 0.50% (50 bps)
            </div>
            <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.375rem', marginBottom: '0.5rem' }}>
              <strong>4. TEAM LEADER Override:</strong> 0.25% (25 bps)
            </div>
            <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.375rem' }}>
              <strong>5. MANAGER Override:</strong> 0.25% (25 bps)
            </div>
          </div>
        </div>

        {/* Tree Attribution Calculator */}
        <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#0F172A', marginTop: 0 }}>Commission Attribution Preview</h2>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
              Disbursal Loan Amount (₹)
            </label>
            <input
              type="number"
              value={disbursalAmount}
              onChange={(e) => setDisbursalAmount(Number(e.target.value))}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1' }}
            />
          </div>

          <button
            onClick={handleCalculateTree}
            disabled={calculating}
            style={{ width: '100%', padding: '0.75rem', background: '#0F172A', color: '#FFF', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {calculating ? 'Calculating Attribution...' : 'Preview Commission Attribution Tree'}
          </button>

          {result && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#0F172A', margin: '0 0 0.75rem 0' }}>Attribution Tree Breakdown</h3>
              {result.attributions.map((attr, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed #E2E8F0', fontSize: '0.875rem' }}>
                  <span>{attr.beneficiaryRole}:</span>
                  <strong>₹{(attr.calculatedAmountPaise / 100).toLocaleString('en-IN')}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>
                <span>Total Commission Pool:</span>
                <span style={{ color: '#166534' }}>₹{(result.totalCommissionAllocatedPaise / 100).toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
