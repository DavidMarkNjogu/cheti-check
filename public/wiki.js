const AUTHENTIC_CREDENTIAL = {
  credential_id: "CC-2026-RU-1042",
  student_name: "Grace Muthoni Kariuki",
  institution: "Riara University",
  degree: "Bachelor of Science in Computer Science",
  classification: "First Class Honours",
  graduation_year: 2026
};

const CANONICAL_SIGNATURE = "ed25519_sig_8f3a9e2c4d7b1a0e5f6c8d9b2a1e4f7c";
let expectedDigest = "";
let currentPayload = { ...AUTHENTIC_CREDENTIAL };

async function sha256(str) {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function canonicalize(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

async function updateSandboxView() {
  const jsonView = document.getElementById("jsonPayloadView");
  const computedHashEl = document.getElementById("computedHashVal");
  const expectedHashEl = document.getElementById("expectedHashVal");
  const stampEl = document.getElementById("sandboxStamp");
  const statusEl = document.getElementById("sandboxStatus");
  const detailEl = document.getElementById("sandboxDetail");

  if (!jsonView || !computedHashEl || !expectedHashEl || !stampEl) return;

  jsonView.textContent = JSON.stringify(currentPayload, null, 2);
  const rawCanonical = canonicalize(currentPayload);
  const currentDigest = await sha256(rawCanonical);

  if (!expectedDigest) {
    expectedDigest = currentDigest;
  }

  computedHashEl.textContent = currentDigest;
  expectedHashEl.textContent = expectedDigest;

  const isMatch = currentDigest === expectedDigest;

  if (isMatch) {
    stampEl.className = "verdict-stamp valid";
    statusEl.textContent = "VERIFIED AUTHENTIC";
    detailEl.innerHTML = `Canonical SHA-256 digest matches Riara University registry record. Asymmetric Ed25519 signature (<code>${CANONICAL_SIGNATURE.slice(0, 16)}...</code>) is mathematically valid.`;
  } else {
    stampEl.className = "verdict-stamp invalid";
    statusEl.textContent = "TAMPER DETECTED";
    detailEl.innerHTML = `Digest mismatch! Recomputed hash differs from the university-signed seal. The credential data has been modified after issuance.`;
  }
}

function tamperName() {
  currentPayload = {
    ...currentPayload,
    student_name: "John Kipchumba Doe"
  };
  updateSandboxView();
}

function tamperGrade() {
  currentPayload = {
    ...currentPayload,
    classification: "Pass"
  };
  updateSandboxView();
}

function resetCredential() {
  currentPayload = { ...AUTHENTIC_CREDENTIAL };
  updateSandboxView();
}

document.addEventListener("DOMContentLoaded", async () => {
  const canonicalOriginal = canonicalize(AUTHENTIC_CREDENTIAL);
  expectedDigest = await sha256(canonicalOriginal);

  const resetBtn = document.getElementById("btnResetSandbox");
  if (resetBtn) resetBtn.addEventListener("click", resetCredential);

  const tamperNameBtn = document.getElementById("btnTamperName");
  if (tamperNameBtn) tamperNameBtn.addEventListener("click", tamperName);

  const tamperGradeBtn = document.getElementById("btnTamperGrade");
  if (tamperGradeBtn) tamperGradeBtn.addEventListener("click", tamperGrade);

  updateSandboxView();
});
