import superjson from "superjson";
import { db } from "../../helpers/db";
import {
  ensureSeeded,
  isMemoryMode,
  getMemoryCredentials,
} from "../../helpers/credentialCrypto";
import { OutputType } from "./list_GET.schema";

export async function handle(request: Request) {
  try {
    await ensureSeeded();
    if (isMemoryMode()) {
      return new Response(
        superjson.stringify(getMemoryCredentials() satisfies OutputType),
      );
    }
    const credentials = await db
      .selectFrom("credentials")
      .select([
        "credentialId",
        "studentName",
        "institution",
        "programme",
        "award",
        "graduationYear",
        "createdAt",
        "revokedAt",
        "revokeReason",
      ])
      .orderBy("createdAt", "desc")
      .execute();
    const audit = await db
      .selectFrom("auditLog")
      .selectAll()
      .orderBy("id", "desc")
      .limit(40)
      .execute();
    return new Response(
      superjson.stringify({ credentials, audit } satisfies OutputType),
    );
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 },
    );
  }
}
