// tests/multi-tenancy-security.test.ts
import { describe, it, expect } from 'vitest';
import { getRepository } from '../src/lib/store/repository';
import { Client, Matter, DocumentRecord } from '../src/types/database';

describe('Multi-Tenancy Security & Data Isolation Tests', () => {
  const repo = getRepository();

  it('guarantees Organisation A cannot access Organisation B clients', () => {
    const orgAId = 'org-tenant-alpha';
    const orgBId = 'org-tenant-beta';

    const clientA: Client = {
      id: 'client-alpha-001',
      organisation_id: orgAId,
      client_type: 'individual',
      primary_name: 'Alpha Tenant Client',
      universal_profile: {},
      portal_access_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const clientB: Client = {
      id: 'client-beta-001',
      organisation_id: orgBId,
      client_type: 'individual',
      primary_name: 'Beta Tenant Client',
      universal_profile: {},
      portal_access_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    repo.saveClient(clientA);
    repo.saveClient(clientB);

    // Queries scoped to Org A
    const orgAClients = repo.getClients(orgAId);
    expect(orgAClients.some(c => c.id === 'client-alpha-001')).toBe(true);
    expect(orgAClients.some(c => c.id === 'client-beta-001')).toBe(false);

    // Direct single client lookup cross-tenant check
    const crossAccess = repo.getClient(orgAId, 'client-beta-001');
    expect(crossAccess).toBeUndefined();
  });

  it('prevents cross-organisation document deletion or mutation', () => {
    const orgAId = 'org-tenant-alpha';
    const orgBId = 'org-tenant-beta';

    const docB: DocumentRecord = {
      id: 'doc-confidential-b',
      organisation_id: orgBId,
      file_name: 'Confidential_Settlement_Beta.pdf',
      file_size_bytes: 1024,
      mime_type: 'application/pdf',
      storage_path: 'beta/confidential.pdf',
      document_category: 'contract_of_sale',
      page_count: 2,
      is_encrypted: false,
      extraction_status: 'uploaded',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    repo.saveDocument(docB);

    // Tenant A attempts to delete Tenant B's document
    const deleteAttempt = repo.deleteDocument(orgAId, 'doc-confidential-b');
    expect(deleteAttempt).toBe(false);

    // Verify document still exists in Tenant B
    const docBStillExists = repo.getDocument(orgBId, 'doc-confidential-b');
    expect(docBStillExists).toBeDefined();
    expect(docBStillExists?.file_name).toBe('Confidential_Settlement_Beta.pdf');
  });
});
