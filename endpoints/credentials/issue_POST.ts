import superjson from "superjson";
import { issueCredential } from "../../helpers/credentialCrypto";
import { schema, OutputType } from "./issue_POST.schema";

export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const credentialId = await issueCredential(input);
    return new Response(superjson.stringify({ credentialId } satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 },
    );
  }
}
