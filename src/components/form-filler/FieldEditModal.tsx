// src/components/form-filler/FieldEditModal.tsx
'use client';

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  AlertTriangle, 
  FileText, 
  UploadCloud, 
  Edit3, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';
import { 
  FormFieldDefinition, 
  FormFieldValueState, 
  FieldConflictOption 
} from '@/types/form-filler';

interface FieldEditModalProps {
  field: FormFieldDefinition;
  state: FormFieldValueState;
  roleLabel?: string;
  onSave: (fieldId: string, value: any, confirmed: boolean) => void;
  onClose: () => void;
  onRequestUploadDoc: () => void;
}

export const FieldEditModal: React.FC<FieldEditModalProps> = ({
  field,
  state,
  roleLabel,
  onSave,
  onClose,
  onRequestUploadDoc
}) => {
  const [val, setVal] = useState(state.currentValue || '');
  const [selectedConflictIndex, setSelectedConflictIndex] = useState<number | null>(null);

  const handlePickConflict = (opt: FieldConflictOption, idx: number) => {
    setVal(opt.value);
    setSelectedConflictIndex(idx);
  };

  const handleConfirm = () => {
    onSave(field.id, val, true);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 20
    }}>
      <div style={{
        backgroundColor: '#162032',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 580,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase' }}>
              {roleLabel || 'Shared Details'} • {field.isRequired ? 'Required Field' : 'Optional Field'}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
              {field.label}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Conflicting options picker if conflicting */}
          {state.conflicts && state.conflicts.length > 1 && (
            <div style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 10,
              padding: 16,
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={18} color="#f59e0b" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>
                  Conflicting Values Found Between Documents
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#fef3c7', marginBottom: 12 }}>
                Multiple uploaded documents provide different values for this field. Select the correct one or enter a manual value below:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {state.conflicts.map((c, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePickConflict(c, idx)}
                    style={{
                      backgroundColor: val === c.value ? 'rgba(37, 99, 235, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                      border: val === c.value ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>
                        {c.value}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        Source: {c.sourceDocName} {c.sourcePage ? `(Page ${c.sourcePage})` : ''}
                      </div>
                    </div>

                    {val === c.value && (
                      <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700 }}>
                        SELECTED
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Source Evidence (if found) */}
          {state.sourceDocName && (
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 18,
              fontSize: 12,
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <FileText size={16} color="#38bdf8" />
              <div>
                Extracted from: <strong style={{ color: '#f8fafc' }}>{state.sourceDocName}</strong>
                {state.sourcePage ? ` (Page ${state.sourcePage})` : ''}
                {state.evidenceText ? ` • "${state.evidenceText}"` : ''}
              </div>
            </div>
          )}

          {/* Value Input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
              Field Value:
            </label>
            <input
              type={field.type === 'date' ? 'date' : 'text'}
              value={val}
              onChange={e => setVal(e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              style={{
                width: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                padding: '12px 14px',
                color: '#f8fafc',
                fontSize: 15,
                outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = '#38bdf8'}
              onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
            />
          </div>

          {/* Action Row for Missing / Additional Docs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestUploadDoc();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
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

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Check size={16} /> Confirm & Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
