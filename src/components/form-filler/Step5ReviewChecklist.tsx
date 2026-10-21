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
  Plus
} from 'lucide-react';
import { 
  AnalyzedFormStructure, 
  FormFieldDefinition, 
  FormFieldValueState, 
  FieldStatus,
  UploadedSupportingDoc
} from '@/types/form-filler';
import { FieldEditModal } from './FieldEditModal';

interface Step5ReviewChecklistProps {
  formStructure: AnalyzedFormStructure;
  fieldValues: Record<string, FormFieldValueState>;
  onUpdateFieldValue: (fieldId: string, value: any, confirmed?: boolean) => void;
  onBatchConfirmFound: () => void;
  onUploadAdditionalDoc: (files: File[]) => void;
  onProceedToCheckAll: () => void;
  onBackToDocuments: () => void;
}

export const Step5ReviewChecklist: React.FC<Step5ReviewChecklistProps> = ({
  formStructure,
  fieldValues,
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
  const [filterMode, setFilterMode] = useState<'all' | 'required' | 'attention'>('all');

  // Compute field statistics
  const allFormFields = [
    ...formStructure.sharedFields,
    ...Object.values(formStructure.personFields).flat()
  ];
  const totalCount = allFormFields.length;
  const requiredCount = allFormFields.filter(f => f.isRequired).length;
  const attentionCount = allFormFields.filter(f => {
    const s = fieldValues[f.id];
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
          label: 'Found — Ready for review'
        };
      case 'needs_review':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: 'rgba(245, 158, 11, 0.3)',
          label: 'Needs Review (Conflict/Unclear)'
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

  return (
    <div style={{ maxWidth: 1040, margin: '40px auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
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
            marginBottom: 10,
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <CheckCircle2 size={14} /> Step 5 of 6 • Review Checklist
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Review Extracted Information
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
            Review information grouped by applicant and shared fields. Every field can be reviewed, edited, or confirmed.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowAddDocDrawer(true)}
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <UploadCloud size={16} /> Upload Another Document
          </button>

          <button
            type="button"
            onClick={onBatchConfirmFound}
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Check size={16} /> Confirm All Found Values
          </button>
        </div>
      </div>

      {/* Upload Additional Doc Drawer / Notification */}
      {showAddDocDrawer && (
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
              Upload an additional document without restarting
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              Upload any extra PDF (e.g. missing payslip, secondary ID, council rates) to automatically populate remaining missing fields.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              <UploadCloud size={16} />
              Select PDF File
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
                padding: '10px 14px',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(22, 32, 50, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: '12px 18px',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          Filter Review List:
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            style={{
              backgroundColor: filterMode === 'all' ? '#2563eb' : 'rgba(15, 23, 42, 0.6)',
              color: filterMode === 'all' ? '#ffffff' : '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            All Fields ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('required')}
            style={{
              backgroundColor: filterMode === 'required' ? '#ef4444' : 'rgba(15, 23, 42, 0.6)',
              color: filterMode === 'required' ? '#ffffff' : '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Required Only ({requiredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('attention')}
            style={{
              backgroundColor: filterMode === 'attention' ? '#f59e0b' : 'rgba(15, 23, 42, 0.6)',
              color: filterMode === 'attention' ? '#ffffff' : '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Needs Attention ({attentionCount})
          </button>
        </div>
      </div>

      {/* SECTION 1: PEOPLE / APPLICANT DETAILS */}
      {formStructure.peopleRoles.map(role => {
        const fields = formStructure.personFields[role.id] || [];
        const visibleFields = fields.filter(field => {
          const state = fieldValues[field.id];
          if (filterMode === 'required') return field.isRequired;
          if (filterMode === 'attention') {
            return state?.status === 'needs_review' || (field.isRequired && (!state || state.status === 'missing' || !state.currentValue));
          }
          return true;
        });

        if (visibleFields.length === 0 && filterMode !== 'all') return null;

        return (
          <div
            key={role.id}
            style={{
              backgroundColor: 'rgba(22, 32, 50, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 14,
              padding: '24px',
              marginBottom: 24
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Users size={18} color="#60a5fa" />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
                {role.label.toUpperCase()}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibleFields.map(field => {
                const state = fieldValues[field.id] || {
                  fieldId: field.id,
                  currentValue: null,
                  status: field.isRequired ? 'missing' : 'optional'
                };
                const badge = getStatusBadge(state.status);

                return (
                  <div
                    key={field.id}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      border: state.status === 'needs_review' 
                        ? '1px solid rgba(245, 158, 11, 0.4)' 
                        : state.status === 'missing' && field.isRequired
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 10,
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>
                          {field.label}
                        </span>
                        {field.isRequired && (
                          <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>*Required</span>
                        )}
                      </div>

                      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {state.currentValue ? (
                          <span style={{ fontSize: 14, color: '#38bdf8', fontWeight: 600 }}>
                            {String(state.currentValue)}
                          </span>
                        ) : (
                          <span style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>
                            No value provided yet
                          </span>
                        )}

                        {state.sourceDocName && (
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>
                            • From: {state.sourceDocName} {state.sourcePage ? `(P.${state.sourcePage})` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: 6,
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}>
                        {badge.label}
                      </span>

                      {/* Action buttons */}
                      {state.status === 'found' && (
                        <button
                          type="button"
                          onClick={() => onUpdateFieldValue(field.id, state.currentValue, true)}
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Confirm
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingField({ field, state, roleLabel: role.label })}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          color: '#e2e8f0',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Edit3 size={12} />
                        {state.status === 'missing' ? 'Fill Manually' : 'Edit / Review'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* SECTION 2: SHARED APPLICATION DETAILS */}
      {(() => {
        const visibleSharedFields = formStructure.sharedFields.filter(field => {
          const state = fieldValues[field.id];
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
            padding: '24px',
            marginBottom: 32
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Layers size={18} color="#38bdf8" />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
                SHARED PROPERTY & LISTING DETAILS
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibleSharedFields.map(field => {
                const state = fieldValues[field.id] || {
                  fieldId: field.id,
                  currentValue: null,
                  status: field.isRequired ? 'missing' : 'optional'
                };
                const badge = getStatusBadge(state.status);

              return (
                <div
                  key={field.id}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: state.status === 'needs_review' 
                      ? '1px solid rgba(245, 158, 11, 0.4)' 
                      : state.status === 'missing' && field.isRequired
                      ? '1px solid rgba(239, 68, 68, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 10,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>
                        {field.label}
                      </span>
                      {field.isRequired && (
                        <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>*Required</span>
                      )}
                    </div>

                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {state.currentValue ? (
                        <span style={{ fontSize: 14, color: '#38bdf8', fontWeight: 600 }}>
                          {String(state.currentValue)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>
                          No value provided yet
                        </span>
                      )}

                      {state.sourceDocName && (
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          • From: {state.sourceDocName} {state.sourcePage ? `(P.${state.sourcePage})` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: 6,
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
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Confirm
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingField({ field, state, roleLabel: 'Shared Details' })}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        color: '#e2e8f0',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Edit3 size={12} />
                      {state.status === 'missing' ? 'Fill Manually' : 'Edit / Review'}
                    </button>
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
        gap: 16
      }}>
        <button
          type="button"
          onClick={onBackToDocuments}
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
          ← Upload More Documents
        </button>

        <button
          type="button"
          onClick={onProceedToCheckAll}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '14px 32px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
          }}
        >
          <ShieldCheck size={18} />
          CHECK ALL DETAILS
        </button>
      </div>

      {/* Edit Modal */}
      {editingField && (
        <FieldEditModal
          field={editingField.field}
          state={editingField.state}
          roleLabel={editingField.roleLabel}
          onSave={(fieldId, val, confirmed) => onUpdateFieldValue(fieldId, val, confirmed)}
          onClose={() => setEditingField(null)}
          onRequestUploadDoc={() => setShowAddDocDrawer(true)}
        />
      )}
    </div>
  );
};
