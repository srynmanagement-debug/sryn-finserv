'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../lib/api-client';
import { ProductConfig, ProductCategory } from '@sryn/types';

export default function ProductsDashboardPage() {
  const [products, setProducts] = useState<ProductConfig[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    let url = `/products?search=${encodeURIComponent(search)}`;
    if (selectedCategory) url += `&categoryId=${selectedCategory}`;
    if (selectedStatus) url += `&status=${selectedStatus}`;

    const res = await fetchApi<ProductConfig[]>(url);
    if (res.success && res.data) {
      setProducts(res.data);
    }
    setLoading(false);
  };

  const loadCategories = async () => {
    const res = await fetchApi<ProductCategory[]>('/products/categories');
    if (res.success && res.data) {
      setCategories(res.data);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, selectedCategory, selectedStatus]);

  const handlePublish = async (id: string) => {
    if (!confirm('Are you sure you want to publish this product version? It will become ACTIVE.')) return;
    const res = await fetchApi(`/products/${id}/publish`, { method: 'POST' });
    if (res.success) {
      setActionMessage('Product published successfully!');
      loadProducts();
    } else {
      alert(`Publish failed: ${res.message}`);
    }
  };

  const handlePause = async (id: string) => {
    const res = await fetchApi(`/products/${id}/pause`, { method: 'POST' });
    if (res.success) {
      setActionMessage('Product paused');
      loadProducts();
    }
  };

  const handleResume = async (id: string) => {
    const res = await fetchApi(`/products/${id}/resume`, { method: 'POST' });
    if (res.success) {
      setActionMessage('Product resumed to ACTIVE status');
      loadProducts();
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Archive this product? It will no longer accept new applications.')) return;
    const res = await fetchApi(`/products/${id}/archive`, { method: 'POST' });
    if (res.success) {
      setActionMessage('Product archived');
      loadProducts();
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { background: '#DCFCE7', color: '#166534' };
      case 'PAUSED': return { background: '#FEF3C7', color: '#92400E' };
      case 'ARCHIVED': return { background: '#F3F4F6', color: '#4B5563' };
      default: return { background: '#DBEAFE', color: '#1E40AF' }; // DRAFT
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: '#0F172A', margin: 0, fontSize: '1.875rem' }}>Dynamic Product Catalog</h1>
          <p style={{ color: '#64748B', margin: '0.25rem 0 0 0' }}>Super Admin Business Configuration Engine</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/products/new" style={{ background: '#0F172A', color: '#FFF', padding: '0.625rem 1.25rem', borderRadius: '0.375rem', textDecoration: 'none', fontWeight: 500 }}>
            + Create Product
          </Link>
          <Link href="/categories" style={{ background: '#E2E8F0', color: '#0F172A', padding: '0.625rem 1.25rem', borderRadius: '0.375rem', textDecoration: 'none', fontWeight: 500 }}>
            Categories
          </Link>
        </div>
      </header>

      {actionMessage && (
        <div style={{ background: '#F0FDF4', color: '#166534', padding: '1rem', borderRadius: '0.375rem', marginBottom: '1.5rem', border: '1px solid #BBF7D0' }}>
          {actionMessage}
        </div>
      )}

      {/* Filters Bar */}
      <div style={{ background: '#FFF', padding: '1.25rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by product name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '250px', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1' }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', minWidth: '180px' }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', minWidth: '150px' }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="PAUSED">PAUSED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
      </div>

      {/* Table List */}
      <div style={{ background: '#FFF', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>Loading products...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
            <p style={{ fontSize: '1.125rem', fontWeight: 500, margin: 0 }}>No products found</p>
            <p style={{ fontSize: '0.875rem' }}>Create a new financial product configuration to get started.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Code</th>
                <th style={{ padding: '0.875rem 1rem' }}>Product Name</th>
                <th style={{ padding: '0.875rem 1rem' }}>Category</th>
                <th style={{ padding: '0.875rem 1rem' }}>Version</th>
                <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const badge = getStatusBadgeStyle(p.status);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#0F172A' }}>{p.code}</td>
                    <td style={{ padding: '1rem' }}>
                      <Link href={`/products/${p.id}`} style={{ color: '#0284C7', textDecoration: 'none', fontWeight: 500 }}>
                        {p.name}
                      </Link>
                    </td>
                    <td style={{ padding: '1rem', color: '#64748B' }}>{p.categoryName || p.categoryId}</td>
                    <td style={{ padding: '1rem' }}>v{p.version}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, ...badge }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Link href={`/forms/editor/${p.id}`} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', background: '#F1F5F9', color: '#334155', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 500 }}>
                          Form Editor
                        </Link>
                        {p.status === 'DRAFT' && (
                          <button onClick={() => handlePublish(p.id)} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', background: '#166534', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>
                            Publish
                          </button>
                        )}
                        {p.status === 'ACTIVE' && (
                          <button onClick={() => handlePause(p.id)} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', background: '#D97706', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>
                            Pause
                          </button>
                        )}
                        {p.status === 'PAUSED' && (
                          <button onClick={() => handleResume(p.id)} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', background: '#166534', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>
                            Resume
                          </button>
                        )}
                        {p.status !== 'ARCHIVED' && (
                          <button onClick={() => handleArchive(p.id)} style={{ padding: '0.375rem 0.75rem', borderRadius: '0.25rem', background: '#DC2626', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>
                            Archive
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
    </div>
  );
}
