# Security, Privacy & Australian Data Handling

## 1. Multi-Tenant Data Isolation

- **Zero Client Trust**: All user identifiers, organisation IDs, and role permissions are resolved and validated server-side.
- **Row Level Security**: Every table enforces an RLS policy ensuring users only query records matching their active organisation memberships.
- **Cross-Organisation Access Denial**: Confirmed via automated security tests: reading, modifying, or deleting records across tenant boundaries returns access denied.

## 2. Australian Privacy Act & APP Compliance

- **Australian Privacy Principle 11 (Security of personal information)**:
  - Personal identification numbers (e.g., driver licences, passports) and financial amounts are encrypted at rest.
  - Documents have configurable retention policies (e.g., 365 days for mortgages, 7 years for legal conveyancing).
  - Outdated documents are subject to automated purging.
- **Privilege & Confidentiality**:
  - Legal intake documents for solicitors are tagged as confidential. Client portal accounts have restricted read access that excludes internal practitioner notes.

## 3. Untrusted Input Handling & AI Security

- All uploaded files are validated against genuine `%PDF-` magic bytes.
- Size limit: 25MB safety cap to mitigate denial-of-service attempts.
- Password-protected/encrypted PDFs are detected and rejected safely.
- Document text is treated strictly as data. AI prompt engineering explicitly instructs the model to ignore system-override instructions embedded in documents.
- AI extractions are never automatically written into verified profiles without explicit human confirmation.

## 4. Audit Trail

- All critical actions (`document.uploaded`, `ai.extraction_completed`, `field.verified`, `pdf.generated`, `document.approved`) emit an immutable audit event recording actor ID, tenant ID, action, and timestamp.
