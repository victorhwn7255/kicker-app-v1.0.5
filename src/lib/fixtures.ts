import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  AccountSchema,
  PostSchema,
  KillListEntrySchema,
  TripwireSchema,
  SourceSectionSchema,
  ResearchPageSchema,
  type Account,
  type Post,
  type KillListEntry,
  type Tripwire,
  type SourceSection,
  type ResearchPage,
} from './types';

/**
 * The ingestion source: the /content bridge files, read from disk and zod-parsed.
 * This is the one-way path into the product - bridge files land in /content, the
 * validator checks them, then the seed imports them into Supabase. The app itself
 * never reads these at runtime (it reads the database via content.ts); only the
 * validator and the seed script do.
 */
const CONTENT_DIR = path.join(process.cwd(), 'content');

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `  - ${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`)
    .join('\n');
}

function readJson(relPath: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, relPath), 'utf8'));
}

function parseArray<T>(schema: z.ZodType<T>, data: unknown, label: string): T[] {
  const result = z.array(schema).safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid content in ${label}:\n${formatIssues(result.error)}`);
  }
  return result.data;
}

export function readAccounts(): Account[] {
  return parseArray(AccountSchema, readJson('accounts.json'), 'accounts.json');
}

export function readPosts(): Post[] {
  return parseArray(PostSchema, readJson('posts.json'), 'posts.json');
}

export function readKillList(): KillListEntry[] {
  return parseArray(KillListEntrySchema, readJson('kill-list.json'), 'kill-list.json');
}

export function readTripwires(): Tripwire[] {
  return parseArray(TripwireSchema, readJson('tripwires.json'), 'tripwires.json');
}

export function readSources(): SourceSection[] {
  return parseArray(SourceSectionSchema, readJson('sources.json'), 'sources.json');
}

export function readResearchPages(): ResearchPage[] {
  const dir = path.join(CONTENT_DIR, 'research');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  return files.map((file) => {
    const result = ResearchPageSchema.safeParse(
      JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')),
    );
    if (!result.success) {
      throw new Error(`Invalid research page ${file}:\n${formatIssues(result.error)}`);
    }
    return result.data;
  });
}
