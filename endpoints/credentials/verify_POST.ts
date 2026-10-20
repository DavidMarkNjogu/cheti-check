import superjson from "superjson";
import { checkCredential } from "../../helpers/credentialCrypto";
import { schema, OutputType } from "./verify_POST.schema";

export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const result = await checkCredential(input.credentialId, input.fileHash);
    return new Response(
      superjson.stringify({ ...result, checkedAt: new Date() } satisfies OutputType),
    );
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 },
    );
  }
}
