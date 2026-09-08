// The eight step screens + the sub-620 kick-out, ported from
// _ref/form-templates/v1/steps.tsx (Tanner's 2026-09-04 edit) for Internet
// Loans Direct: no state step (Texas is fixed), no phone-step subtitle, the ILD
// tcpaCopy next to the consent box, an inline error line for the phone step,
// and a real link to /not-yet on the kick-out. Every step root carries
// data-step="<id>" for the QA walker.

import { type FormEvent } from 'react';
import { Hammer, Home, RefreshCw } from 'lucide-react';
import {
  type PathId,
  type Answers,
  PATHS,
  STEP1_SUB,
  PROCESS_OPTIONS,
  PROPERTY_TYPES,
  CREDIT_OPTIONS,
  KICKOUT,
  PRICE_LABELS,
  PRICE_SUB,
  PRICE_MIN,
  PRICE_MAX,
  PRICE_STEP,
  DOWN_MIN,
  DOWN_MAX,
  DOWN_STEP,
  FORK_QUESTIONS,
  CONTACT_LABEL,
  PHONE_LABEL,
  SUBMIT_LABEL,
  SUBMITTING_LABEL,
  CONSENT_TEXT,
  fmtUsd,
  formatDownPct,
  formatPrice,
  formatPhone,
  isMaxPrice,
  isValidEmail,
  isValidFirstName,
  isValidLastName,
  isValidPhone,
  slugify,
  summaryChips,
} from '../../lib/flow';
import { BackButton, ChipRow, ErrorLine, GoldButton, GoldLink, Headline, MicroLine, OptionCard, SubLine, TextField } from './ui';

const PATH_ICONS: Record<PathId, typeof Home> = {
  buy: Home,
  refi: RefreshCw,
  flip: Hammer,
};

const sliderTrack = (pct: number) =>
  `linear-gradient(to right, #C89334 0%, #E0B15E ${pct}%, #E4E0D5 ${pct}%, #E4E0D5 100%)`;

// Step 1: What are you looking to do?
export function Step1({ selected, onSelect }: { selected?: PathId; onSelect: (p: PathId) => void }) {
  return (
    <div data-step="goal">
      <Headline>What are you looking to do?</Headline>
      <SubLine>{STEP1_SUB}</SubLine>
      <div className="mt-8 space-y-4">
        {PATHS.map((p) => {
          const Icon = PATH_ICONS[p.id];
          return (
            <OptionCard
              key={p.id}
              value={p.goal}
              label={p.label}
              icon={<Icon className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden="true" />}
              selected={selected === p.id}
              onSelect={() => onSelect(p.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// Step 2: Where are you in the process?
export function Step2({
  path,
  selected,
  onSelect,
  onBack,
}: {
  path: PathId;
  selected?: string;
  onSelect: (v: string) => void;
  onBack: () => void;
}) {
  return (
    <div data-step="stage">
      <Headline>Where are you in the process?</Headline>
      <div className="mt-8 space-y-4">
        {PROCESS_OPTIONS[path].map((opt) => (
          <OptionCard key={opt} value={slugify(opt)} label={opt} selected={selected === opt} onSelect={() => onSelect(opt)} />
        ))}
      </div>
      <BackButton onClick={onBack} />
    </div>
  );
}

// Step 3: property type grid, auto-advance on selection.
export function Step3({
  propertyType,
  onPropertyType,
  onBack,
}: {
  propertyType?: string;
  onPropertyType: (v: string) => void;
  onBack: () => void;
}) {
  return (
    <div data-step="propertyType">
      <Headline>Tell us about the property.</Headline>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
        {PROPERTY_TYPES.map((opt, i) => (
          <OptionCard
            key={opt.value}
            value={opt.value}
            label={opt.label}
            selected={propertyType === opt.value}
            onSelect={() => onPropertyType(opt.value)}
            className={i === PROPERTY_TYPES.length - 1 ? 'col-span-2' : undefined}
          />
        ))}
      </div>
      <BackButton onClick={onBack} />
    </div>
  );
}

// Step 4: credit, with the below-620 kick-out handled by the parent.
export function Step4({
  selected,
  onSelect,
  onBack,
}: {
  selected?: string;
  onSelect: (value: string) => void;
  onBack: () => void;
}) {
  return (
    <div data-step="credit">
      <Headline>How&rsquo;s your credit right now?</Headline>
      <div className="mt-8 space-y-4">
        {CREDIT_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            value={opt.value}
            label={opt.label}
            micro={opt.micro || undefined}
            selected={selected === opt.value}
            onSelect={() => onSelect(opt.value)}
          />
        ))}
      </div>
      <BackButton onClick={onBack} />
    </div>
  );
}

// Step 5: giant serif price + gold slider.
export function Step5({
  path,
  price,
  onPrice,
  onContinue,
  onBack,
}: {
  path: PathId;
  price: number;
  onPrice: (v: number) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const pct = ((price - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const downMicro = `About ${fmtUsd(price * 0.2)} down at 20%`;
  const estimateMicro = PRICE_SUB.replace(/\.$/, '');
  return (
    <div data-step="price">
      <Headline>{PRICE_LABELS[path]}</Headline>
      {path === 'buy' ? <SubLine>{PRICE_SUB}</SubLine> : null}
      <div className="v1lo-serif mt-8 text-center text-[3rem] font-semibold leading-none text-[#1E3A5F] sm:text-[4rem]" data-price-display>
        {formatPrice(price)}
      </div>
      <MicroLine>{path === 'buy' ? downMicro : estimateMicro}</MicroLine>
      <div className="mt-8">
        <input
          id="ff-range"
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={price}
          onChange={(e) => onPrice(Number(e.target.value))}
          aria-label={PRICE_LABELS[path]}
          aria-valuetext={formatPrice(price)}
          className="v1lo-slider"
          style={{ background: sliderTrack(pct) }}
        />
        <div className="mt-3 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-[#706C60] [font-variant-numeric:tabular-nums]">
          <span>{fmtUsd(PRICE_MIN)}</span>
          <span>$3M+</span>
        </div>
      </div>
      <div className="mt-8">
        <GoldButton onClick={onContinue} action="continue">
          Continue
        </GoldButton>
      </div>
      <BackButton onClick={onBack} />
    </div>
  );
}

// Step 6, buy path: down-payment slider (giant serif %, gold slider, live dollar line).
export function Step6Buy({
  price,
  pct,
  onPct,
  onContinue,
  onBack,
}: {
  price: number;
  pct: number;
  onPct: (v: number) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const trackPct = ((pct - DOWN_MIN) / (DOWN_MAX - DOWN_MIN)) * 100;
  // exact, not rounded to the nearest $1,000: the payload ships round(pct/100 * price)
  // and the CRM quotes it back, so the line here must be the same number
  const dollars = Math.round((price * pct) / 100);
  const floor = pct >= DOWN_MAX || isMaxPrice(price);
  const dollarLine = floor ? `About ${fmtUsd(dollars)} or more` : `About ${fmtUsd(dollars)} down`;
  return (
    <div data-step="secondary" data-fork="down">
      <Headline>{FORK_QUESTIONS.buy.label}</Headline>
      <div className="v1lo-serif mt-8 text-center text-[3rem] font-semibold leading-none text-[#1E3A5F] sm:text-[4rem]" data-down-display>
        {formatDownPct(pct)}
      </div>
      <MicroLine>{dollarLine}</MicroLine>
      <div className="mt-8">
        <input
          id="ff-range"
          type="range"
          min={DOWN_MIN}
          max={DOWN_MAX}
          step={DOWN_STEP}
          value={pct}
          onChange={(e) => onPct(Number(e.target.value))}
          aria-label={FORK_QUESTIONS.buy.label}
          aria-valuetext={formatDownPct(pct)}
          className="v1lo-slider"
          style={{ background: sliderTrack(trackPct) }}
        />
        <div className="mt-3 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-[#706C60] [font-variant-numeric:tabular-nums]">
          <span>20%</span>
          <span>50%+</span>
        </div>
      </div>
      <div className="mt-8">
        <GoldButton onClick={onContinue} action="continue">
          Continue
        </GoldButton>
      </div>
      <BackButton onClick={onBack} />
    </div>
  );
}

// Step 6, refi + flip paths: the option-card fork (balance owed or rehab budget).
export function Step6({
  path,
  selected,
  onSelect,
  onBack,
}: {
  path: PathId;
  selected?: string;
  onSelect: (v: string) => void;
  onBack: () => void;
}) {
  const q = FORK_QUESTIONS[path];
  return (
    <div data-step="secondary" data-fork={path === 'refi' ? 'balance' : 'rehab'}>
      <Headline>{q.label}</Headline>
      {q.sub ? <SubLine>{q.sub}</SubLine> : null}
      <div className="mt-8 space-y-4">
        {q.options.map((opt) => (
          <OptionCard key={opt} value={slugify(opt)} label={opt} selected={selected === opt} onSelect={() => onSelect(opt)} />
        ))}
      </div>
      <BackButton onClick={onBack} />
    </div>
  );
}

// Step 7: first name, last name, email. Enter = the same guarded continue.
export function Step7({
  firstName,
  lastName,
  email,
  onChange,
  onContinue,
  onBack,
}: {
  firstName: string;
  lastName: string;
  email: string;
  onChange: (patch: Partial<Answers>) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const valid = isValidFirstName(firstName) && isValidLastName(lastName) && isValidEmail(email);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (valid) onContinue();
  };
  return (
    <form onSubmit={submit} noValidate data-step="contact">
      <Headline>{CONTACT_LABEL}</Headline>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="ff-first"
          value={firstName}
          onChange={(v) => onChange({ firstName: v })}
          placeholder="First name"
          ariaLabel="First name"
          autoComplete="given-name"
        />
        <TextField
          id="ff-last"
          value={lastName}
          onChange={(v) => onChange({ lastName: v })}
          placeholder="Last name"
          ariaLabel="Last name"
          autoComplete="family-name"
        />
      </div>
      <div className="mt-4">
        <TextField
          id="ff-email"
          value={email}
          onChange={(v) => onChange({ email: v })}
          placeholder="Email"
          ariaLabel="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
        />
      </div>
      <div className="mt-6">
        <GoldButton type="submit" disabled={!valid} action="continue">
          Continue
        </GoldButton>
      </div>
      <BackButton onClick={onBack} />
    </form>
  );
}

// Step 8: phone + the ONE gated consent box + submit. No subtitle (Tanner, 2026-08-26).
export function Step8({
  answers,
  phone,
  consent,
  submitting,
  error,
  onPhone,
  onConsent,
  onSubmit,
  onBack,
}: {
  answers: Answers;
  phone: string;
  consent: boolean;
  submitting: boolean;
  error: string;
  onPhone: (v: string) => void;
  onConsent: (v: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const valid = isValidPhone(phone) && consent;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <form onSubmit={submit} noValidate data-step="phone">
      <Headline>{PHONE_LABEL}</Headline>
      <div className="mt-7">
        <ChipRow items={summaryChips(answers)} />
      </div>
      <div className="mt-6">
        <TextField
          id="ff-phone"
          value={phone}
          onChange={(v) => onPhone(formatPhone(v))}
          placeholder="(555) 555-0123"
          ariaLabel={PHONE_LABEL}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          centered
          large
        />
      </div>
      {/* TCPA opt-in: above submit, starts unchecked, gates submit. Never pre-check it. */}
      <label
        htmlFor="ff-tcpa"
        data-consent={consent ? 'true' : 'false'}
        className="mt-6 flex cursor-pointer items-start gap-3.5 rounded-[14px] border border-[#DDD8CB] bg-[#FBFAF5] p-4 sm:p-5"
      >
        <input
          id="ff-tcpa"
          name="tcpaConsent"
          type="checkbox"
          checked={consent}
          onChange={(e) => onConsent(e.target.checked)}
          className="v1lo-check mt-0.5 h-5 w-5 shrink-0 cursor-pointer"
        />
        <span className="text-[13px] leading-relaxed text-[#6B6862]">{CONSENT_TEXT}</span>
      </label>
      <ErrorLine>{error}</ErrorLine>
      <div className="mt-6">
        <GoldButton type="submit" disabled={!valid || submitting} arrow={false} action="submit">
          {submitting ? SUBMITTING_LABEL : SUBMIT_LABEL}
        </GoldButton>
      </div>
      <BackButton onClick={onBack} />
    </form>
  );
}

// Sub-620 kick-out: honest line, the fastest way back, and an undo.
export function KickoutScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="text-center" data-step="kickout">
      <Headline>{KICKOUT.headline}</Headline>
      <p className="mx-auto mt-5 max-w-[480px] text-[15px] leading-relaxed text-[#5B6B82] sm:text-base">{KICKOUT.body}</p>
      <div className="mx-auto mt-9 max-w-[420px]">
        <GoldLink href={KICKOUT.linkHref}>{KICKOUT.linkLabel}</GoldLink>
      </div>
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={onBack}
          data-action="back"
          className="v1lo-gold-outline min-h-[52px] rounded-[14px] border-2 border-[#C89334] bg-transparent px-8 py-3.5 text-[16px] font-bold text-[#1E3A5F]"
        >
          {KICKOUT.backLabel}
        </button>
      </div>
    </div>
  );
}
