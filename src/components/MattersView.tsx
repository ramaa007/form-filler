// src/components/MattersView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  DollarSign, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import { Matter, Client, MatterType, DocumentRecord, ExtractedField, GeneratedDocument } from '@/types/database';
import { INDUSTRY_MODULES } from '@/types/industry';
import { MatterComplianceReport } from '@/lib/compliance/engine';

interface MattersViewProps {
  matters: Matter[];
  clients: Client[];
  activeOrgId: string;
  activeOrgIndustry: string;
  selectedMatterId?: string | null;
  onRefresh: () => void;
  onNavigateToDocumentUpload: (matterId: string) => void;
  onNavigateToGenerate: (matterId: string) => void;
}

export const MattersView: React.FC<MattersViewProps> = ({
  matters,
  clients,
  activeOrgId,
  activeOrgIndustry,
  selectedMatterId: initialSelectedId,
  onRefresh,
  onNavigateToDocumentUpload,
  onNavigateToGenerate
}) => {
  const [selectedMatter, setSelectedMatter] = useState<Matter | null>(null);
  const [dossierData, setDossierData] = useState<{
    client: Client | null;
    documents: DocumentRecord[];
    extractedFields: ExtractedField[];
    generatedDocs: GeneratedDocument[];
    complianceReport: MatterComplianceReport | null;
  }>({
    client: null,
    documents: [],
    extractedFields: [],
    generatedDocs: [],
    complianceReport: null
  });
  const [loadingDossier, setLoadingDossier] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [matterType, setMatterType] = useState<MatterType>('mortgage_application');
  const [title, setTitle] = useState('');
  const [refNum, setRefNum] = useState('');
  const [jurisdiction, setJurisdiction] = useState('AU-QLD');
  const [matterProps, setMatterProps] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default selection
  useEffect(() => {
    if (matters.length > 0) {
      const target = initialSelectedId ? matters.find(m => m.id === initialSelectedId) : matters[0];
      setSelectedMatter(target || matters[0]);
    } else {
      setSelectedMatter(null);
    }
  }, [matters, initialSelectedId]);

  // Load detailed dossier when matter is selected
  useEffect(() => {
    if (selectedMatter) {
      setLoadingDossier(true);
      fetch(`/api/matters?orgId=${activeOrgId}&matterId=${selectedMatter.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setDossierData({
              client: data.client,
              documents: data.documents || [],
              extractedFields: data.extractedFields || [],
              generatedDocs: data.generatedDocs || [],
              complianceReport: data.complianceReport
            });
          }
        })
        .finally(() => setLoadingDossier(false));
    }
  }, [selectedMatter, activeOrgId]);

  const handleCreateMatter = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/matters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisation_id: activeOrgId,
          client_id: clientId,
          matter_type: matterType,
          title,
          reference_number: refNum || undefined,
          jurisdiction,
          matter_data: matterProps
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create matter');

      setShowCreateModal(false);
      onRefresh();
      setSelectedMatter(data.matter);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentModule = (INDUSTRY_MODULES as any)[activeOrgIndustry] || INDUSTRY_MODULES.universal;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Matters, Applications & Transactions</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Multi-disciplinary file management containing linked clients, source PDFs, extracted evidence, and statutory compliance status.
          </p>
        </div>
        <button 
          id="btn-create-matter"
          className="btn btn-primary"
          onClick={() => {
            if (clients.length === 0) {
              alert('Please create a client profile first before creating a matter.');
              return;
            }
            setShowCreateModal(true);
          }}
        >
          <Plus size={16} /> Open New Matter File
        </button>
      </div>

      {/* Split Dossier Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
        {/* Matters Directory */}
        <div className="glass-panel" style={{ padding: '20px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Matter Files ({matters.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {matters.map(m => {
              const isSelected = selectedMatter?.id === m.id;
              return (
                <div
                  key={m.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setSelectedMatter(m)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.4 }}>
                      {m.title}
                    </p>
                    <span className="badge badge-info" style={{ fontSize: '10px' }}>
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    <span>Ref: <strong style={{ fontFamily: 'var(--font-mono)' }}>{m.reference_number}</strong></span>
                    <span>{m.jurisdiction}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Matter Full Dossier */}
        {selectedMatter ? (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                    {selectedMatter.matter_type.replace(/_/g, ' ')}
                  </span>
                  <span className="badge badge-muted">
                    {selectedMatter.jurisdiction}
                  </span>
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 700 }}>{selectedMatter.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Reference: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{selectedMatter.reference_number}</strong> | Client: <strong>{dossierData.client?.primary_name || 'Loading...'}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  id="btn-upload-matter-doc"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigateToDocumentUpload(selectedMatter.id)}
                >
                  <FileText size={14} /> Upload PDF
                </button>
                <button 
                  id="btn-generate-matter-doc"
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigateToGenerate(selectedMatter.id)}
                >
                  <FileCheck2 size={14} /> Generate Form
                </button>
              </div>
            </div>

            {/* Matter Transaction Details */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#38bdf8', marginBottom: '12px' }}>
                Transaction & Subject Data
              </h4>
              <div className="grid-cols-3">
                {Object.entries(selectedMatter.matter_data).map(([k, v]) => (
                  <div key={k} style={{ padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {k.replace(/_/g, ' ')}
                    </p>
                    <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                      {String(v)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Compliance Assessment Report Card */}
            {dossierData.complianceReport && (
              <div style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ShieldCheck size={20} color="#10b981" />
                    <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Statutory Compliance Health</h4>
                  </div>
                  <span className={`badge ${dossierData.complianceReport.overallStatus === 'compliant' ? 'badge-verified' : 'badge-unverified'}`}>
                    {dossierData.complianceReport.overallStatus === 'compliant' ? 'Verified Compliant' : 'Requirements Pending'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '20px', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  <div>Total Rules Evaluated: <strong>{dossierData.complianceReport.totalRules}</strong></div>
                  <div>Verified Complete: <strong style={{ color: '#10b981' }}>{dossierData.complianceReport.verifiedCount}</strong></div>
                  <div>Incomplete / Missing: <strong style={{ color: '#fbbf24' }}>{dossierData.complianceReport.incompleteCount}</strong></div>
                </div>

                {/* Evaluations breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dossierData.complianceReport.evaluations.map(ev => (
                    <div 
                      key={ev.ruleId} 
                      style={{ 
                        padding: '10px 14px', 
                        borderRadius: 'var(--radius-sm)', 
                        background: 'var(--bg-card)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        fontSize: '12.5px' 
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--text-main)' }}>{ev.ruleName}</strong>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{ev.notes}</p>
                      </div>
                      <span className={`badge ${ev.status === 'verified_complete' ? 'badge-verified' : 'badge-unverified'}`}>
                        {ev.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Documents & Extracted Evidence */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Linked Documents ({dossierData.documents.length})</h4>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigateToDocumentUpload(selectedMatter.id)}
                >
                  <Plus size={12} /> Add Document
                </button>
              </div>

              {dossierData.documents.length === 0 ? (
                <div style={{ padding: '24px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No documents uploaded to this matter yet. Upload a payslip, ID, or contract to trigger AI extraction.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dossierData.documents.map(d => (
                    <div 
                      key={d.id} 
                      style={{ 
                        padding: '12px 16px', 
                        background: 'var(--bg-surface)', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={20} color="#38bdf8" />
                        <div>
                          <p style={{ fontSize: '13.5px', fontWeight: 600 }}>{d.file_name}</p>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            Category: {d.document_category.replace(/_/g, ' ')} | Size: {Math.round(d.file_size_bytes / 1024)} KB | Pages: {d.page_count}
                          </p>
                        </div>
                      </div>
                      <span className={`badge ${d.extraction_status === 'verified' ? 'badge-verified' : d.extraction_status === 'awaiting_review' ? 'badge-unverified' : 'badge-info'}`}>
                        {d.extraction_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a matter file to view its complete dossier.
          </div>
        )}
      </div>

      {/* Modal: Create Matter */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-modal" style={{ width: '100%', maxWidth: '640px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Open New Matter File</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Create an industry-specific matter record and bind it to a verified client profile.
            </p>

            {error && (
              <div style={{ padding: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateMatter}>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Client Profile</label>
                  <select className="form-select" value={clientId} onChange={e => setClientId(e.target.value)} required>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.primary_name} ({c.client_type})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Matter / Transaction Type</label>
                  <select className="form-select" value={matterType} onChange={e => setMatterType(e.target.value as any)}>
                    {currentModule.supportedMatterTypes.map((t: any) => (
                      <option key={t.type} value={t.type}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Matter Subject / Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="e.g. Purchase Conveyancing - 42 Ocean Parade, Surfers Paradise"
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Jurisdiction</label>
                  <select className="form-select" value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}>
                    <option value="AU-QLD">Queensland (QLD)</option>
                    <option value="AU-NSW">New South Wales (NSW)</option>
                    <option value="AU-VIC">Victoria (VIC)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Reference Number (Auto-assigned if blank)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. MAT-2026-0042" 
                    value={refNum} 
                    onChange={e => setRefNum(e.target.value)} 
                  />
                </div>
              </div>

              {/* Dynamic Matter Fields based on selected type */}
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '16px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                Matter Attributes
              </h4>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Subject Property / Asset Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 42 Ocean Parade, Surfers Paradise QLD"
                    onChange={e => setMatterProps({ ...matterProps, property_address: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Consideration / Loan Amount ($AUD)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="850000"
                    onChange={e => setMatterProps({ ...matterProps, amount: e.target.value, loan_amount: e.target.value, purchase_price: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Key Date (Settlement / Completion)</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    onChange={e => setMatterProps({ ...matterProps, settlement_date: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Lender / Institution / Solicitor</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Commonwealth Bank / REIQ"
                    onChange={e => setMatterProps({ ...matterProps, lender_name: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating Matter...' : 'Open Matter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
