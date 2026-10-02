'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApi } from '../../../lib/api-client';
import { ProductCategory, ProductEligibilityRule, DocumentRequirement } from '@sryn/types';

export default function CreateProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [eligibilityRules, setEligibilityRules] = useState<ProductEligibilityRule[]>([]);
  const [docRequirements, setDocRequirements] = useState<DocumentRequirement[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApi<ProductCategory[]>('/products/categories').then((res) => {
      if (res.success && res.data) {
        setCategories(res.data);
        if (res.data.length > 0) setCategoryId(res.data[0].id);
      }
    });
  }, []);

  const addEligibilityRule = () => {
    setEligibilityRules([
      ...eligibilityRules,
      {
        id: `rule-${Date.now()}`,
        ruleCode: `RULE_${eligibilityRules.length + 1}`,
        fieldName: 'monthlyIncome',
        operator: 'GREATER_THAN',
        expectedValue: 25000,
        errorMessage: 'Minimum monthly income required is ₹25,000',
      },
    ]);
  };

  const addDocumentRequirement = () => {
    setDocRequirements([
      ...docRequirements,
      {
        id: `doc-${Date.now()}`,
        documentType: 'PAN_CARD',
        title: 'PAN Card Copy',
        isRequired: true,
        maxSizeMb: 5,
        allowedExtensions: ['pdf', 'jpg', 'png'],
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      code,
      name,
      categoryId,
      description,
      eligibilityRules,
      documentRequirements: docRequirements,
    };

    const res = await fetchApi('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (res.success && res.data) {
      router.push('/products');
    } else {
      alert(`Error creating product: ${res.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/products" style={{ color: '#0284C7', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Products</Link>
        <h1 style={{ color: '#0F172A', fontSize: '1.875rem', marginTop: '0.5rem' }}>Create New Financial Product</h1>
      </header>

      <form onSubmit={handleSubmit} style={{ background: '#FFF', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Product Code (UPPERCASE_SNAKE_CASE)</label>
          <input
            type="text"
            required
            placeholder="e.g. FD_CREDIT_CARD_GOLD"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Product Display Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Gold Fixed Deposit Backed Credit Card"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1' }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>Description</label>
          <textarea
            rows={3}
            placeholder="Product summary and features..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1' }}
          />
        </div>

        {/* Eligibility Rules Section */}
        <div style={{ marginBottom: '2rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#0F172A' }}>Eligibility Rules</h3>
            <button type="button" onClick={addEligibilityRule} style={{ padding: '0.375rem 0.75rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '0.25rem', cursor: 'pointer' }}>
              + Add Rule
            </button>
          </div>
          {eligibilityRules.map((rule, idx) => (
            <div key={rule.id} style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '0.375rem', marginBottom: '0.75rem', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <input
                  type="text"
                  value={rule.fieldName}
                  onChange={(e) => {
                    const copy = [...eligibilityRules];
                    copy[idx].fieldName = e.target.value;
                    setEligibilityRules(copy);
                  }}
                  placeholder="Field Name"
                  style={{ padding: '0.375rem', border: '1px solid #CBD5E1', borderRadius: '0.25rem' }}
                />
                <select
                  value={rule.operator}
                  onChange={(e) => {
                    const copy = [...eligibilityRules];
                    copy[idx].operator = e.target.value as any;
                    setEligibilityRules(copy);
                  }}
                  style={{ padding: '0.375rem', border: '1px solid #CBD5E1', borderRadius: '0.25rem' }}
                >
                  <option value="EQUALS">EQUALS</option>
                  <option value="GREATER_THAN">GREATER_THAN</option>
                  <option value="LESS_THAN">LESS_THAN</option>
                  <option value="IN">IN</option>
                </select>
                <input
                  type="text"
                  value={rule.expectedValue}
                  onChange={(e) => {
                    const copy = [...eligibilityRules];
                    copy[idx].expectedValue = e.target.value;
                    setEligibilityRules(copy);
                  }}
                  placeholder="Expected Value"
                  style={{ padding: '0.375rem', border: '1px solid #CBD5E1', borderRadius: '0.25rem' }}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{ width: '100%', padding: '0.75rem', background: '#0F172A', color: '#FFF', border: 'none', borderRadius: '0.375rem', fontWeight: 600, cursor: 'pointer' }}
        >
          {saving ? 'Saving Draft Product...' : 'Save Draft Product'}
        </button>
      </form>
    </div>
  );
}
