import { useEffect, useRef, useState } from 'react';
import { Icon } from './ui';
import { printWallSheet } from '../lib/print';
import { cn } from './cn';

export const SECTIONS = [
  { id: 'features', label: 'Features' },
  { id: 'today', label: 'Command Deck' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'shifts', label: 'Daily System' },
  { id: 'notebook', label: 'Notebook' },
];

export const MORE = [
  { id: 'progress', label: 'Progress & readiness', note: 'One score for the whole program' },
  { id: 'toolkit', label: 'Execution toolkit', note: 'Shift timer · Thursday sync · rules' },
  { id: 'settings', label: 'Settings & backup', note: 'Dates, JSON export, wall sheet' },
];

export function Logo({ className }: { className?: string }) {
  return (
    <a href="#top" className={cn('group flex items-center gap-2', className)} aria-label="SAGE — back to top">
      <span className="relative grid h-7 w-7 place-items-center rounded-[9px] bg-gradient-to-b from-white to-glow-300 text-ink-950 shadow-[0_6px_20px_-6px_rgba(158,193,255,0.9)] transition-transform duration-300 group-hover:rotate-[18deg]">
        <Icon name="sparkle" size={15} className="stroke-[1.9]" />
      </span>
      <span className="font-display text-[15px] font-bold uppercase tracking-[0.14em] text-white">Sage</span>
      <span className="ml-0.5 hidden rounded-full border border-white/10 px-1.5 py-[2px] text-[10px] font-semibold tracking-[0.12em] text-glow-300/80 sm:inline">
        V5 PRO
      </span>
    </a>
  );
}

export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join('|');
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.2, 0.6] },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [key]);
  return active;
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const [solid, setSolid] = useState(false);
  const active = useActiveSection([...SECTIONS, ...MORE, { id: 'settings', label: 'Settings' }].map((s) => s.id));

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      setMore(false);
    };
    const onDown = (ev: PointerEvent) => {
      if (more && moreRef.current && !moreRef.current.contains(ev.target as Node)) setMore(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [more]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 no-print transition-all duration-300',
        solid ? 'border-b border-white/[0.07] bg-ink-950/72 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      <div className="shell flex h-[54px] items-center justify-between gap-2 sm:h-[62px]">
        <Logo />

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Sections">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={cn(
                'rounded-full px-3 py-1.5 text-[13px] font-medium transition',
                active === s.id ? 'bg-white/[0.08] text-white' : 'text-glow-200/65 hover:bg-white/[0.05] hover:text-white',
              )}
            >
              {s.label}
            </a>
          ))}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMore((v) => !v)}
              className={cn(
                'tap inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium transition',
                more || MORE.some((m) => m.id === active)
                  ? 'bg-white/[0.08] text-white'
                  : 'text-glow-200/65 hover:bg-white/[0.05] hover:text-white',
              )}
              aria-haspopup="true"
              aria-expanded={more}
            >
              More
              <Icon name="chevron" size={13} className={cn('transition-transform duration-200', more && 'rotate-180')} />
            </button>
            <div
              className={cn(
                'absolute right-0 top-[calc(100%+8px)] w-[264px] origin-top-right rounded-2xl border border-white/10 bg-ink-850/95 p-1.5 shadow-panel backdrop-blur-xl transition-all duration-200',
                more ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-1 opacity-0',
              )}
            >
              {MORE.map((m) => (
                <a key={m.id} href={`#${m.id}`} onClick={() => setMore(false)} className="block rounded-xl px-3 py-2.5 transition hover:bg-white/[0.07]">
                  <span className="block text-[13px] font-semibold text-white">{m.label}</span>
                  <span className="block text-[11px] text-glow-200/50">{m.note}</span>
                </a>
              ))}
              <div className="my-1 h-px bg-white/[0.07]" />
              <button type="button" onClick={printWallSheet} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] text-glow-100/85 transition hover:bg-white/[0.07]">
                <Icon name="printer" size={14} className="text-glow-300" /> Print this week’s wall sheet
              </button>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <a href="#settings" className="hidden text-[13px] font-medium text-glow-200/70 transition hover:text-white lg:block">
            Sign in to your plan
          </a>
          <a href="#today" className="btn-light !min-h-[38px] !px-3.5 !py-1.5 text-[13px] sm:!px-4 sm:!py-2">
            <span className="sm:hidden">Deck</span>
            <span className="hidden sm:inline">Open Command Deck</span>
            <Icon name="arrow" size={14} />
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-glow-100 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <Icon name={open ? 'x' : 'menu'} size={16} />
          </button>
        </div>
      </div>

      {open ? (
        <div className="max-h-[70vh] overflow-y-auto border-t border-white/[0.07] bg-ink-950/95 px-5 py-3 backdrop-blur-xl md:hidden">
          <div className="grid gap-1">
            {[...SECTIONS, ...MORE, { id: 'settings', label: 'Settings' }].map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center justify-between rounded-xl px-3 py-2.5 text-[14px] transition',
                  active === s.id ? 'bg-white/[0.08] text-white' : 'text-glow-100/85 hover:bg-white/[0.06]',
                )}
              >
                {'note' in s && s.note ? (
                  <span>
                    {s.label}
                    <span className="block text-[11px] text-glow-200/45">{String(s.note)}</span>
                  </span>
                ) : (
                  s.label
                )}
                <Icon name="arrow" size={14} className="text-glow-300/60" />
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                printWallSheet();
              }}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-[13px] text-glow-100/85"
            >
              <Icon name="printer" size={14} /> Print wall sheet
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
