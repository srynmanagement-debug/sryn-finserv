'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';

interface PartnerItem {
  id: string;
  name: string;
  partnerType: string;
  onboardingStatus: string;
  gstin: string;
  panNumber: string;
  contactPhone: string;
  referralsCount: number;
  createdAt: string;
}

export default function TeamLeaderPartnersPage() {
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPartners() {
      const res = await fetchApi<{ partners: PartnerItem[] }>('/hierarchy/team-leader/partners');
      if (res.success && res.data) {
        setPartners(res.data.partners);
      }
      setLoading(false);
    }
    loadPartners();
  }, []);

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
          Assigned Retailer & Partner Network
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748B' }}>
          Monitor retailer store onboarding status, compliance details, and customer lead attribution counts
        </p>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading Partner Network...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Store / Partner Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Partner Type</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Contact Phone</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>GSTIN / PAN</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Customer Leads</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Onboarding Status</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#0F172A' }}>{p.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{p.partnerType}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748B' }}>{p.contactPhone}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748B', fontSize: '0.8rem' }}>
                      GST: {p.gstin}<br />PAN: {p.panNumber}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#059669' }}>{p.referralsCount} leads</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: p.onboardingStatus === 'APPROVED' ? '#DCFCE7' : '#FEF3C7',
                        color: p.onboardingStatus === 'APPROVED' ? '#15803D' : '#B45309',
                      }}>
                        {p.onboardingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
