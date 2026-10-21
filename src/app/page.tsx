// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { DashboardView } from '@/components/DashboardView';
import { OrganisationsView } from '@/components/OrganisationsView';
import { ClientsView } from '@/components/ClientsView';
import { MattersView } from '@/components/MattersView';
import { DocumentsView } from '@/components/DocumentsView';
import { TemplatesView } from '@/components/TemplatesView';
import { ComplianceView } from '@/components/ComplianceView';
import { GeneratedFormsView } from '@/components/GeneratedFormsView';
import { AuditView } from '@/components/AuditView';
import { SettingsView } from '@/components/SettingsView';

import { 
  Organisation, 
  Client, 
  Matter, 
  DocumentRecord, 
  ExtractedField, 
  PdfTemplate, 
  GeneratedDocument 
} from '@/types/database';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organisation | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);

  const [preselectedMatterId, setPreselectedMatterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial session & organisations
  const loadSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.activeOrganisation) {
        setActiveOrg(data.activeOrganisation);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    }
  };

  const loadOrganisations = async () => {
    try {
      const res = await fetch('/api/organisations');
      const data = await res.json();
      if (data.organisations) {
        setOrganisations(data.organisations);
        if (!activeOrg && data.organisations.length > 0) {
          setActiveOrg(data.organisations[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load organisations:', err);
    }
  };

  // Load tenant-isolated data whenever activeOrg changes
  const loadTenantData = async (orgId: string) => {
    setLoading(true);
    try {
      // 1. Clients
      const cRes = await fetch(`/api/clients?orgId=${orgId}`);
      const cData = await cRes.json();
      setClients(cData.clients || []);

      // 2. Matters
      const mRes = await fetch(`/api/matters?orgId=${orgId}`);
      const mData = await mRes.json();
      setMatters(mData.matters || []);

      // 3. Documents
      const dRes = await fetch(`/api/matters?orgId=${orgId}&matterId=${mData.matters?.[0]?.id || ''}`);
      const dData = await dRes.json();
      setDocuments(dData.documents || []);
      setExtractedFields(dData.extractedFields || []);
      setGeneratedDocs(dData.generatedDocs || []);

      // 4. Templates
      const tRes = await fetch(`/api/templates?orgId=${orgId}`);
      const tData = await tRes.json();
      setTemplates(tData.templates || []);
    } catch (err) {
      console.error('Error fetching tenant data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
    loadOrganisations();
  }, []);

  useEffect(() => {
    if (activeOrg) {
      loadTenantData(activeOrg.id);
    }
  }, [activeOrg?.id]);

  const handleSelectOrg = (orgId: string) => {
    const target = organisations.find(o => o.id === orgId);
    if (target) {
      setActiveOrg(target);
    }
  };

  const handleNavigate = (tab: string, meta?: any) => {
    if (meta?.selectedMatterId) {
      setPreselectedMatterId(meta.selectedMatterId);
    }
    setCurrentTab(tab);
  };

  if (!activeOrg) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading Universal AI Platform...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Universal Navigation Sidebar */}
      <Sidebar 
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        orgName={activeOrg.branding?.product_name || activeOrg.name}
        industryType={activeOrg.industry_type}
        jurisdiction={activeOrg.jurisdiction}
      />

      <div className="main-content">
        {/* Global Topbar with Tenant Switcher */}
        <Topbar 
          organisations={organisations}
          activeOrg={activeOrg}
          onSelectOrg={handleSelectOrg}
          userName="Alex Sterling"
          userRole="org_owner"
        />

        <main className="page-body">
          {currentTab === 'dashboard' && (
            <DashboardView 
              clients={clients}
              matters={matters}
              documents={documents}
              generatedDocs={generatedDocs}
              onNavigate={handleNavigate}
            />
          )}

          {currentTab === 'organisations' && (
            <OrganisationsView 
              organisations={organisations}
              activeOrg={activeOrg}
              onSelectOrg={handleSelectOrg}
              onRefresh={() => {
                loadOrganisations();
                loadTenantData(activeOrg.id);
              }}
            />
          )}

          {currentTab === 'clients' && (
            <ClientsView 
              clients={clients}
              activeOrgId={activeOrg.id}
              onRefresh={() => loadTenantData(activeOrg.id)}
              onNavigateToMatter={(clientId) => {
                setCurrentTab('matters');
              }}
            />
          )}

          {currentTab === 'matters' && (
            <MattersView 
              matters={matters}
              clients={clients}
              activeOrgId={activeOrg.id}
              activeOrgIndustry={activeOrg.industry_type}
              selectedMatterId={preselectedMatterId}
              onRefresh={() => loadTenantData(activeOrg.id)}
              onNavigateToDocumentUpload={(mId) => {
                setPreselectedMatterId(mId);
                setCurrentTab('documents');
              }}
              onNavigateToGenerate={(mId) => {
                setPreselectedMatterId(mId);
                setCurrentTab('generated');
              }}
            />
          )}

          {currentTab === 'documents' && (
            <DocumentsView 
              documents={documents}
              extractedFields={extractedFields}
              matters={matters}
              activeOrgId={activeOrg.id}
              preselectedMatterId={preselectedMatterId}
              onRefresh={() => loadTenantData(activeOrg.id)}
            />
          )}

          {currentTab === 'templates' && (
            <TemplatesView 
              templates={templates}
              activeOrgId={activeOrg.id}
              onRefresh={() => loadTenantData(activeOrg.id)}
            />
          )}

          {currentTab === 'compliance' && (
            <ComplianceView 
              matters={matters}
              activeOrgId={activeOrg.id}
              activeOrgIndustry={activeOrg.industry_type}
              onRefresh={() => loadTenantData(activeOrg.id)}
            />
          )}

          {currentTab === 'generated' && (
            <GeneratedFormsView 
              generatedDocs={generatedDocs}
              matters={matters}
              templates={templates}
              activeOrgId={activeOrg.id}
              preselectedMatterId={preselectedMatterId}
              onRefresh={() => loadTenantData(activeOrg.id)}
            />
          )}

          {currentTab === 'audit' && (
            <AuditView activeOrgId={activeOrg.id} />
          )}

          {currentTab === 'settings' && (
            <SettingsView 
              activeOrg={activeOrg}
              onRefresh={() => {
                loadOrganisations();
                loadTenantData(activeOrg.id);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
