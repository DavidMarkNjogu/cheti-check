import superjson from "superjson";

export type CredentialSummary = {
  credentialId: string;
  studentName: string;
  institution: string;
  programme: string;
  award: string;
  graduationYear: number;
  createdAt: Date;
  revokedAt: Date | null;
  revokeReason: string | null;
};

export type AuditEntry = {
  id: number;
  event: string;
  credentialId: string;
  detail: string | null;
  createdAt: Date;
};

export type OutputType = {
  credentials: CredentialSummary[];
  audit: AuditEntry[];
};

export const getCredentialsList = async (
  init?: RequestInit,
): Promise<OutputType> => {
  const result = await fetch(`/_api/credentials/list`, {
    method: "GET",
    ...init,
  });
  const text = await result.text();
  if (!result.ok) {
    try {
      const err = superjson.parse<{ error: string }>(text);
      throw new Error(err.error || `HTTP ${result.status}`);
    } catch (e) {
      if (e instanceof Error && e.message && !e.message.includes("is not valid JSON")) {
        throw e;
      }
      throw new Error(text.slice(0, 160) || `HTTP ${result.status}`);
    }
  }
  return superjson.parse<OutputType>(text);
};
