'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';
import { AgentPerformanceSummary } from '@sryn/types';

export default function TeamLeaderAgentsPage() {
  const [agents, setAgents] = useState<AgentPerformanceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAgents() {
      const res = await fetchApi<AgentPerformanceSummary[]>('/hierarchy/team-leader/agents');
      if (res.success && res.data) {
        setAgents(res.data);
      }
      setLoading(false);
    }
    loadAgents();
  }, []);

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
          Assigned Field Agents Management
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748B' }}>
          Monitor team performance, active lead assignments, target completion, and agent profiles
        </p>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading Field Agents...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Agent ID & Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Contact Info</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Active Leads</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Submitted</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Approved</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Conversion Rate</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Target Progress</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agt) => (
                  <tr key={agt.agentId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{agt.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>ID: {agt.agentId}</div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748B' }}>
                      {agt.email}<br />
                      <span style={{ fontSize: '0.75rem' }}>{agt.phone}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#0EA5E9', fontWeight: 600 }}>{agt.activeLeads}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{agt.submittedApplications}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#10B981', fontWeight: 600 }}>{agt.approvedApplications}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{agt.conversionRatePct}%</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {agt.approvedApplications} / {agt.targetApplications}
                      </div>
                      <div style={{ width: '100px', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, Math.round((agt.approvedApplications / agt.targetApplications) * 100))}%`, height: '100%', backgroundColor: '#059669' }} />
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: agt.isActive ? '#DCFCE7' : '#F1F5F9', color: agt.isActive ? '#15803D' : '#64748B' }}>
                        {agt.isActive ? 'ACTIVE' : 'INACTIVE'}
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
