import { StoreProvider } from './lib/store';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Footer } from './components/Footer';
import { Section, SectionHead, Icon } from './components/ui';
import { Features } from './views/Features';
import { Today } from './views/Today';
import { Checklist } from './views/Checklist';
import { Shifts } from './views/Shifts';
import { Notebook } from './views/Notebook';
import { Stats } from './views/Stats';
import { Toolkit } from './views/Toolkit';
import { Settings } from './views/Settings';

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

function Shell() {
  return (
    <div className="relative min-h-screen">
      {/* film grain + top vignette: the reference's atmosphere */}
      <div className="noise pointer-events-none fixed inset-0 z-[1] opacity-[0.05] mix-blend-soft-light" aria-hidden="true" />

      <a
        href="#today"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-ink-950"
      >
        Skip to the command deck
      </a>

      <Nav />

      <main>
        <Hero onOpenApp={() => goTo('today')} />

        <Section id="features" className="!py-14 sm:!py-16">
          <SectionHead
            kicker="Built from the plan itself"
            title={
              <>
                The roadmap already knows what to do.
                <br className="hidden sm:block" /> <span className="blue-text">SAGE makes it visible.</span>
              </>
            }
            lead="A 24-week plan fails in the dark: nobody knows which unit today belongs to, whether the drill hour happened, or if Thursday’s clinic was worth skipping. Every tile below is the plan’s own language, turned into something you can tick."
          />
          <Features />
        </Section>

        <Divider />

        <Section id="today">
          <SectionHead
            align="left"
            kicker="Command deck"
            title="Your day, mapped to the architecture"
            lead="Live shift awareness, question counters and the sleep contract — with the week’s checklist right underneath. Tick as you go; it saves to this browser as you go."
            actions={
              <span className="pill !py-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" /> auto-saving · no account needed
              </span>
            }
          />
          <Today />
        </Section>

        <Section id="checklist" className="!pt-4">
          <SectionHead
            align="left"
            kicker="24-week checklist"
            title={
              <>
                Every week of the roadmap,
                <br className="hidden sm:block" /> <span className="blue-text">one tick at a time.</span>
              </>
            }
            lead="Phase 1A foundations, Phase 1B Grade 11 completion, Phase 2 weak-spot repair, Phase 3 past-paper sprint — with the exact Grade 9–11 units, drill targets, Grade 12 evening links and Thursday clinics from the document."
          />
          <Checklist />
        </Section>

        <Divider tone="#22d3ee" />

        <Section id="shifts">
          <SectionHead
            align="left"
            kicker="Daily system"
            title="Four protected mornings, one evening link, zero weekend drills"
            lead="The shift table from the playbook, rendered as a living week. Nothing new is smuggled in: if the grid is empty on Saturday, Saturday is empty."
          />
          <Shifts />
        </Section>

        <Divider tone="#f472b6" />

        <Section id="notebook">
          <SectionHead
            align="left"
            kicker="Red-flag protocol"
            title="Never repeat the same mistake twice"
            lead="Three lines per miss, every morning from 6:10 to 6:30. Open flags become the Phase 2 re-solve queue — that is the whole difference between 15 questions a day and 15 questions a day that compound."
          />
          <Notebook />
        </Section>

        <Divider tone="#a78bfa" />

        <Section id="progress">
          <SectionHead
            align="left"
            kicker="Progress & readiness"
            title="Proof you are on pace, not just busy"
            lead="Checklist completion, question volume against where the plan expects you by this week, notebook hygiene and nights of protected sleep — one readiness number the group can argue with."
          />
          <Stats />
        </Section>

        <Divider tone="#fbbf24" />

        <Section id="toolkit">
          <SectionHead
            align="left"
            kicker="Execution toolkit"
            title="Timers, sync agendas and the golden rules"
            lead="The accountability machinery from the last page of the playbook: the shift timer, the Thursday night sync, the group verification, and the three rules that keep the architecture from collapsing."
          />
          <Toolkit />
        </Section>

        <Section id="settings" className="!pt-4">
          <SectionHead
            align="left"
            kicker="Setup & backup"
            title="Point the plan at your calendar"
            lead="Set when Week 1 starts and when the national exam lands, then carry your progress with a JSON backup or a printed wall sheet for the dorm wall."
          />
          <Settings />
        </Section>

        <ClosingBand />
      </main>

      <Footer />
    </div>
  );
}

function Divider({ tone = '#6f9bff' }: { tone?: string }) {
  return (
    <div className="relative mx-auto h-px w-full max-w-[1180px] px-5 sm:px-7" aria-hidden="true">
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${tone}44, transparent)` }} />
    </div>
  );
}

function ClosingBand() {
  return (
    <section className="relative mx-auto mt-8 w-full max-w-[1180px] px-5 pb-16 sm:px-7">
      <div className="relative overflow-hidden rounded-[26px] border border-white/[0.09] bg-gradient-to-b from-glow-500/[0.14] via-white/[0.03] to-transparent px-6 py-12 text-center sm:px-12">
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[78%] -translate-x-1/2 rounded-[50%] blur-3xl"
          style={{ background: 'radial-gradient(closest-side, rgba(158,193,255,0.55), transparent 72%)' }}
          aria-hidden="true"
        />
        <span className="pill relative">
          <Icon name="sparkle" size={12} /> Week 1 starts at 3:00 AM
        </span>
        <h2 className="relative mt-5 text-[30px] font-semibold leading-[1.05] text-white sm:text-[44px]">
          Set the alarm. Pack the bag.
          <br />
          <span className="blue-text">Sleep on the plan.</span>
        </h2>
        <p className="muted relative mx-auto mt-4 max-w-xl text-[14.5px]">
          Six and a half hours tonight, fifteen questions before sunrise, and a weekend with nothing on it. That is the entire trick — and
          it is checkable by tomorrow morning.
        </p>
        <div className="relative mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <button type="button" className="btn-light" onClick={() => goTo('checklist')}>
            Open the 24-week checklist
            <Icon name="arrow" size={15} />
          </button>
          <button type="button" className="btn-ghost" onClick={() => goTo('settings')}>
            <Icon name="calendar" size={15} className="text-glow-300" />
            Set my dates
          </button>
        </div>
      </div>
    </section>
  );
}
