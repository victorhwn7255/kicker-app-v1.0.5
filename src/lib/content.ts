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
 * Content loaders. zod parsing happens HERE, at the boundary, so every later
 * phase (and the CI validator) gets typed data and a single failure point.
 * Fixtures live in /content and are swapped for Supabase in Phase 4.
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

export function getAccounts(): Account[] {
  return parseArray(AccountSchema, readJson('accounts.json'), 'accounts.json');
}

export function getAccount(handle: string): Account | undefined {
  return getAccounts().find((a) => a.handle === handle);
}

export function getPosts(): Post[] {
  return parseArray(PostSchema, readJson('posts.json'), 'posts.json');
}

export function getKillList(): KillListEntry[] {
  return parseArray(KillListEntrySchema, readJson('kill-list.json'), 'kill-list.json');
}

export function getTripwires(): Tripwire[] {
  return parseArray(TripwireSchema, readJson('tripwires.json'), 'tripwires.json');
}

export function getSources(): SourceSection[] {
  return parseArray(SourceSectionSchema, readJson('sources.json'), 'sources.json');
}

export function getResearchPages(): ResearchPage[] {
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

export function getResearchPage(slug: string): ResearchPage | undefined {
  return getResearchPages().find((p) => p.slug === slug);
}
