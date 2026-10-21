// src/components/ComplianceView.tsx
'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  AlertTriangle, 
  FileCheck2, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Play, 
  History,
  Scale
} from 'lucide-react';
import { ComplianceRule, Matter } from '@/types/database';
import { SAMPLE_COMPLIANCE_RULES } from '@/lib/compliance/sample-rules';
import { MatterComplianceReport } from '@/lib/compliance/engine';

interface ComplianceViewProps {
  matters: Matter[];
  activeOrgId: string;
  activeOrgIndustry: string;
  onRefresh: () => void;
}

export const ComplianceView: React.FC<ComplianceViewProps> = ({
  matters,
  activeOrgId,
  activeOrgIndustry,
  onRefresh
}) => {
  const [selectedMatterId, setSelectedMatterId] = useState(matters[0]?.id || '');
  const [rules, setRules] = useState<ComplianceRule[]>(SAMPLE_COMPLIANCE_RULES);
  const [evaluating, setEvaluating] = useState(false);
  const [report, setReport] = useState<MatterComplianceReport | null>(null);

  const handleRunEvaluation = async () => {
    if (!selectedMatterId) {
      alert('Please select a matter to evaluate.');
      return;
    }

    setEvaluating(true);
    try {
      const res = await fetch('/api/compliance/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisation_id: activeOrgId,
          matter_id: selectedMatterId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReport(data.report);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEvaluating(false);
    }
  };

  const currentRules = rules.filter(r => 
    r.industry_type === activeOrgIndustry || 
    r.industry_type === 'universal' ||
    activeOrgIndustry === 'universal'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Configurable Statutory Compliance Engine</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Jurisdiction and industry-specific rules engine evaluating required documents, 90-day currency limits, and verified evidence.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            className="form-select" 
            style={{ width: '280px' }}
            value={selectedMatterId}
            onChange={e => setSelectedMatterId(e.target.value)}
          >
            {matters.map(m => (
              <option key={m.id} value={m.id}>{m.title} ({m.reference_number})</option>
            ))}
          </select>

          <button 
            id="btn-evaluate-compliance"
            className="btn btn-primary"
            onClick={handleRunEvaluation}
            disabled={evaluating || !selectedMatterId}
          >
            <Play size={14} />
            {evaluating ? 'Evaluating Rules...' : 'Run Compliance Audit'}
          </button>
        </div>
      </div>

      {/* Mandatory Statutory Disclaimer Banner */}
      <div className="glass-panel" style={{ padding: '20px', borderColor: 'var(--warning-border)', background: 'rgba(245, 158, 11, 0.05)' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <Scale size={24} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '14.5px', fontWeight: 600, color: '#fbbf24' }}>
              Statutory Disclaimer & Professional Verification Requirement
            </h4>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
              This platform provides automated rule evaluation based on configured legislative checklists. 
              Software evaluation does not constitute legal advice, credit licensing guarantee, or judicial compliance. 
              All assessments must be formally reviewed and approved by an accredited solicitor, conveyancer, or licensed credit representative.
            </p>
          </div>
        </div>
      </div>

      {/* Live Evaluation Report (If Evaluated) */}
      {report && (
        <div className="glass-panel" style={{ padding: '28px', border: '1px solid #38bdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span className="badge badge-info" style={{ marginBottom: '6px' }}>
                Jurisdiction: {report.jurisdiction}
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Matter Compliance Audit Report</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Evaluated: {new Date(report.evaluatedAt).toLocaleString('en-AU')}
              </p>
            </div>

            <span className={`badge ${report.overallStatus === 'compliant' ? 'badge-verified' : 'badge-unverified'}`} style={{ fontSize: '13px', padding: '6px 14px' }}>
              {report.overallStatus === 'compliant' ? 'Verified Compliant' : 'Requirements Pending Attention'}
            </span>
          </div>

          <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Rules Assessed</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{report.totalRules}</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Verified Complete</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>{report.verifiedCount}</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Incomplete Items</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#fbbf24' }}>{report.incompleteCount}</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Exceptions Requiring Review</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f87171' }}>{report.exceptionCount}</div>
            </div>
          </div>

          {/* Granular Audit Breakdown */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rule Code</th>
                  <th>Rule Name</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Assessment Findings</th>
                </tr>
              </thead>
              <tbody>
                {report.evaluations.map(ev => (
                  <tr key={ev.ruleId}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{ev.ruleCode}</td>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{ev.ruleName}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>v{ev.ruleVersion}</div>
                    </td>
                    <td>
                      <span className={`badge ${ev.severity === 'mandatory' ? 'badge-conflict' : 'badge-unverified'}`}>
                        {ev.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${ev.status === 'verified_complete' ? 'badge-verified' : 'badge-unverified'}`}>
                        {ev.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {ev.notes}
                      {ev.evidenceReferences.length > 0 && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#38bdf8' }}>
                          Evidence Cited: {ev.evidenceReferences.map(er => er.snippet).join(' | ')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Configured Rules Directory */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
          Configured Statutory Rules Directory ({currentRules.length})
        </h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule Code</th>
                <th>Rule Name & Objective</th>
                <th>Jurisdiction</th>
                <th>Authoritative Source Reference</th>
                <th>Version</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {currentRules.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.rule_code}</td>
                  <td>
                    <strong style={{ color: 'var(--text-main)' }}>{r.name}</strong>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {r.description}
                    </p>
                  </td>
                  <td>{r.jurisdiction}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {r.source_reference || 'Configured internal standard'}
                  </td>
                  <td><span className="badge badge-muted">v{r.version}</span></td>
                  <td>
                    <span className={`badge ${r.severity === 'mandatory' ? 'badge-conflict' : 'badge-info'}`}>
                      {r.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
