'use client';

import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-gradient-to-r from-muted/50 via-muted to-muted/50 bg-[length:200%_100%]',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };