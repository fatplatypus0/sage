import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { STORAGE_KEY } from '../lib/store';

type Props = { children: ReactNode };
type State = { error: Error | null; info: string | null };

/**
 * A crash on a 5:30 AM phone check-in must not look like a dead site, and must never lose the
 * day's ticks: the data lives in localStorage, so the fallback offers a raw download of it and
 * a reload that lands on the same section.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info: (info.componentStack || '').split('\n').slice(1, 6).join(' · ').trim() });
    try {
      window.sessionStorage.setItem('sage.lastError', `${error.stack || error.message}\n${info.componentStack}`.slice(0, 4000));
    } catch {
      /* storage may be the thing that failed */
    }
  }

  private saveRaw = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) || '{}';
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sage-progress-recovery.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch {
      window.alert('Could not read local storage from this state — reload before exporting.');
    }
  };

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="relative grid min-h-[100dvh] place-items-center bg-ink-900 px-5 py-16">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[880px] -translate-x-1/2 -translate-y-[60%] rounded-[50%] blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(120,165,255,0.35), transparent 72%)' }}
          aria-hidden="true"
        />
        <div className="card relative w-full max-w-[560px] p-6 sm:p-8">
          <span className="kicker">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" /> The plan is safe
          </span>
          <h1 className="mt-3 font-display text-[26px] font-semibold leading-tight text-white sm:text-[32px]">
            SAGE hit an error — nothing you ticked was lost.
          </h1>
          <p className="muted mt-3 text-[14px] leading-[1.6]">
            Progress is written to this browser after every change, so a reload puts the day back. If it keeps happening, download the
            raw file and re-import it from Settings after clearing the app — that is the whole recovery, no account involved.
          </p>
          <pre className="mt-4 max-h-[120px] overflow-auto rounded-xl border border-white/[0.08] bg-black/30 p-3 text-[11.5px] leading-snug text-glow-200/70">
            {error.message}
            {info ? `\n${info}` : ''}
          </pre>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="btn-light" onClick={() => window.location.reload()}>
              Reload the deck
            </button>
            <button type="button" className="btn-ghost" onClick={this.saveRaw}>
              Download my raw progress
            </button>
          </div>
        </div>
      </div>
    );
  }
}
