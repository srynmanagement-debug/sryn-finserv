'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';

export default function ManagerAgentsPartnersPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [agRes, ptRes] = await Promise.all([
        fetchApi<any[]>('/hierarchy/team-leader/agents'),
        fetchApi<{ partners: any[] }>('/hierarchy/team-leader/partners'),
      ]);

      if (agRes.success && agRes.data) setAgents(agRes.data);
      if (ptRes.success && ptRes.data) setPartners(ptRes.data.partners);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
          Regional Field Force & Partner Network
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748B' }}>
          Overview of field agents and retailer stores under manager scope
        </p>
      </div>

      {/* Agents Section */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '2rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Field Agents Scope</h3>
        {loading ? (
          <div>Loading agents...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Agent Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Contact</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Active Leads</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Approved Apps</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.agentId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{a.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748B' }}>{a.email}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#0EA5E9', fontWeight: 600 }}>{a.activeLeads}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#10B981', fontWeight: 600 }}>{a.approvedApplications}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: a.isActive ? '#DCFCE7' : '#F1F5F9', color: a.isActive ? '#15803D' : '#64748B' }}>
                        {a.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Partners Section */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Retailer Network Scope</h3>
        {loading ? (
          <div>Loading partners...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Store Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Contact</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Leads</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{p.partnerType}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748B' }}>{p.contactPhone}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#059669' }}>{p.referralsCount}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{ padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: p.onboardingStatus === 'APPROVED' ? '#DCFCE7' : '#FEF3C7', color: p.onboardingStatus === 'APPROVED' ? '#15803D' : '#B45309' }}>
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
