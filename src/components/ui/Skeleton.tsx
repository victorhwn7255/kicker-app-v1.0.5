import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

/** Hard-bordered skeleton block that pulses opacity. No shimmer sweep. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('border bg-band animate-tkpulse', className)} style={style} aria-hidden="true" />;
}

/** A PostCard-shaped loading placeholder. */
export function PostCardSkeleton({ className }: { className?: string }) {
  return (
    <article className={cn('border bg-card', className)} aria-busy="true" aria-label="Loading post">
      <div className="px-[16px] pt-[14px] pb-[12px]">
        <div className="flex items-center gap-[10px]">
          <Skeleton className="h-[36px] w-[36px]" />
          <Skeleton className="h-[14px] w-[96px]" />
        </div>
        <Skeleton className="mt-[14px] h-[14px]" />
        <Skeleton className="mt-[8px] h-[14px] w-4/5" />
      </div>
      <div className="border-t bg-band px-[16px] py-[10px]">
        <Skeleton className="h-[22px] w-[150px] bg-card" />
      </div>
    </article>
  );
}
