'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';
import { TeamLeaderSummary } from '@sryn/types';

export default function ManagerTeamLeadersPage() {
  const [teamLeaders, setTeamLeaders] = useState<TeamLeaderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTLs() {
      const res = await fetchApi<TeamLeaderSummary[]>('/hierarchy/manager/team-leaders');
      if (res.success && res.data) {
        setTeamLeaders(res.data);
      }
      setLoading(false);
    }
    loadTLs();
  }, []);

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
          Team Leaders Hierarchy Management
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748B' }}>
          View assigned Team Leaders, team sizes, active pipeline applications, and target progress
        </p>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading Team Leaders...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Team Leader Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Contact Info</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Agents Managed</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Active Apps</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Approved Apps</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Target Progress</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {teamLeaders.map((tl) => (
                  <tr key={tl.teamLeaderId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{tl.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>ID: {tl.teamLeaderId}</div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748B' }}>
                      {tl.email}<br />
                      <span style={{ fontSize: '0.75rem' }}>{tl.phone}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#0EA5E9' }}>{tl.agentsCount} agents</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{tl.activeApplicationsCount}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#10B981', fontWeight: 600 }}>{tl.approvedApplicationsCount}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {tl.approvedApplicationsCount} / {tl.targetApplications} ({tl.targetProgressPct}%)
                      </div>
                      <div style={{ width: '100px', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, tl.targetProgressPct)}%`, height: '100%', backgroundColor: '#0EA5E9' }} />
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: tl.isActive ? '#DCFCE7' : '#F1F5F9', color: tl.isActive ? '#15803D' : '#64748B' }}>
                        {tl.isActive ? 'ACTIVE' : 'INACTIVE'}
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
