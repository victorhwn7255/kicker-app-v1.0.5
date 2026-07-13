import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeAccount, makeSource, makePost, mockDeps, validBody } from './testkit';
import type { PublishableCandidate } from './data';

/**
 * The publisher is the only path to the public feed, so its safety properties are
 * tested against a mocked DB layer: the gate, idempotent one-post-per-slot dedupe,
 * and dangling-reply protection - with zero live model or DB calls.
 */
vi.mock('./data', () => ({
  loadAccounts: vi.fn(),
  loadSources: vi.fn(),
  loadPosts: vi.fn(),
  loadDuePublishable: vi.fn(),
  publishPosts: vi.fn(async () => {}),
  markCandidatesPublished: vi.fn(async () => {}),
  savePostHistory: vi.fn(async () => {}),
}));

import * as data from './data';
import { publishDue } from './publisher';

const NOW = Date.parse('2026-07-13T17:30:00Z');
const RUN = 'day_20260713';

function candId(account: string, sourceId: string, trigger: string, lane: string) {
  return `${RUN}::${account}::${sourceId}::${trigger}::${lane}`;
}

function makeCand(over: Partial<PublishableCandidate> = {}): PublishableCandidate {
  const account = (over.account as string) ?? '@CRWV';
  const sourceId = (over.source_id as string) ?? 'src-1';
  const trigger = (over.trigger as string) ?? 'rotation';
  const lane = (over as { lane?: string }).lane ?? 'primary';
  return {
    id: candId(account, sourceId, trigger, lane),
    engine_run_id: RUN,
    account,
    source_id: sourceId,
    trigger,
    reply_to: null,
    body: validBody(),
    tier: 'solid',
    qualifier: 'from the 10-K',
    char_len: 500,
    model: 'nemotron-3-ultra',
    provider: 'nim',
    prompt_version: 'p6',
    verdict: { ok: true },
    scheduled_at: '2026-07-13T17:00:00Z',
    published_at: null,
    ...over,
  };
}

function primeDb(cands: PublishableCandidate[], posts = [] as ReturnType<typeof makePost>[]) {
  (data.loadDuePublishable as ReturnType<typeof vi.fn>).mockResolvedValue(cands);
  (data.loadAccounts as ReturnType<typeof vi.fn>).mockResolvedValue([
    makeAccount({ handle: '@CRWV', avatar: 'CRWV' }),
    makeAccount({ handle: '@CORZ', avatar: 'CORZ' }),
  ]);
  (data.loadSources as ReturnType<typeof vi.fn>).mockResolvedValue([makeSource({ id: 'src-1' })]);
  (data.loadPosts as ReturnType<typeof vi.fn>).mockResolvedValue(posts);
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  delete process.env.ENGINE_ENABLED;
});

describe('publishDue: the hard gate', () => {
  it('refuses to publish when ENGINE_ENABLED is not true', async () => {
    delete process.env.ENGINE_ENABLED;
    primeDb([makeCand()]);
    await expect(publishDue({ nowMs: NOW })).rejects.toThrow(/ENGINE_ENABLED/);
    expect(data.publishPosts).not.toHaveBeenCalled();
  });

  it('preview computes what WOULD publish but writes nothing (no gate needed)', async () => {
    delete process.env.ENGINE_ENABLED;
    primeDb([makeCand()]);
    const res = await publishDue({ nowMs: NOW, preview: true });
    expect(res.preview).toBe(true);
    expect(res.published).toBe(1);
    expect(data.publishPosts).not.toHaveBeenCalled();
    expect(data.markCandidatesPublished).not.toHaveBeenCalled();
  });
});

describe('publishDue: live publish', () => {
  beforeEach(() => {
    process.env.ENGINE_ENABLED = 'true';
  });

  it('publishes a due slot with a deterministic id + provenance', async () => {
    primeDb([makeCand()]);
    const res = await publishDue({ nowMs: NOW, deps: mockDeps() });
    expect(res.published).toBe(1);

    const rows = (data.publishPosts as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('p-day-20260713-crwv-src-1-rotation');
    expect(rows[0].verified).toBe(true);
    expect(rows[0].model).toBe('nemotron-3-ultra');
    expect(rows[0].published_at).toBe('2026-07-13T17:00:00Z');
    // the stored Post object is source-attributed + carries the ISO stamp
    expect(rows[0].data.source).toBe('CRWV / Customer concentration');
    expect(Date.parse(rows[0].data.postedAt as string)).toBe(Date.parse('2026-07-13T17:00:00Z'));
    expect(data.markCandidatesPublished).toHaveBeenCalledOnce();
    expect(data.savePostHistory).toHaveBeenCalledOnce();
  });

  it('collapses two verified lanes for one slot into ONE post (primary wins)', async () => {
    const primary = makeCand({ body: validBody(480) });
    const secondary = { ...makeCand({ body: validBody(460) }), id: candId('@CRWV', 'src-1', 'rotation', 'secondary') };
    primeDb([secondary, primary]); // out of order on purpose
    const res = await publishDue({ nowMs: NOW, deps: mockDeps() });

    expect(res.published).toBe(1);
    const rows = (data.publishPosts as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0].data.body).toBe(primary.body); // primary lane chosen

    // BOTH candidate rows get stamped published, mapped to the SAME post id -> the
    // sibling can never be re-published on a later tick.
    const markArgs = (data.markCandidatesPublished as ReturnType<typeof vi.fn>).mock.calls[0];
    const marked = markArgs[0] as PublishableCandidate[];
    const postIdOf = markArgs[1] as (id: string) => string;
    expect(marked).toHaveLength(2);
    expect(postIdOf(primary.id)).toBe(postIdOf(secondary.id));
  });

  it('drops a reply to standalone when the parent has no published post', async () => {
    const reply = makeCand({ trigger: 'conversation', reply_to: '@CORZ' });
    primeDb([reply], []); // no @CORZ post exists yet
    await publishDue({ nowMs: NOW, deps: mockDeps() });
    const rows = (data.publishPosts as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(rows[0].data.variant).toBe('original');
    expect(rows[0].data.replyTo).toBeUndefined();
  });

  it('keeps a reply threaded when the parent IS already published', async () => {
    const reply = makeCand({ trigger: 'conversation', reply_to: '@CORZ' });
    primeDb([reply], [makePost({ id: 'corz-1', handle: '@CORZ' })]);
    await publishDue({ nowMs: NOW, deps: mockDeps() });
    const rows = (data.publishPosts as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(rows[0].data.variant).toBe('reply');
    expect(rows[0].data.replyTo).toBe('@CORZ');
  });

  it('does nothing when nothing is due', async () => {
    primeDb([]);
    const res = await publishDue({ nowMs: NOW, deps: mockDeps() });
    expect(res.published).toBe(0);
    expect(data.publishPosts).not.toHaveBeenCalled();
  });
});
