// src/components/AuditView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Filter, Search } from 'lucide-react';
import { AuditEvent } from '@/types/database';

interface AuditViewProps {
  activeOrgId: string;
}

export const AuditView: React.FC<AuditViewProps> = ({ activeOrgId }) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/audit?orgId=${activeOrgId}`)
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || []);
      })
      .finally(() => setLoading(false));
  }, [activeOrgId]);

  const filtered = events.filter(e => 
    e.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(e.details).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Tenant Audit Log & Traceability</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Immutable chronological record of document uploads, AI extractions, field verifications, and approvals.
          </p>
        </div>

        <div style={{ width: '280px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search audit actions..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading audit records...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No audit events found for this query.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Action</th>
                  <th>Resource Type</th>
                  <th>Details & Lineage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ev => (
                  <tr key={ev.id}>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(ev.created_at).toLocaleString('en-AU')}
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontFamily: 'var(--font-mono)' }}>
                        {ev.action}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{ev.resource_type}</td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {JSON.stringify(ev.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
