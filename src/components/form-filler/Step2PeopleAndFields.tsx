// src/components/form-filler/Step2PeopleAndFields.tsx
'use client';

import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  Trash2, 
  HelpCircle, 
  FileCheck, 
  FileText,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  AnalyzedFormStructure, 
  FormPersonRole, 
  FormFieldDefinition 
} from '@/types/form-filler';

interface Step2PeopleAndFieldsProps {
  structure: AnalyzedFormStructure;
  fileName: string;
  onConfirmStructure: (updatedStructure: AnalyzedFormStructure) => void;
  onBackToUpload: () => void;
}

export const Step2PeopleAndFields: React.FC<Step2PeopleAndFieldsProps> = ({
  structure: initialStructure,
  fileName,
  onConfirmStructure,
  onBackToUpload
}) => {
  const [structure, setStructure] = useState<AnalyzedFormStructure>(initialStructure);
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'required' | 'optional'>('all');

  // Calculate field counts
  const totalCount = structure.sharedFields.length + 
    Object.values(structure.personFields).reduce((acc, f) => acc + f.length, 0);
  const requiredCount = structure.sharedFields.filter(f => f.isRequired).length + 
    Object.values(structure.personFields).reduce((acc, f) => acc + f.filter(x => x.isRequired).length, 0);
  const optionalCount = totalCount - requiredCount;

  const visibleSharedFields = structure.sharedFields.filter(f => {
    if (filterMode === 'required') return f.isRequired;
    if (filterMode === 'optional') return !f.isRequired;
    return true;
  });

  // Edit role label
  const handleRoleLabelChange = (roleId: string, newLabel: string) => {
    setStructure(prev => ({
      ...prev,
      peopleRoles: prev.peopleRoles.map(r => r.id === roleId ? { ...r, label: newLabel } : r)
    }));
  };

  // Add person role
  const handleAddRole = () => {
    if (!newRoleLabel.trim()) return;
    const newId = `person_${Date.now()}`;
    const newRole: FormPersonRole = {
      id: newId,
      label: newRoleLabel.trim(),
      isOptional: true
    };

    setStructure(prev => ({
      ...prev,
      peopleRoles: [...prev.peopleRoles, newRole],
      personFields: {
        ...prev.personFields,
        [newId]: [
          { id: `${newId}_full_name`, label: 'Full Legal Name', personRoleId: newId, type: 'text', isRequired: true },
          { id: `${newId}_dob`, label: 'Date of Birth', personRoleId: newId, type: 'date', isRequired: true },
          { id: `${newId}_phone`, label: 'Contact Phone', personRoleId: newId, type: 'phone', isRequired: true },
          { id: `${newId}_email`, label: 'Email Address', personRoleId: newId, type: 'email', isRequired: true },
          { id: `${newId}_address`, label: 'Residential Address', personRoleId: newId, type: 'text', isRequired: true }
        ]
      }
    }));
    setNewRoleLabel('');
    setShowAddRole(false);
  };

  // Remove person role
  const handleRemoveRole = (roleId: string) => {
    if (structure.peopleRoles.length <= 1) return;
    setStructure(prev => {
      const nextPersonFields = { ...prev.personFields };
      delete nextPersonFields[roleId];
      return {
        ...prev,
        peopleRoles: prev.peopleRoles.filter(r => r.id !== roleId),
        personFields: nextPersonFields
      };
    });
  };

  return (
    <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 20px' }}>
      {/* Banner / Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
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
          marginBottom: 16,
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}>
          <CheckCircle2 size={14} /> Step 2 of 6 • Form Scanned Successfully
        </div>

        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#f8fafc',
          marginBottom: 10,
          letterSpacing: '-0.02em'
        }}>
          We’ve scanned your form. Here’s the information we need.
        </h1>
        <p style={{
          fontSize: 16,
          color: '#94a3b8',
          maxWidth: 680,
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          Form: <strong style={{ color: '#f8fafc' }}>{structure.formName}</strong> ({fileName}) • {structure.pageCount} page(s)
          {structure.isInteractiveAcroForm ? ' • Interactive AcroForm Detected' : ' • Flat PDF (Visual Placement)'}
        </p>
      </div>

      {/* People & Roles Section */}
      <div style={{
        backgroundColor: 'rgba(22, 32, 50, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 14,
        padding: '24px',
        marginBottom: 24
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="#38bdf8" />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
                Detected People & Roles ({structure.peopleRoles.length})
              </h2>
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              The form determines who needs to be included. You can adjust the terminology if needed.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddRole(!showAddRole)}
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <Plus size={14} /> Add Another Applicant / Person
          </button>
        </div>

        {showAddRole && (
          <div style={{
            display: 'flex',
            gap: 10,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            border: '1px solid rgba(56, 189, 248, 0.2)'
          }}>
            <input
              type="text"
              placeholder="e.g. Guarantor, Tenant 3, Co-Borrower"
              value={newRoleLabel}
              onChange={e => setNewRoleLabel(e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 6,
                padding: '8px 12px',
                color: '#f8fafc',
                fontSize: 13
              }}
            />
            <button
              type="button"
              onClick={handleAddRole}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Add Person
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {structure.peopleRoles.map((role, idx) => (
            <div
              key={role.id}
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(37, 99, 235, 0.2)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700
                }}>
                  {idx + 1}
                </div>
                <input
                  type="text"
                  value={role.label}
                  onChange={e => handleRoleLabelChange(role.id, e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid transparent',
                    color: '#f8fafc',
                    fontSize: 14,
                    fontWeight: 600,
                    width: '100%',
                    padding: '2px 4px',
                    borderRadius: 4
                  }}
                  onFocus={e => e.target.style.border = '1px solid rgba(56, 189, 248, 0.4)'}
                  onBlur={e => e.target.style.border = '1px solid transparent'}
                  title="Click to edit role label"
                />
              </div>

              {structure.peopleRoles.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveRole(role.id)}
                  title="Remove this person role"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 4
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Checklist Preview */}
      <div style={{
        backgroundColor: 'rgba(22, 32, 50, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 14,
        padding: '24px',
        marginBottom: 32
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileCheck size={18} color="#10b981" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
              Dynamic Form Checklist ({requiredCount} Required • {optionalCount} Optional)
            </h2>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 6, backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: 4, borderRadius: 20 }}>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              style={{
                backgroundColor: filterMode === 'all' ? '#2563eb' : 'transparent',
                color: filterMode === 'all' ? '#ffffff' : '#94a3b8',
                border: 'none',
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
                backgroundColor: filterMode === 'required' ? '#ef4444' : 'transparent',
                color: filterMode === 'required' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: 16,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Required Only ({requiredCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('optional')}
              style={{
                backgroundColor: filterMode === 'optional' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: filterMode === 'optional' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: 16,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Optional ({optionalCount})
            </button>
          </div>
        </div>

        {/* 1. Shared Fields */}
        {visibleSharedFields.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#38bdf8',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} /> Shared Property & Listing Details ({structure.sharedFields.length})
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                {structure.sharedFields.filter(f => f.isRequired).length} Required • {structure.sharedFields.filter(f => !f.isRequired).length} Optional
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
              {visibleSharedFields.map(field => (
                <div
                  key={field.id}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 13,
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                    {field.label}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 4,
                    flexShrink: 0,
                    backgroundColor: field.isRequired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                    color: field.isRequired ? '#f87171' : '#94a3b8'
                  }}>
                    {field.isRequired ? 'Required' : 'Optional'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Individual People Fields */}
        {structure.peopleRoles.map(role => {
          const fields = structure.personFields[role.id] || [];
          const reqInRole = fields.filter(f => f.isRequired).length;
          const optInRole = fields.length - reqInRole;
          const visibleFields = fields.filter(f => {
            if (filterMode === 'required') return f.isRequired;
            if (filterMode === 'optional') return !f.isRequired;
            return true;
          });

          if (visibleFields.length === 0 && filterMode !== 'all') return null;

          return (
            <div key={role.id} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: role.isOptional ? '#94a3b8' : '#60a5fa',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} /> {role.label.toUpperCase()} {role.isOptional ? '(OPTIONAL CO-APPLICANT)' : ''}
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                  {reqInRole} Required • {optInRole} Optional
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
                {visibleFields.map(field => (
                  <div
                    key={field.id}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      fontSize: 13,
                      color: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                      {field.label}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: 4,
                      flexShrink: 0,
                      backgroundColor: field.isRequired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                      color: field.isRequired ? '#f87171' : '#94a3b8'
                    }}>
                      {field.isRequired ? 'Required' : 'Optional'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Signatures & Declarations Notice */}
        {structure.signatureFields.length > 0 && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10
          }}>
            <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 13, color: '#fef3c7' }}>
              <strong>Signature & Declaration Safeguard:</strong> {structure.signatureFields.length} signature/declaration area(s) detected. As required by law and ethical guidelines, these will be left blank for personal physical or digital signing upon download.
            </div>
          </div>
        )}
      </div>

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
          onClick={onBackToUpload}
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
          ← Choose Different Form
        </button>

        <button
          type="button"
          onClick={() => onConfirmStructure(structure)}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '14px 28px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
          }}
        >
          CONTINUE TO UPLOAD SUPPORTING DOCUMENTS
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
