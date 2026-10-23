import superjson from "superjson";
import { createApplicationCopy } from "../../helpers/credentialCrypto";
import { schema, OutputType } from "./create_copy_POST.schema";

export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const copy = await createApplicationCopy({
      credentialId: input.credentialId,
      recipientName: input.recipientName,
      purpose: input.purpose,
    });
    return new Response(superjson.stringify({ copy } satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 },
    );
  }
}
