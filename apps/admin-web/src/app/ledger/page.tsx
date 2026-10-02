'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../lib/api-client';
import { CommissionLedgerEntry, LedgerStatus } from '@sryn/types';

export default function CommissionLedgerPage() {
  const [entries, setEntries] = useState<CommissionLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<LedgerStatus | null>(null);
  const [reason, setReason] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadEntries = async () => {
    setLoading(true);
    let url = '/ledger/entries';
    if (selectedStatus) url += `?status=${selectedStatus}`;
    const res = await fetchApi<CommissionLedgerEntry[]>(url);
    if (res.success && res.data) {
      setEntries(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEntries();
  }, [selectedStatus]);

  const handleOpenActionModal = (id: string, action: LedgerStatus) => {
    setTransitioningId(id);
    setModalAction(action);
    setReason('');
  };

  const handleExecuteTransition = async () => {
    if (!transitioningId || !modalAction) return;

    if ((modalAction === 'REVERSED' || modalAction === 'CLAWBACK') && !reason.trim()) {
      alert('A written reason is required for financial reversals and clawbacks');
      return;
    }

    const res = await fetchApi(`/ledger/entries/${transitioningId}/transition`, {
      method: 'POST',
      body: JSON.stringify({
        targetStatus: modalAction,
        reason,
        payoutReference: modalAction === 'PAID' ? `PAY-BATCH-${Date.now()}` : undefined,
      }),
    });

    if (res.success) {
      setActionMessage(`Ledger entry transitioned to ${modalAction}`);
      setModalAction(null);
      setTransitioningId(null);
      loadEntries();
    } else {
      alert(`Action failed: ${res.message}`);
    }
  };

  const getStatusBadgeStyle = (status: LedgerStatus) => {
    switch (status) {
      case 'PENDING': return { background: '#FEF3C7', color: '#92400E' };
      case 'APPROVED': return { background: '#DBEAFE', color: '#1E40AF' };
      case 'PAYABLE': return { background: '#E0E7FF', color: '#3730A3' };
      case 'PAID': return { background: '#DCFCE7', color: '#166534' };
      case 'REJECTED': return { background: '#FEE2E2', color: '#991B1B' };
      case 'REVERSED': return { background: '#FFEDD5', color: '#9A3412' };
      case 'CLAWBACK': return { background: '#F3E8FF', color: '#6B21A8' };
      default: return { background: '#F3F4F6', color: '#4B5563' };
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link href="/products" style={{ color: '#0284C7', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Products</Link>
          <h1 style={{ color: '#0F172A', fontSize: '1.875rem', margin: '0.25rem 0 0 0' }}>Financial Commission Ledger</h1>
        </div>
      </header>

      {actionMessage && (
        <div style={{ background: '#F0FDF4', color: '#166534', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1.5rem', border: '1px solid #BBF7D0' }}>
          {actionMessage}
        </div>
      )}

      {/* Status Filter */}
      <div style={{ background: '#FFF', padding: '1rem 1.25rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <label style={{ fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}>Filter Status:</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', minWidth: '180px' }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="PAYABLE">PAYABLE</option>
          <option value="PAID">PAID</option>
          <option value="REJECTED">REJECTED</option>
          <option value="REVERSED">REVERSED</option>
          <option value="CLAWBACK">CLAWBACK</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div style={{ background: '#FFF', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading financial ledger entries...</div>
        ) : entries.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <p style={{ fontSize: '1.125rem', fontWeight: 500, margin: 0 }}>No ledger entries found</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Ledger ID</th>
                <th style={{ padding: '0.875rem 1rem' }}>Beneficiary Role</th>
                <th style={{ padding: '0.875rem 1rem' }}>Amount</th>
                <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const badge = getStatusBadgeStyle(e.status);
                return (
                  <tr key={e.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#0F172A' }}>{e.id}</td>
                    <td style={{ padding: '1rem' }}>{e.beneficiaryRole}</td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: e.calculatedAmountPaise >= 0 ? '#166534' : '#DC2626' }}>
                      ₹{(e.calculatedAmountPaise / 100).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, ...badge }}>
                        {e.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {e.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleOpenActionModal(e.id, 'APPROVED')} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', background: '#166534', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>
                              Approve
                            </button>
                            <button onClick={() => handleOpenActionModal(e.id, 'REJECTED')} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', background: '#DC2626', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>
                              Reject
                            </button>
                          </>
                        )}
                        {e.status === 'APPROVED' && (
                          <>
                            <button onClick={() => handleOpenActionModal(e.id, 'PAYABLE')} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', background: '#3730A3', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>
                              Make Payable
                            </button>
                            <button onClick={() => handleOpenActionModal(e.id, 'REVERSED')} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', background: '#D97706', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>
                              Reverse
                            </button>
                          </>
                        )}
                        {e.status === 'PAYABLE' && (
                          <button onClick={() => handleOpenActionModal(e.id, 'PAID')} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', background: '#166534', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>
                            Mark Paid
                          </button>
                        )}
                        {e.status === 'PAID' && (
                          <button onClick={() => handleOpenActionModal(e.id, 'CLAWBACK')} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', background: '#6B21A8', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>
                            Clawback
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Action Transition Modal */}
      {modalAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#FFF', padding: '2rem', borderRadius: '0.5rem', maxWidth: '500px', width: '100%' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#0F172A' }}>Transition Ledger Status to {modalAction}</h3>
            {(modalAction === 'REVERSED' || modalAction === 'CLAWBACK') && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                  Reason for {modalAction} (Mandatory Audit Requirement)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the reason for this financial correction..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #CBD5E1' }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setModalAction(null)} style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleExecuteTransition} style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', background: '#0F172A', color: '#FFF', border: 'none', cursor: 'pointer' }}>
                Confirm Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
