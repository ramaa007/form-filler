// src/components/ClientsView.tsx
'use client';

import React, { useState } from 'react';
import { Users, Plus, ShieldCheck, Mail, Phone, MapPin, Briefcase, Calendar, CheckCircle2 } from 'lucide-react';
import { Client, ClientType } from '@/types/database';

interface ClientsViewProps {
  clients: Client[];
  activeOrgId: string;
  onRefresh: () => void;
  onNavigateToMatter: (clientId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  activeOrgId,
  onRefresh,
  onNavigateToMatter
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);

  const [clientType, setClientType] = useState<ClientType>('individual');
  const [primaryName, setPrimaryName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [street, setStreet] = useState('');
  const [suburb, setSuburb] = useState('');
  const [state, setState] = useState('QLD');
  const [postcode, setPostcode] = useState('');
  const [employer, setEmployer] = useState('');
  const [income, setIncome] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisation_id: activeOrgId,
          client_type: clientType,
          primary_name: primaryName,
          email: email || null,
          phone: phone || null,
          date_of_birth: dob || null,
          residential_address: street ? { street, suburb, state, postcode, country: 'Australia' } : null,
          employment_details: employer ? {
            employer,
            occupation: 'Professional',
            employment_type: 'full_time',
            gross_annual_income: Number(income) || undefined
          } : null,
          universal_profile: {
            borrower_full_name: primaryName,
            borrower_dob: dob,
            gross_annual_income: income,
            employer_name: employer
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create client');

      setShowCreateModal(false);
      onRefresh();
      setSelectedClient(data.client);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Universal Client Profiles & Identity</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Permanent verified client identity records reused across multiple matters without manual re-entry.
          </p>
        </div>
        <button 
          id="btn-create-client"
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} /> Create Client Profile
        </button>
      </div>

      {/* Main Split Layout: Client List on Left, Detailed Universal Profile on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
        {/* Clients List */}
        <div className="glass-panel" style={{ padding: '20px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Client Directory ({clients.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {clients.map(c => {
              const isSelected = selectedClient?.id === c.id;
              return (
                <div
                  key={c.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setSelectedClient(c)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{c.primary_name}</p>
                    <span className="badge badge-info" style={{ fontSize: '10px' }}>{c.client_type}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {c.email || 'No email registered'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Client Universal Dossier */}
        {selectedClient ? (
          <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px' }}>
              <div>
                <span className="badge badge-verified" style={{ marginBottom: '8px' }}>
                  <ShieldCheck size={12} /> Verified Identity Profile
                </span>
                <h3 style={{ fontSize: '22px', fontWeight: 700 }}>{selectedClient.primary_name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Client Type: <strong style={{ textTransform: 'capitalize' }}>{selectedClient.client_type}</strong> | Registered: {new Date(selectedClient.created_at).toLocaleDateString('en-AU')}
                </p>
              </div>

              <button 
                className="btn btn-primary btn-sm"
                onClick={() => onNavigateToMatter(selectedClient.id)}
              >
                <Plus size={14} /> Open Matter For Client
              </button>
            </div>

            {/* Profile Attributes Grid */}
            <div className="grid-cols-2">
              <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={15} /> Contact Particulars
                </h4>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>Email: <strong>{selectedClient.email || 'N/A'}</strong></div>
                  <div>Phone: <strong>{selectedClient.phone || 'N/A'}</strong></div>
                  <div>DOB: <strong>{selectedClient.date_of_birth || 'N/A'}</strong></div>
                </div>
              </div>

              <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} /> Verified Residential Address
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  {selectedClient.residential_address ? (
                    <>
                      {selectedClient.residential_address.street}<br />
                      {selectedClient.residential_address.suburb} {selectedClient.residential_address.state} {selectedClient.residential_address.postcode}<br />
                      {selectedClient.residential_address.country}
                    </>
                  ) : (
                    'Address not yet recorded or pending verification.'
                  )}
                </p>
              </div>

              <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={15} /> Verified Employment & Income
                </h4>
                {selectedClient.employment_details ? (
                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>Employer: <strong>{selectedClient.employment_details.employer}</strong></div>
                    <div>Occupation: <strong>{selectedClient.employment_details.occupation}</strong></div>
                    <div>Status: <strong style={{ textTransform: 'capitalize' }}>{selectedClient.employment_details.employment_type.replace('_', ' ')}</strong></div>
                    <div>Gross Income: <strong>${selectedClient.employment_details.gross_annual_income?.toLocaleString()} AUD/yr</strong></div>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No employment record attached.</p>
                )}
              </div>

              <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={15} /> Primary Identification Document
                </h4>
                {selectedClient.identification_details ? (
                  <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>Type: <strong style={{ textTransform: 'capitalize' }}>{selectedClient.identification_details.id_type.replace('_', ' ')}</strong></div>
                    <div>Doc Number: <strong style={{ fontFamily: 'var(--font-mono)' }}>{selectedClient.identification_details.id_number}</strong></div>
                    <div>Issuer: <strong>{selectedClient.identification_details.issuer || 'N/A'}</strong></div>
                    <div>Expiry Date: <strong>{selectedClient.identification_details.expiry_date || 'N/A'}</strong></div>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No identity document recorded.</p>
                )}
              </div>
            </div>

            {/* Universal Extensible Attributes */}
            <div style={{ marginTop: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Universal Extensible Profile Attributes</h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Attribute Key</th>
                      <th>Synchronised Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(selectedClient.universal_profile).map(([k, v]) => (
                      <tr key={k}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{k}</td>
                        <td style={{ fontWeight: 600 }}>{String(v)}</td>
                        <td>
                          <span className="badge badge-verified">
                            <CheckCircle2 size={12} /> Verified Data
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select a client from the directory to inspect their verified profile.
          </div>
        )}
      </div>

      {/* Modal: Create Client */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-modal" style={{ width: '100%', maxWidth: '640px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Create Universal Client Profile</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Enter verified client particulars for re-use across applications, contracts, and compliance filings.
            </p>

            {error && (
              <div style={{ padding: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateClient}>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Client Type</label>
                  <select className="form-select" value={clientType} onChange={e => setClientType(e.target.value as any)}>
                    <option value="individual">Individual</option>
                    <option value="joint">Joint Applicant</option>
                    <option value="business">Business / Legal Entity</option>
                    <option value="trust">Family Trust</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Legal Name</label>
                  <input type="text" className="form-input" required placeholder="e.g. David Alexander Ward" value={primaryName} onChange={e => setPrimaryName(e.target.value)} />
                </div>
              </div>

              <div className="grid-cols-3">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" placeholder="david@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="tel" className="form-input" placeholder="0400 123 456" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-input" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '16px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Residential Address</h4>
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input type="text" className="form-input" placeholder="e.g. 55 Queen Street" value={street} onChange={e => setStreet(e.target.value)} />
              </div>
              <div className="grid-cols-3">
                <div className="form-group">
                  <label className="form-label">Suburb</label>
                  <input type="text" className="form-input" placeholder="Brisbane" value={suburb} onChange={e => setSuburb(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="form-select" value={state} onChange={e => setState(e.target.value)}>
                    <option value="QLD">QLD</option>
                    <option value="NSW">NSW</option>
                    <option value="VIC">VIC</option>
                    <option value="WA">WA</option>
                    <option value="SA">SA</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Postcode</label>
                  <input type="text" className="form-input" placeholder="4000" value={postcode} onChange={e => setPostcode(e.target.value)} />
                </div>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '16px', marginBottom: '12px', color: 'var(--text-secondary)' }}>Employment Details</h4>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Current Employer</label>
                  <input type="text" className="form-input" placeholder="e.g. Rio Tinto" value={employer} onChange={e => setEmployer(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gross Annual Income ($AUD)</label>
                  <input type="number" className="form-input" placeholder="125000" value={income} onChange={e => setIncome(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Save Client Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
