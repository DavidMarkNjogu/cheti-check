import { createServer } from "node:http";
import { createHash } from "node:crypto";
import superjson from "superjson";
import * as apiMod from "./api/index";
const handler: any = (apiMod as any).default?.default ?? (apiMod as any).default;

const srv = createServer((req, res) => void handler(req, res));
await new Promise<void>((r) => srv.listen(8788, r));
const base = "http://127.0.0.1:8788";
let pass = 0, fail = 0;
const check = (name: string, ok: boolean, extra?: unknown) => {
  (ok ? pass++ : fail++);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + JSON.stringify(extra)}`);
};
const call = async (method: string, path: string, body?: unknown) => {
  const r = await fetch(`${base}/api/index?path=${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : superjson.stringify(body),
  });
  const text = await r.text();
  let data: any; try { data = superjson.parse(text); } catch { data = text; }
  return { status: r.status, data, raw: text };
};
const verify = (credentialId: string, fileHash?: string) => call("POST", "credentials/verify", { credentialId, fileHash });

let r = await call("GET", "credentials/list");
check("list seeds 3 demo credentials", r.status === 200 && r.data.credentials?.length === 3, r);
const creds = r.data.credentials as any[];
const revoked = creds.filter((c) => c.revokedAt);
check("exactly one seeded credential is revoked", revoked.length === 1, creds);
const amina = creds.find((c) => c.studentName === "Amina Wanjiru");
const brian = creds.find((c) => c.studentName === "Brian Otieno");
check("all records are DEMO INSTITUTION", creds.every((c) => c.institution === "DEMO INSTITUTION"), creds);

r = await verify(amina.credentialId);
check("valid credential -> AUTHENTIC", r.data.status === "AUTHENTIC" && r.data.record?.studentName === "Amina Wanjiru", r);
check("verify shows only name, institution, award, year", JSON.stringify(Object.keys(r.data.record).sort()) === JSON.stringify(["award", "graduationYear", "institution", "studentName"]), r.data.record);
check("verify response never carries a revoke reason or signature", !/reason|signature|ISSUED_IN_ERROR|privateKey/i.test(r.raw), r.raw.slice(0, 300));
r = await verify(brian.credentialId);
check("revoked credential -> REVOKED with date", r.data.status === "REVOKED" && !!r.data.revokedAt, r);
check("REVOKED response hides the reason code", !/ISSUED_IN_ERROR|reason/i.test(r.raw), r.raw.slice(0, 300));
r = await verify("CC-ZZZZZZZZZZZZ");
check("unknown id -> NOT_FOUND", r.data.status === "NOT_FOUND", r);

r = await call("POST", "credentials/issue", { studentName: "Test Student", programme: "Testing", award: "Certificate", graduationYear: 2026 });
const id = r.data.credentialId as string;
check("issue returns a non-guessable id", r.status === 200 && /^CC-[2-9A-HJKMNP-Z]{12}$/.test(id), r);
r = await verify(id);
check("new credential verifies AUTHENTIC", r.data.status === "AUTHENTIC", r);

r = await call("POST", "credentials/holder", { credentialId: id });
const h = r.data;
const hash = createHash("sha256").update(h.canonicalText, "utf8").digest("hex");
check("holder view returns canonical text whose SHA-256 equals the stored hash", r.status === 200 && hash === h.recordHash, h);
r = await verify(id, h.recordHash);
check("file check with the right hash -> AUTHENTIC + MATCH", r.data.status === "AUTHENTIC" && r.data.fileCheck === "MATCH", r);
r = await verify(id, "a".repeat(64));
check("file check with a wrong hash -> ALTERED + MISMATCH", r.data.status === "ALTERED" && r.data.fileCheck === "MISMATCH", r);

r = await call("POST", "credentials/tamper", { credentialId: id });
check("tamper demo edits the stored record", r.data.tampered === true, r);
r = await verify(id);
check("tampered record -> ALTERED (signature no longer matches)", r.data.status === "ALTERED", r);

r = await call("POST", "credentials/revoke", { credentialId: amina.credentialId, reason: "FRAUD_FOUND" });
check("revoke succeeds", r.data.revoked === true, r);
r = await verify(amina.credentialId);
check("revoked -> REVOKED", r.data.status === "REVOKED", r);
r = await call("POST", "credentials/revoke", { credentialId: amina.credentialId, reason: "FRAUD_FOUND" });
check("revoking twice returns revoked:false", r.data.revoked === false, r);
r = await call("POST", "credentials/revoke", { credentialId: amina.credentialId, reason: "NOT_A_REASON" });
check("unknown reason code rejected (400)", r.status === 400, r);

r = await call("POST", "credentials/issue", { studentName: "A", programme: "x", award: "y", graduationYear: 2026 });
check("short student name rejected (400)", r.status === 400, r);
r = await call("POST", "credentials/verify", { credentialId: id, fileHash: "xyz" });
check("malformed file hash rejected (400)", r.status === 400, r);
r = await call("POST", "credentials/holder", { credentialId: "CC-NOPENOPENOPE" });
check("holder for unknown id -> 404", r.status === 404, r);
r = await call("GET", "credentials/nothing");
check("unknown endpoint -> 404", r.status === 404, r);

r = await call("GET", "credentials/list");
const ev = (r.data.audit as any[]).map((a) => a.event);
check("audit log has issue, revoke and tamper events", ev.filter((e) => e === "ISSUED").length === 4 && ev.includes("REVOKED") && ev.includes("TAMPER_DEMO"), ev);
check("list shows 4 credentials after seeding (no re-seed)", r.data.credentials.length === 4, r.data.credentials.length);

console.log(`\n${pass} passed, ${fail} failed`);
srv.close();
process.exit(fail ? 1 : 0);
