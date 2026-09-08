// /start: the V1 (LeaderOne-style) eight-step form for Internet Loans Direct,
// variant B. Ported from _ref/form-templates/v1/FormV1.tsx with the ILD contract
// (BRIEF sections 3, 4, 5) on top:
//   - eight steps, three paths, no state step (Texas is fixed)
//   - ?goal=purchase|refinance|bridge preselects step 1 and opens on step 2
//   - auto-advance ~250ms after the selected state shows; Enter on the two
//     typed steps is guarded (a pick in flight is a nav state)
//   - sub-620 = in-form kick-out, nothing recorded, never posted
//   - ONE gated TCPA checkbox; the click timestamp is the consent time
//   - submit re-validates, POSTs the section-5 payload to /api/lead, shows an
//     inline error with retry on failure, and on success (TEST MODE) keeps the
//     payload in localStorage for /test-leads, then navigates to /thank-you
// Nothing here reaches any host but our own /api/lead.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  type Answers,
  type PathId,
  INITIAL_ANSWERS,
  TOTAL_STEPS,
  CREDIT_OPTIONS,
  KICKOUT,
  PRICE_LABELS,
  FORK_QUESTIONS,
  CONTACT_LABEL,
  PHONE_LABEL,
  ERRORS,
  isTestMode,
  isValidEmail,
  isValidFirstName,
  isValidLastName,
  isValidPhone,
  pathForGoal,
  buildPayload,
  buildLeadSummary,
  recordTestLead,
} from '../../lib/flow';
import { Step1, Step2, Step3, Step4, Step5, Step6, Step6Buy, Step7, Step8, KickoutScreen } from './steps';

const ADVANCE_DELAY = 250; // show the selected state, then slide
const ENTER_GUARD_MS = 350; // ignore Enter/submit this soon after a step mounts

type View = 'form' | 'kickout';
type Dir = -1 | 0 | 1; // 0 = instant (the ?goal preselect jump)

function headlineFor(view: View, step: number, path: PathId): string {
  if (view === 'kickout') return KICKOUT.headline;
  switch (step) {
    case 1:
      return 'What are you looking to do?';
    case 2:
      return 'Where are you in the process?';
    case 3:
      return 'Tell us about the property.';
    case 4:
      return "How's your credit right now?";
    case 5:
      return PRICE_LABELS[path];
    case 6:
      return FORK_QUESTIONS[path].label;
    case 7:
      return CONTACT_LABEL;
    default:
      return PHONE_LABEL;
  }
}

export default function FormV1() {
  const [view, setView] = useState<View>('form');
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<Dir>(1);
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const consentAt = useRef<string | null>(null);
  const startedAt = useRef(0);
  const timerRef = useRef<number | null>(null);
  const navLock = useRef(false);
  const enteredAt = useRef(0);
  const submittingRef = useRef(false);
  const reduceMotion = useReducedMotion();

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => clearTimer, []);

  // ?goal= preselect (BRIEF section 4): highlight step 1's pick, open on step 2.
  useEffect(() => {
    let goal: string | null = null;
    try {
      goal = new URLSearchParams(window.location.search).get('goal');
    } catch {
      goal = null;
    }
    const p = pathForGoal(goal);
    if (p) {
      setAnswers((a) => ({ ...a, path: p.id }));
      setDirection(0);
      setStep(2);
    }
  }, []);

  // A mounted step unlocks navigation and stamps its entry time (Enter guard).
  useEffect(() => {
    navLock.current = false;
    enteredAt.current = Date.now();
  }, [step, view]);

  // bfcache back-nav: never leave the button stuck on the submitting label.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        submittingRef.current = false;
        setSubmitting(false);
      }
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const touch = () => {
    if (!startedAt.current) startedAt.current = Date.now();
  };

  const patch = (p: Partial<Answers>) => setAnswers((a) => ({ ...a, ...p }));

  // Show the selected state first, then slide forward.
  const scheduleAdvance = (to: number | 'kickout') => {
    clearTimer();
    navLock.current = true;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setDirection(1);
      if (to === 'kickout') setView('kickout');
      else setStep(to);
    }, ADVANCE_DELAY);
  };

  const goForward = (to: number) => {
    clearTimer();
    navLock.current = true;
    setError('');
    setDirection(1);
    setStep(to);
  };

  // Enter-key / double-tap guard for the typed steps: a pick in flight is a
  // nav state, and a submit that lands within ENTER_GUARD_MS of the step
  // mounting is a held key, not a decision.
  const guardedForward = (to: number) => {
    if (navLock.current) return;
    if (Date.now() - enteredAt.current < ENTER_GUARD_MS) return;
    goForward(to);
  };

  const goBack = () => {
    clearTimer();
    navLock.current = false;
    setError('');
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1));
  };

  const selectPath = (p: PathId) => {
    touch();
    patch({ path: p });
    scheduleAdvance(2);
  };

  const selectStage = (v: string) => {
    touch();
    patch({ stage: v });
    scheduleAdvance(3);
  };

  const selectPropertyType = (v: string) => {
    touch();
    patch({ propertyType: v });
    scheduleAdvance(4);
  };

  const selectCredit = (value: string) => {
    touch();
    const opt = CREDIT_OPTIONS.find((o) => o.value === value);
    patch({ credit: value });
    scheduleAdvance(opt?.kickOut ? 'kickout' : 5);
  };

  const kickoutBack = () => {
    clearTimer();
    navLock.current = false;
    patch({ credit: undefined });
    setDirection(-1);
    setView('form');
  };

  const selectFork = (v: string) => {
    touch();
    patch(answers.path === 'refi' ? { balance: v } : { rehab: v });
    scheduleAdvance(7);
  };

  // ----------------------------------------------------------------
  // submit
  // ----------------------------------------------------------------
  const submit = async () => {
    if (submittingRef.current) return;
    if (Date.now() - enteredAt.current < ENTER_GUARD_MS) return;

    // Re-validate everything the payload depends on, independent of the
    // button's disabled state.
    if (!isValidFirstName(answers.firstName) || !isValidLastName(answers.lastName)) {
      setError(ERRORS.name);
      return;
    }
    if (!isValidEmail(answers.email)) {
      setError(ERRORS.email);
      return;
    }
    if (!isValidPhone(answers.phone)) {
      setError(ERRORS.phone);
      return;
    }
    // TCPA gate: affirmative consent or no POST at all. Never soften.
    if (!consent || !consentAt.current) {
      setError(ERRORS.consent);
      return;
    }

    const honeypot = (document.getElementById('ff-website') as HTMLInputElement | null)?.value ?? '';
    const payload = buildPayload(answers, {
      consent: { at: consentAt.current, url: window.location.href },
      startedAt: startedAt.current,
      honeypot,
    });

    submittingRef.current = true;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      let body: { testMode?: boolean } = {};
      try {
        body = await res.json();
      } catch {
        body = {};
      }
      if (isTestMode || body.testMode) {
        // TEST MODE: the lead stays in this browser for /test-leads.
        recordTestLead(payload);
        console.log('[variant TEST LEAD]', payload);
      }
      try {
        sessionStorage.setItem('lead-summary', JSON.stringify(buildLeadSummary(answers)));
      } catch {
        // private mode: the thank-you page renders its defaults
      }
      window.location.href = '/thank-you';
    } catch {
      submittingRef.current = false;
      setSubmitting(false);
      setError(ERRORS.submit);
    }
  };

  // ----------------------------------------------------------------
  // render
  // ----------------------------------------------------------------
  const path: PathId = answers.path ?? 'buy';
  const shownStep = view === 'kickout' ? 4 : step;
  const percent = Math.round((shownStep / TOTAL_STEPS) * 100);
  const announcement = view === 'form' ? `Step ${step} of ${TOTAL_STEPS}. ${headlineFor(view, step, path)}` : headlineFor(view, step, path);

  const dist = reduceMotion ? 0 : 64;
  const dur = (d: number) => (d === 0 ? 0 : reduceMotion ? 0.12 : 0.3);
  const ease = [0.32, 0.72, 0.35, 1] as const;
  const variants = {
    enter: (d: number) => ({ x: d > 0 ? dist : d < 0 ? -dist : 0, opacity: d === 0 ? 1 : 0 }),
    center: (d: number) => ({ x: 0, opacity: 1, transition: { duration: dur(d), ease } }),
    exit: (d: number) => ({ x: d > 0 ? -dist : d < 0 ? dist : 0, opacity: 0, transition: { duration: dur(d), ease } }),
  };

  const screenKey = view === 'form' ? `step-${step}` : view;

  let content: ReactNode;
  if (view === 'kickout') {
    content = <KickoutScreen onBack={kickoutBack} />;
  } else {
    switch (step) {
      case 1:
        content = <Step1 selected={answers.path} onSelect={selectPath} />;
        break;
      case 2:
        content = <Step2 path={path} selected={answers.stage} onSelect={selectStage} onBack={goBack} />;
        break;
      case 3:
        content = <Step3 propertyType={answers.propertyType} onPropertyType={selectPropertyType} onBack={goBack} />;
        break;
      case 4:
        content = <Step4 selected={answers.credit} onSelect={selectCredit} onBack={goBack} />;
        break;
      case 5:
        content = (
          <Step5
            path={path}
            price={answers.price}
            onPrice={(v) => {
              touch();
              patch({ price: v });
            }}
            onContinue={() => {
              touch();
              goForward(6);
            }}
            onBack={goBack}
          />
        );
        break;
      case 6:
        content =
          path === 'buy' ? (
            <Step6Buy
              price={answers.price}
              pct={answers.downPct}
              onPct={(v) => {
                touch();
                patch({ downPct: v });
              }}
              onContinue={() => {
                touch();
                goForward(7);
              }}
              onBack={goBack}
            />
          ) : (
            <Step6 path={path} selected={path === 'refi' ? answers.balance : answers.rehab} onSelect={selectFork} onBack={goBack} />
          );
        break;
      case 7:
        content = (
          <Step7
            firstName={answers.firstName}
            lastName={answers.lastName}
            email={answers.email}
            onChange={(p) => {
              touch();
              patch(p);
            }}
            onContinue={() => guardedForward(8)}
            onBack={goBack}
          />
        );
        break;
      default:
        content = (
          <Step8
            answers={answers}
            phone={answers.phone}
            consent={consent}
            submitting={submitting}
            error={error}
            onPhone={(v) => {
              touch();
              patch({ phone: v });
              if (error) setError('');
            }}
            onConsent={(next) => {
              touch();
              setConsent(next);
              // the moment consent was actually given, not submit time
              consentAt.current = next ? new Date().toISOString() : null;
              if (next && error) setError('');
            }}
            onSubmit={submit}
            onBack={goBack}
          />
        );
        break;
    }
  }

  return (
    <div id="start" className="v1lo-root flex flex-1 flex-col px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
      {/* honeypot: in the always-mounted shell so its value survives step changes */}
      <input id="ff-website" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" className="v1lo-hp" />

      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col justify-center">
        <div className="mb-10">
          <div className="mb-2.5 flex items-baseline justify-between">
            <span className="text-[12px] font-medium uppercase tracking-[0.22em] text-[#636D7C]" data-step-label>
              Step {shownStep} of {TOTAL_STEPS}
            </span>
            <span className="text-[12px] font-semibold tracking-[0.18em] text-[#8A5F06] [font-variant-numeric:tabular-nums]">{percent}%</span>
          </div>
          <div className="h-[5px] overflow-hidden rounded-full bg-[#E4E0D5]">
            <div className="v1lo-progress-fill h-full rounded-full" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div key={screenKey} custom={direction} variants={variants} initial="enter" animate="center" exit="exit">
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
