import './_env';
import { supabaseRead } from '../src/lib/supabase/read';
import { supabaseAdmin } from '../src/lib/supabase/admin';

/**
 * Proves the RLS invariant the phase depends on: published content is world-
 * readable, but the anonymous (publishable) key cannot write it, and the private
 * reservoir is not anon-readable at all. Exits non-zero if any check fails.
 */
const PROBE_HANDLE = '@__rls_probe__';

async function main() {
  const read = supabaseRead();
  let failures = 0;

  // 1. Public read works: anon can SELECT published content.
  {
    const { data, error } = await read.from('accounts').select('handle').limit(1);
    if (error || !data || data.length === 0) {
      console.log(`FAIL  anon read of accounts (${error?.message ?? 'no rows returned'})`);
      failures++;
    } else {
      console.log('PASS  anon can read published accounts');
    }
  }

  // 2. Anon write is blocked (no insert policy / no insert grant).
  {
    const { error } = await read
      .from('accounts')
      .insert({ handle: PROBE_HANDLE, kind: 'company', seq: 999, data: {} });
    if (error) {
      console.log(`PASS  anon write blocked (${error.code ?? error.message})`);
    } else {
      console.log('FAIL  anon INSERT into accounts SUCCEEDED - writes are not protected');
      failures++;
      await supabaseAdmin().from('accounts').delete().eq('handle', PROBE_HANDLE);
    }
  }

  // 3. Private reservoir is not anon-readable.
  {
    const { data, error } = await read.from('sources').select('id').limit(1);
    if (!error && data && data.length > 0) {
      console.log('FAIL  anon can read the private sources reservoir');
      failures++;
    } else {
      console.log('PASS  anon cannot read the private sources reservoir');
    }
  }

  if (failures) {
    console.error(`\n${failures} RLS check(s) failed.`);
    process.exit(1);
  }
  console.log('\nAll RLS checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
