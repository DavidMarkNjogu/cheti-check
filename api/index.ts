import type { IncomingMessage, ServerResponse } from "node:http";
import { ensureSchema } from "../helpers/ensureSchema";
import * as listGet from "../endpoints/credentials/list_GET";
import * as issuePost from "../endpoints/credentials/issue_POST";
import * as revokePost from "../endpoints/credentials/revoke_POST";
import * as tamperPost from "../endpoints/credentials/tamper_POST";
import * as verifyPost from "../endpoints/credentials/verify_POST";
import * as holderPost from "../endpoints/credentials/holder_POST";

type Handle = (request: Request) => Promise<Response>;

const routes: Record<string, Handle> = {
  "GET credentials/list": listGet.handle,
  "POST credentials/issue": issuePost.handle,
  "POST credentials/revoke": revokePost.handle,
  "POST credentials/tamper": tamperPost.handle,
  "POST credentials/verify": verifyPost.handle,
  "POST credentials/holder": holderPost.handle,
};

async function readBody(req: IncomingMessage): Promise<Uint8Array | undefined> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  if (chunks.length) return new Uint8Array(Buffer.concat(chunks));
  // Some runtimes pre-parse the body; fall back to it.
  const parsed = (req as unknown as { body?: unknown }).body;
  if (parsed == null) return undefined;
  if (typeof parsed === "string") return new TextEncoder().encode(parsed);
  if (parsed instanceof Uint8Array) return parsed;
  return new TextEncoder().encode(JSON.stringify(parsed));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const send = (status: number, body: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  };
  try {
    const url = new URL(req.url ?? "/", "https://app.local");
    const method = (req.method ?? "GET").toUpperCase();
    const route = (
      url.searchParams.get("path") ??
      url.pathname.replace(/^\/(_api|api)\//, "").replace(/^index\/?/, "")
    ).replace(/^\/+|\/+$/g, "");
    const fn = routes[`${method} ${route}`];
    if (!fn) return send(404, { error: `No endpoint for ${method} /${route}` });

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v == null) continue;
      headers.set(k, Array.isArray(v) ? v.join(", ") : v);
    }
    const body = method === "GET" || method === "HEAD" ? undefined : await readBody(req);
    const request = new Request(`https://${req.headers.host ?? "app.local"}/${route}`, {
      method,
      headers,
      body: body as BodyInit | undefined,
    });

    await ensureSchema();
    const response = await fn(request);

    res.statusCode = response.status;
    response.headers.forEach((value, name) => {
      if (name.toLowerCase() !== "set-cookie") res.setHeader(name, value);
    });
    const cookies = response.headers.getSetCookie?.() ?? [];
    if (cookies.length) res.setHeader("Set-Cookie", cookies);
    res.setHeader("Cache-Control", "no-store");
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    send(500, { error: error instanceof Error ? error.message : "Unknown error" });
  }
}
