import type { ReactNode } from 'react';
import { useReveal } from '../lib/store';
import { cn } from './cn';

/* ------------------------------------------------------------------ *
 * Icons — a single inline set so the bundle stays dependency-free
 * ------------------------------------------------------------------ */

const PATHS: Record<string, ReactNode> = {
  sparkle: <path d="M12 3.2c.9 4.4 3.4 6.9 7.8 7.8-4.4.9-6.9 3.4-7.8 7.8-.9-4.4-3.4-6.9-7.8-7.8 4.4-.9 6.9-3.4 7.8-7.8Z" />,
  star4: <path d="M12 2.5 13.9 9 20.5 11 13.9 13 12 19.5 10.1 13 3.5 11 10.1 9 12 2.5Z" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2 2 0 0 1 6 3.5h13v15H6a2 2 0 0 0-2 2Z" />
      <path d="M4 5.5v15" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3h5M10.5 3v6L5.6 18a2 2 0 0 0 1.7 3h9.4a2 2 0 0 0 1.7-3L13.5 9V3" />
      <path d="M8 15h8" />
    </>
  ),
  dna: (
    <>
      <path d="M7 3c0 6 10 6 10 12M17 3c0 6-10 6-10 12M7 21c0-2 2-3.5 5-3.5s5 1.5 5 3.5" />
      <path d="M8.6 7h6.8M8.6 15h6.8" />
    </>
  ),
  sigma: <path d="M17.5 5.5H7l6 6.5-6 6.5h10.5" />,
  bolt: <path d="M13.5 2.5 5.5 13.5h5l-1 8 8.5-11h-5.2Z" />,
  download: <path d="M12 3.5v11m0 0 4-4m-4 4-4-4M4.5 19.5h15" />,
  upload: <path d="M12 15.5v-11m0 0 4 4m-4-4-4 4M4.5 19.5h15" />,
  printer: (
    <>
      <path d="M7 9V4h10v5M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  minus: <path d="M5.5 12h13" />,
  trash: <path d="M4.5 7h15M9.5 7V4.5h5V7M7 7l.8 12.5a1.5 1.5 0 0 0 1.5 1.5h5.4a1.5 1.5 0 0 0 1.5-1.5L17 7" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  x: <path d="m6 6 12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  play: <path d="M8 5.5 19 12 8 18.5Z" />,
  pause: <path d="M9 5.5v13M15 5.5v13" />,
  reset: <path d="M4.5 12a7.5 7.5 0 1 0 2.6-5.7M4.5 4.5V10h5.5" />,
  flag: <path d="M6 21V4.5h11l-2 3.5 2 3.5H6" />,
  users: (
    <>
      <circle cx="9.5" cy="8.5" r="3.4" />
      <path d="M3.5 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16.5 5.6a3.4 3.4 0 0 1 0 6.4M18 14.7c2 .7 3.5 2.5 3.5 5.3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10.5h17M8 3.5v4M16 3.5v4" />
    </>
  ),
  chart: <path d="M4.5 19.5V11M10 19.5V5.5M15.5 19.5v-6M21 19.5v-9" />,
  shield: <path d="M12 3 5 5.8v5.4c0 4.4 2.9 7.6 7 9.3 4.1-1.7 7-4.9 7-9.3V5.8Z" />,
  eye: (
    <>
      <path d="M2.5 12S6 6.2 12 6.2 21.5 12 21.5 12 18 17.8 12 17.8 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9 15 2-4 4-2-2 4Z" />
    </>
  ),
  bed: <path d="M3 18v-7h13a4 4 0 0 1 4 4v3M3 11V6.5M3 18h18M6.5 11V9h4v2" />,
  alarm: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9.5V13l2.5 1.6M4 4 1.8 6.2M20 4l2.2 2.2" />
    </>
  ),
  coffee: <path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm12 1.5h2a2.5 2.5 0 0 1 0 5h-2M6 3v2.5M10 3v2.5M14 3v2.5" />,
  quote: <path d="M9 6c-3 1.5-4.5 4-4.5 7.5 0 2.5 1.3 4 3.2 4S9.7 16 9.7 14.2c0-1.7-1.2-2.9-2.9-2.9-.3 0-.6 0-.8.1.2-1.7 1.3-3.1 3-4Zm9 0c-3 1.5-4.5 4-4.5 7.5 0 2.5 1.3 4 3.2 4s2-.5 2-2.3c0-1.7-1.2-2.9-2.9-2.9-.3 0-.6 0-.8.1.2-1.7 1.3-3.1 3-4Z" />,
};

export function Icon({ name, className, size = 18 }: { name: keyof typeof PATHS | string; className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name] ?? PATHS.sparkle}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Layout atoms
 * ------------------------------------------------------------------ */

export function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  const { ref, shown, cb } = useReveal<HTMLElement>();
  return (
    <section
      id={id}
      ref={(node) => {
        cb(node);
        if (ref) ref.current = node;
      }}
      className={cn(
        'relative mx-auto w-full max-w-[1180px] px-5 py-16 sm:px-7 sm:py-24 transition-all duration-700 print:translate-y-0 print:opacity-100',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHead({
  kicker,
  title,
  lead,
  align = 'center',
  actions,
}: {
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'center' | 'left';
  actions?: ReactNode;
}) {
  return (
    <header className={cn('mb-10 flex flex-col gap-4 sm:mb-12', align === 'center' ? 'items-center text-center' : 'items-start text-left')}>
      {kicker ? (
        <span className="kicker">
          <Icon name="star4" size={13} className="text-glow-300" />
          {kicker}
        </span>
      ) : null}
      <h2 className={cn('max-w-3xl text-[30px] font-semibold leading-[1.06] text-white sm:text-[42px]')}>{title}</h2>
      {lead ? <p className={cn('muted max-w-2xl text-[15px]', align === 'center' && 'mx-auto')}>{lead}</p> : null}
      {actions ? <div className="mt-1 flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Card({ children, className, glow = false }: { children: ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={cn('card p-5 sm:p-6', glow && 'shadow-lift', className)}>
      {glow ? <div className="topline pointer-events-none absolute inset-x-8 -top-px" /> : null}
      {children}
    </div>
  );
}

export function Bar({ value, color = '#6f9bff', className, height = 6 }: { value: number; color?: string; className?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-white/[0.07]', className)} style={{ height }}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}66, ${color})`, boxShadow: `0 0 18px ${color}55` }}
      />
    </div>
  );
}

export function Ring({
  value,
  size = 84,
  stroke = 7,
  color = '#6f9bff',
  track = 'rgba(158,193,255,0.14)',
  label,
  sub,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  const v = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gid = `ring-${Math.round(size)}-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 6px ${color}77)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        <div>
          <div className="num text-[15px] font-semibold text-white">{label}</div>
          {sub ? <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-glow-200/55">{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  tone = '#6f9bff',
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('group flex w-full items-start gap-3 text-left', className)}
    >
      <span
        className="checkbox mt-[2px]"
        data-checked={checked}
        style={checked ? { boxShadow: `0 0 0 3px ${tone}22, 0 6px 18px -8px ${tone}` } : undefined}
      >
        <Icon name="check" size={12} className={cn('transition-opacity', checked ? 'text-ink-950 opacity-100' : 'opacity-0')} />
      </span>
      <span className={cn('text-[14px] leading-snug transition-colors', checked ? 'text-glow-200/45 line-through decoration-glow-300/30' : 'text-glow-100/90')}>
        {label}
      </span>
    </button>
  );
}

export function Tag({ children, color, className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.12em]', className)}
      style={{
        borderColor: color ? `${color}44` : 'rgba(158,193,255,0.18)',
        background: color ? `${color}18` : 'rgba(255,255,255,0.04)',
        color: color ?? 'rgba(197,217,255,0.85)',
      }}
    >
      {children}
    </span>
  );
}

export function Stat({
  icon,
  value,
  label,
  hint,
  color = '#6f9bff',
}: {
  icon: string;
  value: ReactNode;
  label: string;
  hint?: ReactNode;
  color?: string;
}) {
  return (
    <div className="card-quiet flex items-center gap-3.5 p-4">
      <span
        className="grid h-9 w-9 place-items-center rounded-xl border"
        style={{ borderColor: `${color}33`, background: `${color}14`, color }}
      >
        <Icon name={icon} size={16} />
      </span>
      <div className="min-w-0">
        <div className="num text-[19px] font-semibold leading-none text-white">{value}</div>
        <div className="mt-1.5 truncate text-[11px] uppercase tracking-[0.14em] text-glow-200/55">{label}</div>
        {hint ? <div className="mt-1 truncate text-[11.5px] text-glow-200/45">{hint}</div> : null}
      </div>
    </div>
  );
}

export function IconButton({
  icon,
  label,
  onClick,
  tone,
  active,
  size = 15,
}: {
  icon: string;
  label: string;
  onClick?: () => void;
  tone?: string;
  active?: boolean;
  size?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-glow-200/70 transition hover:border-white/25 hover:bg-white/[0.1] hover:text-white',
        active && 'border-glow-400/50 bg-glow-500/20 text-white',
      )}
      style={tone && active ? { borderColor: `${tone}66`, background: `${tone}22`, color: '#fff' } : undefined}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}

export function EmptyState({ icon = 'sparkle', title, body, action }: { icon?: string; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.02] px-6 py-10 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-glow-300">
        <Icon name={icon} size={19} />
      </span>
      <div>
        <div className="font-display text-[15px] font-semibold text-white">{title}</div>
        <p className="muted mx-auto mt-1 max-w-md text-[13px]">{body}</p>
      </div>
      {action}
    </div>
  );
}
