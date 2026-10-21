import superjson from "superjson";
import { revokeCredential } from "../../helpers/credentialCrypto";
import { schema, OutputType } from "./revoke_POST.schema";

export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const revoked = await revokeCredential(input.credentialId, input.reason);
    return new Response(superjson.stringify({ revoked } satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 },
    );
  }
}
