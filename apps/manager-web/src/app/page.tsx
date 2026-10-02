'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '../lib/api-client';
import { ManagerDashboardMetrics, TeamLeaderSummary } from '@sryn/types';

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<ManagerDashboardMetrics | null>(null);
  const [teamLeaders, setTeamLeaders] = useState<TeamLeaderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('sryn_mgr_token');
    if (!token) {
      router.push('/login');
      return;
    }

    async function loadData() {
      try {
        const dashRes = await fetchApi<ManagerDashboardMetrics>('/hierarchy/manager/dashboard');
        if (dashRes.success && dashRes.data) {
          setMetrics(dashRes.data);
        }

        const tlsRes = await fetchApi<TeamLeaderSummary[]>('/hierarchy/manager/team-leaders');
        if (tlsRes.success && tlsRes.data) {
          setTeamLeaders(tlsRes.data);
        }
      } catch (err) {
        setError('Failed to load manager dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '3rem auto', padding: '0 1.5rem', textAlign: 'center', color: '#64748B' }}>
        Loading Regional Management Dashboard...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
            Regional Management Dashboard
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748B' }}>
            Team Leaders Hierarchy, Partner Store Onboarding Queue & Regional Target Progress
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            href="/onboarding-reviews"
            style={{ padding: '0.6rem 1rem', backgroundColor: '#0EA5E9', color: '#FFFFFF', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
          >
            Review Onboarding Queue ({metrics?.pendingOnboardingCount ?? 0})
          </Link>
          <Link
            href="/team-leaders"
            style={{ padding: '0.6rem 1rem', backgroundColor: '#FFFFFF', color: '#0F172A', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}
          >
            Team Leaders Overview
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Operational Alerts Banner */}
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
                <span style={{ fontWeight: 'bold', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: alt.severity === 'HIGH' ? '#B45309' : '#0369A1', color: '#FFFFFF' }}>
                  {alt.type}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 500 }}>{alt.message}</span>
              </div>
              <Link href="/onboarding-reviews" style={{ fontSize: '0.8rem', color: '#0EA5E9', fontWeight: 600, textDecoration: 'none' }}>
                Review Now →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Team Leaders</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0F172A', marginTop: '0.5rem' }}>{metrics?.teamLeadersCount ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#0EA5E9', marginTop: '0.25rem' }}>Managed team leads</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Field Agents</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#059669', marginTop: '0.5rem' }}>{metrics?.agentsCount ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>Field force team</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Pending Onboarding</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#F59E0B', marginTop: '0.5rem' }}>{metrics?.pendingOnboardingCount ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '0.25rem' }}>Requires manager approval</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Applications</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#6366F1', marginTop: '0.5rem' }}>{metrics?.totalApplicationsCount ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>Regional volume</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Partner Network</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#10B981', marginTop: '0.5rem' }}>{metrics?.partnersCount ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.25rem' }}>Retailers & distributors</div>
        </div>
      </div>

      {/* Regional Target Progress Bar */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
              Regional Monthly Applications Target
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Effective from {metrics?.regionalTargetMetrics?.effectiveFrom ? new Date(metrics.regionalTargetMetrics.effectiveFrom).toLocaleDateString() : 'Current Cycle'}
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0EA5E9' }}>
            {metrics?.regionalTargetMetrics?.currentAchievedApplications ?? 0} / {metrics?.regionalTargetMetrics?.monthlyTargetApplications ?? 200} Apps ({metrics?.regionalTargetMetrics?.targetProgressPct ?? 0}%)
          </div>
        </div>

        <div style={{ width: '100%', height: '12px', backgroundColor: '#E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${metrics?.regionalTargetMetrics?.targetProgressPct ?? 0}%`,
              height: '100%',
              backgroundColor: '#0EA5E9',
              borderRadius: '6px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Managed Team Leaders Table */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
            Managed Team Leaders & Teams Performance
          </h3>
          <Link href="/team-leaders" style={{ fontSize: '0.85rem', color: '#0EA5E9', fontWeight: 600, textDecoration: 'none' }}>
            View Full Team Structure →
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Team Leader Name</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Contact Details</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Agents Count</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Active Apps</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Approved Apps</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Team Target Progress</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {teamLeaders.map((tl) => (
                <tr key={tl.teamLeaderId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#0F172A' }}>{tl.name}</td>
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
      </div>
    </div>
  );
}
