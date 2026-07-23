'use client';

/**
 * The floating "↑ N new posts" affordance - X's pattern. Fixed just under the 53px
 * sticky header, centered over the column. Appears when the background poll has
 * buffered newer posts; clicking prepends them and scrolls to top. It's the desktop
 * path to new posts (no pull gesture on a mouse) and a passive-reader shortcut on mobile.
 */
export function NewPostsPill({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[62px] z-30 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-pill border border-line bg-card px-4 py-1.5 text-[13px] font-semibold text-cyan shadow-md transition-colors hover:bg-wash"
      >
        <span aria-hidden="true">↑</span>
        {count} new post{count === 1 ? '' : 's'}
      </button>
    </div>
  );
}
