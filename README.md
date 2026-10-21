# ChetiCheck: Verifiable Academic Credentials

> A secure, privacy-preserving credential issuance and verification platform for Kenyan higher education institutions. Authorized universities issue digitally signed degrees embedded in QR codes; employers and verifiers validate authenticity in seconds without contacting registrars or exposing student PII.

Built for the **Riara University Inter-University Hackathon 2026** under the **EdTech Innovation & Cybersecurity** track.

- **Live Production URL**: [https://cheticheck.vercel.app](https://cheticheck.vercel.app)
- **Non-Technical Guide & Testing Manual**: [HOW_TO_USE.md](HOW_TO_USE.md)
- **Dual-Track Contributor Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Design Thinking Methodology Mapping**: [docs/design-thinking-mapping.md](docs/design-thinking-mapping.md)
- **Riara Training Workshop Playbook**: [docs/riara-training-playbook-raw.md](docs/riara-training-playbook-raw.md)

---

## System Architecture & Verification Flow

```mermaid
flowchart TD
    subgraph Issuance["1. University Registrar Portal"]
        direction TB
        A["Registrar Inputs Student Record<br/>(Name, ID, Degree, Class)"] --> B["Compute Canonical SHA-256 Digest"]
        B --> C["Sign Digest with Institutional Private Key<br/>(ECDSA P-256 / Ed25519)"]
        C --> D["Persist Credential Record to Neon DB"]
        D --> E["Generate Tamper-Evident QR Code"]
    end

    subgraph Verification["2. Public Verification Engine"]
        direction TB
        F["Employer Scans QR Code / Enters URL"] --> G["Fetch Signed Credential Payload"]
        G --> H["Recompute Canonical SHA-256 Digest"]
        H --> I{"Compare Computed Hash vs Signed Digest"}
        
        I -->|"Hash Matches"| J{"Check Revocation Status in Neon DB"}
        I -->|"Hash Mismatch"| K["Verdict: TAMPERED / ALTERED<br/>(Red Warning)"]
        
        J -->|"Active"| L["Verdict: VERIFIED AUTHENTIC<br/>(Green Stamp)"]
        J -->|"Revoked"| M["Verdict: REVOKED<br/>(Amber Warning)"]
    end

    E -.->|"Scanned by Mobile Camera"| F

    style Issuance fill:#1e293b,stroke:#475569,stroke-width:2px,color:#f8fafc
    style Verification fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#f8fafc
    style L fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#ecfdf5
    style K fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fef2f2
    style M fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#fffbeb
```

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, CSS Modules
- **Backend**: Vercel Serverless Functions (`api/index.ts`)
- **Database**: Neon Serverless PostgreSQL with Kysely query builder
- **Cryptography**: Web Crypto API (SubtleCrypto), SHA-256 canonical hashing, ECDSA / Ed25519
- **Deployment**: Vercel Edge Network

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm

### Installation & Setup
```bash
git clone https://github.com/DavidMarkNjogu/cheti-check.git
cd cheti-check
npm install
```

### Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
```

### Run Locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Run Verification & Type Checks
```bash
npm run typecheck
npm run build
npx tsx _test.mts
```

---

## Project Structure

```
cheti-check/
├── api/                           # Vercel serverless request routing
│   └── index.ts                   # Unified API router
├── components/                    # Reusable UI component primitives
│   ├── AppShell.tsx               # Main layout wrapper
│   ├── QrImage.tsx                # Client-side QR code generator
│   └── VerdictStamp.tsx           # Cryptographic verdict stamp component
├── endpoints/                     # Domain API handlers
│   └── credentials/               # Issue, verify, revoke, tamper endpoints
├── helpers/                       # Core utilities and data layer
│   ├── credentialCrypto.tsx       # SHA-256 canonical hashing & ECDSA signing
│   ├── db.tsx                     # Kysely client connection
│   ├── ensureSchema.ts            # Idempotent auto-migration runner
│   └── schema.tsx                 # Database table definitions
├── pages/                         # Application route pages
│   ├── _index.tsx                 # Public showcase homepage
│   ├── credential.$credentialId.tsx # Printable graduate certificate view
│   ├── verify.$credentialId.tsx   # Public verification portal
│   └── issuer.tsx                 # University registrar portal
├── docs/                          # Design thinking & workshop playbooks
│   ├── spec-problem-definition.md # Initial conception and PRD
│   ├── design-thinking-mapping.md # Alignment to Riara training frameworks
│   └── riara-training-playbook-raw.md # Raw workshop transcript
├── HOW_TO_USE.md                  # Non-technical testing guide
├── CONTRIBUTING.md                # Dual-track developer instructions
└── README.md                      # Project documentation
```

---

## Honest Boundaries & Security Scope

1. **Cryptographic Integrity**: The signature guarantees that the certificate has not been altered since the moment of issuance. Any modification of the graduate's name, degree class, or award date immediately breaks the mathematical check.
2. **Key Storage**: In this demonstration prototype, the demo issuer signing key is managed in the serverless database. In enterprise production, signing keys are delegated to hardware security modules (HSM) or AWS KMS.
3. **Issuer Trust**: ChetiCheck proves that a certificate was signed by an issuer in the registry; validating institutional accreditation is performed via the national regulator registry.
