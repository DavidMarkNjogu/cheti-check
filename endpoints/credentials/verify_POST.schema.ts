import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  credentialId: z.string().trim().min(4).max(64),
  fileHash: z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/)
    .optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  status:
    | "AUTHENTIC"
    | "ALTERED"
    | "REVOKED"
    | "NOT_FOUND"
    | "AUTHENTIC_COPY"
    | "ALTERED_COPY"
    | "COPY_DEACTIVATED";
  fileCheck?: "MATCH" | "MISMATCH" | null;
  revokedAt?: Date | null;
  recordHash?: string;
  copy?: {
    copyId: string;
    recipientName: string;
    purpose: string;
    deactivatedAt: Date | null;
    createdAt: Date;
  };
  forensicAttribution?: {
    copyId: string;
    recipientName: string;
    leakedAt: Date;
  };
  record?: {
    studentName: string;
    institution: string;
    award: string;
    graduationYear: number;
  };
  checkedAt: Date;
};

export const postVerify = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validated = schema.parse(body);
  const result = await fetch(`/_api/credentials/verify`, {
    method: "POST",
    body: superjson.stringify(validated),
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
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
