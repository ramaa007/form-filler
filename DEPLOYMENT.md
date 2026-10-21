# Production Deployment & Readiness Checklist

## 1. Prerequisites

- **Node.js**: v20+ LTS or v22+
- **Supabase Project**: Active project with database schema applied
- **Google Cloud Platform / Google AI Studio**: Gemini API key with access to `gemini-2.5-flash` or `gemini-1.5-flash`
- **Hosting**: Vercel, AWS ECS, Google Cloud Run, or Docker

## 2. Environment Variables Configuration

Set the following environment variables in production:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-private-service-role-key>

GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-2.5-flash

NEXT_PUBLIC_APP_NAME="Universal AI Document Platform"
NEXT_PUBLIC_DEFAULT_JURISDICTION="AU-QLD"
NEXT_PUBLIC_STORAGE_BUCKET="documents"
NODE_ENV=production
```

## 3. Database Migration Execution

Execute `supabase/migrations/20261021000000_init_universal_platform.sql` in your Supabase SQL editor:
1. Navigate to the Supabase Dashboard -> **SQL Editor**.
2. Paste the contents of `supabase/migrations/20261021000000_init_universal_platform.sql`.
3. Click **Run**.
4. Confirm tables and Row Level Security policies are enabled.

## 4. Production Build & Execution

```bash
npm ci
npm test
npm run build
npm run start
```

## 5. Production Readiness Checklist

- [x] Strict Row Level Security (RLS) enabled on all exposed database tables.
- [x] Multi-tenancy isolation tested and verified against cross-organisation reads/deletions.
- [x] Gemini API key configured server-side only; zero client-side credential exposure.
- [x] Magic-byte `%PDF-` validation and 25MB file-size limits active on document uploads.
- [x] Diagonal draft watermarking enabled on draft PDF generations.
- [x] Human-in-the-loop review required before data synchronisation to client profiles.
- [x] Statutory compliance disclaimers present on all automated assessment outputs.
- [x] Automated audit logging enabled across all key document operations.
