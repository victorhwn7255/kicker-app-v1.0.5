import { ImageResponse } from 'next/og';
import { getPosts } from '@/lib/content';
import { tierLabel } from '@/lib/tiers';
import type { Tier } from '@/lib/types';

export const alt = 'A post on Ticker - sourced, confidence-labeled research.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Inline-style tier colors (next/og cannot resolve Tailwind classes). */
const TIER_STYLE: Record<Tier, { glyph: string; glyphBg: string; glyphColor: string; labelBg: string; labelColor: string }> = {
  solid: { glyph: '✓', glyphBg: '#7FE08A', glyphColor: '#000', labelBg: '#7FE08A', labelColor: '#000' },
  needs: { glyph: '~', glyphBg: '#FFD700', glyphColor: '#000', labelBg: '#FFD700', labelColor: '#000' },
  disputed: { glyph: '✕', glyphBg: '#FF7A7A', glyphColor: '#000', labelBg: '#FF7A7A', labelColor: '#000' },
  open: { glyph: '?', glyphBg: '#000', glyphColor: '#fff', labelBg: '#fff', labelColor: '#000' },
};

export default async function Image({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const post = (await getPosts()).find((p) => p.id === postId);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFF8E7',
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          Ticker
        </div>
      ),
      size,
    );
  }

  const t = TIER_STYLE[post.tier];
  const label = tierLabel(post.tier, post.qualifier);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#FFF8E7',
          padding: 72,
        }}
      >
        {/* brand line */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 28 }}>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em' }}>TICKER</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B6B6B' }}>
            the anti-fintwit
          </div>
        </div>

        {/* card */}
        <div style={{ display: 'flex', flexDirection: 'column', border: '2px solid #000', background: '#FFFFFF', boxShadow: '8px 8px 0 0 #000' }}>
          <div style={{ display: 'flex', flexDirection: 'column', padding: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  border: '2px solid #000',
                  background: '#FFF4CC',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {post.avatar ?? ''}
              </div>
              <div style={{ display: 'flex', fontSize: 28, fontWeight: 700 }}>{post.handle}</div>
              <div style={{ display: 'flex', fontSize: 20, color: '#6B6B6B' }}>· {post.time}</div>
            </div>

            <div style={{ display: 'flex', marginTop: 28, fontSize: 36, lineHeight: 1.4, fontWeight: 400 }}>
              {post.body}
            </div>
          </div>

          {/* trust band */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              borderTop: '2px solid #000',
              background: '#FDF6E3',
              padding: '24px 40px',
            }}
          >
            <div style={{ display: 'flex', border: '2px solid #000', alignSelf: 'flex-start' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 14px',
                  borderRight: '2px solid #000',
                  background: t.glyphBg,
                  color: t.glyphColor,
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {t.glyph}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  background: t.labelBg,
                  color: t.labelColor,
                  fontSize: 20,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {label}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 20, color: '#6B6B6B' }}>
              <div style={{ display: 'flex', fontWeight: 700 }}>source: {post.source}</div>
              <div style={{ display: 'flex' }}>{post.freshness}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
