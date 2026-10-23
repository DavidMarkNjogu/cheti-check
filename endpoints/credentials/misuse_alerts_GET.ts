import superjson from "superjson";
import { listMisuseIncidents } from "../../helpers/credentialCrypto";
import { OutputType } from "./misuse_alerts_GET.schema";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const credentialId = url.searchParams.get("credentialId") ?? undefined;
    const incidents = listMisuseIncidents(credentialId);
    return new Response(superjson.stringify({ incidents } satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 400 },
    );
  }
}
