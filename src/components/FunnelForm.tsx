import { useEffect, useMemo, useRef, useState } from 'react';
import {
  brand,
  goals,
  dealStages,
  refiStages,
  propertyTypes,
  creditBands,
  usStates,
  tcpaCopy,
  fixedState,
} from '../config/funnel';

// ------------------------------------------------------------------
// types
// ------------------------------------------------------------------

type Answers = {
  goal: string;
  stage: string;
  propertyType: string;
  credit: string;
  price: number;
  downPct: number;
  balance: number;
  rehab: number;
  city: string;
  state: string;
  firstName: string;
  email: string;
  phone: string;
};

type StepId =
  | 'goal'
  | 'stage'
  | 'propertyType'
  | 'credit'
  | 'price'
  | 'secondary'
  | 'city'
  | 'state'
  | 'contact'
  | 'phone';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const track = (event: string, data: Record<string, unknown> = {}) => {
  try {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event, ...data });
  } catch {
    /* no-op */
  }
};

// ------------------------------------------------------------------
// shared sub-components. MODULE scope on purpose: defining these inside
// FunnelForm gave them a new component identity on every render, so React
// remounted the underlying DOM mid-interaction and range-slider dragging
// died after the first change event (click worked, drag did not).
// ------------------------------------------------------------------

const OptionGrid = ({
  options,
  onPick,
  cols = 1,
}: {
  options: ReadonlyArray<{
    value: string;
    label: string;
    sub?: string;
    note?: string;
    icon?: ReadonlyArray<string>;
  }>;
  onPick: (value: string) => void;
  cols?: 1 | 2;
}) => (
  <div className={cols === 2 ? 'grid grid-cols-2 gap-2.5' : 'grid gap-2.5'}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onPick(o.value)}
        className="opt-btn rounded-xl px-4 py-3.5 flex items-center justify-between gap-3"
      >
        <span className="flex items-center gap-3.5">
          {o.icon && (
            <span className="w-10 h-10 shrink-0 rounded-full border border-pine/25 bg-pine/5 text-pine flex items-center justify-center">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {o.icon.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
            </span>
          )}
          <span>
            <span className="block font-semibold text-[1.02rem] leading-snug">{o.label}</span>
            {o.sub && <span className="block text-sm text-ink/55 mt-0.5">{o.sub}</span>}
          </span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {o.note && (
            <span className="font-mono text-[0.62rem] uppercase tracking-widest text-moss">{o.note}</span>
          )}
          <span className="opt-arrow text-brass text-lg" aria-hidden>
            →
          </span>
        </span>
      </button>
    ))}
  </div>
);

const Slider = ({
  value,
  min,
  max,
  stepSize,
  onChange,
  display,
  hint,
  minLabel,
  maxLabel,
}: {
  value: number;
  min: number;
  max: number;
  stepSize: number;
  onChange: (v: number) => void;
  display: string;
  hint?: string;
  minLabel?: string;
  maxLabel?: string;
}) => (
  <div>
    <div className="text-center mb-5">
      <div className="font-display text-[2.6rem] leading-none tracking-tight tabular-nums">{display}</div>
      {hint && <div className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/50 mt-2">{hint}</div>}
    </div>
    <input
      type="range"
      className="brass-range"
      min={min}
      max={max}
      step={stepSize}
      value={value}
      style={{ ['--fill' as never]: `${((value - min) / (max - min)) * 100}%` }}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    <div className="flex justify-between font-mono text-[0.62rem] uppercase tracking-widest text-ink/40 mt-2">
      <span>{minLabel ?? fmt(min)}</span>
      <span>{maxLabel ?? (max >= 2_000_000 ? '$2M+' : fmt(max))}</span>
    </div>
  </div>
);

const Continue = ({ onClick, label = 'Continue' }: { onClick: () => void; label?: string }) => (
  <button type="button" onClick={onClick} className="btn-brass w-full rounded-xl py-3.5 text-[1.05rem] mt-6">
    {label} <span aria-hidden>→</span>
  </button>
);

const Back = ({ show, onBack }: { show: boolean; onBack: () => void }) =>
  show ? (
    <button
      type="button"
      onClick={onBack}
      className="mx-auto mt-4 flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/45 hover:text-ink transition-colors"
    >
      ← Back
    </button>
  ) : null;

// ------------------------------------------------------------------
// component
// ------------------------------------------------------------------

export default function FunnelForm() {
  const [answers, setAnswers] = useState<Answers>({
    goal: '',
    stage: '',
    propertyType: '',
    credit: '',
    price: 350_000,
    downPct: 25,
    balance: 175_000,
    rehab: 75_000,
    city: '',
    state: fixedState || '',
    firstName: '',
    email: '',
    phone: '',
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<'fwd' | 'back'>('fwd');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [stateQuery, setStateQuery] = useState('');
  // TCPA: explicit opt-in. Starts UNCHECKED by law (no pre-checked consent) and
  // gates submit. The timestamp is captured at the moment of the click, not at
  // submit, so the record reflects when consent was actually given.
  const [tcpaConsent, setTcpaConsent] = useState(false);
  const tcpaConsentAt = useRef<string | null>(null);
  const startedAt = useRef<number>(0);
  const attribution = useRef<Record<string, string>>({});
  const cardRef = useRef<HTMLDivElement>(null);

  // capture gclid / utm params once
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    // ?qa=1 marks a QA walk: the lead still posts end to end, but the Ads
    // conversion on /thank-you is suppressed so tests never pollute the data.
    if (p.get('qa') === '1') sessionStorage.setItem('qa', '1');
    const keep = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const found: Record<string, string> = {};
    keep.forEach((k) => {
      const v = p.get(k) || sessionStorage.getItem(`attr_${k}`) || '';
      if (v) {
        found[k] = v;
        sessionStorage.setItem(`attr_${k}`, v);
      }
    });
    attribution.current = found;
  }, []);

  const steps: StepId[] = useMemo(() => {
    // single-state funnel: the state step is skipped and every lead is
    // stamped with fixedState (see src/config/funnel.ts). The city step
    // (overhaul 2026-08-19) sits after the deal-structure step and right
    // before contact info: it feeds the "[city] rental" opener in Paul's
    // first text and is a low-friction commitment beat.
    return fixedState
      ? ['goal', 'stage', 'propertyType', 'credit', 'price', 'secondary', 'city', 'contact', 'phone']
      : ['goal', 'stage', 'propertyType', 'credit', 'price', 'secondary', 'city', 'state', 'contact', 'phone'];
  }, []);

  const step = steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((a) => ({ ...a, [key]: value }));

  const go = (dir: 'fwd' | 'back') => {
    setError('');
    setDirection(dir);
    setStepIndex((i) => Math.min(steps.length - 1, Math.max(0, i + (dir === 'fwd' ? 1 : -1))));
    // keep the card in view on mobile as steps change height
    requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  };

  const pick = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    if (!startedAt.current) {
      startedAt.current = Date.now();
      track('funnel_start');
    }
    set(key, value);
    track('funnel_step', { step, value: String(value) });
    if (key === 'credit' && value === '<620') {
      // Hard exit (overhaul 2026-08-19): sub-620 goes to /not-yet, the honest
      // no-with-a-path page, instead of a soft "change my answer" loop. The
      // server side of this gate lives in /api/lead.
      window.location.href = '/not-yet';
      return;
    }
    window.setTimeout(() => go('fwd'), 180);
  };

  // ----------------------------------------------------------------
  // submit
  // ----------------------------------------------------------------

  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
  const phoneDigits = answers.phone.replace(/\D/g, '');

  const formatPhone = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  const stageOptions = answers.goal === 'refinance' ? refiStages : dealStages;

  // display-ready strings ride along so the CRM never has to format numbers
  // (GHL merge fields render these directly; see deliverables/WIRING.md)
  const buildLeadPayload = (honeypot = '') => {
    const isRefiGoal = answers.goal === 'refinance' || answers.goal === 'cashout';
    const clampedBalance = Math.min(answers.balance, answers.price);
    const equity = isRefiGoal ? Math.max(answers.price - clampedBalance, 0) : null;
    const downPayment =
      answers.goal === 'purchase' ? Math.round((answers.downPct / 100) * answers.price) : null;
    const priceDisplay = answers.price >= 2_000_000 ? '$2,000,000+' : fmt(answers.price);
    const scenarioDetail =
      answers.goal === 'purchase'
        ? `${answers.downPct}% down (about ${fmt(downPayment ?? 0)})`
        : answers.goal === 'bridge'
          ? `Rehab budget around ${fmt(answers.rehab)}`
          : `About ${fmt(clampedBalance)} owed, roughly ${fmt(equity ?? 0)} in equity`;

    return {
      ...answers,
      city: answers.city.trim(),
      phone: phoneDigits,
      partial: false,   // always false; partial captures removed, kept so the CRM field map never sees a missing key
      price: answers.price >= 2_000_000 ? '2000000+' : answers.price,
      downPayment,
      goalLabel: goals.find((g) => g.value === answers.goal)?.label ?? answers.goal,
      stageLabel: stageOptions.find((s) => s.value === answers.stage)?.label ?? answers.stage,
      propertyTypeLabel:
        propertyTypes.find((p) => p.value === answers.propertyType)?.label ?? answers.propertyType,
      priceDisplay,
      downPctDisplay: answers.goal === 'purchase' ? `${answers.downPct}%` : null,
      downPaymentDisplay: downPayment !== null ? fmt(downPayment) : null,
      balanceDisplay: isRefiGoal ? fmt(clampedBalance) : null,
      equity,
      equityDisplay: equity !== null ? fmt(equity) : null,
      rehabDisplay: answers.goal === 'bridge' ? fmt(answers.rehab) : null,
      scenarioDetail,
      // ---- TCPA consent record (map ALL of these into the CRM) ----
      // A bare "true" is weak evidence: it does not prove WHAT was agreed to,
      // and this disclaimer text will change over time. So the exact language
      // shown at the moment of consent ships with every lead.
      tcpaConsent: true,                        // gated; a lead cannot submit without checking
      tcpaConsentText: tcpaCopy,                // verbatim language the lead agreed to
      tcpaConsentAt: tcpaConsentAt.current,     // ISO timestamp of the checkbox click
      tcpaConsentUrl: window.location.href,     // exact page/URL where consent was captured
      ...attribution.current,
      landingPage: window.location.pathname + window.location.search,
      secondsToComplete: startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : null,
      website: honeypot, // honeypot; non-empty means bot
      submittedAt: new Date().toISOString(),
    };
  };

  // NO partial captures. One webhook per lead, fired only from submit() with
  // name + email + phone all present, so the CRM never sees a half-lead and
  // only one intake automation is needed. (Removed 2026-07-27, Tanner's call.)

  const submit = async () => {
    if (phoneDigits.length !== 10) {
      setError('Enter a 10-digit mobile number so we can text your pricing options.');
      return;
    }
    // TCPA gate. Consent must be affirmative, so this blocks submit outright
    // rather than defaulting to consented. Do not soften into a warning.
    if (!tcpaConsent) {
      setError('Please check the consent box so we have your permission to contact you.');
      return;
    }
    const honeypot = (document.getElementById('ff-company') as HTMLInputElement)?.value;
    setSubmitting(true);
    setSubmitError(false);

    const payload = buildLeadPayload(honeypot || '');

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      track('lead_submit', { goal: answers.goal, state: answers.state });
      sessionStorage.setItem(
        'lead-summary',
        JSON.stringify({
          firstName: answers.firstName,
          goal: answers.goal,
          propertyType: answers.propertyType,
          credit: answers.credit,
          price: answers.price,
          city: answers.city.trim(),
          state: answers.state,
        })
      );
      window.location.href = '/thank-you';
    } catch {
      setSubmitting(false);
      setSubmitError(true);
    }
  };

  // shared sub-components live at module scope (see note above the
  // component): keeping them here remounted the DOM every render and
  // broke slider dragging.

  // ----------------------------------------------------------------
  // step content
  // ----------------------------------------------------------------

  const isPurchase = answers.goal === 'purchase';
  const isBridge = answers.goal === 'bridge';

  const titles: Record<StepId, string> = {
    goal: 'What are you looking to do?',
    stage: 'Where are you in the deal?',
    propertyType: 'What type of property?',
    credit: "Where's your credit sitting?",
    price: isPurchase || isBridge ? 'Estimated purchase price?' : 'Estimated property value?',
    secondary: isPurchase
      ? 'How are you structuring the deal?'
      : isBridge
        ? 'Estimated rehab budget?'
        : 'Roughly what do you still owe?',
    city: 'Which Texas city is the property in?',
    state: 'Where is the property?',
    contact: "What's your name and email?",
    phone: 'Where should we text your pricing options?',
  };

  const subtitles: Partial<Record<StepId, string>> = {
    goal: 'Takes about 60 seconds. No credit pull, no obligation.',
    credit: 'A soft estimate is fine. This never touches your credit.',
    secondary: isPurchase ? 'More down usually means sharper pricing.' : undefined,
    contact: 'So your specialist knows who to follow up with.',
    phone: 'Text first. A call only if you ask for one.',
  };

  const filteredStates = usStates
    .filter((s) => s.toLowerCase().startsWith(stateQuery.trim().toLowerCase()))
    .slice(0, 6);

  const renderStep = () => {
    switch (step) {
      case 'goal':
        return <OptionGrid options={goals} onPick={(v) => pick('goal', v as never)} />;

      case 'stage':
        return <OptionGrid options={stageOptions} onPick={(v) => pick('stage', v as never)} />;

      case 'propertyType':
        return <OptionGrid options={propertyTypes} onPick={(v) => pick('propertyType', v as never)} cols={2} />;

      case 'credit':
        return <OptionGrid options={creditBands} onPick={(v) => pick('credit', v as never)} />;

      case 'price':
        return (
          <>
            <Slider
              value={answers.price}
              min={150_000}
              max={2_000_000}
              stepSize={25_000}
              onChange={(v) => set('price', v)}
              display={answers.price >= 2_000_000 ? '$2,000,000+' : fmt(answers.price)}
            />
            <Continue onClick={() => go('fwd')} />
          </>
        );

      case 'secondary':
        if (isPurchase) {
          const dollars = Math.round((answers.downPct / 100) * answers.price);
          return (
            <>
              <Slider
                value={answers.downPct}
                min={20}
                max={60}
                stepSize={5}
                onChange={(v) => set('downPct', v)}
                display={`${answers.downPct}%`}
                hint={`≈ ${fmt(dollars)} down`}
                minLabel="20%"
                maxLabel="60%+"
              />
              <Continue onClick={() => go('fwd')} />
            </>
          );
        }
        if (isBridge) {
          return (
            <>
              <Slider
                value={answers.rehab}
                min={0}
                max={500_000}
                stepSize={25_000}
                onChange={(v) => set('rehab', v)}
                display={fmt(answers.rehab)}
              />
              <Continue onClick={() => go('fwd')} />
            </>
          );
        }
        return (
          <>
            <Slider
              value={Math.min(answers.balance, answers.price)}
              min={0}
              max={answers.price}
              stepSize={25_000}
              onChange={(v) => set('balance', v)}
              display={fmt(Math.min(answers.balance, answers.price))}
              hint={`≈ ${fmt(Math.max(answers.price - answers.balance, 0))} in equity`}
            />
            <Continue onClick={() => go('fwd')} />
          </>
        );

      case 'city':
        return (
          <div className="grid gap-3">
            <input
              className="field-input rounded-xl"
              placeholder="e.g. Fort Worth"
              autoComplete="address-level2"
              value={answers.city}
              autoFocus
              onChange={(e) => set('city', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && answers.city.trim().length >= 2) {
                  track('funnel_step', { step: 'city', value: answers.city.trim() });
                  go('fwd');
                }
              }}
            />
            {error && <p className="text-sm text-blush font-medium">{error}</p>}
            <Continue
              onClick={() => {
                if (answers.city.trim().length < 2) {
                  setError('Add the city so your options get priced to the right market.');
                  return;
                }
                track('funnel_step', { step: 'city', value: answers.city.trim() });
                go('fwd');
              }}
            />
          </div>
        );

      case 'state':
        return (
          <div>
            <input
              className="field-input rounded-xl"
              placeholder="Start typing your state…"
              value={answers.state || stateQuery}
              autoFocus
              onChange={(e) => {
                setStateQuery(e.target.value);
                set('state', '');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredStates.length > 0) {
                  pick('state', filteredStates[0]);
                }
              }}
            />
            {!answers.state && stateQuery.trim() && (
              <div className="mt-2.5 grid gap-1.5">
                {filteredStates.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => pick('state', s)}
                    className="opt-btn rounded-lg px-4 py-2.5 text-[0.98rem] font-medium"
                  >
                    {s}
                  </button>
                ))}
                {filteredStates.length === 0 && (
                  <p className="text-sm text-ink/50 px-1 pt-1">No match. Check the spelling?</p>
                )}
              </div>
            )}
            {!stateQuery.trim() && (
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-ink/40 mt-3 text-center">
                Where the property is located
              </p>
            )}
          </div>
        );

      case 'contact':
        return (
          <div className="grid gap-3">
            <input
              className="field-input rounded-xl"
              placeholder="Full name"
              autoComplete="name"
              value={answers.firstName}
              onChange={(e) => set('firstName', e.target.value)}
            />
            <input
              className="field-input rounded-xl"
              placeholder="Email address"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={answers.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {error && <p className="text-sm text-blush font-medium">{error}</p>}
            <Continue
              onClick={() => {
                if (answers.firstName.trim().length < 2) {
                  setError('Add your full name so we know who to address.');
                  return;
                }
                if (!validEmail(answers.email)) {
                  setError('That email doesn’t look right. Mind checking it?');
                  return;
                }
                track('funnel_step', { step: 'contact' });
                go('fwd');
              }}
            />
          </div>
        );

      case 'phone': {
        const summaryBits = [
          goals.find((g) => g.value === answers.goal)?.label,
          propertyTypes.find((p) => p.value === answers.propertyType)?.label,
          answers.city.trim() || answers.state,
          answers.price >= 2_000_000 ? '$2M+' : fmt(answers.price),
        ].filter(Boolean);
        return (
          <div>
            <div className="flex flex-wrap gap-1.5 justify-center mb-4">
              {summaryBits.map((b) => (
                <span
                  key={String(b)}
                  className="font-mono text-[0.62rem] uppercase tracking-[0.14em] bg-pine/10 text-pine border border-pine/20 rounded-full px-2.5 py-1"
                >
                  {b}
                </span>
              ))}
            </div>
            <input
              className="field-input rounded-xl text-center text-lg tracking-wide"
              placeholder="(555) 555-0140"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={answers.phone}
              autoFocus
              onChange={(e) => set('phone', formatPhone(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            {error && <p className="text-sm text-blush font-medium mt-2">{error}</p>}
            {submitError && (
              <p className="text-sm text-blush font-medium mt-2">
                Hmm, that didn&rsquo;t go through. Give it one more try. Your answers are saved.
              </p>
            )}

            {/* TCPA opt-in. MUST stay above the submit button, MUST start
                unchecked, and MUST gate submit. Never pre-check it. */}
            <label
              htmlFor="ff-tcpa"
              className="flex gap-3 mt-4 cursor-pointer select-none rounded-xl border border-ink/12 bg-paper-2/60 px-3.5 py-3 transition-colors hover:border-ink/25"
            >
              <input
                id="ff-tcpa"
                type="checkbox"
                checked={tcpaConsent}
                onChange={(e) => {
                  const next = e.target.checked;
                  setTcpaConsent(next);
                  // stamp the moment consent was actually given, not submit time
                  tcpaConsentAt.current = next ? new Date().toISOString() : null;
                  if (next) setError('');
                }}
                className="mt-0.5 h-[1.15rem] w-[1.15rem] shrink-0 cursor-pointer accent-[var(--color-pine)]"
              />
              <span className="text-[0.68rem] leading-relaxed text-ink/55">{tcpaCopy}</span>
            </label>

            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="btn-brass w-full rounded-xl py-4 text-[1.08rem] mt-4 disabled:opacity-60 disabled:cursor-wait"
            >
              {submitting ? 'Pulling your pricing options…' : 'Get My DSCR Pricing Options'}
            </button>
          </div>
        );
      }
    }
  };

  // ----------------------------------------------------------------
  // card shell
  // ----------------------------------------------------------------

  return (
    <div ref={cardRef}>
      {/* honeypot; humans never see it. Lives in the always-mounted shell so its
          value survives step changes and is still in the DOM at submit time. */}
      <input
        id="ff-company"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-5000px', width: 1, height: 1, opacity: 0 }}
      />
      {/* progress */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-ink/50">
          Step {stepIndex + 1} of {steps.length}
        </span>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-brass">{progress}%</span>
      </div>
      <div className="h-[3px] rounded-full bg-ink/10 overflow-hidden mb-6">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brass to-brass-2 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* step body */}
      <div key={`${step}-${direction}`} className={direction === 'fwd' ? 'step-enter' : 'step-enter-back'}>
        <h3 className="font-display text-[1.45rem] leading-tight text-center mb-1.5">{titles[step]}</h3>
        {subtitles[step] && (
          <p className="text-center text-[0.88rem] text-ink/55 mb-5">{subtitles[step]}</p>
        )}
        {!subtitles[step] && <div className="mb-5" />}
        {renderStep()}
      </div>

      <Back show={stepIndex > 0} onBack={() => go('back')} />
    </div>
  );
}
