// src/components/Topbar.tsx
'use client';

import React from 'react';
import { Building2, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { Organisation } from '@/types/database';

interface TopbarProps {
  organisations: Organisation[];
  activeOrg: Organisation;
  onSelectOrg: (orgId: string) => void;
  userName: string;
  userRole: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  organisations,
  activeOrg,
  onSelectOrg,
  userName,
  userRole
}) => {
  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={18} color="#38bdf8" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Organisation Tenant:
          </span>
        </div>
        <select
          id="select-active-org"
          className="form-select"
          style={{ padding: '6px 12px', fontSize: '13px', background: 'var(--bg-card)' }}
          value={activeOrg.id}
          onChange={(e) => onSelectOrg(e.target.value)}
        >
          {organisations.map(o => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.jurisdiction})
            </option>
          ))}
        </select>

        <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Shield size={12} />
          Private RLS Enforced
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
          <span>Gemini AI Multimodal</span>
          <Sparkles size={14} color="#f59e0b" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{userName}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {userRole.replace('_', ' ')}
            </p>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff' }}>
            {userName.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};
