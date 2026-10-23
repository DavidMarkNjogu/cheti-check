import { databaseUrl, sql } from "./db";

// Creates the tables on first use. Safe to run many times, and safe when
// several cold starts run it at once (advisory lock).
const DDL = `
create table if not exists demo_keys (
  id integer primary key,
  public_key_pem text not null,
  private_key_pem text not null,
  created_at timestamptz not null default now()
);
create table if not exists credentials (
  credential_id text primary key,
  student_name text not null,
  institution text not null,
  programme text not null,
  award text not null,
  graduation_year integer not null,
  signature text not null,
  record_hash text not null,
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default now()
);
create index if not exists credentials_created_idx on credentials (created_at);
create table if not exists audit_log (
  id serial primary key,
  event text not null,
  credential_id text not null,
  detail text,
  created_at timestamptz not null default now()
);
create table if not exists application_copies (
  copy_id text primary key,
  credential_id text not null,
  recipient_name text not null,
  purpose text not null,
  copy_hash text not null,
  deactivated_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists misuse_incidents (
  id serial primary key,
  copy_id text not null,
  credential_id text not null,
  recipient_name text not null,
  student_name text not null,
  mismatches text not null,
  status text not null default 'ACTIVE_ALERT',
  created_at timestamptz not null default now()
);
`;

let ready: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!databaseUrl || databaseUrl.includes("missing:missing")) {
    // Database URL not configured or dummy fallback: operate in resilient in-memory demo mode
    return Promise.resolve();
  }
  if (!ready) {
    ready = sql
      .begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(727275)`;
        await tx.unsafe(DDL);
      })
      .then(() => undefined)
      .catch((e) => {
        ready = null;
        console.warn("Neon connection failed, operating in memory demo mode:", e.message);
      });
  }
  return ready;
}
