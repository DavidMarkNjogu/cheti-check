import superjson from "superjson";
import { deactivateCopy } from "../../helpers/credentialCrypto";
import { schema, OutputType } from "./deactivate_copy_POST.schema";

export async function handle(request: Request) {
  try {
    const input = schema.parse(superjson.parse(await request.text()));
    const success = await deactivateCopy(input.copyId);
    return new Response(superjson.stringify({ success } satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 },
    );
  }
}
