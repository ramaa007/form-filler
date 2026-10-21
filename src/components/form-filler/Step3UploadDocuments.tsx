// src/components/form-filler/Step3UploadDocuments.tsx
'use client';

import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { 
  AnalyzedFormStructure, 
  UploadedSupportingDoc 
} from '@/types/form-filler';

interface Step3UploadDocumentsProps {
  formStructure: AnalyzedFormStructure;
  documents: UploadedSupportingDoc[];
  onDocumentsChange: (docs: UploadedSupportingDoc[]) => void;
  onProceedToScan: () => void;
  onBack: () => void;
  onLoadSampleDocs: () => void;
}

export const Step3UploadDocuments: React.FC<Step3UploadDocumentsProps> = ({
  formStructure,
  documents,
  onDocumentsChange,
  onProceedToScan,
  onBack,
  onLoadSampleDocs
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (files.length === 0) {
      setError('Please upload PDF files only.');
      return;
    }

    addFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (!e.target.files) return;
    const files = Array.from(e.target.files).filter(
      f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (files.length === 0) {
      setError('Please upload PDF files only.');
      return;
    }

    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const newDocs: UploadedSupportingDoc[] = files.map(file => ({
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      assignedPersonRoleId: 'auto', // default to auto-detect
      status: 'ready'
    }));

    onDocumentsChange([...documents, ...newDocs]);
  };

  const removeDoc = (id: string) => {
    onDocumentsChange(documents.filter(d => d.id !== id));
  };

  const updateDocRole = (id: string, roleId: string) => {
    onDocumentsChange(
      documents.map(d => d.id === id ? { ...d, assignedPersonRoleId: roleId } : d)
    );
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          color: '#38bdf8',
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 16,
          border: '1px solid rgba(56, 189, 248, 0.25)'
        }}>
          <Sparkles size={14} /> Step 3 of 6 • Multi-Document Ingestion
        </div>

        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#f8fafc',
          marginBottom: 12,
          letterSpacing: '-0.02em'
        }}>
          Now upload the documents that contain these details.
        </h1>
        <p style={{
          fontSize: 16,
          color: '#94a3b8',
          maxWidth: 680,
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          Upload multiple PDF files in one session (driver’s licence, passport, payslips, bank statements, contract notes, etc.). Documents for all applicants are supported together.
        </p>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 14
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Multi-File Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2px dashed #38bdf8' : '2px dashed rgba(255, 255, 255, 0.18)',
          borderRadius: 16,
          backgroundColor: isDragging ? 'rgba(56, 189, 248, 0.05)' : 'rgba(22, 32, 50, 0.7)',
          padding: '36px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: 24
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto'
        }}>
          <UploadCloud size={30} />
        </div>

        <p style={{ fontSize: 17, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
          Drop supporting PDFs here, or click to browse multiple files
        </p>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>
          Passports • Driver Licences • Payslips • Bank Statements • Existing Application Forms
        </p>
      </div>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(22, 32, 50, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 14,
          padding: '20px',
          marginBottom: 28
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
              Uploaded Supporting Documents ({documents.length})
            </h3>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              Assign to person or let AI auto-detect
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {documents.map(doc => (
              <div
                key={doc.id}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 220 }}>
                  <FileText size={20} color="#38bdf8" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>
                      {doc.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {(doc.size / 1024 / 1024).toFixed(2)} MB • Ready to scan
                    </div>
                  </div>
                </div>

                {/* Person Assignment Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UserCheck size={14} color="#94a3b8" />
                    <select
                      value={doc.assignedPersonRoleId}
                      onChange={e => updateDocRole(doc.id, e.target.value)}
                      style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.8)',
                        color: '#f8fafc',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 6,
                        padding: '6px 10px',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="auto">Auto-detect from names</option>
                      {formStructure.peopleRoles.map(role => (
                        <option key={role.id} value={role.id}>
                          Belongs to: {role.label}
                        </option>
                      ))}
                      {formStructure.peopleRoles.length > 1 && (
                        <option value="both">Contains details for both</option>
                      )}
                      <option value="not_sure">Not sure</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeDoc(doc.id)}
                    title="Remove document"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 4
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Docs Quick Launcher */}
      <div style={{
        backgroundColor: 'rgba(22, 32, 50, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 2 }}>
            Don’t have files ready on your computer?
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Load our pre-configured supporting documents pack (licences, payslips, bank statements) matching {formStructure.peopleRoles.map(r => r.label).join(' & ')}.
          </div>
        </div>

        <button
          type="button"
          onClick={onLoadSampleDocs}
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Layers size={14} />
          Load Sample Supporting Docs
        </button>
      </div>

      {/* Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 8,
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          ← Back to Form Structure
        </button>

        <button
          type="button"
          onClick={onProceedToScan}
          disabled={documents.length === 0}
          style={{
            backgroundColor: documents.length > 0 ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '14px 32px',
            fontSize: 15,
            fontWeight: 700,
            cursor: documents.length > 0 ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: documents.length > 0 ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none'
          }}
        >
          SCAN DOCUMENTS
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
