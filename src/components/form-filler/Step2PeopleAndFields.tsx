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
  ChevronUp,
  Columns,
  Eye,
  CheckSquare,
  Square,
  MinusCircle
} from 'lucide-react';
import { 
  AnalyzedFormStructure, 
  FormPersonRole, 
  FormFieldDefinition 
} from '@/types/form-filler';
import { FormPdfViewer } from './FormPdfViewer';

interface Step2PeopleAndFieldsProps {
  structure: AnalyzedFormStructure;
  fileName: string;
  originalPdfBase64?: string;
  onConfirmStructure: (updatedStructure: AnalyzedFormStructure) => void;
  onBackToUpload: () => void;
}

export const Step2PeopleAndFields: React.FC<Step2PeopleAndFieldsProps> = ({
  structure: initialStructure,
  fileName,
  originalPdfBase64,
  onConfirmStructure,
  onBackToUpload
}) => {
  const [structure, setStructure] = useState<AnalyzedFormStructure>(initialStructure);
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'required' | 'optional' | 'skipped'>('all');
  const [viewMode, setViewMode] = useState<'split' | 'fields'>(originalPdfBase64 ? 'split' : 'fields');

  // Compute stats
  const allFields: FormFieldDefinition[] = [
    ...structure.sharedFields,
    ...Object.values(structure.personFields).flat()
  ];
  const totalCount = allFields.length;
  const skippedCount = allFields.filter(f => f.isSkipped).length;
  const activeCount = totalCount - skippedCount;
  const requiredCount = allFields.filter(f => f.isRequired && !f.isSkipped).length;
  const optionalCount = allFields.filter(f => !f.isRequired && !f.isSkipped).length;

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
          { id: `${newId}_full_name`, label: 'Full Legal Name', personRoleId: newId, type: 'text', isRequired: true, isSelected: true },
          { id: `${newId}_dob`, label: 'Date of Birth', personRoleId: newId, type: 'date', isRequired: true, isSelected: true },
          { id: `${newId}_phone`, label: 'Contact Phone', personRoleId: newId, type: 'phone', isRequired: true, isSelected: true },
          { id: `${newId}_email`, label: 'Email Address', personRoleId: newId, type: 'email', isRequired: true, isSelected: true },
          { id: `${newId}_address`, label: 'Residential Address', personRoleId: newId, type: 'text', isRequired: true, isSelected: true }
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

  // Toggle field selection (Included vs Skipped)
  const handleToggleField = (fieldId: string) => {
    setStructure(prev => {
      // Check in shared fields
      const sIdx = prev.sharedFields.findIndex(f => f.id === fieldId);
      if (sIdx !== -1) {
        const nextShared = [...prev.sharedFields];
        const current = nextShared[sIdx];
        const nextSkipped = !current.isSkipped;
        nextShared[sIdx] = {
          ...current,
          isSkipped: nextSkipped,
          isSelected: !nextSkipped
        };
        return { ...prev, sharedFields: nextShared };
      }

      // Check in person fields
      const nextPersonFields = { ...prev.personFields };
      for (const roleId of Object.keys(nextPersonFields)) {
        const pIdx = nextPersonFields[roleId].findIndex(f => f.id === fieldId);
        if (pIdx !== -1) {
          const list = [...nextPersonFields[roleId]];
          const current = list[pIdx];
          const nextSkipped = !current.isSkipped;
          list[pIdx] = {
            ...current,
            isSkipped: nextSkipped,
            isSelected: !nextSkipped
          };
          nextPersonFields[roleId] = list;
          return { ...prev, personFields: nextPersonFields };
        }
      }
      return prev;
    });
  };

  // Bulk actions
  const handleSelectAll = (select: boolean) => {
    setStructure(prev => ({
      ...prev,
      sharedFields: prev.sharedFields.map(f => ({ ...f, isSkipped: !select, isSelected: select })),
      personFields: Object.fromEntries(
        Object.entries(prev.personFields).map(([roleId, fields]) => [
          roleId,
          fields.map(f => ({ ...f, isSkipped: !select, isSelected: select }))
        ])
      )
    }));
  };

  const handleSelectRequiredOnly = () => {
    setStructure(prev => ({
      ...prev,
      sharedFields: prev.sharedFields.map(f => ({ ...f, isSkipped: !f.isRequired, isSelected: f.isRequired })),
      personFields: Object.fromEntries(
        Object.entries(prev.personFields).map(([roleId, fields]) => [
          roleId,
          fields.map(f => ({ ...f, isSkipped: !f.isRequired, isSelected: f.isRequired }))
        ])
      )
    }));
  };

  const filterField = (f: FormFieldDefinition) => {
    if (filterMode === 'skipped') return !!f.isSkipped;
    if (f.isSkipped) return false;
    if (filterMode === 'required') return f.isRequired;
    if (filterMode === 'optional') return !f.isRequired;
    return true;
  };

  const visibleSharedFields = structure.sharedFields.filter(filterField);

  return (
    <div style={{ maxWidth: viewMode === 'split' ? 1440 : 1000, margin: '30px auto', padding: '0 24px' }}>
      {/* Banner / Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
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
          marginBottom: 12,
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}>
          <CheckCircle2 size={14} /> Step 2 of 6 • Form Scanned & Ready for Customization
        </div>

        <h1 style={{
          fontSize: 30,
          fontWeight: 700,
          color: '#f8fafc',
          marginBottom: 8,
          letterSpacing: '-0.02em'
        }}>
          Choose What to Fill & Confirm Applicants
        </h1>
        <p style={{
          fontSize: 15,
          color: '#94a3b8',
          maxWidth: 720,
          margin: '0 auto',
          lineHeight: 1.5
        }}>
          View your uploaded document on the left and select which fields you want filled. Click any field to toggle it on or skip it according to your client’s needs.
        </p>

        {/* View Layout Toggle Bar */}
        {originalPdfBase64 && (
          <div style={{ display: 'inline-flex', gap: 8, marginTop: 16 }}>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'split' ? 'fields' : 'split')}
              style={{
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                borderRadius: 20,
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Columns size={14} />
              {viewMode === 'split' ? 'Switch to Full Checklist View' : 'Show Uploaded Document Side-by-Side'}
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Split (Document + Fields) or Single Column */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: viewMode === 'split' ? 'minmax(420px, 1fr) minmax(480px, 1.25fr)' : '1fr',
        gap: 24,
        alignItems: 'start'
      }}>
        {/* Left Column: Embedded Document Preview (in split mode) */}
        {viewMode === 'split' && originalPdfBase64 && (
          <div style={{ position: 'sticky', top: 20 }}>
            <FormPdfViewer
              pdfBase64={originalPdfBase64}
              formName={structure.formName}
              title="Uploaded Original Form"
              subtitle="Reference this document while selecting fields"
              height="740px"
            />
          </div>
        )}

        {/* Right Column: Roles & Selectable Field Checklist */}
        <div>
          {/* People & Roles Section */}
          <div style={{
            backgroundColor: 'rgba(22, 32, 50, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 14,
            padding: '20px',
            marginBottom: 20
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} color="#38bdf8" />
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc' }}>
                    Applicants & Roles ({structure.peopleRoles.length})
                  </h2>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  Customize role names or add additional co-applicants/guarantors.
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
                <Plus size={14} /> Add Applicant
              </button>
            </div>

            {showAddRole && (
              <div style={{
                display: 'flex',
                gap: 10,
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                padding: 10,
                borderRadius: 8,
                marginBottom: 14,
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              {structure.peopleRoles.map((role, idx) => (
                <div
                  key={role.id}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(37, 99, 235, 0.2)',
                      color: '#60a5fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
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
                        fontSize: 13,
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
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Field Selection Checklist */}
          <div style={{
            backgroundColor: 'rgba(22, 32, 50, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 14,
            padding: '20px',
            marginBottom: 24
          }}>
            {/* Top Toolbar: Counters & Quick Select Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: 16
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileCheck size={18} color="#10b981" />
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f8fafc' }}>
                    Select Fields to Fill ({activeCount} Selected • {skippedCount} Skipped)
                  </h2>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  Click any field to toggle it on or off. Skipped fields will be left cleanly blank.
                </p>
              </div>

              {/* Quick Select Buttons */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    color: '#38bdf8',
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
                  <CheckSquare size={13} /> Select All
                </button>
                <button
                  type="button"
                  onClick={handleSelectRequiredOnly}
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#f87171',
                    borderRadius: 6,
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Required Only
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  style={{
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: '#94a3b8',
                    borderRadius: 6,
                    padding: '5px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
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
                Required to Fill ({requiredCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('optional')}
                style={{
                  backgroundColor: filterMode === 'optional' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                  color: filterMode === 'optional' ? '#ffffff' : '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Optional ({optionalCount})
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

            {/* Shared Fields Section */}
            {visibleSharedFields.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#38bdf8',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={14} /> Shared Property & Listing Details
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {structure.sharedFields.filter(f => !f.isSkipped).length} to fill
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
                  {visibleSharedFields.map(field => {
                    const isSkipped = !!field.isSkipped;
                    return (
                      <div
                        key={field.id}
                        onClick={() => handleToggleField(field.id)}
                        style={{
                          backgroundColor: isSkipped ? 'rgba(15, 23, 42, 0.35)' : 'rgba(15, 23, 42, 0.75)',
                          border: isSkipped ? '1px dashed rgba(255, 255, 255, 0.1)' : '1px solid rgba(56, 189, 248, 0.25)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          fontSize: 13,
                          color: isSkipped ? '#64748b' : '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                          <input
                            type="checkbox"
                            checked={!isSkipped}
                            onChange={() => {}} // Handled by container onClick
                            style={{ cursor: 'pointer', accentColor: '#2563eb' }}
                          />
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            textDecoration: isSkipped ? 'line-through' : 'none'
                          }}>
                            {field.label}
                          </span>
                        </div>

                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 4,
                          flexShrink: 0,
                          marginLeft: 6,
                          backgroundColor: isSkipped 
                            ? 'rgba(100, 116, 139, 0.2)' 
                            : field.isRequired 
                            ? 'rgba(239, 68, 68, 0.15)' 
                            : 'rgba(56, 189, 248, 0.12)',
                          color: isSkipped ? '#94a3b8' : field.isRequired ? '#f87171' : '#38bdf8'
                        }}>
                          {isSkipped ? 'Skipped' : field.isRequired ? 'Required' : 'Optional'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Individual Applicant Fields */}
            {structure.peopleRoles.map(role => {
              const fields = structure.personFields[role.id] || [];
              const visibleFields = fields.filter(filterField);

              if (visibleFields.length === 0 && filterMode !== 'all') return null;

              return (
                <div key={role.id} style={{ marginBottom: 18 }}>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#60a5fa',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={14} /> {role.label.toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {fields.filter(f => !f.isSkipped).length} to fill
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8 }}>
                    {visibleFields.map(field => {
                      const isSkipped = !!field.isSkipped;
                      return (
                        <div
                          key={field.id}
                          onClick={() => handleToggleField(field.id)}
                          style={{
                            backgroundColor: isSkipped ? 'rgba(15, 23, 42, 0.35)' : 'rgba(15, 23, 42, 0.75)',
                            border: isSkipped ? '1px dashed rgba(255, 255, 255, 0.1)' : '1px solid rgba(56, 189, 248, 0.25)',
                            borderRadius: 8,
                            padding: '10px 12px',
                            fontSize: 13,
                            color: isSkipped ? '#64748b' : '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                            <input
                              type="checkbox"
                              checked={!isSkipped}
                              onChange={() => {}} // Handled by parent div
                              style={{ cursor: 'pointer', accentColor: '#2563eb' }}
                            />
                            <span style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              textDecoration: isSkipped ? 'line-through' : 'none'
                            }}>
                              {field.label}
                            </span>
                          </div>

                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: 4,
                            flexShrink: 0,
                            marginLeft: 6,
                            backgroundColor: isSkipped 
                              ? 'rgba(100, 116, 139, 0.2)' 
                              : field.isRequired 
                              ? 'rgba(239, 68, 68, 0.15)' 
                              : 'rgba(56, 189, 248, 0.12)',
                            color: isSkipped ? '#94a3b8' : field.isRequired ? '#f87171' : '#38bdf8'
                          }}>
                            {isSkipped ? 'Skipped' : field.isRequired ? 'Required' : 'Optional'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Signature Warning */}
            {structure.signatureFields.length > 0 && (
              <div style={{
                marginTop: 14,
                padding: '10px 14px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: '#fef3c7' }}>
                  <strong>{structure.signatureFields.length} Signature field(s) detected:</strong> Protected and kept blank for physical/digital signature upon completion.
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
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
              onClick={onBackToUpload}
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
                padding: '14px 26px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}
            >
              CONTINUE WITH {activeCount} FIELDS TO FILL
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
