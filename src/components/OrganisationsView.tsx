// src/components/OrganisationsView.tsx
'use client';

import React, { useState } from 'react';
import { Building2, Plus, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { Organisation } from '@/types/database';
import { SUPPORTED_JURISDICTIONS } from '@/types/industry';

interface OrganisationsViewProps {
  organisations: Organisation[];
  activeOrg: Organisation;
  onSelectOrg: (orgId: string) => void;
  onRefresh: () => void;
}

export const OrganisationsView: React.FC<OrganisationsViewProps> = ({
  organisations,
  activeOrg,
  onSelectOrg,
  onRefresh
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [industryType, setIndustryType] = useState('mortgage_finance');
  const [jurisdiction, setJurisdiction] = useState('AU-QLD');
  const [retentionDays, setRetentionDays] = useState(365);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/organisations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          industry_type: industryType,
          jurisdiction,
          retention_policy_days: retentionDays
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create organisation');

      setName('');
      setShowCreateModal(false);
      onRefresh();
      onSelectOrg(data.organisation.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Multi-Tenant Organisations & Security</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Each business maintains its own isolated data boundary enforced via PostgreSQL Row Level Security (RLS) and storage policies.
          </p>
        </div>
        <button 
          id="btn-register-org"
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} /> Register New Organisation
        </button>
      </div>

      {/* Isolation Explainer Banner */}
      <div className="glass-panel" style={{ padding: '20px', borderColor: 'var(--info-border)', background: 'rgba(14, 165, 233, 0.05)' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <ShieldCheck size={24} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#38bdf8' }}>Strict Tenant Data Isolation</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              Organisation records (clients, matters, source PDFs, and extracted fields) are partitioned by tenant UUID. 
              Switching your active organisation demonstrates seamless context transition while strictly denying access to non-member data.
            </p>
          </div>
        </div>
      </div>

      {/* Organisation Cards Grid */}
      <div className="grid-cols-3">
        {organisations.map(org => {
          const isActive = org.id === activeOrg.id;
          return (
            <div 
              key={org.id} 
              className="glass-panel"
              style={{ 
                padding: '24px',
                border: isActive ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Building2 size={24} color={isActive ? '#38bdf8' : 'var(--text-muted)'} />
                  {isActive ? (
                    <span className="badge badge-verified">
                      <Check size={12} /> Active Tenant
                    </span>
                  ) : (
                    <span className="badge badge-muted">Inactive Context</span>
                  )}
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: 700, marginTop: '12px' }}>{org.name}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Slug: <span style={{ fontFamily: 'var(--font-mono)' }}>{org.slug}</span>
                </p>

                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <div>Industry: <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{org.industry_type.replace('_', ' ')}</strong></div>
                  <div>Jurisdiction: <strong style={{ color: 'var(--text-main)' }}>{org.jurisdiction}</strong></div>
                  <div>Retention Policy: <strong style={{ color: 'var(--text-main)' }}>{org.retention_policy_days} days</strong></div>
                </div>
              </div>

              {!isActive && (
                <button 
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', marginTop: '8px' }}
                  onClick={() => onSelectOrg(org.id)}
                >
                  Switch to this Organisation
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal: Create Organisation */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-modal" style={{ width: '100%', maxWidth: '520px', padding: '32px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Register New Organisation</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Create an independent SaaS tenant environment with custom industry configuration and jurisdiction.
            </p>

            {error && (
              <div style={{ padding: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateOrg}>
              <div className="form-group">
                <label className="form-label">Business / Firm Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="e.g. Sterling Legal Solicitors" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Industry Module</label>
                <select 
                  className="form-select" 
                  value={industryType} 
                  onChange={e => setIndustryType(e.target.value)}
                >
                  <option value="mortgage_finance">Mortgage & Finance</option>
                  <option value="solicitor_conveyancing">Solicitors & Conveyancing</option>
                  <option value="real_estate">Real Estate & Property Management</option>
                  <option value="universal">Universal Document Platform</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Configured Jurisdiction</label>
                <select 
                  className="form-select" 
                  value={jurisdiction} 
                  onChange={e => setJurisdiction(e.target.value)}
                >
                  {SUPPORTED_JURISDICTIONS.map(j => (
                    <option key={j.code} value={j.code}>{j.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Document Retention Policy (Days)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  min={30} 
                  max={3650} 
                  value={retentionDays} 
                  onChange={e => setRetentionDays(Number(e.target.value))} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Register Organisation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
