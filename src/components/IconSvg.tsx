// React twin of Icon.astro for the form island. Same output contract:
// 24-viewBox, stroke currentColor, width 1.8, round caps, aria-hidden,
// one <path d> per entry in icons[name]. Unknown name renders null + warning.
import { icons, type IconName } from '../config/site';

type Props = { name: IconName | string; size?: number; className?: string };

const warned = new Set<string>();

export default function IconSvg({ name, size = 24, className }: Props) {
  const paths = (icons as Record<string, string[]>)[name];
  if (!paths) {
    if (!warned.has(name)) {
      warned.add(name);
      console.warn(`[IconSvg] unknown icon name "${name}"; rendering nothing`);
    }
    return null;
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
