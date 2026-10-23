import superjson from "superjson";
import { ApplicationCopySummary } from "./list_GET.schema";

export type OutputType = {
  copies: ApplicationCopySummary[];
};

export const getCopies = async (
  credentialId?: string,
  init?: RequestInit,
): Promise<OutputType> => {
  const query = credentialId ? `?credentialId=${encodeURIComponent(credentialId)}` : "";
  const result = await fetch(`/_api/credentials/copies${query}`, {
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
