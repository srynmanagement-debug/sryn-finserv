'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '../../../../lib/api-client';
import { FormSchemaConfig, FormFieldConfig, FieldType } from '@sryn/types';

export default function FormSchemaEditorPage({ params }: { params: { productId: string } }) {
  const productId = params.productId;
  const [schema, setSchema] = useState<FormSchemaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchApi<FormSchemaConfig>(`/forms/schemas/${productId}`).then((res) => {
      if (res.success && res.data) {
        setSchema(res.data);
      }
      setLoading(false);
    });
  }, [productId]);

  const addFieldToCurrentStep = () => {
    if (!schema) return;
    const newField: FormFieldConfig = {
      id: `f-${Date.now()}`,
      name: `field_${Date.now().toString().slice(-4)}`,
      label: 'New Form Input Field',
      fieldType: 'TEXT',
      placeholder: 'Enter text...',
      validations: [{ type: 'REQUIRED', message: 'This field is required' }],
      isReadonly: false,
      stepNumber: activeStep,
      displayOrder: schema.steps[activeStep - 1]?.fields.length + 1 || 1,
    };

    const updatedSteps = [...schema.steps];
    updatedSteps[activeStep - 1].fields.push(newField);
    setSchema({ ...schema, steps: updatedSteps });
  };

  const handleSaveSchema = async () => {
    if (!schema) return;
    setSaving(true);
    const res = await fetchApi('/forms/schemas', {
      method: 'POST',
      body: JSON.stringify(schema),
    });
    setSaving(false);

    if (res.success && res.data) {
      alert(`Form schema saved successfully as version ${res.data.version}`);
      setSchema(res.data);
    } else {
      alert(`Failed to save form schema: ${res.message}`);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading form schema...</div>;
  if (!schema) return <div style={{ padding: '3rem', textAlign: 'center' }}>Schema not found</div>;

  const currentStepData = schema.steps[activeStep - 1] || schema.steps[0];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link href="/products" style={{ color: '#0284C7', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Products</Link>
          <h1 style={{ color: '#0F172A', fontSize: '1.75rem', margin: '0.25rem 0 0 0' }}>Dynamic Form Schema Editor</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            style={{ padding: '0.625rem 1.25rem', borderRadius: '0.375rem', background: '#F1F5F9', border: '1px solid #CBD5E1', cursor: 'pointer', fontWeight: 600 }}
          >
            {previewMode ? 'Edit Schema' : 'Interactive Preview'}
          </button>
          <button
            onClick={handleSaveSchema}
            disabled={saving}
            style={{ padding: '0.625rem 1.25rem', borderRadius: '0.375rem', background: '#0F172A', color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            {saving ? 'Saving Schema...' : 'Save Schema'}
          </button>
        </div>
      </header>

      {/* Editor Grid */}
      {!previewMode ? (
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '1.5rem' }}>
          {/* Steps Navigation Sidebar */}
          <div style={{ background: '#FFF', padding: '1.25rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#0F172A' }}>Form Steps</h3>
            {schema.steps.map((step) => (
              <button
                key={step.stepNumber}
                onClick={() => setActiveStep(step.stepNumber)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: activeStep === step.stepNumber ? '#0F172A' : '#F8FAFC',
                  color: activeStep === step.stepNumber ? '#FFF' : '#334155',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Step {step.stepNumber}: {step.title}
              </button>
            ))}
          </div>

          {/* Fields Editor Container */}
          <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A' }}>Fields in Step {activeStep}: {currentStepData.title}</h2>
              <button onClick={addFieldToCurrentStep} style={{ padding: '0.5rem 1rem', background: '#0F172A', color: '#FFF', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                + Add Input Field
              </button>
            </div>

            {currentStepData.fields.map((field, idx) => (
              <div key={field.id} style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Field Label</label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => {
                        const copy = [...schema.steps];
                        copy[activeStep - 1].fields[idx].label = e.target.value;
                        setSchema({ ...schema, steps: copy });
                      }}
                      style={{ width: '100%', padding: '0.375rem', borderRadius: '0.25rem', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Field Name / Key</label>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => {
                        const copy = [...schema.steps];
                        copy[activeStep - 1].fields[idx].name = e.target.value;
                        setSchema({ ...schema, steps: copy });
                      }}
                      style={{ width: '100%', padding: '0.375rem', borderRadius: '0.25rem', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>Field Type</label>
                    <select
                      value={field.fieldType}
                      onChange={(e) => {
                        const copy = [...schema.steps];
                        copy[activeStep - 1].fields[idx].fieldType = e.target.value as FieldType;
                        setSchema({ ...schema, steps: copy });
                      }}
                      style={{ width: '100%', padding: '0.375rem', borderRadius: '0.25rem', border: '1px solid #CBD5E1' }}
                    >
                      <option value="TEXT">TEXT</option>
                      <option value="NUMBER">NUMBER</option>
                      <option value="EMAIL">EMAIL</option>
                      <option value="PHONE">PHONE</option>
                      <option value="DATE">DATE</option>
                      <option value="DROPDOWN">DROPDOWN</option>
                      <option value="CHECKBOX">CHECKBOX</option>
                      <option value="FILE_UPLOAD">FILE_UPLOAD</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Live Form Interactive Preview */
        <div style={{ background: '#FFF', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            Live Customer Mobile / Web Form Preview
          </h2>
          {currentStepData.fields.map((field) => (
            <div key={field.id} style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                {field.label} {field.validations.some(v => v.type === 'REQUIRED') && <span style={{ color: '#DC2626' }}>*</span>}
              </label>
              {field.fieldType === 'TEXT' || field.fieldType === 'EMAIL' || field.fieldType === 'PHONE' ? (
                <input type={field.fieldType.toLowerCase()} placeholder={field.placeholder} style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1' }} />
              ) : field.fieldType === 'NUMBER' ? (
                <input type="number" placeholder={field.placeholder} style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1' }} />
              ) : field.fieldType === 'FILE_UPLOAD' ? (
                <input type="file" style={{ width: '100%', padding: '0.5rem' }} />
              ) : (
                <input type="text" placeholder={field.placeholder} style={{ width: '100%', padding: '0.625rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
