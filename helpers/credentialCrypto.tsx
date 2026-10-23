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

export type ApplicationCopy = {
  copyId: string;
  credentialId: string;
  recipientName: string;
  purpose: string;
  copyHash: string;
  createdAt: Date;
  deactivatedAt: Date | null;
};

export type MisuseIncident = {
  id: number;
  copyId: string;
  credentialId: string;
  recipientName: string;
  studentName: string;
  mismatches: string[];
  status: "ACTIVE_ALERT" | "INVESTIGATING" | "RESOLVED";
  detectedAt: Date;
};

const memoryCredentials: MemoryCredential[] = [];
const memoryAuditLog: MemoryAudit[] = [];
const memoryCopies: ApplicationCopy[] = [];
const memoryMisuseIncidents: MisuseIncident[] = [];
let memoryKeys: { id: number; publicKeyPem: string; privateKeyPem: string } | null = null;
let auditIdSeq = 1;
let misuseIdSeq = 1;

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

export type VerifyStatus =
  | "AUTHENTIC"
  | "ALTERED"
  | "REVOKED"
  | "NOT_FOUND"
  | "AUTHENTIC_COPY"
  | "ALTERED_COPY"
  | "COPY_DEACTIVATED";

export async function createApplicationCopy(input: {
  credentialId: string;
  recipientName: string;
  purpose: string;
}): Promise<ApplicationCopy> {
  const slug = input.recipientName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
  const copyId = `${input.credentialId}-CPY-${slug || "APP"}-${makeId().slice(0, 4)}`;
  const copyHash = sha256Hex(`${input.credentialId}:${input.recipientName}:${input.purpose}`);

  const copy: ApplicationCopy = {
    copyId,
    credentialId: input.credentialId,
    recipientName: input.recipientName,
    purpose: input.purpose,
    copyHash,
    createdAt: new Date(),
    deactivatedAt: null,
  };

  if (isMemoryMode()) {
    memoryCopies.push(copy);
    memoryAuditLog.push({
      id: auditIdSeq++,
      event: "COPY_GENERATED",
      credentialId: input.credentialId,
      detail: `Application copy generated for ${input.recipientName} (${input.purpose})`,
      createdAt: new Date(),
    });
    return copy;
  }

  await db
    .insertInto("applicationCopies" as any)
    .values({
      copyId: copy.copyId,
      credentialId: copy.credentialId,
      recipientName: copy.recipientName,
      purpose: copy.purpose,
      copyHash: copy.copyHash,
      createdAt: copy.createdAt,
    } as any)
    .execute();

  await db
    .insertInto("auditLog")
    .values({
      event: "COPY_GENERATED",
      credentialId: input.credentialId,
      detail: `Application copy generated for ${input.recipientName} (${input.purpose})`,
    })
    .execute();

  return copy;
}

export async function deactivateCopy(copyId: string): Promise<boolean> {
  if (isMemoryMode()) {
    const found = memoryCopies.find((c) => c.copyId === copyId);
    if (!found || found.deactivatedAt) return false;
    found.deactivatedAt = new Date();
    memoryAuditLog.push({
      id: auditIdSeq++,
      event: "COPY_DEACTIVATED",
      credentialId: found.credentialId,
      detail: `Application copy ${copyId} for ${found.recipientName} deactivated by graduate`,
      createdAt: new Date(),
    });
    return true;
  }

  const res = await db
    .updateTable("applicationCopies" as any)
    .set({ deactivatedAt: new Date() } as any)
    .where("copyId", "=", copyId)
    .where("deactivatedAt", "is", null)
    .executeTakeFirst();

  return Number(res.numUpdatedRows) > 0;
}

export function listApplicationCopies(credentialId?: string): ApplicationCopy[] {
  if (credentialId) {
    return memoryCopies.filter((c) => c.credentialId === credentialId);
  }
  return [...memoryCopies];
}

export function listMisuseIncidents(credentialId?: string): MisuseIncident[] {
  if (credentialId) {
    return memoryMisuseIncidents.filter((m) => m.credentialId === credentialId);
  }
  return [...memoryMisuseIncidents];
}

export function tamperCopy(copyId: string): boolean {
  const copy = memoryCopies.find((c) => c.copyId === copyId);
  if (!copy) return false;
  const root = memoryCredentials.find((c) => c.credentialId === copy.credentialId);
  if (!root) return false;

  // Log a simulated misuse incident
  const incident: MisuseIncident = {
    id: misuseIdSeq++,
    copyId: copy.copyId,
    credentialId: copy.credentialId,
    recipientName: copy.recipientName,
    studentName: root.studentName,
    mismatches: [
      `Award altered: Expected '${root.award}', submitted as 'First Class Distinction'`,
      `Graduation year altered: Expected ${root.graduationYear}, submitted as ${root.graduationYear - 1}`,
    ],
    status: "ACTIVE_ALERT",
    detectedAt: new Date(),
  };
  memoryMisuseIncidents.unshift(incident);

  memoryAuditLog.push({
    id: auditIdSeq++,
    event: "MISUSE_FLAGGED",
    credentialId: copy.credentialId,
    detail: `Forensic alert: Altered copy ${copy.copyId} issued to ${copy.recipientName} uploaded for verification`,
    createdAt: new Date(),
  });

  return true;
}

export async function checkCredential(credentialId: string, fileHash?: string) {
  // Check if this is an application copy
  let matchedCopy = memoryCopies.find((c) => c.copyId === credentialId);
  let effectiveCredentialId = matchedCopy ? matchedCopy.credentialId : credentialId;

  let row: MemoryCredential | undefined;

  if (isMemoryMode()) {
    row = memoryCredentials.find((c) => c.credentialId === effectiveCredentialId);
  } else {
    const dbRow = await db
      .selectFrom("credentials")
      .selectAll()
      .where("credentialId", "=", effectiveCredentialId)
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

  if (matchedCopy) {
    if (matchedCopy.deactivatedAt) {
      status = "COPY_DEACTIVATED";
    } else if (!signatureOk || fileCheck === "MISMATCH") {
      status = "ALTERED_COPY";
      // Record misuse incident
      const existing = memoryMisuseIncidents.find((m) => m.copyId === matchedCopy!.copyId);
      if (!existing) {
        memoryMisuseIncidents.unshift({
          id: misuseIdSeq++,
          copyId: matchedCopy.copyId,
          credentialId: matchedCopy.credentialId,
          recipientName: matchedCopy.recipientName,
          studentName: row.studentName,
          mismatches: [
            "Cryptographic signature check failed or file hash mismatch against issuer records",
          ],
          status: "ACTIVE_ALERT",
          detectedAt: new Date(),
        });
      }
    } else if (row.revokedAt) {
      status = "REVOKED";
    } else {
      status = "AUTHENTIC_COPY";
    }
  } else {
    if (!signatureOk) status = "ALTERED";
    else if (row.revokedAt) status = "REVOKED";
    else if (fileCheck === "MISMATCH") status = "ALTERED";
  }

  return {
    status,
    fileCheck,
    revokedAt: row.revokedAt,
    recordHash: row.recordHash,
    copy: matchedCopy
      ? {
          copyId: matchedCopy.copyId,
          recipientName: matchedCopy.recipientName,
          purpose: matchedCopy.purpose,
          deactivatedAt: matchedCopy.deactivatedAt,
          createdAt: matchedCopy.createdAt,
        }
      : undefined,
    forensicAttribution:
      matchedCopy && status === "ALTERED_COPY"
        ? {
            copyId: matchedCopy.copyId,
            recipientName: matchedCopy.recipientName,
            leakedAt: matchedCopy.createdAt,
          }
        : undefined,
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
    const graceId = await issueCredential({
      studentName: "Grace Muthoni Kariuki",
      programme: "Computer Science",
      award: "Bachelor of Science in Computer Science",
      graduationYear: 2026,
    });
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

    // Seed application copies for Grace
    const safaricomCopy = await createApplicationCopy({
      credentialId: graceId,
      recipientName: "Safaricom PLC",
      purpose: "Graduate Software Engineer Trainee 2026",
    });
    await createApplicationCopy({
      credentialId: graceId,
      recipientName: "KCB Bank Kenya",
      purpose: "Junior Cloud Infrastructure Analyst",
    });

    // Seed a simulated misuse incident for demonstration
    memoryMisuseIncidents.push({
      id: misuseIdSeq++,
      copyId: safaricomCopy.copyId,
      credentialId: graceId,
      recipientName: "Safaricom PLC",
      studentName: "Grace Muthoni Kariuki",
      mismatches: [
        "Classification altered: Expected 'First Class Honours', received 'Executive Distinction'",
        "Graduation year altered: Expected 2026, received 2024",
      ],
      status: "ACTIVE_ALERT",
      detectedAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    });

    return;
  }

  const first = await db
    .selectFrom("credentials")
    .select("credentialId")
    .limit(1)
    .executeTakeFirst();
  if (first) return;
  const graceId = await issueCredential({
    studentName: "Grace Muthoni Kariuki",
    programme: "Computer Science",
    award: "Bachelor of Science in Computer Science",
    graduationYear: 2026,
  });
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

  await createApplicationCopy({
    credentialId: graceId,
    recipientName: "Safaricom PLC",
    purpose: "Graduate Software Engineer Trainee 2026",
  });
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
  const copies = [...memoryCopies]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const misuseIncidents = [...memoryMisuseIncidents]
    .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  return { credentials, audit, copies, misuseIncidents };
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
