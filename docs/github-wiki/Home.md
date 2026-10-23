# ChetiCheck Architectural Wiki

Welcome to the **ChetiCheck** Knowledge Base on GitHub.

ChetiCheck is an asymmetric cryptographic credential issuance and verification platform engineered for Kenyan higher education institutions.

---

### Quick Navigation
- [[The KNEC Monopoly Myth|KNEC-vs-ChetiCheck]]
- [[Cryptographic Verification & Architecture|Cryptographic-Verification]]
- [[Judge Defense Manual|Judge-Defense]]

---

### The Problem in Kenyan Higher Education
According to the Kenya National Qualifications Authority (KNQA), an estimated 1 in 3 academic certificates presented to Kenyan employers contains discrepancies or is completely forged. 

When corporate recruiters or government agencies attempt to verify a bachelor's degree, manual registry clearance takes **2 to 6 weeks**, costs **KES 2,300+**, and relies on physical paper records vulnerable to photoshop forgery and rogue employee bribes.

### How ChetiCheck Solves It
1. **Asymmetric Cryptography (Ed25519)**: The university seals the degree with its private key.
2. **Instant 200ms Verification**: Anyone can scan the QR code with a standard smartphone camera to verify the signature against the university's public key.
3. **100% Offline Capable**: Verification executes mathematically on the verifier's phone without requiring active cloud connectivity.
4. **Zero Gas Fees & Privacy Compliant**: Bypasses the gas fees and permanent data exposure risks of public blockchains, complying fully with Section 35 of the Kenya Data Protection Act 2019.
