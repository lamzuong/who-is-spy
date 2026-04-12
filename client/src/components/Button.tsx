import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cx } from '../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        'rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-night text-white hover:bg-slate-800',
        variant === 'secondary' && 'bg-aqua text-night hover:bg-teal-300',
        variant === 'ghost' && 'border border-slate-200 bg-white text-night hover:bg-slate-50',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
