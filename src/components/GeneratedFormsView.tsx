// src/components/GeneratedFormsView.tsx
'use client';

import React, { useState } from 'react';
import { 
  FileSignature, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Play, 
  ShieldCheck, 
  FileText,
  Sparkles
} from 'lucide-react';
import { GeneratedDocument, Matter, PdfTemplate } from '@/types/database';

interface GeneratedFormsViewProps {
  generatedDocs: GeneratedDocument[];
  matters: Matter[];
  templates: PdfTemplate[];
  activeOrgId: string;
  preselectedMatterId?: string | null;
  onRefresh: () => void;
}

export const GeneratedFormsView: React.FC<GeneratedFormsViewProps> = ({
  generatedDocs,
  matters,
  templates,
  activeOrgId,
  preselectedMatterId,
  onRefresh
}) => {
  const [selectedMatterId, setSelectedMatterId] = useState(preselectedMatterId || matters[0]?.id || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [generationType, setGenerationType] = useState<'draft' | 'final'>('draft');
  const [generating, setGenerating] = useState(false);
  
  const [approvalDocId, setApprovalDocId] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approving, setApproving] = useState(false);

  const [lastGeneratedPdfBase64, setLastGeneratedPdfBase64] = useState<string | null>(null);
  const [lastGeneratedFileName, setLastGeneratedFileName] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePdf = async () => {
    if (!selectedMatterId || !selectedTemplateId) {
      alert('Please select both a matter and a template.');
      return;
    }

    setGenerating(true);
    setError(null);
    setWarnings([]);

    try {
      const res = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisation_id: activeOrgId,
          matter_id: selectedMatterId,
          template_id: selectedTemplateId,
          generation_type: generationType,
          apply_draft_watermark: generationType === 'draft'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate PDF document');
      }

      setLastGeneratedPdfBase64(data.pdf_base64);
      setLastGeneratedFileName(data.file_name);
      if (data.warnings?.length) setWarnings(data.warnings);

      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadBase64 = (base64: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApproveDocument = async (docId: string, action: 'approve' | 'reject') => {
    setApproving(true);
    try {
      const res = await fetch('/api/pdf/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisation_id: activeOrgId,
          document_id: docId,
          action,
          notes: approvalNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setApprovalDocId(null);
      setApprovalNotes('');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setApproving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Universal PDF Generation & Formal Approval</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Merge verified client data into blank AcroForms or flat coordinate layouts with draft watermarking and formal legal approval sign-off.
        </p>
      </div>

      {/* Form Generation Trigger Box */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#38bdf8" /> Configure Document Generation Run
        </h3>

        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {warnings.length > 0 && (
          <div style={{ padding: '12px 16px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', color: '#fbbf24', fontSize: '13px', marginBottom: '16px' }}>
            {warnings.join(' | ')}
          </div>
        )}

        <div className="grid-cols-3">
          <div className="form-group">
            <label className="form-label">Target Matter File</label>
            <select className="form-select" value={selectedMatterId} onChange={e => setSelectedMatterId(e.target.value)}>
              {matters.map(m => (
                <option key={m.id} value={m.id}>{m.title} ({m.reference_number})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Form Template</label>
            <select className="form-select" value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)}>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Generation Mode</label>
            <select className="form-select" value={generationType} onChange={e => setGenerationType(e.target.value as any)}>
              <option value="draft">Draft (Includes "DRAFT - NOT FOR EXECUTION" Watermark)</option>
              <option value="final">Final Execution (Enforces Mandatory Validations)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <button 
            id="btn-generate-pdf-execute"
            className="btn btn-primary"
            disabled={generating}
            onClick={handleGeneratePdf}
          >
            <Play size={14} />
            {generating ? 'Processing PDF Engine...' : `Generate ${generationType === 'draft' ? 'Draft' : 'Final'} PDF`}
          </button>
        </div>

        {/* Immediate Download Banner If Just Generated */}
        {lastGeneratedPdfBase64 && lastGeneratedFileName && (
          <div style={{ marginTop: '20px', padding: '16px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#34d399' }}>Document Successfully Generated & Rendered!</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>File: {lastGeneratedFileName}</p>
            </div>
            <button 
              id="btn-download-generated-pdf"
              className="btn btn-success"
              onClick={() => handleDownloadBase64(lastGeneratedPdfBase64, lastGeneratedFileName)}
            >
              <Download size={16} /> Download Completed PDF
            </button>
          </div>
        )}
      </div>

      {/* Generated Documents History & Formal Sign-off Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          Generated Documents & Approval Register ({generatedDocs.length})
        </h3>

        {generatedDocs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No documents generated yet in this organisation.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Mode</th>
                  <th>Approval Status</th>
                  <th>Sign-off Details</th>
                  <th>Generated At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {generatedDocs.map(g => (
                  <tr key={g.id}>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{g.file_name}</strong>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Template v{g.template_version}</p>
                    </td>
                    <td>
                      <span className={`badge ${g.generation_type === 'draft' ? 'badge-unverified' : 'badge-info'}`}>
                        {g.generation_type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${g.approval_status === 'approved' ? 'badge-verified' : g.approval_status === 'rejected' ? 'badge-conflict' : 'badge-unverified'}`}>
                        {g.approval_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {g.approved_by ? (
                        <>
                          Approved by <strong>{g.approved_by}</strong> on {new Date(g.approved_at || '').toLocaleDateString('en-AU')}<br />
                          {g.approval_notes && <em>"{g.approval_notes}"</em>}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Pending formal human review</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(g.created_at).toLocaleString('en-AU')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {g.approval_status === 'awaiting_approval' && (
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => setApprovalDocId(g.id)}
                          >
                            Sign-off
                          </button>
                        )}
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            // If base64 exists in session or trigger instant synthetic view
                            if (lastGeneratedPdfBase64) {
                              handleDownloadBase64(lastGeneratedPdfBase64, g.file_name);
                            } else {
                              handleGeneratePdf();
                            }
                          }}
                        >
                          <Download size={12} /> Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Formal Sign-off and Approval */}
      {approvalDocId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-modal" style={{ width: '100%', maxWidth: '500px', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Formal Document Approval & Sign-Off</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Confirm that you have reviewed the generated PDF against verified supporting documentation.
            </p>

            <div className="form-group">
              <label className="form-label">Reviewer Compliance Notes / Reference</label>
              <textarea 
                className="form-textarea" 
                rows={3} 
                placeholder="e.g. Cross-referenced against certified bank statements and identification. Approved for lodgement."
                value={approvalNotes} 
                onChange={e => setApprovalNotes(e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setApprovalDocId(null)}>Cancel</button>
              <button 
                className="btn btn-danger btn-sm"
                disabled={approving}
                onClick={() => handleApproveDocument(approvalDocId, 'reject')}
              >
                Reject Document
              </button>
              <button 
                className="btn btn-success"
                disabled={approving}
                onClick={() => handleApproveDocument(approvalDocId, 'approve')}
              >
                Approve Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
