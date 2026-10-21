import superjson from "superjson";
import { db } from "../../helpers/db";
import { canonicalize } from "../../helpers/credentialCrypto";
import { schema, OutputType } from "./holder_POST.schema";

export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const row = await db
      .selectFrom("credentials")
      .selectAll()
      .where("credentialId", "=", input.credentialId)
      .executeTakeFirst();
    if (!row) {
      return new Response(superjson.stringify({ error: "Credential not found" }), {
        status: 404,
      });
    }
    // canonicalText is the issued record at signing time, rebuilt from the stored hash source.
    // It is what the holder downloads and what a verifier can upload for the file check.
    const out = {
      credentialId: row.credentialId,
      studentName: row.studentName,
      institution: row.institution,
      programme: row.programme,
      award: row.award,
      graduationYear: row.graduationYear,
      issuedAt: row.createdAt,
      revokedAt: row.revokedAt,
      recordHash: row.recordHash,
      canonicalText: canonicalize(row),
    } satisfies OutputType;
    return new Response(superjson.stringify(out));
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 },
    );
  }
}
