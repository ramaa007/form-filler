// src/components/DashboardView.tsx
'use client';

import React from 'react';
import { 
  Users, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  FileCheck2
} from 'lucide-react';
import { Client, Matter, DocumentRecord, GeneratedDocument, ComplianceAssessment } from '@/types/database';

interface DashboardViewProps {
  clients: Client[];
  matters: Matter[];
  documents: DocumentRecord[];
  generatedDocs: GeneratedDocument[];
  onNavigate: (tab: string, meta?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clients,
  matters,
  documents,
  generatedDocs,
  onNavigate
}) => {
  const openMatters = matters.filter(m => m.status === 'open' || m.status === 'under_review' || m.status === 'pending_documents');
  const awaitingReviewDocs = documents.filter(d => d.extraction_status === 'awaiting_review' || d.extraction_status === 'uploaded');
  const awaitingApprovalForms = generatedDocs.filter(g => g.approval_status === 'awaiting_approval');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>Platform Operations Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Real-time overview of active tenant clients, matter compliance health, AI document extractions, and pending form approvals.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid-cols-4">
        <div className="glass-panel stat-card" id="card-metric-clients">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Active Clients</span>
            <Users size={18} color="#38bdf8" />
          </div>
          <div className="stat-value">{clients.length}</div>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ marginTop: '8px' }}
            onClick={() => onNavigate('clients')}
          >
            Manage Profiles <ArrowRight size={14} />
          </button>
        </div>

        <div className="glass-panel stat-card" id="card-metric-matters">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Open Matters / Files</span>
            <Briefcase size={18} color="#818cf8" />
          </div>
          <div className="stat-value">{openMatters.length}</div>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ marginTop: '8px' }}
            onClick={() => onNavigate('matters')}
          >
            View Matters <ArrowRight size={14} />
          </button>
        </div>

        <div className="glass-panel stat-card" id="card-metric-docs-review">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Documents Awaiting Review</span>
            <Clock size={18} color="#fbbf24" />
          </div>
          <div className="stat-value" style={{ color: awaitingReviewDocs.length > 0 ? '#fbbf24' : 'var(--text-main)' }}>
            {awaitingReviewDocs.length}
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ marginTop: '8px' }}
            onClick={() => onNavigate('documents')}
          >
            Verify Extractions <ArrowRight size={14} />
          </button>
        </div>

        <div className="glass-panel stat-card" id="card-metric-forms-approval">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Forms Awaiting Approval</span>
            <FileCheck2 size={18} color="#34d399" />
          </div>
          <div className="stat-value" style={{ color: awaitingApprovalForms.length > 0 ? '#38bdf8' : 'var(--text-main)' }}>
            {awaitingApprovalForms.length}
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ marginTop: '8px' }}
            onClick={() => onNavigate('generated')}
          >
            Review & Sign <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Two Column Layout: Active Matters & Quick Actions */}
      <div className="grid-cols-2">
        {/* Open Matters & Settlement Deadlines */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Priority Matters & Transactions</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('matters')}>View All</button>
          </div>

          {matters.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No matters registered in this organisation yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matters.slice(0, 5).map(m => (
                <div 
                  key={m.id} 
                  style={{ 
                    padding: '14px 16px', 
                    borderRadius: 'var(--radius-md)', 
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{m.title}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Ref: <span style={{ fontFamily: 'var(--font-mono)' }}>{m.reference_number}</span> | Jurisdiction: {m.jurisdiction}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${m.status === 'open' ? 'badge-info' : 'badge-unverified'}`}>
                      {m.status.replace('_', ' ')}
                    </span>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => onNavigate('matters', { selectedMatterId: m.id })}
                    >
                      Dossier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Universal Engine Quick Actions */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Universal Automation Workflow</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            Follow the universal document lifecycle to ingest, verify, map, and generate verified PDF documents.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
              onClick={() => onNavigate('documents')}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontWeight: 700, fontSize: '13px' }}>1</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13.5px', fontWeight: 600 }}>Upload & Extract PDF</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ingest payslips, IDs, or contracts into Gemini multimodal</p>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </div>

            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
              onClick={() => onNavigate('documents')}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(251, 191, 36, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', fontWeight: 700, fontSize: '13px' }}>2</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13.5px', fontWeight: 600 }}>Verify Extracted Evidence</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Audit citations, confidence scores, and resolve conflicts</p>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </div>

            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
              onClick={() => onNavigate('templates')}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(129, 140, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontWeight: 700, fontSize: '13px' }}>3</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13.5px', fontWeight: 600 }}>Map Universal Templates</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Connect AcroForms and flat coordinate overlays to profile fields</p>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </div>

            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
              onClick={() => onNavigate('compliance')}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 700, fontSize: '13px' }}>4</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13.5px', fontWeight: 600 }}>Evaluate Compliance Rules</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automate statutory checklists with versioned statutory evidence</p>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
