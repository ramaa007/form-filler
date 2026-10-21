// src/components/DocumentsView.tsx
'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  ShieldAlert, 
  Check, 
  RotateCw,
  FileSearch,
  ExternalLink
} from 'lucide-react';
import { DocumentRecord, ExtractedField, Matter, DocumentCategory } from '@/types/database';

interface DocumentsViewProps {
  documents: DocumentRecord[];
  extractedFields: ExtractedField[];
  matters: Matter[];
  activeOrgId: string;
  preselectedMatterId?: string | null;
  onRefresh: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  extractedFields,
  matters,
  activeOrgId,
  preselectedMatterId,
  onRefresh
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(documents[0] || null);
  const [uploadMatterId, setUploadMatterId] = useState(preselectedMatterId || matters[0]?.id || '');
  const [category, setCategory] = useState<DocumentCategory>('income_payslip');
  
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter fields for selected document
  const docFields = selectedDoc 
    ? extractedFields.filter(f => f.document_id === selectedDoc.id)
    : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.pdf') && selected.type !== 'application/pdf') {
      setError('Invalid format: Only genuine PDF files (.pdf) are supported in this release.');
      return;
    }

    if (selected.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB safety processing limit.');
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileBase64(event.target?.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileBase64) {
      setError('Please select a PDF document.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisation_id: activeOrgId,
          matter_id: uploadMatterId || undefined,
          file_name: file.name,
          file_base64: fileBase64,
          document_category: category
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setSuccessMsg(`Document "${file.name}" uploaded and inspected successfully.`);
      setFile(null);
      setFileBase64(null);
      onRefresh();
      setSelectedDoc(data.document);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRunAiExtraction = async (docId: string) => {
    setExtracting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/documents/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisation_id: activeOrgId,
          document_id: docId,
          pdf_base64: fileBase64 || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI Extraction failed');

      setSuccessMsg(`Extracted ${data.extracted_fields?.length || 0} fields with evidence quotes.`);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleVerifyField = async (fieldId: string, status: 'verified' | 'rejected' | 'conflict', syncToProfile: boolean = false) => {
    try {
      const res = await fetch('/api/documents/verify-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisation_id: activeOrgId,
          field_id: fieldId,
          status,
          sync_to_client_profile: syncToProfile,
          client_id: selectedDoc?.client_id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification action failed');

      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>AI Document Ingestion & Verification Lineage</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Server-side Gemini multimodal parsing with strict prompt-injection protection, cited evidence quotes, and human verification controls.
        </p>
      </div>

      {/* Top Upload Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={18} color="#38bdf8" /> Ingest Source PDF Document
        </h3>

        {error && (
          <div style={{ padding: '12px 16px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '12px 16px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', color: '#34d399', fontSize: '13px', marginBottom: '16px' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div className="grid-cols-3">
            <div className="form-group">
              <label className="form-label">Associated Matter File</label>
              <select className="form-select" value={uploadMatterId} onChange={e => setUploadMatterId(e.target.value)}>
                {matters.map(m => (
                  <option key={m.id} value={m.id}>{m.title} ({m.reference_number})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Document Category</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value as any)}>
                <option value="income_payslip">Income Payslip / Financial Evidence</option>
                <option value="identity_document">Identity Document (Passport / Licence)</option>
                <option value="contract_of_sale">Contract of Sale (REIQ / Standard)</option>
                <option value="bank_statement">Bank / Financial Statement</option>
                <option value="tenancy_agreement">Tenancy / Lease Agreement</option>
                <option value="supporting_document">Supporting Legal Document</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">PDF File (.pdf only)</label>
              <input 
                id="input-pdf-file"
                type="file" 
                accept="application/pdf,.pdf" 
                className="form-input" 
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button 
              id="btn-upload-pdf-submit"
              type="submit" 
              className="btn btn-primary" 
              disabled={uploading || !file}
            >
              <Upload size={14} />
              {uploading ? 'Validating & Storing...' : 'Upload & Inspect PDF'}
            </button>
          </div>
        </form>
      </div>

      {/* Main Split Layout: Document Ingestion List vs Extracted Fields Lineage */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
        {/* Document Ingestion List */}
        <div className="glass-panel" style={{ padding: '20px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Uploaded Documents ({documents.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {documents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No documents uploaded yet.</p>
            ) : (
              documents.map(d => {
                const isSelected = selectedDoc?.id === d.id;
                return (
                  <div
                    key={d.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setSelectedDoc(d)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                        {d.file_name}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span className="badge badge-muted" style={{ fontSize: '10.5px' }}>
                        {d.document_category.replace(/_/g, ' ')}
                      </span>
                      <span className={`badge ${d.extraction_status === 'verified' ? 'badge-verified' : d.extraction_status === 'awaiting_review' ? 'badge-unverified' : 'badge-info'}`}>
                        {d.extraction_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Document Evidence & Verification Review */}
        {selectedDoc ? (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '8px' }}>
                  {selectedDoc.document_category.replace(/_/g, ' ')}
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>{selectedDoc.file_name}</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Size: {Math.round(selectedDoc.file_size_bytes / 1024)} KB | Pages: {selectedDoc.page_count} | Status: <strong style={{ textTransform: 'capitalize' }}>{selectedDoc.extraction_status.replace(/_/g, ' ')}</strong>
                </p>
              </div>

              <button 
                id="btn-run-ai-extract"
                className="btn btn-primary"
                disabled={extracting}
                onClick={() => handleRunAiExtraction(selectedDoc.id)}
              >
                <Sparkles size={16} />
                {extracting ? 'Extracting via Gemini...' : 'Extract Fields with AI'}
              </button>
            </div>

            {/* Regulatory AI Disclaimer */}
            <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-muted)' }}>
              <strong>Notice:</strong> AI extraction parses factual values and quotes citations as untrusted document input. 
              Extraction does not constitute legal verification, title guarantee, or credit decisioning. Human verification is required.
            </div>

            {/* Extracted Fields Evidence Table */}
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>
                Extracted Field Values & Supporting Evidence ({docFields.length})
              </h4>

              {docFields.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                  No fields extracted for this document yet. Click <strong>"Extract Fields with AI"</strong> to run extraction.
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Field Label</th>
                        <th>Extracted Value</th>
                        <th>Citing Evidence / Snippet</th>
                        <th>Confidence</th>
                        <th>Verification Status</th>
                        <th>Human Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docFields.map(f => (
                        <tr key={f.id}>
                          <td>
                            <strong style={{ color: 'var(--text-main)' }}>{f.field_label}</strong>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{f.field_key}</p>
                          </td>
                          <td style={{ fontWeight: 600, color: '#38bdf8' }}>
                            {f.extracted_value || '<Not Found / Null>'}
                          </td>
                          <td style={{ maxWidth: '240px', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            "{f.evidence_text || 'No verbatim quote'}"
                            {f.source_page && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Page {f.source_page}</div>}
                          </td>
                          <td>
                            <span className="badge badge-info" style={{ fontSize: '11px' }}>
                              {Math.round((f.confidence_score || 0.85) * 100)}%
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${f.verification_status === 'verified' ? 'badge-verified' : f.verification_status === 'conflict' ? 'badge-conflict' : 'badge-unverified'}`}>
                              {f.verification_status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {f.verification_status !== 'verified' && (
                                <button
                                  className="btn btn-success btn-sm"
                                  title="Verify and sync to client universal profile"
                                  onClick={() => handleVerifyField(f.id, 'verified', true)}
                                >
                                  <Check size={12} /> Verify
                                </button>
                              )}
                              {f.verification_status !== 'conflict' && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  title="Mark as conflict requiring human audit"
                                  onClick={() => handleVerifyField(f.id, 'conflict', false)}
                                >
                                  Conflict
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a document to inspect its AI extraction evidence and verification history.
          </div>
        )}
      </div>
    </div>
  );
};
