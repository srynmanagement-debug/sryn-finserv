'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api-client';

interface OnboardingItem {
  id: string;
  name: string;
  partnerType: string;
  onboardingStatus: string;
  gstin?: string;
  panNumber?: string;
  contactPhone?: string;
  createdAt: string;
}

export default function ManagerOnboardingReviewsPage() {
  const [queue, setQueue] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<{ partner: OnboardingItem; action: 'APPROVED' | 'REJECTED' } | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    const res = await fetchApi<{ queue: OnboardingItem[] }>('/partners/admin/onboarding-queue');
    if (res.success && res.data) {
      setQueue(res.data.queue);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleReviewSubmit = async () => {
    if (!reviewModal) return;
    setSubmitting(true);

    try {
      const res = await fetchApi(`/partners/${reviewModal.partner.id}/onboarding-review`, {
        method: 'POST',
        body: JSON.stringify({
          status: reviewModal.action,
          reviewNotes: notes || `Onboarding ${reviewModal.action.toLowerCase()} by Manager`,
        }),
      });

      if (res.success) {
        setFeedback(`Partner onboarding ${reviewModal.action} successfully!`);
        setReviewModal(null);
        setNotes('');
        loadQueue();
      } else {
        alert(`Review action failed: ${res.message}`);
      }
    } catch (err) {
      alert('Network error while processing onboarding review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
          Partner Store Onboarding Review Queue
        </h1>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748B' }}>
          Review retailer and distributor onboarding registrations, verify GSTIN/PAN compliance, and issue approval decisions
        </p>
      </div>

      {feedback && (
        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#15803D', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 600 }}>
          {feedback}
        </div>
      )}

      <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading Pending Onboarding Queue...</div>
        ) : queue.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>Queue Clear — No Pending Approvals</div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>All retailer and distributor registrations have been reviewed.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Partner Store Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Partner Type</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Contact Phone</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>GSTIN / PAN</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Manager Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#0F172A' }}>{p.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{p.partnerType}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748B' }}>{p.contactPhone || '+91 9800000000'}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#64748B', fontSize: '0.8rem' }}>
                      GST: {p.gstin || 'Not provided'}<br />PAN: {p.panNumber || 'ABCDE1234F'}
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{ padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#FEF3C7', color: '#B45309' }}>
                        {p.onboardingStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setReviewModal({ partner: p, action: 'APPROVED' })}
                          style={{ padding: '0.35rem 0.65rem', borderRadius: '4px', border: 'none', backgroundColor: '#059669', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setReviewModal({ partner: p, action: 'REJECTED' })}
                          style={{ padding: '0.35rem 0.65rem', borderRadius: '4px', border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Action Modal */}
      {reviewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
              Confirm Onboarding {reviewModal.action === 'APPROVED' ? 'Approval' : 'Rejection'}
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: '#64748B' }}>
              Store: <strong>{reviewModal.partner.name}</strong> ({reviewModal.partner.partnerType})
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Review Notes / Verification Remarks
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Enter approval or compliance notes..."
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setReviewModal(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={submitting}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: reviewModal.action === 'APPROVED' ? '#059669' : '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Submitting...' : `Confirm ${reviewModal.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
