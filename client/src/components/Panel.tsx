import type { PropsWithChildren, ReactNode } from 'react';

interface PanelProps extends PropsWithChildren {
  title?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function Panel({ title, subtitle, action, className, children }: PanelProps) {
  return (
    <section
      className={`rounded-3xl border border-white/80 bg-white/80 p-6 shadow-panel backdrop-blur ${className || ''}`}
    >
      {(title || subtitle || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title ? <h2 className="text-xl font-semibold text-night">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
