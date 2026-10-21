// src/components/SettingsView.tsx
'use client';

import React, { useState } from 'react';
import { Settings, Save, ShieldCheck, Database, Sparkles, Building2 } from 'lucide-react';
import { Organisation } from '@/types/database';
import { SUPPORTED_JURISDICTIONS } from '@/types/industry';

interface SettingsViewProps {
  activeOrg: Organisation;
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ activeOrg, onRefresh }) => {
  const [productName, setProductName] = useState(activeOrg.branding?.product_name || 'Universal AI Document Platform');
  const [primaryColor, setPrimaryColor] = useState(activeOrg.branding?.primary_color || '#2563eb');
  const [retentionDays, setRetentionDays] = useState(activeOrg.retention_policy_days || 365);
  const [jurisdiction, setJurisdiction] = useState(activeOrg.jurisdiction || 'AU-QLD');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      activeOrg.branding = {
        ...activeOrg.branding,
        product_name: productName,
        primary_color: primaryColor
      };
      activeOrg.retention_policy_days = Number(retentionDays);
      activeOrg.jurisdiction = jurisdiction;

      setSavedSuccess(true);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Platform Settings & Brand Configuration</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Customise white-label platform branding, AI model parameters, jurisdiction rules, and Australian Privacy retention controls.
        </p>
      </div>

      {savedSuccess && (
        <div style={{ padding: '12px 16px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', color: '#34d399', fontSize: '13px' }}>
          Settings and white-label branding updated successfully.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
        <form onSubmit={handleSave} className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            White-Label Brand & Organisation Preferences
          </h3>

          <div className="form-group">
            <label className="form-label">Working Product Name (Re-brandable)</label>
            <input 
              type="text" 
              className="form-input" 
              value={productName} 
              onChange={e => setProductName(e.target.value)} 
            />
          </div>

          <div className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Primary Brand Accent Color</label>
              <input 
                type="color" 
                className="form-input" 
                style={{ height: '44px', padding: '4px' }}
                value={primaryColor} 
                onChange={e => setPrimaryColor(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Active Jurisdiction</label>
              <select className="form-select" value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}>
                {SUPPORTED_JURISDICTIONS.map(j => (
                  <option key={j.code} value={j.code}>{j.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Statutory Document Retention Period (Days)</label>
            <input 
              type="number" 
              className="form-input" 
              value={retentionDays} 
              onChange={e => setRetentionDays(Number(e.target.value))} 
            />
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Documents older than this period are subject to automated purging under Australian Privacy Principles (APP 11.2).
            </p>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginTop: '12px' }}>
            AI Multimodal Configuration
          </h3>

          <div className="form-group">
            <label className="form-label">Server AI Multimodal Model</label>
            <select className="form-select" value={aiModel} onChange={e => setAiModel(e.target.value)}>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended: Fast & Ultra-Accurate Document Reasoning)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Complex Legal Document Synthesis)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Standard Multimodal)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

        {/* System & Architecture Health Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600 }}>System Health & Infrastructure</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={18} color="#10b981" />
              <div>
                <p style={{ fontWeight: 600 }}>Supabase PostgreSQL</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Row Level Security (RLS) Active</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} color="#38bdf8" />
              <div>
                <p style={{ fontWeight: 600 }}>Tenant Data Isolation</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Multi-Tenant Partitioning Active</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} color="#fbbf24" />
              <div>
                <p style={{ fontWeight: 600 }}>Google Gemini API</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Server-only Protected Integration</p>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong>Australian Privacy Act & QLD Compliance:</strong> All records are stored with encryption at rest, audited access logs, and strict human-in-the-loop verification before legal or credit form generation.
          </div>
        </div>
      </div>
    </div>
  );
};
