// src/components/Sidebar.tsx
'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  Briefcase, 
  FileText, 
  FileCheck2, 
  ShieldCheck, 
  FileSignature, 
  History, 
  Settings,
  Scale
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  orgName: string;
  industryType: string;
  jurisdiction: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  orgName,
  industryType,
  jurisdiction
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'organisations', label: 'Organisations & Team', icon: Building },
    { id: 'clients', label: 'Clients & Profiles', icon: Users },
    { id: 'matters', label: 'Matters & Transactions', icon: Briefcase },
    { id: 'documents', label: 'Documents & AI Extraction', icon: FileText },
    { id: 'templates', label: 'PDF Form Templates', icon: FileCheck2 },
    { id: 'compliance', label: 'Compliance Engine', icon: ShieldCheck },
    { id: 'generated', label: 'Generated Documents', icon: FileSignature },
    { id: 'audit', label: 'Audit History', icon: History },
    { id: 'settings', label: 'Settings & Security', icon: Settings }
  ];

  const getIndustryBadge = () => {
    switch (industryType) {
      case 'mortgage_finance': return 'Mortgage & Finance';
      case 'solicitor_conveyancing': return 'Solicitors & Conveyancing';
      case 'real_estate': return 'Real Estate';
      default: return 'Universal Document';
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-badge">
          <Scale size={12} />
          {jurisdiction} COMPLIANT
        </div>
        <h1 className="brand-title">{orgName}</h1>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {getIndustryBadge()}
        </p>
      </div>

      <nav className="nav-section">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px', color: 'var(--text-muted)' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Universal AI Engine v1.0</p>
        <p>Tenant Data Isolation Active</p>
      </div>
    </aside>
  );
};
