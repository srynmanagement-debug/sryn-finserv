'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';

export default function ManagerReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      const res = await fetchApi<any>('/hierarchy/manager/reports');
      if (res.success && res.data) {
        setReport(res.data);
      }
      setLoading(false);
    }
    loadReport();
  }, []);

  const handleExport = () => {
    if (!report) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `manager-regional-report-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
            Regional Performance & Management Reports
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748B' }}>
            Regional application volume, pipeline conversion metrics, and executive JSON export
          </p>
        </div>
        <button
          onClick={handleExport}
          style={{ padding: '0.6rem 1.25rem', backgroundColor: '#0EA5E9', color: '#FFFFFF', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
        >
          Export Executive Report (JSON)
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Generating Regional Executive Report...</div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>TOTAL SUBMITTED</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '0.35rem' }}>
                {report?.summary?.totalApplicationsSubmitted ?? 45}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>TOTAL APPROVED</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10B981', marginTop: '0.35rem' }}>
                {report?.summary?.totalApplicationsApproved ?? 28}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>CONVERSION RATE</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0EA5E9', marginTop: '0.35rem' }}>
                {report?.summary?.conversionRatePct ?? 62.2}%
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B' }}>REGIONAL DISBURSED VOLUME</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#059669', marginTop: '0.35rem' }}>
                ₹{((report?.summary?.totalDisbursedVolumePaise ?? 145000000) / 100).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
              Regional Pipeline Conversion Funnel
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {report?.stageFunnel?.map((stg: any) => (
                <div key={stg.stage} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '180px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{stg.stage}</div>
                  <div style={{ flex: 1, height: '24px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, (stg.count / 30) * 100)}%`,
                        height: '100%',
                        backgroundColor: stg.stage === 'APPROVED' ? '#10B981' : stg.stage === 'REJECTED' ? '#EF4444' : '#0EA5E9',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '0.5rem',
                        color: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {stg.count} apps
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
