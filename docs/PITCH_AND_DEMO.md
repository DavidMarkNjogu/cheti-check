# ChetiCheck: Hackathon Pitch Script & Judge Walkthrough

**Project:** ChetiCheck (Verifiable Academic Credentials)  
**Track:** EdTech Innovation and Cybersecurity  
**Event:** Riara University Inter-University Design Thinking Hackathon 2026  
**Live URL:** [https://cheticheck.vercel.app](https://cheticheck.vercel.app)

---

## 1. The 90-Second Stage Demo Script
1. **The Context (15 seconds)**:
   "According to the Kenya National Qualifications Authority, 1 in 3 credentials in Kenya has discrepancies or forgeries. Manual registry checks take up to 6 weeks."
2. **The Issuance (25 seconds)**:
   "On `cheticheck.vercel.app/issuer`, a university registrar clicks 'Fill demo certificate' for graduate Grace Muthoni Kariuki, Computer Science 2026, and clicks 'Sign and issue'. In under 200ms, an asymmetric Ed25519 digital signature is generated over a canonical SHA-256 digest."
3. **The Verification (25 seconds)**:
   "An employer scans the QR code or opens `cheticheck.vercel.app/verify/CC-XXXX`. The platform mathematically checks the signature against the university's public key. Instant green verdict: Authentic."
4. **The Attack Defense (25 seconds)**:
   "When an insider attempts to alter the graduation year from 2026 to 2025 via our Tamper Demo, re-verifying instantly fails with an Altered verdict. The cryptographic signature breaks because the document digest does not match."

---

## 2. 60-Second Hands-On Walkthrough for Judges
1. Open [https://cheticheck.vercel.app/issuer](https://cheticheck.vercel.app/issuer).
2. Click **Fill demo certificate** -> Click **Sign and issue**.
3. Click **Open the graduate view and QR** to inspect the issued certificate.
4. Return to Issuer portal and click **Verify** on your new certificate -> Green **Authentic** badge.
5. In the Issuer portal, click **Tamper demo** on the certificate.
6. Click **Verify** again -> Red **Altered** badge with cryptographic explanation.

---

## 3. Architecture & Security Highlights
- **Cryptographic Standard**: Ed25519 asymmetric signatures + SHA-256 canonicalization.
- **Privacy First**: Credential verification does not expose the student's national ID, birthdate, or full transcript.
- **Zero Blockchain Friction**: No gas fees, no wallet requirement, zero carbon footprint.
- **Revocation Transparency**: Audited registrar revocation log with reason codes (`ISSUED_IN_ERROR`, `AWARD_WITHDRAWN`, `FRAUD_FOUND`).
