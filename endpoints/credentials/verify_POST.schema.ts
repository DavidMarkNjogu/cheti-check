import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  credentialId: z.string().trim().min(4).max(40),
  fileHash: z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/)
    .optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  status: "AUTHENTIC" | "ALTERED" | "REVOKED" | "NOT_FOUND";
  fileCheck?: "MATCH" | "MISMATCH" | null;
  revokedAt?: Date | null;
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
  if (!result.ok) {
    const err = superjson.parse<{ error: string }>(await result.text());
    throw new Error(err.error);
  }
  return superjson.parse<OutputType>(await result.text());
};
