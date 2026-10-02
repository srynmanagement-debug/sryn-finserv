'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';

export default function ManagerApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  const loadApps = async () => {
    setLoading(true);
    const query = statusFilter ? `?status=${statusFilter}` : '';
    const res = await fetchApi<{ applications: any[] }>(`/hierarchy/manager/applications${query}`);
    if (res.success && res.data) {
      setApplications(res.data.applications);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadApps();
  }, [statusFilter]);

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
            Regional Applications Oversight
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748B' }}>
            Regional search, status filters, and complete workflow details
          </p>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
          >
            <option value="">All Application Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="ADDITIONAL_INFORMATION_REQUIRED">ADDITIONAL_INFO_REQUIRED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading Applications...</div>
        ) : applications.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>No applications found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>App Number</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Product Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Customer Details</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Assigned Agent</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#0F172A' }}>{app.applicationNumber}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{app.productName}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748B' }}>
                      {app.customerName}<br />
                      <span style={{ fontSize: '0.75rem' }}>{app.customerPhone}</span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#0EA5E9', fontWeight: 500 }}>{app.agentName}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: app.currentStatus === 'APPROVED' ? '#DCFCE7' : app.currentStatus === 'SUBMITTED' ? '#FEF3C7' : '#E0F2FE',
                        color: app.currentStatus === 'APPROVED' ? '#15803D' : app.currentStatus === 'SUBMITTED' ? '#B45309' : '#0369A1',
                      }}>
                        {app.currentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748B', fontSize: '0.8rem' }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <button
                        onClick={() => setSelectedApp(app)}
                        style={{ padding: '0.35rem 0.65rem', borderRadius: '4px', border: '1px solid #0EA5E9', backgroundColor: '#F0F9FF', color: '#0EA5E9', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '550px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                Application {selectedApp.applicationNumber}
              </h3>
              <button onClick={() => setSelectedApp(null)} style={{ border: 'none', backgroundColor: 'transparent', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>

            <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
              <p><strong>Product:</strong> {selectedApp.productName}</p>
              <p><strong>Customer Name:</strong> {selectedApp.customerName}</p>
              <p><strong>Mobile Number:</strong> {selectedApp.customerPhone}</p>
              <p><strong>Assigned Agent:</strong> {selectedApp.agentName}</p>
              <p><strong>Current Status:</strong> <span style={{ fontWeight: 600, color: '#0EA5E9' }}>{selectedApp.currentStatus}</span></p>
              <p><strong>Created Date:</strong> {new Date(selectedApp.createdAt).toLocaleString()}</p>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setSelectedApp(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
