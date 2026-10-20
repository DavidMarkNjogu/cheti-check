import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  studentName: z.string().trim().min(2).max(120),
  programme: z.string().trim().min(2).max(160),
  award: z.string().trim().min(2).max(160),
  graduationYear: z.number().int().min(1990).max(2100),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { credentialId: string };

export const postIssue = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validated = schema.parse(body);
  const result = await fetch(`/_api/credentials/issue`, {
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
