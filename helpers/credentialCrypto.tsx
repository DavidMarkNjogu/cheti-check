import {
  createHash,
  generateKeyPairSync,
  randomInt,
  sign,
  verify,
} from "node:crypto";
import { db } from "./db";

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
      recordHash: sha256Hex(canonical),
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
  const row = await db
    .selectFrom("credentials")
    .selectAll()
    .where("credentialId", "=", credentialId)
    .executeTakeFirst();
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
    record: {
      studentName: row.studentName,
      institution: row.institution,
      award: row.award,
      graduationYear: row.graduationYear,
    },
  };
}

export async function ensureSeeded() {
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
