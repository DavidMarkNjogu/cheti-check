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
  if (!result.ok) {
    const err = superjson.parse<{ error: string }>(await result.text());
    throw new Error(err.error);
  }
  return superjson.parse<OutputType>(await result.text());
};
