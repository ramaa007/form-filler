# Universal AI Document Platform

An enterprise-grade, multi-tenant SaaS web application engineered from scratch for automated PDF document intake, multimodal AI field extraction, verification lineage, AcroForm & visual coordinate form filling, and Australian statutory compliance auditing.

Designed for **Mortgage & Finance**, **Solicitors & Conveyancing**, and **Real Estate** (Sales & Leasing), with a configurable architecture extensible to future industries.

Initial jurisdiction: **Australia (Queensland - AU-QLD)**, with configurable rules for NSW and Victoria.

---

## Key Features

1. **Multi-Tenant SaaS Architecture**
   - True logical tenant data isolation enforced by PostgreSQL Row Level Security (RLS).
   - Roles: `platform_admin`, `org_owner`, `org_admin`, `staff`, `compliance_officer`, `client_portal`.
   - Organisation A can never read, modify, or delete Organisation B data.

2. **Universal PDF Processing Engine (`pdf-lib`)**
   - Genuine PDF magic byte validation (`%PDF-`), file-size safeguards, and password/encryption handling.
   - Interactive AcroForm auto-detection, parsing, and populating.
   - Visual coordinate placement for flat PDFs with alignment and font sizing.
   - Australian formatting rules (Currency `$#,##0.00`, Date `DD/MM/YYYY`, UPPERCASE, Australian phone formatting).
   - Automatic diagonal draft watermarking (`DRAFT - NOT FOR EXECUTION`).

3. **Server-Side Multimodal AI Extraction (`Gemini API`)**
   - Strictly validated structured JSON outputs.
   - Prompt-injection resistance: documents treated as untrusted input.
   - Retains granular lineage: field key, value, evidence quotation, source page, confidence score, and verification status.
   - Human-in-the-loop review interface prevents silent overwrites.

4. **Reusable Client Profile System**
   - Individuals, Joint applicants, Businesses, and Trusts.
   - Verified personal particulars persist across multiple matter files.

5. **Configurable Compliance Rules Engine**
   - Evaluates mandatory checklists against verified documents and 90-day currency limits.
   - Preserves historical rule versions immutably.
   - Includes real sample rules for Queensland (NCCP Responsible Lending, REIQ Contract Verification, RTA Bond Lodgement).
   - Prominent statutory disclaimers ensuring professional sign-off is maintained.

6. **Formal PDF Sign-Off & Approval Workflow**
   - Clear workflow state progression:
     `Uploaded → Processing → Extracted → Awaiting Review → Verified → Ready to Generate → Generated → Awaiting Approval → Approved → Downloaded`.

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Lucide Icons, Vanilla CSS Design System with Glassmorphism and Dark Theme.
- **Backend**: Next.js Server API Routes, `@supabase/supabase-js`, `@google/generative-ai`, `pdf-lib`.
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS).
- **Testing**: Vitest with unit, integration, security, and PDF engine test suites.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Provide your `GEMINI_API_KEY` (optional for local testing; platform includes local deterministic engine fallback).

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Documentation

- [ARCHITECTURE.md](file:///c:/Users/61425/Downloads/Form%20Filler/ARCHITECTURE.md) - Architectural overview and multi-tenant design
- [SECURITY.md](file:///c:/Users/61425/Downloads/Form%20Filler/SECURITY.md) - Security, Australian Privacy Principles, and data isolation
- [DATABASE.md](file:///c:/Users/61425/Downloads/Form%20Filler/DATABASE.md) - Database schema, migrations, and RLS policies
- [COMPLIANCE_RULES.md](file:///c:/Users/61425/Downloads/Form%20Filler/COMPLIANCE_RULES.md) - Compliance rules framework and sample rule catalog
- [TESTING.md](file:///c:/Users/61425/Downloads/Form%20Filler/TESTING.md) - Test strategy and verification results
- [DEPLOYMENT.md](file:///c:/Users/61425/Downloads/Form%20Filler/DEPLOYMENT.md) - Production deployment guide
