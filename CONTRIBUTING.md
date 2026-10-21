# Contributing to ChetiCheck: Dual-Track Contributor Guide

Welcome to ChetiCheck! We welcome contributions from everyone on the team and open-source community. To make contributing accessible to different skill sets, we offer two distinct developer tracks:

1. **Track 1: Soft Dev (AI-Assisted & Content/UI Developers)**: For builders using AI tools (Claude, Cursor, Antigravity) or focusing on UI styling, copy, and layout adjustments.
2. **Track 2: Deep Dev (Full-Stack, Cryptographic & Systems Engineers)**: For engineers working on cryptographic signature math, Neon PostgreSQL migrations, Kysely query schemas, and serverless API endpoints.

---

## Track 1: Soft Dev (AI-Assisted & UI Contributors)

If your workflow relies on AI coding assistants, or if you are focused on improving the visual polish and user experience, follow this track.

### 1. Safe Editing Zones
You can safely modify the following areas without risk of breaking core cryptographic verification:
- **Design Tokens & Theme Styling**: [base.css](file:///c:/Users/user%20pc/Desktop/2026/RIARA%20HACKATHON/cheti-check/base.css) — Modify CSS variables for colors, typography, border-radii, and spacing.
- **Component Styling**: `components/*.module.css` and `pages/*.module.css` — Refine padding, layout flexboxes, mobile media queries, and button hover states.
- **User-Facing Copy & Wording**: Text strings inside [components/AppShell.tsx](file:///c:/Users/user%20pc/Desktop/2026/RIARA%20HACKATHON/cheti-check/components/AppShell.tsx), [pages/_index.tsx](file:///c:/Users/user%20pc/Desktop/2026/RIARA%20HACKATHON/cheti-check/pages/_index.tsx), and [pages/verify.$credentialId.tsx](file:///c:/Users/user%20pc/Desktop/2026/RIARA%20HACKATHON/cheti-check/pages/verify.$credentialId.tsx).

### 2. High-Risk Zones (Avoid Touching in Soft Dev)
Do **not** allow an AI tool to rewrite or delete these files unless guided by a deep dev:
- `helpers/credentialCrypto.tsx`: The cryptographic signing and verification logic.
- `helpers/schema.tsx` & `helpers/ensureSchema.ts`: Neon database table definitions.
- `api/index.ts`: The unified Vercel serverless request router.

### 3. Prompting AI Assistants Safely
When asking an AI (Claude, Cursor, Antigravity) to make changes, use this exact prompt guardrail:
```text
"You are editing ChetiCheck. 
Rules:
1. NO EMOJI anywhere in source code, UI labels, or copy.
2. Do NOT touch helpers/credentialCrypto.tsx or modify database schemas.
3. Keep all changes restricted to CSS styling and UI layout in pages/ and components/.
4. Run 'npm run typecheck' and verify zero TypeScript errors before presenting the diff."
```

### 4. Verification Before Submitting
Always run these two checks in your terminal before committing:
```bash
npm run typecheck
npm run build
```
If both exit with code 0, your UI changes are safe to submit!

---

## Track 2: Deep Dev (Full-Stack & Systems Engineers)

For engineers working on the cryptographic core, backend endpoints, and database infrastructure.

### 1. Technology Stack Overview
- **Runtime**: Node.js 20+ / TypeScript 5.8
- **Frontend**: React 19, Vite, CSS Modules
- **Database**: Neon Serverless PostgreSQL, Kysely query builder
- **Cryptography**: Web Crypto API (SubtleCrypto), SHA-256 canonical hashing, ECDSA P-256 signatures
- **Deployment**: Vercel Serverless Functions (`api/index.ts`)

### 2. Core Cryptographic Invariants
ChetiCheck relies on asymmetric key cryptography:
1. **Canonical Payload Serialization**:
   - Every credential must be normalized into a deterministic JSON string (`helpers/credentialCrypto.tsx`) prior to hashing. Keys must be sorted alphabetically to guarantee identical SHA-256 digests across different platforms.
2. **Signature Verification**:
   - The verification endpoint computes the SHA-256 digest of the received payload and validates it against the issuer's public ECDSA key.
   - Any character alteration (tampering) produces a hash mismatch, flipping the status stamp to `TAMPERED`.
3. **Revocation Semantics**:
   - A mathematically valid signature can still be marked `REVOKED` in the Neon PostgreSQL database by an authorized registrar.

### 3. Database Layer & Schema Migrations
- All database queries use the type-safe Kysely query builder: [helpers/db.tsx](file:///c:/Users/user%20pc/Desktop/2026/RIARA%20HACKATHON/cheti-check/helpers/db.tsx).
- Schema migrations are idempotent and managed in [helpers/ensureSchema.ts](file:///c:/Users/user%20pc/Desktop/2026/RIARA%20HACKATHON/cheti-check/helpers/ensureSchema.ts).
- Never write destructive migrations (`DROP TABLE`) without team review.

### 4. Automated E2E Verification Suite
ChetiCheck includes a comprehensive 61-point automated verification suite:
```bash
npx tsx _test.mts
```
This suite verifies:
- Key pair generation and deterministic signing.
- Correct SHA-256 canonical digest calculations.
- Tamper detection on modified student names, grades, and dates.
- Credential revocation workflows.
- API route handlers and error boundary responses.

### 5. Git Commit & Pull Request Conventions
- Commit messages must follow conventional commits: `type(scope): concise description`.
  - Example: `feat(crypto): add key rotation support for institutional issuers`
  - Example: `fix(api): handle missing database connection string gracefully`
- Strictly **ZERO EMOJI** in commit messages, branch names, and pull request titles.
- Every PR touching backend code must include test verification output from `_test.mts`.
