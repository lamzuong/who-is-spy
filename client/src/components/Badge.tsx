import type { PropsWithChildren } from 'react';
import { cx } from '../lib/utils';

interface BadgeProps extends PropsWithChildren {
  tone?: 'neutral' | 'accent' | 'warning' | 'danger';
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        tone === 'neutral' && 'bg-slate-100 text-slate-700',
        tone === 'accent' && 'bg-aqua/30 text-slate-800',
        tone === 'warning' && 'bg-gold/30 text-amber-900',
        tone === 'danger' && 'bg-coral/20 text-rose-700'
      )}
    >
      {children}
    </span>
  );
}
