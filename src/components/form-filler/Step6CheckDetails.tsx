// src/components/form-filler/Step6CheckDetails.tsx
'use client';

import React, { useMemo } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Edit3, 
  UploadCloud, 
  FileCheck,
  Users,
  Layers,
  Sparkles,
  MinusCircle,
  FileText
} from 'lucide-react';
import { 
  AnalyzedFormStructure, 
  FormFieldValueState, 
  FormValidationSummary,
  FormFieldDefinition
} from '@/types/form-filler';
import { FormValidator } from '@/lib/form-validator';

interface Step6CheckDetailsProps {
  formStructure: AnalyzedFormStructure;
  fieldValues: Record<string, FormFieldValueState>;
  onProceedToGenerate: () => void;
  onBackToReview: () => void;
  onEditField: (field: FormFieldDefinition, roleLabel?: string) => void;
  onSkipField?: (fieldId: string) => void;
  onUploadMoreDocs: () => void;
}

export const Step6CheckDetails: React.FC<Step6CheckDetailsProps> = ({
  formStructure,
  fieldValues,
  onProceedToGenerate,
  onBackToReview,
  onEditField,
  onSkipField,
  onUploadMoreDocs
}) => {
  const summary: FormValidationSummary = useMemo(() => {
    return FormValidator.validate(formStructure, fieldValues);
  }, [formStructure, fieldValues]);

  return (
    <div style={{ maxWidth: 880, margin: '40px auto', padding: '0 20px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: summary.isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          color: summary.isValid ? '#10b981' : '#f59e0b',
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 16,
          border: `1px solid ${summary.isValid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`
        }}>
          <ShieldCheck size={14} /> Step 6 of 6 • Form Completeness Validation
        </div>

        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#f8fafc',
          marginBottom: 12,
          letterSpacing: '-0.02em'
        }}>
          Validation & Readiness Check
        </h1>

        <p style={{
          fontSize: 16,
          color: '#94a3b8',
          maxWidth: 640,
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          Review form readiness before generating. Any remaining missing fields can either be filled manually or skipped to leave them blank.
        </p>
      </div>

      {/* Big Status Banner */}
      {summary.isValid ? (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 14,
          padding: '24px 28px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: '#10b981',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={28} />
          </div>

          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>
              All selected information is ready. You can now generate your completed form.
            </h3>
            <p style={{ fontSize: 13, color: '#d1fae5', marginTop: 4 }}>
              Total {summary.totalConfirmed} of {summary.totalRequired} active required fields satisfied across {formStructure.peopleRoles.length} applicant(s) and shared sections
              {summary.totalSkipped > 0 ? ` (${summary.totalSkipped} fields skipped by choice)` : ''}.
            </p>
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 14,
          padding: '24px 28px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: '#f59e0b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={28} />
          </div>

          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>
              Some required details still need your attention
            </h3>
            <p style={{ fontSize: 13, color: '#fef3c7', marginTop: 4 }}>
              {summary.totalConfirmed} of {summary.totalRequired} required fields confirmed. Fill in remaining details, upload more documents, or click <strong>Skip Field</strong> to leave them blank.
            </p>
          </div>
        </div>
      )}

      {/* Progress Cards per Person & Shared */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
        {summary.personStats.map(stat => (
          <div
            key={stat.roleId}
            style={{
              backgroundColor: 'rgba(22, 32, 50, 0.7)',
              border: stat.isComplete ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 12,
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} color={stat.isComplete ? '#34d399' : '#fbbf24'} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                  {stat.roleLabel}
                </span>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: stat.isComplete ? '#34d399' : '#fbbf24'
              }}>
                {stat.isComplete ? 'READY' : 'INCOMPLETE'}
              </span>
            </div>

            <div style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>
              {stat.confirmedRequired} <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>of {stat.totalRequired} required</span>
            </div>

            {stat.skippedCount > 0 && (
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MinusCircle size={12} /> {stat.skippedCount} skipped by choice
              </div>
            )}

            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 3,
              overflow: 'hidden',
              marginBottom: 12
            }}>
              <div style={{
                width: `${stat.totalRequired > 0 ? (stat.confirmedRequired / stat.totalRequired) * 100 : 100}%`,
                height: '100%',
                backgroundColor: stat.isComplete ? '#10b981' : '#f59e0b',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* List missing fields */}
            {stat.missingFields.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#f87171' }}>
                <strong>Missing:</strong> {stat.missingFields.map(f => f.label).join(', ')}
              </div>
            )}

            {stat.conflictingFields.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#fbbf24' }}>
                <strong>Conflicts:</strong> {stat.conflictingFields.map(f => f.label).join(', ')}
              </div>
            )}
          </div>
        ))}

        {/* Shared Details Stat Card */}
        {summary.sharedStats.totalRequired > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(22, 32, 50, 0.7)',
              border: summary.sharedStats.isComplete ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 12,
              padding: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={16} color={summary.sharedStats.isComplete ? '#34d399' : '#fbbf24'} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                  Shared Details
                </span>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: summary.sharedStats.isComplete ? '#34d399' : '#fbbf24'
              }}>
                {summary.sharedStats.isComplete ? 'READY' : 'INCOMPLETE'}
              </span>
            </div>

            <div style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>
              {summary.sharedStats.confirmedRequired} <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>of {summary.sharedStats.totalRequired} required</span>
            </div>

            {summary.sharedStats.skippedCount > 0 && (
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MinusCircle size={12} /> {summary.sharedStats.skippedCount} skipped by choice
              </div>
            )}

            <div style={{
              width: '100%',
              height: 6,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 3,
              overflow: 'hidden',
              marginBottom: 12
            }}>
              <div style={{
                width: `${summary.sharedStats.totalRequired > 0 ? (summary.sharedStats.confirmedRequired / summary.sharedStats.totalRequired) * 100 : 100}%`,
                height: '100%',
                backgroundColor: summary.sharedStats.isComplete ? '#10b981' : '#f59e0b',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {summary.sharedStats.missingFields.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#f87171' }}>
                <strong>Missing:</strong> {summary.sharedStats.missingFields.map(f => f.label).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Outstanding Items Action Box (if incomplete) */}
      {!summary.isValid && (
        <div style={{
          backgroundColor: 'rgba(22, 32, 50, 0.65)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 32
        }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
            Resolve Remaining Items:
          </h4>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14 }}>
            Click <strong>Fill</strong> to provide a value or <strong>Skip</strong> to leave it blank without guessing.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Person Missing Fields */}
            {summary.personStats.flatMap(p => p.missingFields.map(f => ({ field: f, role: p.roleLabel }))).map(({ field, role }) => (
              <div
                key={field.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: 8,
                  flexWrap: 'wrap',
                  gap: 10
                }}
              >
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>{role}</span>
                  <span style={{ fontSize: 13, color: '#f8fafc', marginLeft: 8, fontWeight: 600 }}>{field.label}</span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => onEditField(field, role)}
                    style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: 6,
                      padding: '5px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Edit3 size={12} /> Fill Value
                  </button>

                  {onSkipField && (
                    <button
                      type="button"
                      onClick={() => onSkipField(field.id)}
                      style={{
                        backgroundColor: 'rgba(100, 116, 139, 0.15)',
                        border: '1px solid rgba(100, 116, 139, 0.3)',
                        color: '#94a3b8',
                        borderRadius: 6,
                        padding: '5px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <MinusCircle size={12} /> Skip (Leave Blank)
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Shared Missing Fields */}
            {summary.sharedStats.missingFields.map(field => (
              <div
                key={field.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: 8,
                  flexWrap: 'wrap',
                  gap: 10
                }}
              >
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>Shared</span>
                  <span style={{ fontSize: 13, color: '#f8fafc', marginLeft: 8, fontWeight: 600 }}>{field.label}</span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => onEditField(field, 'Shared')}
                    style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      borderRadius: 6,
                      padding: '5px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Edit3 size={12} /> Fill Value
                  </button>

                  {onSkipField && (
                    <button
                      type="button"
                      onClick={() => onSkipField(field.id)}
                      style={{
                        backgroundColor: 'rgba(100, 116, 139, 0.15)',
                        border: '1px solid rgba(100, 116, 139, 0.3)',
                        color: '#94a3b8',
                        borderRadius: 6,
                        padding: '5px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <MinusCircle size={12} /> Skip (Leave Blank)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          onClick={onBackToReview}
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
          ← Back to Review Checklist
        </button>

        <button
          type="button"
          onClick={onProceedToGenerate}
          disabled={!summary.isValid}
          style={{
            backgroundColor: summary.isValid ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '14px 32px',
            fontSize: 15,
            fontWeight: 700,
            cursor: summary.isValid ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: summary.isValid ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none'
          }}
        >
          GENERATE COMPLETED PDF
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
