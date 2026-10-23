# Cryptographic Verification & Architecture

This guide explains the technical and cryptographic specifications powering ChetiCheck's verifiable credential issuance and offline validation engine.

---

## 1. Asymmetric Digital Signature Flow

ChetiCheck uses asymmetric cryptography based on the **Ed25519** signature scheme (Edwards-curve Digital Signature Algorithm over Curve25519) combined with **SHA-256** canonical message digests.

```text
[Registrar Input] 
       ↓
[Canonical JSON Serialization (RFC 8785)] 
       ↓
[SHA-256 Digest Computation] 
       ↓
[Ed25519 Private Key Signing] 
       ↓
[Signed Credential Payload Embedded in QR / .cheti.json]
```

### Why Ed25519?
- **Small Signature Size**: 64-byte signatures and 32-byte public keys fit comfortably into standard printable QR codes.
- **High Performance**: Over 50,000 signature verifications per second on modern hardware, allowing instant (under 2ms) evaluation in browser WebAssembly / JavaScript.
- **Side-Channel & Collision Resistance**: Immune to timing attacks and cache-collision vulnerabilities common in legacy RSA implementations.

---

## 2. Canonical JSON Serialization (RFC 8785)

In standard JSON, key order and whitespace can vary arbitrarily:
```json
{"name": "Grace", "degree": "BSc"} vs {"degree": "BSc", "name": "Grace"}
```
If hashed naively, these two identical payloads would produce completely different cryptographic digests.

ChetiCheck implements strict deterministic canonicalization:
1. Object keys are sorted lexicographically by Unicode code point.
2. All non-semantic whitespace is stripped.
3. Numbers and UTF-8 characters are encoded deterministically.

```javascript
function canonicalize(payload) {
  return JSON.stringify(payload, Object.keys(payload).sort());
}
```

---

## 3. Credential Payload Schema

A ChetiCheck signed credential contains the following fields:

```json
{
  "credential_id": "CC-2026-RU-1042",
  "issuer_did": "did:cheti:ru:ke",
  "institution_name": "Riara University",
  "student_name": "Grace Muthoni Kariuki",
  "student_id": "RU-CS-2022-1042",
  "degree": "Bachelor of Science in Computer Science",
  "classification": "First Class Honours",
  "graduation_year": 2026,
  "issuance_date": "2026-10-22T08:30:00Z",
  "public_key": "ed25519:0x8f3c7a1e4b9d2f60...",
  "signature": "0x5a1e8c9d2f3a4b5c6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d..."
}
```

---

## 4. Verification Algorithm (Zero Network Round-Trips)

When an employer scans the QR code or uploads the `.cheti.json` credential:

1. **Extraction**: The verifier extracts the payload fields and the signature string.
2. **Digest Recomputation**: The verifier canonicalizes the payload (excluding the signature) and computes `H_client = SHA-256(canonicalPayload)`.
3. **Mathematical Verification**: Using the university's known public key `PK_uni`, the verifier checks:
   $$\text{Verify}(PK_{uni}, H_{client}, \text{Signature}) \stackrel{?}{=} \text{True}$$
4. **Verdict Generation**:
   - If `True`: The credential is mathematically guaranteed to be issued by the university and unaltered by even 1 single byte.
   - If `False`: Any modification to name, graduation year, or grade classification triggers an immediate cryptographic failure.

---

## 5. Revocation & Tamper Detection Model

While cryptographic verification confirms that a credential is un-altered, universities occasionally revoke degrees (e.g., student disciplinary findings).

ChetiCheck employs a privacy-preserving revocation registry:
- **Offline Mode**: Confirms signature authenticity and data integrity.
- **Online Pulse**: Queries the university's lightweight revocation endpoint (`/api/revocations?id=CC-2026-RU-1042`).
- If revoked, the verification screen immediately displays an amber warning badge stating the revocation timestamp and reason without disclosing irrelevant student history.
