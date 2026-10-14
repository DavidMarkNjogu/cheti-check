# ChetiCheck: Riara Design Thinking Methodology Mapping

This document details how **ChetiCheck** directly applies the principles, frameworks, and criteria taught by **Stephen Kagwathi** during the Riara University Inter-University Hackathon 2026 pre-hackathon training sessions (Session 1: October 7, 2026; Session 2: October 14, 2026).

---

## 1. Session 1 Application: Problem Discovery & Definition

> "Don't solve it yet. Find the problem worth solving." — Stephen Kagwathi

### 1.1 The Empathy Phase (Observe, Ask, Listen, Notice)
- **Observations**: Kenyan university registries spend hundreds of hours responding to manual verification letters from overseas institutions, embassies, and employers.
- **Interviews Conducted**: Students waiting weeks for stamped certification; HR professionals receiving forged degree printouts with altered classifications.
- **The Core Insight**: The vulnerability is not the graduation record itself, but the lack of an offline-verifiable, tamper-evident carrier that allows verifiers to validate the credential without needing direct access to university internal systems.

### 1.2 ChetiCheck Problem Card
| Field | ChetiCheck Definition |
| :--- | :--- |
| **Who** | University Registrars, Graduating Students, and HR Hiring Verifiers. |
| **Where** | Job recruitment screening, embassy visa checks, graduate school admissions. |
| **When** | During hiring cycles and credential evaluations. |
| **What Pain** | Verification takes 2 to 6 weeks, or employers accept unverified documents, allowing credential fraud to proliferate. |
| **Why it Matters** | Academic fraud devalues genuine degrees and risks dangerous incompetence in licensed professions. |

### 1.3 How Might We (HMW) Statements
- *How might we turn an academic certificate into a self-verifying cryptographic object that requires no phone-home database query?*
- *How might we make credential tampering immediately visible to any non-technical hiring manager in under 5 seconds?*

---

## 2. Session 2 Application: Prototype Archetype & 48-Hour Feasibility Filter

> "Build to learn. One question -> one prototype." — Stephen Kagwathi

### 2.1 The Core Prototype Question
- **The Question**: Can an asymmetric cryptographic signature embedded in a QR code prove certificate authenticity and detect single-character tampering in under 5 seconds on a phone browser?
- **Selected Archetype**: **Clickable Interactive Prototype + Live Functional Demo**.

### 2.2 The 48-Hour Feasibility Filter Evaluation
Stephen Kagwathi outlined 4 non-negotiable filters for hackathon viability:

| Filter Dimension | Kagwathi Criterion | ChetiCheck Implementation & Proof |
| :--- | :--- | :--- |
| **Desirable** | Do target users genuinely want this? | Registrars eliminate manual paperwork backlogs; graduates receive instant verifiable credentials; employers eliminate fraud risk. |
| **Useful** | Does it solve the real root friction? | Provides an unambiguous, instant verdict: Authentic, Altered, or Revoked. |
| **Feasible** | Can this be engineered and proven in 48 hours? | Built using lightweight web standards: React 19, Web Crypto API (SHA-256 / ECDSA), and Neon Serverless PostgreSQL. |
| **Trustworthy** | Is it secure, private, and resilient? | Zero private PII exposure. Verification validates the mathematical signature against the issuer's public identity; student data remains tamper-proof. |

---

## 3. The 80/20 User Testing & Feedback Protocol

> "User talks 80%, team listens. Never defend the design during user tests." — Stephen Kagwathi

During student and peer testing rounds:
1. **Tester Prompt**: *"Here is a verified certificate. Try to verify it, then click 'Tamper Demo' and tell us what you observe."*
2. **Key Feedback Collected**:
   - Initial testers were confused by raw cryptographic hashes.
   - **Iterative Adaptation**: Introduced the visual `VerdictStamp` (high-contrast Green "AUTHENTIC" vs Red "TAMPERED / ALTERED" badge) to make the cryptographic result immediately understandable to non-technical users.
3. **Outcome**: Reduced verification cognitive load from reading hash strings to a single glanceable badge.

---

## 4. Mapping to the 8-Step Competition Playbook

1. **Step 1: Pick a Problem Worth Solving**: Credential forgery and 4-week verification bottlenecks in Kenya.
2. **Step 2: Know Your User**: Registrars (issuers), Students (holders), HR managers (verifiers).
3. **Step 3: Define the Core Question**: Can a QR code verify authenticity without leaking student data?
4. **Step 4: Pick the Right Prototype**: Interactive web app with live cryptographic verification.
5. **Step 5: Build Lean**: Scope focused exclusively on issuance, verification, and tamper detection.
6. **Step 6: Test with Real Users**: Conducted hallway usability tests with hackathon peers.
7. **Step 7: Iterate**: Added 1-click tamper simulation so judges can test forgery resistance in real-time.
8. **Step 8: Tell the Story**: Problem -> Live Tamper Demo -> Architectural Trust -> Kenyan Impact.
