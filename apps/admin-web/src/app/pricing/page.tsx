'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../lib/api-client';
import { PricingCalculationResult } from '@sryn/types';

export default function PricingRulesPage() {
  const [loanAmount, setLoanAmount] = useState<number>(500000);
  const [productId, setProductId] = useState<string>('00000000-0000-0000-0000-000000000001');
  const [calculation, setCalculation] = useState<PricingCalculationResult | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);

  const handlePreviewCalculation = async () => {
    setCalculating(true);
    const res = await fetchApi<PricingCalculationResult>('/pricing/preview', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        loanAmountPaise: Math.round(loanAmount * 100),
      }),
    });
    setCalculating(false);

    if (res.success && res.data) {
      setCalculation(res.data);
    } else {
      alert(`Calculation preview failed: ${res.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link href="/products" style={{ color: '#0284C7', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Products</Link>
          <h1 style={{ color: '#0F172A', fontSize: '1.875rem', margin: '0.25rem 0 0 0' }}>Pricing, Fees & Tax Engine</h1>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Rules Config Section */}
        <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#0F172A', marginTop: 0 }}>Pricing & Fee Rules</h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            Configure fixed fees, percentage-based fees, slab-based processing charges, and GST tax rules.
          </p>
          <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.375rem', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>Processing Fee Rule (PF_STANDARD)</h4>
            <span style={{ fontSize: '0.75rem', background: '#DBEAFE', color: '#1E40AF', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>PERCENTAGE: 2.50% (250 bps)</span>
            <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '0.5rem 0 0 0' }}>Inclusive Tax: GST @ 18.00% (1800 bps)</p>
          </div>
        </div>

        {/* Calculation Preview Calculator */}
        <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#0F172A', marginTop: 0 }}>Interactive Pricing Calculator</h2>
          
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
              Input Principal Amount (₹)
            </label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1' }}
            />
          </div>

          <button
            onClick={handlePreviewCalculation}
            disabled={calculating}
            style={{ width: '100%', padding: '0.75rem', background: '#0F172A', color: '#FFF', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {calculating ? 'Calculating Breakdown...' : 'Calculate Fee & Tax Breakdown'}
          </button>

          {calculation && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: '#0F172A', margin: '0 0 0.75rem 0' }}>Calculation Breakdown (Paise Precision)</h3>
              <div style={{ fontSize: '0.875rem', color: '#334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0' }}>
                  <span>Principal Amount:</span>
                  <strong>₹{(calculation.inputLoanAmountPaise / 100).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0' }}>
                  <span>Total Base Processing Fees:</span>
                  <strong>₹{(calculation.totalBaseFeesPaise / 100).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0' }}>
                  <span>Applicable GST Tax:</span>
                  <strong>₹{(calculation.totalTaxesPaise / 100).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px solid #E2E8F0', fontWeight: 700, color: '#0F172A' }}>
                  <span>Net Disbursal to Customer:</span>
                  <span style={{ color: '#166534' }}>₹{(calculation.netDisbursalAmountPaise / 100).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
