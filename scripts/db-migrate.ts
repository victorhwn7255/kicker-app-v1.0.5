import './_env';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

/**
 * Applies the SQL migrations in supabase/migrations/ against the project's
 * Postgres. DDL cannot go through the PostgREST API, so this uses a direct
 * connection (SUPABASE_DB_URL). Each migration runs once, inside a transaction,
 * and is recorded in schema_migrations - re-running is a safe no-op.
 */
const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

async function main() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) {
    console.error(
      [
        'Missing SUPABASE_DB_URL.',
        'Add the Supabase database connection string (URI) to .env.local, e.g.:',
        '  SUPABASE_DB_URL="postgresql://postgres.<ref>:<db-password>@<host>.pooler.supabase.com:5432/postgres"',
        'Find it in the dashboard: Project Settings -> Database -> Connection string -> URI',
        '(the Session pooler or Direct connection; include the database password).',
      ].join('\n'),
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    // The ledger lives in the API-exposed `public` schema, so it needs RLS just
    // like every other table (0001 turns it on for the rest). Without this, the
    // anon/publishable key could read it or - worse - pre-insert a future
    // migration name so `applied.has(file)` skips it. RLS on + no policy = private;
    // this migrate script connects as a BYPASSRLS role, so its own reads/writes
    // are unaffected. Enabling RLS when already enabled is a no-op, so it stays
    // idempotent across runs.
    await client.query(
      `create table if not exists public.schema_migrations (
         name text primary key,
         applied_at timestamptz not null default now()
       );
       alter table public.schema_migrations enable row level security;`,
    );
    const applied = new Set(
      (await client.query('select name from public.schema_migrations')).rows.map((r) => r.name),
    );

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let ran = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip  ${file} (already applied)`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      process.stdout.write(`apply ${file} ... `);
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into public.schema_migrations(name) values ($1)', [file]);
        await client.query('commit');
        console.log('ok');
        ran++;
      } catch (err) {
        await client.query('rollback');
        console.log('FAILED');
        throw err;
      }
    }
    console.log(`\nDone. ${ran} migration(s) applied, ${files.length - ran} already current.`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
