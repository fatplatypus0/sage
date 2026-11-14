import { useState } from 'react';
import { WEEKS } from '../data/roadmap';
import { Card, EmptyState, Icon, Tag, Bar } from '../components/ui';
import { cn } from '../components/cn';
import { haptic } from '../lib/haptic';
import { useStore } from '../lib/store';

const VENUES = ['Kebele café', 'Sablar A dorm', 'Husena library', 'Sablar B dorm'];

/**
 * The Thursday clinic is the part of the plan that dies first: two venues refuse students and
 * members quietly drop out. This roster makes the weekly verification real — questions hit,
 * mini-lesson taught, venue actually locked — and records the retro line the playbook asks for.
 */
export function Roster() {
  const { state, dispatch, derived } = useStore();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const week = WEEKS[derived.currentWeek - 1];
  const override = state.overrides[String(derived.currentWeek)] ?? {};
  const retro = state.retro[String(derived.currentWeek)] ?? '';
  const venue = VENUES[(derived.currentWeek - 1) % VENUES.length];

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: 'addPeer', name: trimmed });
    setName('');
    setAdding(false);
    haptic(12);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className={cn('!p-4', derived.groupVerified >= 4 && 'border-mint/35 bg-mint/[0.06]')}>
          <div className="flex items-center justify-between">
            <span className="label !mb-0">Clinic status · week {derived.currentWeek}</span>
            <Icon name={derived.groupVerified >= 4 ? 'check' : 'clock'} size={16} className={derived.groupVerified >= 4 ? 'text-mint' : 'text-amber'} />
          </div>
          <div className="mt-2 font-display text-[20px] font-semibold leading-tight text-white">
            {derived.peerCount === 0
              ? 'No roster yet'
              : derived.groupVerified >= 4
                ? 'Thursday runs as planned'
                : derived.peersReady >= 2
                  ? 'Runs in pairs'
                  : 'Use the fallback'}
          </div>
          <p className="muted mt-1.5 text-[12.5px] leading-[1.5]">
            {derived.groupVerified}/6 members have hit {derived.groupTarget} questions <em>and</em> taught their mini-lesson at{' '}
            {venue}.
          </p>
        </Card>
        <Card className="!p-4">
          <span className="label !mb-0">Roster</span>
          <div className="mt-2 font-display text-[20px] font-semibold text-white">
            {derived.peerCount}
            <span className="text-[13px] font-normal text-glow-200/50"> / {Math.max(6, state.groupSize)} people</span>
          </div>
          <Bar value={derived.peerCount / Math.max(6, state.groupSize)} className="mt-2.5" height={5} />
          <p className="muted mt-2 text-[12px]">
            The plan assumes six. Below four the clinic becomes two pairs — logged, not mourned.
          </p>
        </Card>
        <Card className="!p-4">
          <span className="label !mb-0">Rotation</span>
          <div className="mt-2 font-display text-[20px] font-semibold text-white">{venue}</div>
          <p className="muted mt-1.5 text-[12.5px]">
            5:30–6:50 PM clinic, 7:00–8:30 PM timed set. Venue moves every week so nobody’s landlady decides the schedule.
          </p>
        </Card>
      </div>

      {adding ? (
        <Card className="!p-4">
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[200px] flex-1">
              <span className="label">Name or nickname</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder="e.g. Abdi"
                className="field mt-1.5 w-full"
                maxLength={24}
                autoFocus
              />
            </label>
            <button type="button" className="btn-light !py-2.5 text-[13.5px]" onClick={add}>
              <Icon name="check" size={15} /> Add to group
            </button>
            <button type="button" className="btn-ghost !py-2.5 text-[13.5px]" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </Card>
      ) : null}

      {state.peers.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {state.peers.map((p, i) => {
            const hit = p.stem >= derived.groupTarget;
            const ok = hit && p.taught && p.locked;
            return (
              <li key={p.id}>
                <Card className={cn('!p-4 transition', ok && 'border-mint/30 bg-mint/[0.05]')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[15.5px] font-semibold text-white">{p.name}</span>
                        {ok ? <Tag color="#34d399">verified</Tag> : !p.locked ? <Tag color="#f472b6">no venue</Tag> : null}
                      </div>
                      <div className="mt-0.5 text-[12px] text-glow-200/50">
                        teaches at {VENUES[i % VENUES.length]} · fortnight {Math.ceil(derived.currentWeek / 2)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-tiny !px-2.5 !py-2"
                      aria-label={`Remove ${p.name} from the group`}
                      onClick={() => {
                        if (window.confirm(`Remove ${p.name} from the roster?`)) dispatch({ type: 'delPeer', id: p.id });
                      }}
                    >
                      <Icon name="trash" size={13} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                    <span className="text-[12px] text-glow-200/60">Questions this week</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        type="button"
                        className="tap grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-glow-100 active:scale-95"
                        aria-label={`Remove 10 questions from ${p.name}`}
                        onClick={() => dispatch({ type: 'patchPeer', id: p.id, patch: { stem: Math.max(0, p.stem - 10) } })}
                      >
                        <Icon name="minus" size={14} />
                      </button>
                      <span className={cn('num w-14 text-center text-[15px] font-bold', hit ? 'text-mint' : 'text-white')}>{p.stem}</span>
                      <button
                        type="button"
                        className="tap grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-glow-100 active:scale-95"
                        aria-label={`Add 10 questions to ${p.name}`}
                        onClick={() => {
                          dispatch({ type: 'patchPeer', id: p.id, patch: { stem: Math.min(200, p.stem + 10) } });
                          haptic(8);
                        }}
                      >
                        <Icon name="plus" size={14} />
                      </button>
                    </div>
                  </div>
                  <Bar value={p.stem / Math.max(1, derived.groupTarget)} className="mt-2" height={4} color={hit ? '#34d399' : '#6f9bff'} />

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'patchPeer', id: p.id, patch: { taught: !p.taught } });
                        haptic(10);
                      }}
                      className={cn('tap inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[12.5px] transition', p.taught ? 'border-glow-400/45 bg-glow-500/20 text-white' : 'border-white/10 bg-white/[0.04] text-glow-200/70')}
                    >
                      <Icon name="book" size={14} /> {p.taught ? 'Taught their 5-min lesson' : 'No mini-lesson yet'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'patchPeer', id: p.id, patch: { locked: !p.locked } });
                        haptic(10);
                      }}
                      className={cn('tap inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[12.5px] transition', p.locked ? 'border-mint/45 bg-mint/15 text-white' : 'border-white/10 bg-white/[0.04] text-glow-200/70')}
                    >
                      <Icon name="shield" size={14} /> {p.locked ? 'Venue holds' : 'Venue unconfirmed'}
                    </button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon="users"
          title="The roster is empty"
          body="Two venues in the document refuse students, and members fade by week six. Name the six people here, tick what actually happened each Thursday, and the plan adapts instead of quietly collapsing."
          action={
            <button type="button" className="btn-light mt-1" onClick={() => setAdding(true)}>
              <Icon name="plus" size={15} /> Add the first member
            </button>
          }
        />
      )}

      <Card className="!p-4 sm:!p-5">
        <span className="kicker">
          <Icon name="flag" size={12} className="text-amber" /> Thursday night sync · week {derived.currentWeek}
        </span>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <label className="block">
            <span className="label">Two-line retro for this week</span>
            <textarea
              value={retro}
              onChange={(e) => dispatch({ type: 'setRetro', week: derived.currentWeek, text: e.target.value })}
              rows={4}
              placeholder={'what got done · what slipped and why'}
              className="field mt-1.5 w-full resize-y text-[13.5px] leading-[1.55]"
              maxLength={600}
            />
          </label>
          <div>
            <span className="label">Reality override</span>
            <div className="mt-1.5 grid gap-1.5">
              <button
                type="button"
                onClick={() => dispatch({ type: 'setOverride', week: derived.currentWeek, patch: { swapped: !override.swapped } })}
                className={cn(
                  'tap flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[13px] transition',
                  override.swapped ? 'border-glow-400/45 bg-glow-500/15 text-white' : 'border-white/10 bg-white/[0.03] text-glow-100/85',
                )}
              >
                <Icon name="reset" size={15} className={override.swapped ? 'text-glow-200' : 'text-glow-300/60'} />
                Swap the two sides this week ({week.sides[1].short} before {week.sides[0].short})
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'setOverride', week: derived.currentWeek, patch: { catchUp: override.catchUp ? undefined : 'Sunday 9:00 AM · 40 leftovers + 10 re-solves' } })}
                className={cn(
                  'tap flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[13px] transition',
                  override.catchUp ? 'border-amber/45 bg-amber/15 text-white' : 'border-white/10 bg-white/[0.03] text-glow-100/85',
                )}
              >
                <Icon name="calendar" size={15} className={override.catchUp ? 'text-amber' : 'text-glow-300/60'} />
                {override.catchUp ? 'Catch-up block booked: ' + override.catchUp : 'Book the Sunday catch-up block'}
              </button>
              <label className="block">
                <span className="label">Note for this week</span>
                <input
                  value={override.note ?? ''}
                  onChange={(e) => dispatch({ type: 'setOverride', week: derived.currentWeek, patch: { note: e.target.value } })}
                  placeholder="e.g. church festival Wed–Thu, clinic in pairs"
                  className="field mt-1.5 w-full"
                  maxLength={120}
                />
              </label>
            </div>
          </div>
        </div>
        <p className="muted mt-3 text-[12px]">
          Overrides are local edits to the printed plan — they never rewrite the roadmap, they only annotate the week so Sunday’s
          review knows why the numbers look like that.
        </p>
      </Card>
    </div>
  );
}
