// V1 (LeaderOne style) visual atoms, ported from _ref/form-templates/v1/ui.tsx.
// Additions for this variant: the headline is the page h1 (data-step-title),
// option cards carry data-value, buttons carry data-action, inputs take an id,
// and ErrorLine renders the inline [data-error] message. Class names are the
// V1 originals so the look is Tanner's pick, unchanged.

import { createContext, useContext, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/** Where the form lives. 'page' = /start (the headline is the page h1).
 *  'embedded' = inside the landing-page hero card (the LP h1 already exists,
 *  so the step headline renders as an h2 at a size that sits under it). */
export const FormPlacement = createContext<'page' | 'embedded'>('page');

export function Headline({ children }: { children: ReactNode }) {
  const placement = useContext(FormPlacement);
  const embedded = placement === 'embedded';
  const Tag = embedded ? 'h2' : 'h1';
  return (
    <Tag
      data-step-title
      className={[
        'v1lo-serif v1lo-headline text-center font-semibold text-[#1E3A5F]',
        embedded ? 'text-[1.55rem] sm:text-[1.95rem]' : 'text-[1.9rem] sm:text-[2.4rem]',
      ].join(' ')}
    >
      {children}
    </Tag>
  );
}

export function SubLine({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto mt-3 max-w-[480px] text-center text-[15px] leading-relaxed text-[#5B6B82] sm:text-base">
      {children}
    </p>
  );
}

export function MicroLine({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[#8A5F06] sm:text-[13px]">
      {children}
    </p>
  );
}

interface OptionCardProps {
  label: string;
  value: string;
  micro?: string;
  icon?: ReactNode;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}

export function OptionCard({ label, value, micro, icon, selected, onSelect, className }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-value={value}
      data-selected={selected ? 'true' : 'false'}
      className={[
        'v1lo-card flex min-h-[60px] w-full items-center gap-4 rounded-[14px] border border-[#E7E1D2] bg-white px-5 py-4 text-left sm:px-6 sm:py-5',
        className ?? '',
      ].join(' ')}
    >
      {icon ? (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#CBD6E3] bg-[#EEF2F7] text-[#1E3A5F]">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-bold text-[#1E3A5F] sm:text-[17px]">{label}</span>
      </span>
      {micro ? (
        <span className="ml-2 shrink-0 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-[#526C8C] sm:text-[11px]">
          {micro}
        </span>
      ) : null}
    </button>
  );
}

interface GoldButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  arrow?: boolean;
  action?: string;
}

export function GoldButton({ children, onClick, disabled, type = 'button', arrow = true, action }: GoldButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-action={action}
      className="v1lo-gold-btn min-h-[56px] w-full rounded-[14px] px-6 py-4 text-lg font-bold text-[#1E3A5F]"
    >
      <span className="inline-flex items-center justify-center gap-2.5">
        {children}
        {arrow ? <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" /> : null}
      </span>
    </button>
  );
}

/** Same gold look as GoldButton, as a real link (kick-out -> /not-yet). */
export function GoldLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      data-action="not-yet"
      className="v1lo-gold-btn inline-flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-[14px] px-6 py-4 text-lg font-bold text-[#1E3A5F] no-underline"
    >
      {children}
      <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
    </a>
  );
}

export function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <div className="mt-8 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        data-action="back"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-[6px] px-4 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#706C60] transition-colors hover:text-[#1E3A5F]"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
        {label}
      </button>
    </div>
  );
}

interface TextFieldProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel: string;
  type?: string;
  inputMode?: 'text' | 'tel' | 'email';
  autoComplete?: string;
  centered?: boolean;
  large?: boolean;
}

export function TextField({
  id,
  value,
  onChange,
  placeholder,
  ariaLabel,
  type = 'text',
  inputMode = 'text',
  autoComplete,
  centered = false,
  large = false,
}: TextFieldProps) {
  return (
    <input
      id={id}
      name={id.replace(/^ff-/, '')}
      type={type}
      inputMode={inputMode}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={[
        'v1lo-input w-full rounded-[14px] px-5 text-[#1E3A5F]',
        centered ? 'text-center' : 'text-left',
        large ? 'py-5 text-xl sm:text-2xl' : 'py-4 text-lg',
      ].join(' ')}
    />
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-full border border-[#B9C7D8] bg-white/70 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#526C8C] sm:text-[11px]">
      <span className="truncate">{children}</span>
    </span>
  );
}

export function ChipRow({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2" data-chips>
      {items.map((item) => (
        <Chip key={item}>{item}</Chip>
      ))}
    </div>
  );
}

/** Inline validation / submit error. Rendered only when there is a message. */
export function ErrorLine({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p data-error role="alert" className="mt-4 text-center text-[14px] font-semibold leading-snug text-[#B4432E]">
      {children}
    </p>
  );
}
