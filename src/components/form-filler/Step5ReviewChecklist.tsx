// src/components/form-filler/Step5ReviewChecklist.tsx
'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Edit3, 
  UploadCloud, 
  Users, 
  Layers, 
  Check, 
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Plus,
  Columns,
  MinusCircle,
  Eye,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { 
  AnalyzedFormStructure, 
  FormFieldDefinition, 
  FormFieldValueState, 
  FieldStatus 
} from '@/types/form-filler';
import { FieldEditModal } from './FieldEditModal';
import { FormPdfViewer } from './FormPdfViewer';

interface Step5ReviewChecklistProps {
  formStructure: AnalyzedFormStructure;
  fieldValues: Record<string, FormFieldValueState>;
  originalPdfBase64?: string;
  onUpdateFieldValue: (fieldId: string, value: any, confirmed?: boolean, statusOverride?: FieldStatus) => void;
  onBatchConfirmFound: () => void;
  onUploadAdditionalDoc: (files: File[]) => void;
  onProceedToCheckAll: () => void;
  onBackToDocuments: () => void;
}

export const Step5ReviewChecklist: React.FC<Step5ReviewChecklistProps> = ({
  formStructure,
  fieldValues,
  originalPdfBase64,
  onUpdateFieldValue,
  onBatchConfirmFound,
  onUploadAdditionalDoc,
  onProceedToCheckAll,
  onBackToDocuments
}) => {
  const [editingField, setEditingField] = useState<{
    field: FormFieldDefinition;
    state: FormFieldValueState;
    roleLabel?: string;
  } | null>(null);

  const [showAddDocDrawer, setShowAddDocDrawer] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'required' | 'attention' | 'skipped'>('all');
  const [viewMode, setViewMode] = useState<'split' | 'checklist'>(originalPdfBase64 ? 'split' : 'checklist');
  const [previewDocMode, setPreviewDocMode] = useState<'blank' | 'filled'>('blank');
  const [filledPdfBase64, setFilledPdfBase64] = useState<string | null>(null);
  const [isGeneratingFillPreview, setIsGeneratingFillPreview] = useState(false);

  // Compute field statistics
  const allFormFields = [
    ...formStructure.sharedFields,
    ...Object.values(formStructure.personFields).flat()
  ];
  const totalCount = allFormFields.length;
  const skippedCount = allFormFields.filter(f => fieldValues[f.id]?.status === 'skipped' || f.isSkipped).length;
  const confirmedCount = allFormFields.filter(f => fieldValues[f.id]?.status === 'confirmed').length;
  const foundCount = allFormFields.filter(f => fieldValues[f.id]?.status === 'found').length;
  const requiredCount = allFormFields.filter(f => f.isRequired && fieldValues[f.id]?.status !== 'skipped' && !f.isSkipped).length;
  
  const attentionCount = allFormFields.filter(f => {
    const s = fieldValues[f.id];
    if (s?.status === 'skipped' || f.isSkipped) return false;
    return s?.status === 'needs_review' || (f.isRequired && (!s || s.status === 'missing' || !s.currentValue));
  }).length;

  // Status badge style helper
  const getStatusBadge = (status: FieldStatus) => {
    switch (status) {
      case 'confirmed':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: 'rgba(16, 185, 129, 0.3)',
          label: 'Confirmed'
        };
      case 'found':
        return {
          bg: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          border: 'rgba(56, 189, 248, 0.3)',
          label: 'Found — Ready'
        };
      case 'needs_review':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: 'rgba(245, 158, 11, 0.3)',
          label: 'Needs Review'
        };
      case 'manually_entered':
        return {
          bg: 'rgba(139, 92, 246, 0.15)',
          color: '#c084fc',
          border: 'rgba(139, 92, 246, 0.3)',
          label: 'Manually Entered'
        };
      case 'missing':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: 'rgba(239, 68, 68, 0.3)',
          label: 'Missing'
        };
      case 'optional':
        return {
          bg: 'rgba(148, 163, 184, 0.12)',
          color: '#94a3b8',
          border: 'rgba(148, 163, 184, 0.2)',
          label: 'Optional'
        };
      case 'skipped':
        return {
          bg: 'rgba(100, 116, 139, 0.2)',
          color: '#94a3b8',
          border: 'rgba(100, 116, 139, 0.35)',
          label: 'Skipped (Leave Blank)'
        };
    }
  };

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(
        f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (files.length > 0) {
        onUploadAdditionalDoc(files);
        setShowAddDocDrawer(false);
      }
    }
  };

  // Toggle preview mode between blank and filled form
  const handleToggleDocPreviewMode = async (mode: 'blank' | 'filled') => {
    setPreviewDocMode(mode);
    if (mode === 'filled' && !filledPdfBase64 && originalPdfBase64) {
      try {
        setIsGeneratingFillPreview(true);
        const formData = new FormData();
        formData.append('originalPdfBase64', originalPdfBase64);
        formData.append('formStructure', JSON.stringify(formStructure));
        formData.append('fieldValues', JSON.stringify(fieldValues));

        const res = await fetch('/api/form/generate', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            const resultStr = reader.result as string;
            const b64 = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
            setFilledPdfBase64(b64);
          };
          reader.readAsDataURL(blob);
        }
      } catch (err) {
        console.error('Error generating live filled PDF preview:', err);
      } finally {
        setIsGeneratingFillPreview(false);
      }
    }
  };

  // Skip a specific field
  const handleSkipField = (fieldId: string) => {
    onUpdateFieldValue(fieldId, null, false, 'skipped');
    setFilledPdfBase64(null); // invalidate cached preview
  };

  // Unskip a field back to its natural state
  const handleUnskipField = (field: FormFieldDefinition) => {
    onUpdateFieldValue(field.id, null, false, field.isRequired ? 'missing' : 'optional');
    setFilledPdfBase64(null);
  };

  // Bulk Skip Optional Fields
  const handleSkipAllOptional = () => {
    allFormFields.forEach(f => {
      if (!f.isRequired) {
        const s = fieldValues[f.id];
        if (!s || s.status === 'missing' || s.status === 'optional' || !s.currentValue) {
          onUpdateFieldValue(f.id, null, false, 'skipped');
        }
      }
    });
    setFilledPdfBase64(null);
  };

  // Bulk Skip Any Remaining Missing Fields
  const handleSkipAllMissing = () => {
    allFormFields.forEach(f => {
      const s = fieldValues[f.id];
      if (!s || s.status === 'missing' || !s.currentValue) {
        onUpdateFieldValue(f.id, null, false, 'skipped');
      }
    });
    setFilledPdfBase64(null);
  };

  return (
    <div style={{ maxWidth: viewMode === 'split' ? 1480 : 1040, margin: '30px auto', padding: '0 24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            padding: '6px 14px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 8,
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <CheckCircle2 size={14} /> Step 5 of 6 • Review Extracted Information
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Verify Details & Skip Optional Fields
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
            Compare extracted client details with the actual document. Click <strong>Skip Field</strong> on any field you don’t need filled.
          </p>
        </div>

        {/* Global Toolbar Controls */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {originalPdfBase64 && (
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'split' ? 'checklist' : 'split')}
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                borderRadius: 8,
                padding: '9px 15px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Columns size={15} />
              {viewMode === 'split' ? 'Checklist Only' : 'Show Document Side-by-Side'}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddDocDrawer(true)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              borderRadius: 8,
              padding: '9px 15px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <UploadCloud size={15} /> Upload More Docs
          </button>

          {foundCount > 0 && (
            <button
              type="button"
              onClick={onBatchConfirmFound}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                borderRadius: 8,
                padding: '9px 15px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Check size={15} /> Confirm All Found ({foundCount})
            </button>
          )}

          <button
            type="button"
            onClick={handleSkipAllOptional}
            title="Skip all optional fields that have not been populated"
            style={{
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#cbd5e1',
              borderRadius: 8,
              padding: '9px 15px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <MinusCircle size={15} /> Skip All Optional
          </button>
        </div>
      </div>

      {/* Upload Additional Doc Drawer */}
      {showAddDocDrawer && (
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: 12,
          padding: '18px 22px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginBottom: 2 }}>
              Upload additional client document without losing progress
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Upload any extra PDF (e.g. passport, tax assessment, lease agreement) to auto-fill missing details.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              <UploadCloud size={14} /> Select PDF File
              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileDrop}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowAddDocDrawer(false)}
              style={{
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Layout Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: viewMode === 'split' ? 'minmax(420px, 1fr) minmax(500px, 1.25fr)' : '1fr',
        gap: 24,
        alignItems: 'start'
      }}>
        {/* Left Column: Embedded Form Document Preview (in split mode) */}
        {viewMode === 'split' && originalPdfBase64 && (
          <div style={{ position: 'sticky', top: 20 }}>
            <FormPdfViewer
              pdfBase64={previewDocMode === 'filled' && filledPdfBase64 ? filledPdfBase64 : originalPdfBase64}
              formName={formStructure.formName}
              title={previewDocMode === 'filled' ? 'Live Form Fill Preview' : 'Original Blank Form'}
              subtitle={previewDocMode === 'filled' ? 'Showing filled fields placed onto actual form' : 'Reference blank document'}
              mode={previewDocMode}
              onModeChange={handleToggleDocPreviewMode}
              hasFilledData={confirmedCount > 0 || foundCount > 0}
              height="740px"
            />
            {previewDocMode === 'filled' && isGeneratingFillPreview && (
              <div style={{ fontSize: 11, color: '#38bdf8', marginTop: 6, textAlign: 'center' }}>
                Updating live filled PDF preview...
              </div>
            )}
          </div>
        )}

        {/* Right Column: Review Checklist & Controls */}
        <div>
          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(22, 32, 50, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: '10px 16px',
            marginBottom: 18,
            flexWrap: 'wrap',
            gap: 10
          }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Filter Fields:
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                style={{
                  backgroundColor: filterMode === 'all' ? '#2563eb' : 'rgba(15, 23, 42, 0.6)',
                  color: filterMode === 'all' ? '#ffffff' : '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('required')}
                style={{
                  backgroundColor: filterMode === 'required' ? '#ef4444' : 'rgba(15, 23, 42, 0.6)',
                  color: filterMode === 'required' ? '#ffffff' : '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Required ({requiredCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('attention')}
                style={{
                  backgroundColor: filterMode === 'attention' ? '#f59e0b' : 'rgba(15, 23, 42, 0.6)',
                  color: filterMode === 'attention' ? '#ffffff' : '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Needs Attention ({attentionCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('skipped')}
                style={{
                  backgroundColor: filterMode === 'skipped' ? '#64748b' : 'rgba(15, 23, 42, 0.6)',
                  color: filterMode === 'skipped' ? '#ffffff' : '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <MinusCircle size={12} /> Skipped ({skippedCount})
              </button>
            </div>
          </div>

          {/* Section 1: People / Applicant Details */}
          {formStructure.peopleRoles.map(role => {
            const fields = formStructure.personFields[role.id] || [];
            const visibleFields = fields.filter(field => {
              const state = fieldValues[field.id];
              const isSkipped = state?.status === 'skipped' || field.isSkipped;
              if (filterMode === 'skipped') return isSkipped;
              if (isSkipped) return false;
              if (filterMode === 'required') return field.isRequired;
              if (filterMode === 'attention') {
                return state?.status === 'needs_review' || (field.isRequired && (!state || state.status === 'missing' || !state.currentValue));
              }
              return true;
            });

            if (visibleFields.length === 0 && filterMode !== 'all') return null;

            const roleFilled = fields.filter(f => fieldValues[f.id]?.status === 'confirmed' || fieldValues[f.id]?.status === 'found').length;
            const roleSkipped = fields.filter(f => fieldValues[f.id]?.status === 'skipped' || f.isSkipped).length;

            return (
              <div
                key={role.id}
                style={{
                  backgroundColor: 'rgba(22, 32, 50, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 14,
                  padding: '20px',
                  marginBottom: 20
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                  flexWrap: 'wrap',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={17} color="#60a5fa" />
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                      {role.label.toUpperCase()}
                    </h2>
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {roleFilled} filled • {roleSkipped} skipped
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {visibleFields.map(field => {
                    const state = fieldValues[field.id] || {
                      fieldId: field.id,
                      currentValue: null,
                      status: field.isSkipped ? 'skipped' : field.isRequired ? 'missing' : 'optional'
                    };
                    const isSkipped = state.status === 'skipped' || field.isSkipped;
                    const badge = getStatusBadge(state.status);

                    return (
                      <div
                        key={field.id}
                        style={{
                          backgroundColor: isSkipped ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.75)',
                          border: isSkipped
                            ? '1px dashed rgba(255, 255, 255, 0.1)'
                            : state.status === 'needs_review' 
                            ? '1px solid rgba(245, 158, 11, 0.4)' 
                            : state.status === 'missing' && field.isRequired
                            ? '1px solid rgba(239, 68, 68, 0.35)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: 8,
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: isSkipped ? '#94a3b8' : '#f8fafc',
                              textDecoration: isSkipped ? 'line-through' : 'none'
                            }}>
                              {field.label}
                            </span>
                            {field.isRequired && !isSkipped && (
                              <span style={{ fontSize: 10, color: '#f87171', fontWeight: 600 }}>*Required</span>
                            )}
                          </div>

                          <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {isSkipped ? (
                              <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                                Skipped by user (will remain blank on form)
                              </span>
                            ) : state.currentValue ? (
                              <span style={{ fontSize: 13, color: '#38bdf8', fontWeight: 600 }}>
                                {String(state.currentValue)}
                              </span>
                            ) : (
                              <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                                No value extracted yet
                              </span>
                            )}

                            {!isSkipped && state.sourceDocName && (
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                • From: {state.sourceDocName} {state.sourcePage ? `(P.${state.sourcePage})` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '3px 7px',
                            borderRadius: 4,
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`
                          }}>
                            {badge.label}
                          </span>

                          {/* If Found: Quick Confirm */}
                          {state.status === 'found' && (
                            <button
                              type="button"
                              onClick={() => onUpdateFieldValue(field.id, state.currentValue, true)}
                              style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                borderRadius: 6,
                                padding: '5px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Confirm
                            </button>
                          )}

                          {/* Edit / Enter */}
                          {!isSkipped && (
                            <button
                              type="button"
                              onClick={() => setEditingField({ field, state, roleLabel: role.label })}
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                color: '#e2e8f0',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: 6,
                                padding: '5px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Edit3 size={11} />
                              {state.status === 'missing' ? 'Fill' : 'Edit'}
                            </button>
                          )}

                          {/* Skip / Unskip Toggle */}
                          {isSkipped ? (
                            <button
                              type="button"
                              onClick={() => handleUnskipField(field)}
                              style={{
                                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                color: '#38bdf8',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                borderRadius: 6,
                                padding: '5px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <RotateCcw size={11} /> Unskip
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSkipField(field.id)}
                              title="Skip this field and leave it blank on the form"
                              style={{
                                backgroundColor: 'rgba(100, 116, 139, 0.15)',
                                color: '#94a3b8',
                                border: '1px solid rgba(100, 116, 139, 0.25)',
                                borderRadius: 6,
                                padding: '5px 9px',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <MinusCircle size={11} /> Skip
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Section 2: Shared Application Details */}
          {(() => {
            const visibleSharedFields = formStructure.sharedFields.filter(field => {
              const state = fieldValues[field.id];
              const isSkipped = state?.status === 'skipped' || field.isSkipped;
              if (filterMode === 'skipped') return isSkipped;
              if (isSkipped) return false;
              if (filterMode === 'required') return field.isRequired;
              if (filterMode === 'attention') {
                return state?.status === 'needs_review' || (field.isRequired && (!state || state.status === 'missing' || !state.currentValue));
              }
              return true;
            });

            if (visibleSharedFields.length === 0 && filterMode !== 'all') return null;

            return (
              <div style={{
                backgroundColor: 'rgba(22, 32, 50, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 14,
                padding: '20px',
                marginBottom: 24
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Layers size={17} color="#38bdf8" />
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                    SHARED PROPERTY & APPLICATION DETAILS
                  </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {visibleSharedFields.map(field => {
                    const state = fieldValues[field.id] || {
                      fieldId: field.id,
                      currentValue: null,
                      status: field.isSkipped ? 'skipped' : field.isRequired ? 'missing' : 'optional'
                    };
                    const isSkipped = state.status === 'skipped' || field.isSkipped;
                    const badge = getStatusBadge(state.status);

                    return (
                      <div
                        key={field.id}
                        style={{
                          backgroundColor: isSkipped ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.75)',
                          border: isSkipped
                            ? '1px dashed rgba(255, 255, 255, 0.1)'
                            : state.status === 'needs_review' 
                            ? '1px solid rgba(245, 158, 11, 0.4)' 
                            : state.status === 'missing' && field.isRequired
                            ? '1px solid rgba(239, 68, 68, 0.35)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: 8,
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: isSkipped ? '#94a3b8' : '#f8fafc',
                              textDecoration: isSkipped ? 'line-through' : 'none'
                            }}>
                              {field.label}
                            </span>
                            {field.isRequired && !isSkipped && (
                              <span style={{ fontSize: 10, color: '#f87171', fontWeight: 600 }}>*Required</span>
                            )}
                          </div>

                          <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            {isSkipped ? (
                              <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                                Skipped by user (will remain blank on form)
                              </span>
                            ) : state.currentValue ? (
                              <span style={{ fontSize: 13, color: '#38bdf8', fontWeight: 600 }}>
                                {String(state.currentValue)}
                              </span>
                            ) : (
                              <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                                No value extracted yet
                              </span>
                            )}

                            {!isSkipped && state.sourceDocName && (
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                • From: {state.sourceDocName} {state.sourcePage ? `(P.${state.sourcePage})` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '3px 7px',
                            borderRadius: 4,
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`
                          }}>
                            {badge.label}
                          </span>

                          {state.status === 'found' && (
                            <button
                              type="button"
                              onClick={() => onUpdateFieldValue(field.id, state.currentValue, true)}
                              style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                borderRadius: 6,
                                padding: '5px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Confirm
                            </button>
                          )}

                          {!isSkipped && (
                            <button
                              type="button"
                              onClick={() => setEditingField({ field, state })}
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                color: '#e2e8f0',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: 6,
                                padding: '5px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Edit3 size={11} />
                              {state.status === 'missing' ? 'Fill' : 'Edit'}
                            </button>
                          )}

                          {isSkipped ? (
                            <button
                              type="button"
                              onClick={() => handleUnskipField(field)}
                              style={{
                                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                color: '#38bdf8',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                borderRadius: 6,
                                padding: '5px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <RotateCcw size={11} /> Unskip
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSkipField(field.id)}
                              title="Skip this field and leave it blank on the form"
                              style={{
                                backgroundColor: 'rgba(100, 116, 139, 0.15)',
                                color: '#94a3b8',
                                border: '1px solid rgba(100, 116, 139, 0.25)',
                                borderRadius: 6,
                                padding: '5px 9px',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <MinusCircle size={11} /> Skip
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            marginTop: 10
          }}>
            <button
              type="button"
              onClick={onBackToDocuments}
              style={{
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                padding: '12px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ← Supporting Documents
            </button>

            <button
              type="button"
              onClick={onProceedToCheckAll}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '14px 28px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}
            >
              <ShieldCheck size={16} />
              VALIDATE & PROCEED TO FINISH
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal with direct Skip capability */}
      {editingField && (
        <FieldEditModal
          field={editingField.field}
          state={editingField.state}
          roleLabel={editingField.roleLabel}
          onSave={(fieldId, val, confirmed) => onUpdateFieldValue(fieldId, val, confirmed)}
          onSkip={(fieldId) => {
            handleSkipField(fieldId);
            setEditingField(null);
          }}
          onClose={() => setEditingField(null)}
          onRequestUploadDoc={() => setShowAddDocDrawer(true)}
        />
      )}
    </div>
  );
};
