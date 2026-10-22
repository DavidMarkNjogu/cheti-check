import superjson from "superjson";
import { sql } from "kysely";
import { db } from "../../helpers/db";
import {
  isMemoryMode,
  tamperMemoryCredential,
} from "../../helpers/credentialCrypto";
import { schema, OutputType } from "./tamper_POST.schema";

// DEMO ONLY: edits a stored record WITHOUT re-signing, to show the ALTERED state.
export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    if (isMemoryMode()) {
      const tampered = tamperMemoryCredential(input.credentialId);
      return new Response(superjson.stringify({ tampered } satisfies OutputType));
    }

    const res = await db
      .updateTable("credentials")
      .set({ graduationYear: sql<number>`graduation_year + 1` })
      .where("credentialId", "=", input.credentialId)
      .executeTakeFirst();
    const tampered = Number(res.numUpdatedRows) > 0;
    if (tampered) {
      await db
        .insertInto("auditLog")
        .values({
          event: "TAMPER_DEMO",
          credentialId: input.credentialId,
          detail: "Stored year changed without re-signing (demo)",
        })
        .execute();
    }
    return new Response(superjson.stringify({ tampered } satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 },
    );
  }
}
