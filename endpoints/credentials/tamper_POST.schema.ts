import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  credentialId: z.string().min(4).max(40),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { tampered: boolean };

export const postTamper = async (
  body: InputType,
  init?: RequestInit,
): Promise<OutputType> => {
  const validated = schema.parse(body);
  const result = await fetch(`/_api/credentials/tamper`, {
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
