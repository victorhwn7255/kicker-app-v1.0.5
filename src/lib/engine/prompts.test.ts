import { describe, it, expect } from 'vitest';
import { generatorPrompt } from './prompts';
import { makeAccount, makeSource } from './testkit';

describe('generatorPrompt reply framing (conversation trigger)', () => {
  it('frames the post as a reply when replyingTo is given', () => {
    const p = generatorPrompt({
      account: makeAccount(),
      source: makeSource(),
      keyFact: 'x',
      recentPosts: [],
      replyingTo: { handle: '@CORZ', body: 'colocation revenue is up' },
    });
    expect(p).toContain('YOU ARE REPLYING to @CORZ');
    expect(p).toContain('colocation revenue is up');
  });

  it('omits reply framing for a normal post', () => {
    const p = generatorPrompt({ account: makeAccount(), source: makeSource(), keyFact: 'x', recentPosts: [] });
    expect(p).not.toContain('YOU ARE REPLYING');
  });
});
