import superjson from "superjson";
import { listApplicationCopies } from "../../helpers/credentialCrypto";
import { OutputType } from "./copies_GET.schema";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const credentialId = url.searchParams.get("credentialId") ?? undefined;
    const copies = listApplicationCopies(credentialId);
    return new Response(superjson.stringify({ copies } satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 },
    );
  }
}
