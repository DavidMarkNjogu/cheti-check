# ChetiCheck: Verifiable Education Records Specification & Problem Definition

**Project**: ChetiCheck  
**Conception Date**: Wednesday, October 7, 2026  
**Event**: Riara University Inter-University Design Thinking Hackathon 2026  
**Track**: EdTech Innovation and Cybersecurity  
**Author**: David Mark Njogu  

---

## 1. Executive Summary

Academic credential fraud is an escalating challenge across tertiary institutions and employer hiring pipelines in Kenya and East Africa. Fake degree certificates, manipulated grade transcripts, and doctored KCSE result slips undermine institutional credibility and disadvantage legitimate graduates. Current verification mechanisms are paper-bound, sluggish (taking between 2 to 6 weeks through university registrar back-offices), and vulnerable to insider bribery or unauthorized database modification.

ChetiCheck is a secure, privacy-preserving academic credential issuance and verification platform designed for Kenyan higher education institutions. Authorized university registrars issue digitally signed credentials embedded in high-density QR codes. Prospective employers, scholarship boards, and admissions officers can instantly verify the authenticity of a certificate in under 5 seconds using any standard camera or web browser, without exposing sensitive student personal data or creating centralised privacy honeypots.

---

## 2. Problem Framing & Design Thinking Canvas

### 2.1 The Problem Card
- **Who has the problem?**
  1. **Kenyan University Registrars**: Overwhelmed with manual, paper-based transcript verification requests from embassies, employers, and foreign universities.
  2. **Graduates and Job Applicants**: Suffer hiring delays and lost career opportunities while waiting for official verification letters.
  3. **Employers and HR Managers**: Risk hiring unqualified candidates due to undetectable forged certificates and fake diploma rings.
- **Where does it happen?**
  Recruitment screening desks, higher education admissions, regulatory compliance audits, and visa processing offices.
- **When does it happen?**
  During post-graduation recruitment drives, scholarship applications, and professional board licensures.
- **What is the core pain?**
  Verification currently requires a slow phone-home process to university registries. Furthermore, central databases are single points of failure, vulnerable to tampering, corruption, and systemic outages.
- **Why does it matter?**
  Trust in academic credentials is the foundation of economic meritocracy and professional safety in engineering, medicine, law, and education.

### 2.2 How Might We (HMW) Questions
1. *How might we enable employers to verify an academic certificate instantly without requiring direct database access to the university's internal records?*
2. *How might we cryptographically prove that a certificate has not been tampered with since issuance while protecting student privacy?*
3. *How might we provide universities with an immutable, zero-friction issuance workflow that integrates into existing registrar operations?*

---

## 3. Core System Architecture & Cryptographic Invariants

ChetiCheck operates on asymmetric cryptographic proof rather than centralized proprietary locks.

```
+-----------------------------------------------------------------------------------+
|                            CHETICHECK CORE LIFECYCLE                              |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ University Registrar ]                                                         |
|             |                                                                     |
|             v                                                                     |
|   1. Input Credential Details (Student Name, ID, Institution, Degree, Class)     |
|             |                                                                     |
|             v                                                                     |
|   2. Compute Canonical SHA-256 Digest of Normalized Credential Payload             |
|             |                                                                     |
|             v                                                                     |
|   3. Sign Digest using Institution's Cryptographic Key                            |
|             |                                                                     |
|             v                                                                     |
|   4. Generate Tamper-Evident QR Code & Issue Verifiable Certificate               |
|             |                                                                     |
|             v                                                                     |
|   [ Public Verification Portal ] <--- (Scanned by Employer / Verifier)            |
|             |                                                                     |
|             v                                                                     |
|   5. Recompute Payload SHA-256 Digest & Validate Signature                        |
|             |                                                                     |
|             +---> VALID: Certificate is authentic, unmanipulated, active         |
|             +---> TAMPERED: Hash mismatch detected, red alert triggered          |
|             +---> REVOKED: Issuer marked record revoked                          |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### 3.1 Key Technical Invariants
1. **Canonical Payload Hashing**: The certificate metadata must be serialized into a deterministic canonical string before SHA-256 hashing to prevent whitespace or key-ordering discrepancies.
2. **Asymmetric Verification**: Verifiers require only the issuer's public key or verification endpoint; private signing keys never leave the secure server environment.
3. **Privacy by Design**: Verification checks confirm validity without exposing extraneous personal identifiable information (PII) to unauthorized parties.
4. **Instant Tamper Detection**: Any modification of student name, graduation year, degree classification, or issuing department invalidates the cryptographic signature immediately.

---

## 4. Prototype Scope (Hackathon Deliverables)

1. **Issuer Portal**: Secure dashboard for registrars to issue verifiable degrees, view registry statistics, and revoke credentials.
2. **Public Certificate View**: Responsive, high-fidelity certificate display with QR badge and printable graduation styling.
3. **Public Verification Portal**: Instant camera/URL scanner that parses the payload, tests the cryptographic signature, and displays an animated verdict stamp (Authentic, Altered, Revoked).
4. **Interactive Tamper Demo**: Live interactive demonstration tool allowing judges and testers to alter a single character in the certificate data and observe the cryptographic verification engine detect the tampering instantly.
