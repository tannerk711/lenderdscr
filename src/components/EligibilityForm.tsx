// Eligibility form island (BRIEF section 6). Mounted client:load inside
// HeroForm.astro's #start card. Imports ONLY react, site.ts, states.ts and
// IconSvg.tsx: the island is the hero, so its bundle stays lean.
//
// Nothing in here ever receives GSAP / tilt / entrance motion. Step motion is
// React + CSS only (.step-enter, the height tween, .is-selected).
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  site,
  form,
  goals,
  propertyTypes,
  creditBands,
  tcpaCopy,
  tcpaParties,
  type IconName,
  type Option,
} from '../config/site';
import { states, findState, type StateEntry } from '../data/states';
import IconSvg from './IconSvg';

// ---------------------------------------------------------------------------
// types + constants
// ---------------------------------------------------------------------------

type StepId = 'goal' | 'propertyType' | 'credit' | 'price' | 'secondary' | 'state' | 'contact' | 'phone';
type PhaseId = 'property' | 'credit' | 'deal' | 'contact';
type Dir = 'fwd' | 'back';

type Answers = {
  goal: string;
  propertyType: string;
  credit: string;
  price: number;
  downPct: number;
  balance: number;
  rehab: number;
  state: string; // full name ('Texas')
  stateSlug: string; // 'texas'
  firstName: string;
  email: string;
  phone: string; // formatted for display; payload ships 10 digits
};

const ALL_STEPS: StepId[] = ['goal', 'propertyType', 'credit', 'price', 'secondary', 'state', 'contact', 'phone'];

const PHASE_OF: Record<StepId, PhaseId> = {
  goal: 'property',
  propertyType: 'property',
  credit: 'credit',
  price: 'deal',
  secondary: 'deal',
  state: 'deal',
  contact: 'contact',
  phone: 'contact',
};

const PRICE = { min: 100_000, max: 2_000_000, step: 25_000, initial: 300_000 };
const DOWN = { min: 20, max: 50, step: 5, initial: 25 };
const REHAB = { min: 0, max: 500_000, step: 25_000, initial: 75_000 };
const BALANCE = { step: 25_000, initial: 175_000 };
const ADVANCE_MS = 180;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ATTR_KEYS = ['gclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;
// Not a config token yet (site.ts is frozen); see the return summary NEEDS.
const SUBMIT_FAILED = "That didn't go through. Give it one more try. Your answers are saved.";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const priceDisplayOf = (p: number) => (p >= PRICE.max ? '$2,000,000+' : fmt(p));
const priceShortOf = (p: number) => (p >= PRICE.max ? '$2M+' : fmt(p));

const track = (event: string, data: Record<string, unknown> = {}) => {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...data });
  } catch {
    /* analytics never breaks the funnel */
  }
};

// sessionStorage throws in Safari private mode and storage-blocked contexts
const ssGet = (k: string): string => {
  try {
    return window.sessionStorage.getItem(k) || '';
  } catch {
    return '';
  }
};
const ssSet = (k: string, v: string) => {
  try {
    window.sessionStorage.setItem(k, v);
  } catch {
    /* thank-you page just skips personalization */
  }
};

// Autofill and pasted contacts often carry the US country code (+1XXXXXXXXXX).
function formatPhone(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  // 11+ digits that are not a leading-1 US number (international paste, junk):
  // keep the raw digits so the 10-digit validation fails loudly instead of
  // shipping a truncated but plausible-looking number, and its TCPA consent
  // record, that the user never gave.
  if (d.length > 10) return d;
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// Type-ahead: names by prefix, abbreviations by prefix (2 chars max), exact
// name/abbr/slug match first. Names and abbreviations resolve to the SAME
// StateEntry, so stateSlug is never empty when state is set.
function stateMatches(query: string): StateEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const exact = findState(q);
  const rest = states.filter(
    (s) =>
      s !== exact &&
      (s.name.toLowerCase().startsWith(q) || (q.length <= 2 && s.abbr.toLowerCase().startsWith(q))),
  );
  return (exact ? [exact, ...rest] : rest).slice(0, 6);
}

const fillStyle = (value: number, min: number, max: number): CSSProperties =>
  ({ ['--fill' as string]: `${max > min ? ((value - min) / (max - min)) * 100 : 0}%` }) as CSSProperties;

// ---------------------------------------------------------------------------
// sub-components at MODULE scope. Defining these inside the form gives them a
// new identity every render, React remounts the DOM mid-interaction, and
// range-slider drag dies after the first change event.
// ---------------------------------------------------------------------------

function OptionCards({
  options,
  selected,
  onPick,
}: {
  options: ReadonlyArray<Option>;
  selected: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3 md:gap-4">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-value={o.value}
          aria-pressed={selected === o.value}
          className={`opt-card${selected === o.value ? ' is-selected' : ''}`}
          onClick={() => onPick(o.value)}
        >
          <span className="opt-coin">
            <IconSvg name={o.icon} size={24} />
          </span>
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function OptionRows({
  options,
  selected,
  onPick,
  cols = 1,
}: {
  options: ReadonlyArray<Option>;
  selected: string;
  onPick: (value: string) => void;
  cols?: 1 | 2;
}) {
  return (
    <div className={cols === 2 ? 'grid grid-cols-2 gap-2.5' : 'grid gap-2.5'}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-value={o.value}
          aria-pressed={selected === o.value}
          className={`opt-btn${selected === o.value ? ' is-selected' : ''}`}
          onClick={() => onPick(o.value)}
        >
          <span className="opt-coin">
            <IconSvg name={o.icon} size={20} />
          </span>
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
  display,
  hint,
  minLabel,
  maxLabel,
  ariaLabel,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
  hint?: string;
  minLabel: string;
  maxLabel: string;
  ariaLabel: string;
}) {
  return (
    <div>
      <div className="text-center">
        <div className="font-display text-[2.4rem] font-extrabold leading-none tracking-[-0.008em] text-ink tabular">
          {display}
        </div>
        {hint && <div className="label mt-2">{hint}</div>}
      </div>
      <input
        id="ff-range"
        type="range"
        className="amber-range mt-5"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        aria-valuetext={display}
        style={fillStyle(value, min, max)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="label mt-1 flex justify-between">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function ContinueBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" data-action="continue" className="btn-amber mt-6 w-full" onClick={onClick}>
      {form.continue}
      <IconSvg name="arrow" size={18} />
    </button>
  );
}

function ErrorLine({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p data-error role="alert" className="mt-3 text-sm font-medium text-brand">
      {text}
    </p>
  );
}

// ---------------------------------------------------------------------------
// the island
// ---------------------------------------------------------------------------

export default function EligibilityForm({ fixedState }: { fixedState?: StateEntry }) {
  const steps = useMemo<StepId[]>(
    () => (fixedState ? ALL_STEPS.filter((s) => s !== 'state') : ALL_STEPS),
    [fixedState],
  );

  const [answers, setAnswers] = useState<Answers>(() => ({
    goal: '',
    propertyType: '',
    credit: '',
    price: PRICE.initial,
    downPct: DOWN.initial,
    balance: BALANCE.initial,
    rehab: REHAB.initial,
    state: fixedState?.name ?? '',
    stateSlug: fixedState?.slug ?? '',
    firstName: '',
    email: '',
    phone: '',
  }));
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<Dir>('fwd');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stateQuery, setStateQuery] = useState('');
  // keyboard-highlighted suggestion in the state listbox (-1 = none)
  const [stateActive, setStateActive] = useState(-1);
  // TCPA: starts UNCHECKED, gates submit; the timestamp is the click moment.
  const [consent, setConsent] = useState(false);
  const consentAt = useRef<string | null>(null);

  const startedAt = useRef(0);
  const inFlight = useRef(false); // synchronous duplicate-submit guard
  const advanceTimer = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hpRef = useRef<HTMLInputElement>(null);
  const outgoingH = useRef<number | null>(null);
  const prevIndex = useRef(0);
  const stepIndexRef = useRef(0); // preselect guard reads the live index
  const focusWasInForm = useRef(false); // a11y: restore focus after step remount

  const step = steps[stepIndex];
  const total = steps.length;
  const progress = Math.round(((stepIndex + 1) / total) * 100);
  const activePhase = PHASE_OF[step];
  const phaseIdx = form.phases.findIndex((p) => p.id === activePhase);

  const isPurchase = answers.goal === 'purchase';
  const isBridge = answers.goal === 'bridge';
  const isRefi = answers.goal === 'refinance';

  // ---- navigation ---------------------------------------------------------

  const ensureStarted = () => {
    if (!startedAt.current) {
      startedAt.current = Date.now();
      track('funnel_start');
    }
  };

  const go = (dir: Dir) => {
    setError('');
    // if focus is inside the form now, the step remount will orphan it
    focusWasInForm.current = !!rootRef.current?.contains(document.activeElement);
    // capture the outgoing height so the shell tweens instead of snapping
    outgoingH.current = shellRef.current?.offsetHeight ?? null;
    setDirection(dir);
    setStepIndex((i) => Math.min(total - 1, Math.max(0, i + (dir === 'fwd' ? 1 : -1))));
  };

  const scheduleAdvance = () => {
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => go('fwd'), ADVANCE_MS);
  };

  const pick = (key: 'goal' | 'propertyType' | 'credit', value: string) => {
    ensureStarted();
    setAnswers((a) => ({ ...a, [key]: value }));
    track('funnel_step', { step: key, value });
    if (key === 'credit' && value === '<620') {
      // Hard exit: the honest no-with-a-path page. /api/lead drops it too.
      window.location.href = '/not-yet';
      return;
    }
    scheduleAdvance();
  };

  const pickState = (st: StateEntry) => {
    ensureStarted();
    setAnswers((a) => ({ ...a, state: st.name, stateSlug: st.slug }));
    setStateQuery(st.name);
    track('funnel_step', { step: 'state', value: st.slug });
    scheduleAdvance();
  };

  const continueFrom = (s: StepId, value?: string | number) => {
    ensureStarted();
    track('funnel_step', { step: s, value: value === undefined ? undefined : String(value) });
    go('fwd');
  };

  const back = () => {
    window.clearTimeout(advanceTimer.current);
    go('back');
  };

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);

  // bfcache restore (Back from /thank-you) revives the island with
  // submitting=true and inFlight locked, leaving the form dead until a manual
  // reload. pageshow with e.persisted is the restore signal; reset to interactive.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      inFlight.current = false;
      setSubmitting(false);
      setError('');
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  // ---- preselect ([data-goal] elements, HeroForm.astro inline script) ------

  useEffect(() => {
    const apply = (goal: unknown) => {
      if (typeof goal !== 'string' || !goals.some((g) => g.value === goal)) return;
      // Only while still on the goal step. Past it, rewriting the goal would
      // silently switch the branch semantics of price/secondary answers the
      // user already gave (a Purchase down payment shipping as a fabricated
      // refinance balance). Later [data-goal] clicks just scroll to the form.
      if (stepIndexRef.current !== 0) return;
      ensureStarted();
      setAnswers((a) => ({ ...a, goal }));
      track('funnel_step', { step: 'goal', value: goal, preselect: true });
      setError('');
      outgoingH.current = shellRef.current?.offsetHeight ?? null;
      setDirection('fwd');
      // only jump when still on the goal step; never throw away later answers
      setStepIndex((i) => (i === 0 ? 1 : i));
    };
    const start = rootRef.current?.closest<HTMLElement>('#start');
    const pre = start?.dataset.preselect;
    if (pre) {
      delete start!.dataset.preselect;
      apply(pre);
    }
    const onEvent = (e: Event) => apply((e as CustomEvent).detail);
    document.addEventListener('funnel:preselect', onEvent);
    return () => document.removeEventListener('funnel:preselect', onEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- height tween between steps (reduced-motion aware) -------------------

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const from = outgoingH.current;
    outgoingH.current = null;
    if (!shell || from == null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const to = shell.offsetHeight;
    if (Math.abs(to - from) < 2) return;
    shell.style.height = `${from}px`;
    shell.style.overflow = 'hidden';
    shell.style.transition = 'none';
    void shell.offsetHeight;
    shell.style.transition = 'height 0.32s cubic-bezier(0.25, 1, 0.5, 1)';
    shell.style.height = `${to}px`;
    const done = () => {
      shell.style.height = '';
      shell.style.overflow = '';
      shell.style.transition = '';
      shell.removeEventListener('transitionend', done);
    };
    shell.addEventListener('transitionend', done);
  }, [stepIndex]);

  // ---- keep the card in view on step change (Lenis-aware) ------------------

  useEffect(() => {
    if (prevIndex.current === stepIndex) return;
    prevIndex.current = stepIndex;
    const card = rootRef.current?.closest<HTMLElement>('#start') ?? rootRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    // already comfortably in view: leave the scroll position alone
    if (rect.top >= 0 && rect.top < window.innerHeight * 0.6) return;
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(card, { offset: -16, duration: 0.6 });
    else card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [stepIndex]);

  // ---- keyboard focus across step remounts ---------------------------------

  // The step body remounts under a new key on navigation, unmounting the
  // focused button and dropping focus to <body> (the next Tab would restart at
  // the topbar). When focus was inside the form and the new step has no
  // autoFocus input, move it to the step title (tabIndex -1).
  useEffect(() => {
    if (!focusWasInForm.current) return;
    focusWasInForm.current = false;
    const root = rootRef.current;
    if (!root) return;
    const active = document.activeElement;
    if (active && active !== document.body && root.contains(active)) return; // an autoFocus input took it
    root.querySelector<HTMLElement>('[data-step-title]')?.focus({ preventScroll: true });
  }, [stepIndex]);

  // ---- payload --------------------------------------------------------------

  const goalOpt = goals.find((g) => g.value === answers.goal);
  const propOpt = propertyTypes.find((p) => p.value === answers.propertyType);
  const clampedBalance = Math.min(answers.balance, answers.price);

  const buildPayload = (phoneDigits: number | string) => {
    const equity = isRefi ? Math.max(answers.price - clampedBalance, 0) : null;
    const downPayment = isPurchase ? Math.round((answers.downPct / 100) * answers.price) : null;
    const scenarioDetail = isPurchase
      ? `${answers.downPct}% down (about ${fmt(downPayment ?? 0)})`
      : isBridge
        ? `Rehab budget around ${fmt(answers.rehab)}`
        : `About ${fmt(clampedBalance)} owed, roughly ${fmt(equity ?? 0)} in equity`;

    const params = new URLSearchParams(window.location.search);
    const attribution: Record<string, string> = {};
    for (const k of ATTR_KEYS) {
      const v = ssGet(`attr_${k}`) || params.get(k) || '';
      if (v) attribution[k] = v; // OMITTED (not null) when absent
    }

    return {
      source: 'dscr-funnel-template-4',
      mode: site.mode,
      goal: answers.goal,
      goalLabel: goalOpt?.label ?? answers.goal,
      stage: '',
      stageLabel: '',
      propertyType: answers.propertyType,
      propertyTypeLabel: propOpt?.label ?? answers.propertyType,
      credit: answers.credit,
      price: answers.price >= PRICE.max ? '2000000+' : answers.price,
      priceDisplay: priceDisplayOf(answers.price),
      downPct: answers.downPct,
      downPctDisplay: isPurchase ? `${answers.downPct}%` : null,
      downPayment,
      downPaymentDisplay: downPayment !== null ? fmt(downPayment) : null,
      balance: clampedBalance,
      balanceDisplay: isRefi ? fmt(clampedBalance) : null,
      equity,
      equityDisplay: equity !== null ? fmt(equity) : null,
      rehab: answers.rehab,
      rehabDisplay: isBridge ? fmt(answers.rehab) : null,
      scenarioDetail,
      city: '',
      state: answers.state,
      stateSlug: answers.stateSlug,
      firstName: answers.firstName.trim(),
      email: answers.email.trim(),
      phone: String(phoneDigits),
      partial: false,
      // ---- TCPA consent record (the verbatim text ships with every lead) ----
      tcpaConsent: true,
      tcpaConsentText: tcpaCopy,
      tcpaConsentAt: consentAt.current,
      tcpaConsentUrl: window.location.href,
      tcpaConsentMode: site.mode,
      tcpaConsentParties: tcpaParties,
      ...attribution,
      landingPage: ssGet('attr_landing') || window.location.href,
      referrer: ssGet('attr_referrer') || document.referrer || '',
      secondsToComplete: startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : null,
      website: hpRef.current?.value ?? '',
      submittedAt: new Date().toISOString(),
    };
  };

  // ---- submit ---------------------------------------------------------------

  const submit = async () => {
    if (inFlight.current) return;
    const digits = answers.phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError(form.errors.phone);
      return;
    }
    // Affirmative consent only. Blocks outright; never soften into a warning.
    if (!consent) {
      setError(form.errors.consent);
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setError('');
    const payload = buildPayload(digits);
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`lead endpoint ${res.status}`);
      track('lead_submit', { goal: answers.goal, state: answers.stateSlug });
      // A filled honeypot means the server silently dropped the lead (bot).
      // Skip the summary so /thank-you never fires the Ads conversion for a
      // lead that never reached the CRM (conversion-on-accepted-lead doctrine).
      const botFilled = (hpRef.current?.value ?? '').trim() !== '';
      if (!botFilled) {
        ssSet(
          'lead-summary',
          JSON.stringify({
            firstName: payload.firstName,
            goal: payload.goal,
            goalLabel: payload.goalLabel,
            propertyType: payload.propertyType,
            propertyTypeLabel: payload.propertyTypeLabel,
            credit: payload.credit,
            price: payload.price,
            priceDisplay: payload.priceDisplay,
            state: payload.state,
            stateSlug: payload.stateSlug,
            mode: site.mode,
          }),
        );
      }
      window.location.href = '/thank-you';
    } catch {
      inFlight.current = false;
      setSubmitting(false);
      setError(SUBMIT_FAILED);
    }
  };

  const submitContact = () => {
    if (answers.firstName.trim().length < 2) {
      setError(form.errors.name);
      return;
    }
    if (!EMAIL_RE.test(answers.email.trim())) {
      setError(form.errors.email);
      return;
    }
    continueFrom('contact');
  };

  // ---- copy -------------------------------------------------------------------

  const title: string = (() => {
    switch (step) {
      case 'goal':
        return form.titles.goal;
      case 'propertyType':
        return form.titles.propertyType;
      case 'credit':
        return form.titles.credit;
      case 'price':
        return isRefi ? form.titles.priceRefi : form.titles.pricePurchase;
      case 'secondary':
        return isPurchase ? form.titles.down : isBridge ? form.titles.rehab : form.titles.balance;
      case 'state':
        return form.titles.state;
      case 'contact':
        return form.titles.contact;
      case 'phone':
        return site.mode === 'network' ? form.titles.phoneNetwork : form.titles.phone;
    }
  })();

  const sub: string | undefined =
    step === 'credit' ? form.subs.credit : step === 'secondary' && isPurchase ? form.subs.down : undefined;

  // ---- step bodies -------------------------------------------------------------

  const renderStep = () => {
    switch (step) {
      case 'goal':
        return <OptionCards options={goals} selected={answers.goal} onPick={(v) => pick('goal', v)} />;

      case 'propertyType':
        return (
          <OptionRows options={propertyTypes} selected={answers.propertyType} cols={2} onPick={(v) => pick('propertyType', v)} />
        );

      case 'credit':
        return <OptionRows options={creditBands} selected={answers.credit} onPick={(v) => pick('credit', v)} />;

      case 'price':
        return (
          <>
            <Slider
              value={answers.price}
              min={PRICE.min}
              max={PRICE.max}
              step={PRICE.step}
              onChange={(v) => setAnswers((a) => ({ ...a, price: v }))}
              display={priceDisplayOf(answers.price)}
              minLabel="$100K"
              maxLabel="$2M+"
              ariaLabel={title}
            />
            <ContinueBtn onClick={() => continueFrom('price', answers.price)} />
          </>
        );

      case 'secondary': {
        if (isPurchase) {
          const dollars = Math.round((answers.downPct / 100) * answers.price);
          return (
            <>
              <Slider
                value={answers.downPct}
                min={DOWN.min}
                max={DOWN.max}
                step={DOWN.step}
                onChange={(v) => setAnswers((a) => ({ ...a, downPct: v }))}
                display={`${answers.downPct}%`}
                hint={`≈ ${fmt(dollars)} down`}
                minLabel="20%"
                maxLabel="50%+"
                ariaLabel={title}
              />
              <ContinueBtn onClick={() => continueFrom('secondary', answers.downPct)} />
            </>
          );
        }
        if (isBridge) {
          return (
            <>
              <Slider
                value={answers.rehab}
                min={REHAB.min}
                max={REHAB.max}
                step={REHAB.step}
                onChange={(v) => setAnswers((a) => ({ ...a, rehab: v }))}
                display={fmt(answers.rehab)}
                minLabel="$0"
                maxLabel="$500K+"
                ariaLabel={title}
              />
              <ContinueBtn onClick={() => continueFrom('secondary', answers.rehab)} />
            </>
          );
        }
        return (
          <>
            <Slider
              value={clampedBalance}
              min={0}
              max={answers.price}
              step={BALANCE.step}
              onChange={(v) => setAnswers((a) => ({ ...a, balance: v }))}
              display={fmt(clampedBalance)}
              hint={`≈ ${fmt(Math.max(answers.price - clampedBalance, 0))} in equity`}
              minLabel="$0"
              maxLabel={priceShortOf(answers.price)}
              ariaLabel={title}
            />
            <ContinueBtn onClick={() => continueFrom('secondary', clampedBalance)} />
          </>
        );
      }

      case 'state': {
        const matches = stateMatches(stateQuery);
        const showList = !answers.state && stateQuery.trim().length > 0;
        const activeOpt = showList && stateActive >= 0 && stateActive < matches.length ? matches[stateActive] : null;
        const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            if (!showList || matches.length === 0) return;
            e.preventDefault();
            const delta = e.key === 'ArrowDown' ? 1 : -1;
            setStateActive((i) => (i + delta + matches.length) % matches.length);
            return;
          }
          if (e.key !== 'Enter') return;
          const first = activeOpt ?? findState(stateQuery) ?? matches[0];
          if (first) {
            e.preventDefault();
            pickState(first);
          }
        };
        return (
          <div>
            <input
              id="ff-state"
              className="field-input"
              type="text"
              role="combobox"
              aria-expanded={showList}
              aria-controls="ff-state-list"
              aria-autocomplete="list"
              aria-activedescendant={activeOpt ? `ff-state-opt-${activeOpt.slug}` : undefined}
              placeholder={form.statePlaceholder}
              aria-label={form.titles.state}
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              value={stateQuery}
              autoFocus
              onChange={(e) => {
                setStateQuery(e.target.value);
                setStateActive(-1);
                setAnswers((a) => ({ ...a, state: '', stateSlug: '' }));
              }}
              onKeyDown={onKey}
            />
            {showList && (
              <div
                id="ff-state-list"
                className="mt-2.5 grid max-h-[19rem] gap-1.5 overflow-y-auto"
                data-lenis-prevent
                role="listbox"
                aria-label="Matching states"
              >
                {matches.map((st, i) => (
                  <button
                    key={st.slug}
                    id={`ff-state-opt-${st.slug}`}
                    type="button"
                    role="option"
                    aria-selected={i === stateActive}
                    data-value={st.slug}
                    className={`opt-btn${i === stateActive ? ' is-selected' : ''}`}
                    onClick={() => pickState(st)}
                  >
                    <span>{st.name}</span>
                    <span className="label ml-auto">{st.abbr}</span>
                  </button>
                ))}
                {matches.length === 0 && <p className="px-1 pt-1 text-sm text-ink/60">No match. Check the spelling?</p>}
              </div>
            )}
          </div>
        );
      }

      case 'contact':
        return (
          <div className="grid gap-3">
            <input
              id="ff-name"
              className="field-input"
              type="text"
              placeholder={form.namePlaceholder}
              aria-label={form.namePlaceholder}
              autoComplete="name"
              autoCapitalize="words"
              value={answers.firstName}
              autoFocus
              onChange={(e) => setAnswers((a) => ({ ...a, firstName: e.target.value }))}
            />
            <input
              id="ff-email"
              className="field-input"
              type="email"
              inputMode="email"
              placeholder={form.emailPlaceholder}
              aria-label={form.emailPlaceholder}
              autoComplete="email"
              autoCapitalize="off"
              spellCheck={false}
              value={answers.email}
              onChange={(e) => setAnswers((a) => ({ ...a, email: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitContact();
                }
              }}
            />
            <ErrorLine text={error} />
            <ContinueBtn onClick={submitContact} />
          </div>
        );

      case 'phone': {
        const chips: Array<{ icon: IconName; label: string }> = [];
        if (goalOpt) chips.push({ icon: goalOpt.icon, label: goalOpt.label });
        if (propOpt) chips.push({ icon: propOpt.icon, label: propOpt.label });
        if (answers.state) chips.push({ icon: 'map-pin', label: answers.state });
        chips.push({ icon: 'ledger', label: priceShortOf(answers.price) });
        return (
          <div>
            <div className="mb-4 flex flex-wrap justify-center gap-1.5">
              {chips.map((c) => (
                <span key={c.label} className="deal-chip">
                  <IconSvg name={c.icon} size={14} />
                  {c.label}
                </span>
              ))}
            </div>
            <input
              id="ff-phone"
              className="field-input text-center text-lg tracking-wide"
              type="tel"
              inputMode="tel"
              placeholder={form.phonePlaceholder}
              aria-label={title}
              autoComplete="tel-national"
              value={answers.phone}
              autoFocus
              onChange={(e) => setAnswers((a) => ({ ...a, phone: formatPhone(e.target.value) }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void submit();
                }
              }}
            />

            {/* TCPA opt-in. Stays ABOVE the submit button, starts unchecked, gates submit. */}
            <label htmlFor="ff-tcpa" className={`tcpa-box mt-4 select-none${consent ? ' is-consented' : ''}`}>
              <input
                id="ff-tcpa"
                type="checkbox"
                className="tcpa-check"
                checked={consent}
                onChange={(e) => {
                  const next = e.target.checked;
                  setConsent(next);
                  consentAt.current = next ? new Date().toISOString() : null;
                  if (next && error === form.errors.consent) setError('');
                }}
              />
              <span>{tcpaCopy}</span>
            </label>

            <ErrorLine text={error} />

            <button
              type="button"
              data-action="submit"
              className="btn-amber mt-4 w-full text-[1.05rem]"
              disabled={submitting}
              aria-busy={submitting}
              onClick={() => void submit()}
            >
              {submitting ? form.submitting : form.submit}
            </button>
            <p className="label mt-3 text-center">{form.reassurance}</p>
          </div>
        );
      }
    }
  };

  // ---- shell ------------------------------------------------------------------------

  return (
    <div id="eligibility-form" ref={rootRef} className="relative">
      {/* honeypot: always mounted so its value is in the DOM at submit time;
          no name attribute and an id that resembles no autofill category */}
      <input ref={hpRef} id="ff-ref-b" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field" />

      {/* phase pills (visible) + sr-only step counter (never visible text) */}
      <div className="flex flex-wrap items-center gap-1.5">
        {form.phases.map((p, i) => {
          const state = i < phaseIdx ? ' is-done' : i === phaseIdx ? ' is-active' : '';
          return (
            <span
              key={p.id}
              data-phase-pill
              data-phase={p.id}
              className={`phase-pill${state}`}
              aria-current={i === phaseIdx ? 'step' : undefined}
            >
              {i < phaseIdx && <IconSvg name="check" size={11} />}
              {p.label}
            </span>
          );
        })}
      </div>
      <div className="progress-track mt-3" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p data-step-label className="sr-only" aria-live="polite">
        Step {stepIndex + 1} of {total}
      </p>

      {/* step body: the shell tweens height between steps */}
      <div ref={shellRef} className="mt-4">
        <div key={`${step}-${direction}`} data-step={step} className={direction === 'fwd' ? 'step-enter' : 'step-enter-back'}>
          <h2 data-step-title tabIndex={-1} className="h-step text-center">
            {title}
          </h2>
          {sub && (
            <p data-step-sub className="mt-1.5 text-center text-[0.9rem] text-ink/60">
              {sub}
            </p>
          )}
          <div className={sub ? 'mt-4' : 'mt-4 md:mt-5'}>{renderStep()}</div>
        </div>
      </div>

      {stepIndex > 0 && (
        <button
          type="button"
          data-action="back"
          className="label mx-auto mt-4 flex min-h-11 items-center gap-1.5 px-3 transition-colors hover:text-ink"
          onClick={back}
        >
          <IconSvg name="arrow" size={14} className="rotate-180" />
          {form.back}
        </button>
      )}
    </div>
  );
}
