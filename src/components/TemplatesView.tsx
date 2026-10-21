// src/components/TemplatesView.tsx
'use client';

import React, { useState } from 'react';
import { 
  FileCheck2, 
  Plus, 
  Sliders, 
  Eye, 
  Download, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Save, 
  FileCode,
  Crosshair,
  FileSpreadsheet
} from 'lucide-react';
import { PdfTemplate, PdfTemplateFieldMapping, TargetFieldType } from '@/types/database';

interface TemplatesViewProps {
  templates: PdfTemplate[];
  activeOrgId: string;
  onRefresh: () => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates,
  activeOrgId,
  onRefresh
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate | null>(templates[0] || null);
  const [activeTab, setActiveTab] = useState<'mappings' | 'coordinate_editor' | 'synthetic_test'>('mappings');

  // Form builder mapping state
  const [mappings, setMappings] = useState<PdfTemplateFieldMapping[]>(selectedTemplate?.mappings || []);
  const [fieldName, setFieldName] = useState('');
  const [targetType, setTargetType] = useState<TargetFieldType>('acroform');
  const [sourceBinding, setSourceBinding] = useState('client.primary_name');
  const [formatRule, setFormatRule] = useState<string>('uppercase');
  const [isRequired, setIsRequired] = useState(true);

  // Flat coordinate visual placement editor state
  const [coordX, setCoordX] = useState<number>(140);
  const [coordY, setCoordY] = useState<number>(120);
  const [coordWidth, setCoordWidth] = useState<number>(200);
  const [coordHeight, setCoordHeight] = useState<number>(20);
  const [coordFontSize, setCoordFontSize] = useState<number>(10);
  const [coordAlignment, setCoordAlignment] = useState<'left' | 'center' | 'right'>('left');

  // Synthetic sample testing state
  const [syntheticLoading, setSyntheticLoading] = useState(false);
  const [syntheticPreview, setSyntheticPreview] = useState<any>(null);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Sync mappings when template changes
  const handleSelectTemplate = (tpl: PdfTemplate) => {
    setSelectedTemplate(tpl);
    setMappings(tpl.mappings || []);
    setStatusMsg(null);
  };

  const handleAddMapping = () => {
    if (!fieldName) {
      alert('Please specify a Field Name.');
      return;
    }

    const newMap: PdfTemplateFieldMapping = {
      id: `map-draft-${Date.now()}`,
      template_id: selectedTemplate?.id || '',
      field_name: fieldName,
      target_type: targetType,
      source_binding: sourceBinding,
      is_required: isRequired,
      formatting_rule: formatRule as any,
      page_number: 1,
      coordinate_x: targetType === 'coordinate_overlay' ? coordX : null,
      coordinate_y: targetType === 'coordinate_overlay' ? coordY : null,
      width: targetType === 'coordinate_overlay' ? coordWidth : null,
      height: targetType === 'coordinate_overlay' ? coordHeight : null,
      font_size: targetType === 'coordinate_overlay' ? coordFontSize : null,
      alignment: targetType === 'coordinate_overlay' ? coordAlignment : null,
      created_at: new Date().toISOString()
    };

    setMappings([...mappings, newMap]);
    setFieldName('');
    setStatusMsg('Mapping added to draft.');
  };

  const handleSaveTemplateMappings = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisation_id: activeOrgId,
          name: selectedTemplate.name,
          industry_type: selectedTemplate.industry_type,
          jurisdiction: selectedTemplate.jurisdiction,
          description: selectedTemplate.description,
          template_type: selectedTemplate.template_type,
          mappings
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save template mappings');

      setStatusMsg('Template mappings successfully published.');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSyntheticBlank = async () => {
    setSyntheticLoading(true);
    try {
      const res = await fetch(`/api/templates/synthetic-sample?title=Universal_Interactive_Schedule&industry=mortgage_finance&jurisdiction=AU-QLD`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSyntheticPreview(data);
      setStatusMsg(`Generated synthetic blank PDF (${data.inspection.detectedFields.length} AcroForms detected).`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSyntheticLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Universal PDF Form Template Builder</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Map verified client profile attributes and matter data to interactive AcroForm fields or visually positioned flat PDF overlays.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            id="btn-gen-synthetic-sample"
            className="btn btn-secondary"
            onClick={handleGenerateSyntheticBlank}
            disabled={syntheticLoading}
          >
            <Sparkles size={16} color="#fbbf24" />
            {syntheticLoading ? 'Generating...' : 'Inspect Synthetic AcroForm Blank'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div style={{ padding: '12px 16px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', color: '#34d399', fontSize: '13px' }}>
          {statusMsg}
        </div>
      )}

      {/* Split Template Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
        {/* Templates Directory */}
        <div className="glass-panel" style={{ padding: '20px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Available Templates ({templates.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {templates.map(t => {
              const isSelected = selectedTemplate?.id === t.id;
              return (
                <div
                  key={t.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => handleSelectTemplate(t)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{t.name}</p>
                    <span className="badge badge-info" style={{ fontSize: '10px' }}>v{t.version}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {t.template_type} | {t.jurisdiction}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Template Editor Area */}
        {selectedTemplate ? (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <span className="badge badge-info" style={{ marginBottom: '8px' }}>
                  {selectedTemplate.industry_type.replace(/_/g, ' ')}
                </span>
                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>{selectedTemplate.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Type: <strong>{selectedTemplate.template_type}</strong> | Jurisdiction: <strong>{selectedTemplate.jurisdiction}</strong> | Version: <strong>v{selectedTemplate.version}</strong>
                </p>
              </div>

              <button 
                id="btn-save-template-mappings"
                className="btn btn-primary btn-sm"
                onClick={handleSaveTemplateMappings}
                disabled={saving}
              >
                <Save size={14} />
                {saving ? 'Publishing...' : 'Save & Publish Mappings'}
              </button>
            </div>

            {/* Tabs for Editor Mode */}
            <div className="tabs-header">
              <button 
                className={`tab-btn ${activeTab === 'mappings' ? 'active' : ''}`}
                onClick={() => setActiveTab('mappings')}
              >
                AcroForm Field Mappings ({mappings.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'coordinate_editor' ? 'active' : ''}`}
                onClick={() => setActiveTab('coordinate_editor')}
              >
                Visual Flat Coordinate Placement
              </button>
              <button 
                className={`tab-btn ${activeTab === 'synthetic_test' ? 'active' : ''}`}
                onClick={() => setActiveTab('synthetic_test')}
              >
                Synthetic Data Test & Preview
              </button>
            </div>

            {/* TAB 1: AcroForm Field Mappings */}
            {activeTab === 'mappings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Add New Mapping Row */}
                <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginBottom: '12px' }}>
                    Connect New Form Field
                  </h4>
                  <div className="grid-cols-4">
                    <div className="form-group">
                      <label className="form-label">PDF Field Identifier</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. client_full_name" 
                        value={fieldName} 
                        onChange={e => setFieldName(e.target.value)} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Field Target Type</label>
                      <select 
                        className="form-select" 
                        value={targetType} 
                        onChange={e => setTargetType(e.target.value as any)}
                      >
                        <option value="acroform">Interactive AcroForm Field</option>
                        <option value="coordinate_overlay">Flat PDF Coordinate Overlay</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Data Source Binding</label>
                      <select 
                        className="form-select" 
                        value={sourceBinding} 
                        onChange={e => setSourceBinding(e.target.value)}
                      >
                        <option value="client.primary_name">Client Legal Name</option>
                        <option value="client.date_of_birth">Client Date of Birth</option>
                        <option value="client.residential_address">Client Residential Address</option>
                        <option value="client.employment.employer">Client Employer</option>
                        <option value="client.employment.gross_annual_income">Client Gross Income ($AUD)</option>
                        <option value="matter.property_address">Matter Property Address</option>
                        <option value="matter.loan_amount">Matter Loan Amount ($AUD)</option>
                        <option value="matter.purchase_price">Matter Consideration Price ($AUD)</option>
                        <option value="matter.settlement_date">Matter Settlement Date</option>
                        <option value="matter.lender_name">Matter Proposed Lender</option>
                        <option value="static">Static Value</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Formatting Rule</label>
                      <select 
                        className="form-select" 
                        value={formatRule} 
                        onChange={e => setFormatRule(e.target.value)}
                      >
                        <option value="uppercase">UPPERCASE</option>
                        <option value="date_au_slash">Date (DD/MM/YYYY)</option>
                        <option value="currency_aud">Currency ($#,##0.00)</option>
                        <option value="phone_au">Australian Phone</option>
                        <option value="lowercase">lowercase</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={isRequired} 
                        onChange={e => setIsRequired(e.target.checked)} 
                      />
                      <span>Mark field as mandatory for Final PDF Generation</span>
                    </label>

                    <button className="btn btn-secondary btn-sm" onClick={handleAddMapping}>
                      <Plus size={14} /> Add Mapping
                    </button>
                  </div>
                </div>

                {/* Existing Mappings Table */}
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>PDF Target Field</th>
                        <th>Type</th>
                        <th>Source Binding</th>
                        <th>Formatting Rule</th>
                        <th>Required</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappings.map((m, idx) => (
                        <tr key={m.id || idx}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{m.field_name}</td>
                          <td>
                            <span className="badge badge-muted">{m.target_type}</span>
                          </td>
                          <td style={{ color: '#38bdf8' }}>{m.source_binding}</td>
                          <td>{m.formatting_rule || 'raw'}</td>
                          <td>
                            {m.is_required ? (
                              <span className="badge badge-verified">Required</span>
                            ) : (
                              <span className="badge badge-muted">Optional</span>
                            )}
                          </td>
                          <td>
                            <button 
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#f87171' }}
                              onClick={() => setMappings(mappings.filter((_, i) => i !== idx))}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: Visual Flat Coordinate Placement */}
            {activeTab === 'coordinate_editor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  For flat PDFs without editable AcroForm fields, position text using millimeter/point coordinates, font sizing, and alignment controls.
                </p>

                <div className="grid-cols-4" style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                  <div className="form-group">
                    <label className="form-label">X Coordinate (Points)</label>
                    <input type="number" className="form-input" value={coordX} onChange={e => setCoordX(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Y Coordinate (Points)</label>
                    <input type="number" className="form-input" value={coordY} onChange={e => setCoordY(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Font Size (pt)</label>
                    <input type="number" className="form-input" value={coordFontSize} onChange={e => setCoordFontSize(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alignment</label>
                    <select className="form-select" value={coordAlignment} onChange={e => setCoordAlignment(e.target.value as any)}>
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>

                {/* Interactive Visual Canvas Container */}
                <div style={{ padding: '24px', background: '#0f172a', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'center' }}>
                  <div 
                    className="pdf-editor-canvas" 
                    style={{ width: '460px', height: '620px', border: '1px solid #cbd5e1' }}
                  >
                    <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a' }}>A4 Flat Document Visual Layout Simulator</p>
                      <p style={{ fontSize: '10px', color: '#64748b' }}>Coordinate System: Standard PDF 72 DPI points</p>
                    </div>

                    {/* Draggable/Configured Placement Box */}
                    <div 
                      className="draggable-field-box active"
                      style={{
                        left: `${Math.min(coordX, 300)}px`,
                        top: `${Math.min(coordY, 500)}px`,
                        width: `${coordWidth}px`,
                        height: `${coordHeight}px`,
                        fontSize: `${coordFontSize}px`,
                        textAlign: coordAlignment
                      }}
                    >
                      <span>{fieldName || 'Target Value Preview'}</span>
                      <Crosshair size={12} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Synthetic Data Test & Preview */}
            {activeTab === 'synthetic_test' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Test template binding with simulated synthetic data to verify field values, date formatting, and layout stability.
                  </p>
                  <button className="btn btn-primary btn-sm" onClick={handleGenerateSyntheticBlank}>
                    Run Live Synthetic Test
                  </button>
                </div>

                {syntheticPreview ? (
                  <div style={{ padding: '20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '12px' }}>
                      <CheckCircle2 size={18} />
                      <strong style={{ fontSize: '14px' }}>Synthetic Inspection Passed</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      <div>File Size: <strong>{syntheticPreview.file_size_bytes} bytes</strong></div>
                      <div>Pages: <strong>{syntheticPreview.inspection.pageCount}</strong></div>
                      <div>AcroForm Fields: <strong>{syntheticPreview.inspection.detectedFields.length}</strong></div>
                    </div>

                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Detected Form Field</th>
                            <th>Field Type</th>
                            <th>Simulation Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {syntheticPreview.inspection.detectedFields.map((df: any) => (
                            <tr key={df.name}>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{df.name}</td>
                              <td><span className="badge badge-info">{df.type}</span></td>
                              <td style={{ color: '#38bdf8' }}>SARAH JANE THOMPSON</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '36px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
                    Click <strong>"Run Live Synthetic Test"</strong> or <strong>"Inspect Synthetic AcroForm Blank"</strong> to simulate form mapping.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a template to configure mappings.
          </div>
        )}
      </div>
    </div>
  );
};
