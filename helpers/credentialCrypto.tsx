import {
  createHash,
  generateKeyPairSync,
  randomInt,
  sign,
  verify,
} from "node:crypto";
import { db, databaseUrl } from "./db";

// Resilient in-memory fallback store for hackathon demo when DATABASE_URL is not set
export type MemoryCredential = {
  credentialId: string;
  studentName: string;
  institution: string;
  programme: string;
  award: string;
  graduationYear: number;
  signature: string;
  recordHash: string;
  revokedAt: Date | null;
  revokeReason: string | null;
  createdAt: Date;
};

export type MemoryAudit = {
  id: number;
  event: string;
  credentialId: string;
  detail: string | null;
  createdAt: Date;
};

const memoryCredentials: MemoryCredential[] = [];
const memoryAuditLog: MemoryAudit[] = [];
let memoryKeys: { id: number; publicKeyPem: string; privateKeyPem: string } | null = null;
let auditIdSeq = 1;

export const isMemoryMode = () => !databaseUrl || databaseUrl.includes("missing:missing");

// BACKEND ONLY. Demo signing key lives in the database for the hackathon demo.
// Real use needs HSM / managed key storage (see PRD risk R4).

export const INSTITUTION = "DEMO INSTITUTION";

// No look-alike characters (0/O, 1/I/L). 12 characters from 31 is not guessable.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const makeId = () =>
  Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
export const newCredentialId = () => `CC-${makeId()}`;

export type RecordFields = {
  credentialId: string;
  studentName: string;
  institution: string;
  programme: string;
  award: string;
  graduationYear: number;
};

export function canonicalize(r: RecordFields): string {
  return JSON.stringify([
    "cheticheck.v1",
    r.credentialId,
    r.studentName,
    r.institution,
    r.programme,
    r.award,
    r.graduationYear,
  ]);
}

export const sha256Hex = (value: string) =>
  createHash("sha256").update(value, "utf8").digest("hex");

export async function getKeys() {
  if (isMemoryMode()) {
    if (!memoryKeys) {
      const { publicKey, privateKey } = generateKeyPairSync("ed25519");
      memoryKeys = {
        id: 1,
        publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
        privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
      };
    }
    return memoryKeys;
  }

  const existing = await db
    .selectFrom("demoKeys")
    .selectAll()
    .where("id", "=", 1)
    .executeTakeFirst();
  if (existing) return existing;

  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  await db
    .insertInto("demoKeys")
    .values({
      id: 1,
      publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
      privateKeyPem: privateKey
        .export({ type: "pkcs8", format: "pem" })
        .toString(),
    })
    .onConflict((oc) => oc.column("id").doNothing())
    .execute();
  return db
    .selectFrom("demoKeys")
    .selectAll()
    .where("id", "=", 1)
    .executeTakeFirstOrThrow();
}

export async function issueCredential(input: {
  studentName: string;
  programme: string;
  award: string;
  graduationYear: number;
}): Promise<string> {
  const keys = await getKeys();
  const record: RecordFields = {
    credentialId: newCredentialId(),
    institution: INSTITUTION,
    ...input,
  };
  const canonical = canonicalize(record);
  const signature = sign(
    null,
    Buffer.from(canonical, "utf8"),
    keys.privateKeyPem,
  ).toString("base64");
  const recordHash = sha256Hex(canonical);

  if (isMemoryMode()) {
    memoryCredentials.push({
      credentialId: record.credentialId,
      studentName: record.studentName,
      institution: record.institution,
      programme: record.programme,
      award: record.award,
      graduationYear: record.graduationYear,
      signature,
      recordHash,
      revokedAt: null,
      revokeReason: null,
      createdAt: new Date(),
    });
    memoryAuditLog.push({
      id: auditIdSeq++,
      event: "ISSUED",
      credentialId: record.credentialId,
      detail: `${record.award}, ${record.graduationYear}`,
      createdAt: new Date(),
    });
    return record.credentialId;
  }

  await db
    .insertInto("credentials")
    .values({
      credentialId: record.credentialId,
      studentName: record.studentName,
      institution: record.institution,
      programme: record.programme,
      award: record.award,
      graduationYear: record.graduationYear,
      signature,
      recordHash,
    })
    .execute();
  await db
    .insertInto("auditLog")
    .values({
      event: "ISSUED",
      credentialId: record.credentialId,
      detail: `${record.award}, ${record.graduationYear}`,
    })
    .execute();
  return record.credentialId;
}

export async function revokeCredential(
  credentialId: string,
  reason: string,
): Promise<boolean> {
  if (isMemoryMode()) {
    const found = memoryCredentials.find((c) => c.credentialId === credentialId);
    if (!found || found.revokedAt) return false;
    found.revokedAt = new Date();
    found.revokeReason = reason;
    memoryAuditLog.push({
      id: auditIdSeq++,
      event: "REVOKED",
      credentialId,
      detail: reason,
      createdAt: new Date(),
    });
    return true;
  }

  const res = await db
    .updateTable("credentials")
    .set({ revokedAt: new Date(), revokeReason: reason })
    .where("credentialId", "=", credentialId)
    .where("revokedAt", "is", null)
    .executeTakeFirst();
  if (Number(res.numUpdatedRows) === 0) return false;
  await db
    .insertInto("auditLog")
    .values({ event: "REVOKED", credentialId, detail: reason })
    .execute();
  return true;
}

export type VerifyStatus = "AUTHENTIC" | "ALTERED" | "REVOKED" | "NOT_FOUND";

export async function checkCredential(credentialId: string, fileHash?: string) {
  let row: MemoryCredential | undefined;

  if (isMemoryMode()) {
    row = memoryCredentials.find((c) => c.credentialId === credentialId);
  } else {
    const dbRow = await db
      .selectFrom("credentials")
      .selectAll()
      .where("credentialId", "=", credentialId)
      .executeTakeFirst();
    if (dbRow) {
      row = {
        credentialId: dbRow.credentialId,
        studentName: dbRow.studentName,
        institution: dbRow.institution,
        programme: dbRow.programme,
        award: dbRow.award,
        graduationYear: dbRow.graduationYear,
        signature: dbRow.signature,
        recordHash: dbRow.recordHash,
        revokedAt: dbRow.revokedAt,
        revokeReason: dbRow.revokeReason,
        createdAt: dbRow.createdAt,
      };
    }
  }

  if (!row) return { status: "NOT_FOUND" as VerifyStatus };

  const keys = await getKeys();
  const canonical = canonicalize(row);
  let signatureOk = false;
  try {
    signatureOk = verify(
      null,
      Buffer.from(canonical, "utf8"),
      keys.publicKeyPem,
      Buffer.from(row.signature, "base64"),
    );
  } catch {
    signatureOk = false;
  }

  let fileCheck: "MATCH" | "MISMATCH" | null = null;
  if (fileHash) {
    fileCheck = fileHash.toLowerCase() === row.recordHash ? "MATCH" : "MISMATCH";
  }

  let status: VerifyStatus = "AUTHENTIC";
  if (!signatureOk) status = "ALTERED";
  else if (row.revokedAt) status = "REVOKED";
  else if (fileCheck === "MISMATCH") status = "ALTERED";

  return {
    status,
    fileCheck,
    revokedAt: row.revokedAt,
    recordHash: row.recordHash,
    record: {
      studentName: row.studentName,
      institution: row.institution,
      award: row.award,
      graduationYear: row.graduationYear,
    },
  };
}

export async function ensureSeeded() {
  if (isMemoryMode()) {
    if (memoryCredentials.length > 0) return;
    await issueCredential({
      studentName: "Amina Wanjiru",
      programme: "Computer Science",
      award: "Bachelor of Science",
      graduationYear: 2025,
    });
    const revokedId = await issueCredential({
      studentName: "Brian Otieno",
      programme: "Information Technology",
      award: "Diploma",
      graduationYear: 2024,
    });
    await issueCredential({
      studentName: "Carol Njeri",
      programme: "Data Skills",
      award: "Short Course Certificate",
      graduationYear: 2026,
    });
    await revokeCredential(revokedId, "ISSUED_IN_ERROR");
    return;
  }

  const first = await db
    .selectFrom("credentials")
    .select("credentialId")
    .limit(1)
    .executeTakeFirst();
  if (first) return;
  await issueCredential({
    studentName: "Amina Wanjiru",
    programme: "Computer Science",
    award: "Bachelor of Science",
    graduationYear: 2025,
  });
  const revokedId = await issueCredential({
    studentName: "Brian Otieno",
    programme: "Information Technology",
    award: "Diploma",
    graduationYear: 2024,
  });
  await issueCredential({
    studentName: "Carol Njeri",
    programme: "Data Skills",
    award: "Short Course Certificate",
    graduationYear: 2026,
  });
  await revokeCredential(revokedId, "ISSUED_IN_ERROR");
}

export function getMemoryCredentials() {
  const credentials = [...memoryCredentials]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((c) => ({
      credentialId: c.credentialId,
      studentName: c.studentName,
      institution: c.institution,
      programme: c.programme,
      award: c.award,
      graduationYear: c.graduationYear,
      createdAt: c.createdAt,
      revokedAt: c.revokedAt,
      revokeReason: c.revokeReason,
    }));
  const audit = [...memoryAuditLog]
    .sort((a, b) => b.id - a.id)
    .slice(0, 40);
  return { credentials, audit };
}

export function getMemoryHolderRecord(credentialId: string) {
  const row = memoryCredentials.find((c) => c.credentialId === credentialId);
  if (!row) return null;
  return {
    credentialId: row.credentialId,
    studentName: row.studentName,
    institution: row.institution,
    programme: row.programme,
    award: row.award,
    graduationYear: row.graduationYear,
    issuedAt: row.createdAt,
    revokedAt: row.revokedAt,
    recordHash: row.recordHash,
    canonicalText: canonicalize(row),
  };
}

export function tamperMemoryCredential(credentialId: string): boolean {
  const row = memoryCredentials.find((c) => c.credentialId === credentialId);
  if (!row) return false;
  row.graduationYear += 1;
  memoryAuditLog.push({
    id: auditIdSeq++,
    event: "TAMPER_DEMO",
    credentialId,
    detail: "Stored year changed without re-signing (demo)",
    createdAt: new Date(),
  });
  return true;
}
