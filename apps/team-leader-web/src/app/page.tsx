'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../lib/api-client';
import { TeamLeaderDashboardMetrics, AgentPerformanceSummary } from '@sryn/types';

export default function TeamLeaderDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<TeamLeaderDashboardMetrics | null>(null);
  const [agents, setAgents] = useState<AgentPerformanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('sryn_tl_token');
    if (!token) {
      router.push('/login');
      return;
    }

    async function loadData() {
      try {
        const dashRes = await fetchApi<TeamLeaderDashboardMetrics>('/hierarchy/team-leader/dashboard');
        if (dashRes.success && dashRes.data) {
          setMetrics(dashRes.data);
        }

        const agentsRes = await fetchApi<AgentPerformanceSummary[]>('/hierarchy/team-leader/agents');
        if (agentsRes.success && agentsRes.data) {
          setAgents(agentsRes.data);
        }
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '3rem auto', padding: '0 1.5rem', textAlign: 'center', color: '#64748B' }}>
        Loading Team Leader Operations Dashboard...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
            Team Leader Operations Dashboard
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748B' }}>
            Field Agent Performance, Applications Verification Queue & Retailer Network
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            href="/applications"
            style={{ padding: '0.6rem 1rem', backgroundColor: '#059669', color: '#FFFFFF', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
          >
            Review Applications Queue
          </Link>
          <Link
            href="/agents"
            style={{ padding: '0.6rem 1rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
          >
            Manage Agents
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Actionable Alerts Banner */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          {metrics.alerts.map((alt) => (
            <div
              key={alt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                backgroundColor: alt.severity === 'HIGH' ? '#FFFBEB' : '#F0FDF4',
                border: `1px solid ${alt.severity === 'HIGH' ? '#FCD34D' : '#86EFAC'}`,
                borderRadius: '8px',
                marginBottom: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: alt.severity === 'HIGH' ? '#B45309' : '#15803D', color: '#FFFFFF' }}>
                  {alt.type}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 500 }}>{alt.message}</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Action Required</span>
            </div>
          ))}
        </div>
      )}

      {/* Top Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Assigned Field Agents</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0F172A', marginTop: '0.5rem' }}>{metrics?.assignedAgentsCount ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.25rem' }}>Active team members</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Active Applications</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0EA5E9', marginTop: '0.5rem' }}>{metrics?.activeApplicationsCount ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>In pipeline & review</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Pending TL Verification</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#F59E0B', marginTop: '0.5rem' }}>{metrics?.pendingReviewsCount ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '0.25rem' }}>Requires review</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Approved Applications</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#10B981', marginTop: '0.5rem' }}>{metrics?.approvedCount ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.25rem' }}>Successfully converted</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Retailer Network</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#6366F1', marginTop: '0.5rem' }}>{metrics?.assignedPartnersCount ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>Assigned partner stores</div>
        </div>
      </div>

      {/* Target Progress Section */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
              Monthly Team Target Progress
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Effective from {metrics?.targetMetrics?.effectiveFrom ? new Date(metrics.targetMetrics.effectiveFrom).toLocaleDateString() : 'Current Cycle'}
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
            {metrics?.targetMetrics?.currentAchievedApplications ?? 0} / {metrics?.targetMetrics?.monthlyTargetApplications ?? 50} Apps ({metrics?.targetMetrics?.targetProgressPct ?? 0}%)
          </div>
        </div>

        <div style={{ width: '100%', height: '12px', backgroundColor: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${metrics?.targetMetrics?.targetProgressPct ?? 0}%`,
              height: '100%',
              backgroundColor: '#059669',
              borderRadius: '6px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Assigned Agents Overview Table */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
            Assigned Field Agents & Performance
          </h3>
          <Link href="/agents" style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600, textDecoration: 'none' }}>
            View All Agents →
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Agent Name</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Contact Email & Phone</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Active Leads</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Submitted</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Approved</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Target Progress</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                    No field agents assigned yet.
                  </td>
                </tr>
              ) : (
                agents.map((agt) => (
                  <tr key={agt.agentId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#0F172A' }}>{agt.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748B' }}>
                      {agt.email}<br />
                      <span style={{ fontSize: '0.75rem' }}>{agt.phone}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#0EA5E9', fontWeight: 600 }}>{agt.activeLeads}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{agt.submittedApplications}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#10B981', fontWeight: 600 }}>{agt.approvedApplications}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {agt.approvedApplications} / {agt.targetApplications} ({Math.round((agt.approvedApplications / agt.targetApplications) * 100)}%)
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
