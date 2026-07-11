import { z } from 'zod';
import type { Account, SourceSection } from '@/lib/types';
import { verifierLane } from './config';
import { generateStructured } from './models';

/**
 * Source-attribution audit - a CURATION-TIME gate that runs on every source
 * import, not a one-off fix. The generator speaks a source in the account's FIRST
 * PERSON, so a source in @CRWV's reservoir that actually holds @CORZ's facts
 * (colocation revenue, the project bond) inverts the landlord/tenant relationship
 * when spoken as "my revenue". The verifier cannot catch this: those facts DO
 * trace to the source text; the defect is that the wrong facts are in the source.
 * Only an attribution check - do these facts belong to THIS account - catches it.
 *
 * This must run whenever the vault publish skill imports sources (Phase 9). It is
 * exercised now via `pnpm engine:audit-sources`.
 */
export const AttributionSchema = z.object({
  /** Every fact in the source can be truthfully asserted BY this account. */
  belongs: z.boolean(),
  /** Facts that are actually about a different entity (would be false in first person). */
  misattributed_facts: z.array(z.string()),
  reasoning: z.string(),
});
export type Attribution = z.infer<typeof AttributionSchema>;

function attributionSystem(): string {
  return [
    'You audit a research SOURCE before it enters an account\'s generation reservoir.',
    'The account will later re-express these facts in its own voice. Your job is',
    'ATTRIBUTION: could this specific account truthfully assert every fact here, or',
    'are some facts actually about a DIFFERENT company or entity - facts that would be',
    'FALSE or inverted if this account claimed them?',
    '',
    'Example of misattribution: a datacenter TENANT\'s reservoir containing "colocation',
    'revenue is 100% one customer" - that is the LANDLORD\'s revenue; spoken by the',
    'tenant it inverts the relationship. Set belongs=false and list it.',
    '',
    'A company account must only hold ITS OWN facts (its revenue, its filings, its',
    'customers). A theme or chokepoint account may describe a system or relationship it',
    'observes, as long as it does not claim another company\'s figures as its own.',
    '',
    'List every misattributed fact in misattributed_facts. When in doubt, flag it.',
  ].join('\n');
}

function attributionPrompt(account: Account, source: SourceSection): string {
  return [
    `ACCOUNT: ${account.handle} (kind: ${account.kind})`,
    `WHO THIS ACCOUNT IS: ${account.bio}`,
    '',
    `SOURCE SECTION - "${source.section_title}":`,
    source.body_text,
    '',
    'Does every fact here belong to this account? Return your attribution verdict.',
  ].join('\n');
}

export type AttributionRunner = (system: string, prompt: string) => Promise<Attribution>;

/** Audit one source. Pass a runner to unit-test without a live model. */
export async function auditSourceAttribution(
  account: Account,
  source: SourceSection,
  runner?: AttributionRunner,
): Promise<Attribution> {
  const run: AttributionRunner =
    runner ??
    ((system, prompt) => generateStructured(verifierLane(), { system, prompt, schema: AttributionSchema }));
  return run(attributionSystem(), attributionPrompt(account, source));
}
