// US states + DC for the /dscr-loans/[state] directory and the form's state
// type-ahead. Keep this file TINY: the React island imports it. Optional
// per-state blurbs live in ./state-blurbs.ts (only the state route imports it).

export type StateEntry = { name: string; abbr: string; slug: string; blurb?: string };

const raw: Array<[string, string]> = [
  ['Alabama', 'AL'], ['Alaska', 'AK'], ['Arizona', 'AZ'], ['Arkansas', 'AR'],
  ['California', 'CA'], ['Colorado', 'CO'], ['Connecticut', 'CT'], ['Delaware', 'DE'],
  ['District of Columbia', 'DC'], ['Florida', 'FL'], ['Georgia', 'GA'], ['Hawaii', 'HI'],
  ['Idaho', 'ID'], ['Illinois', 'IL'], ['Indiana', 'IN'], ['Iowa', 'IA'],
  ['Kansas', 'KS'], ['Kentucky', 'KY'], ['Louisiana', 'LA'], ['Maine', 'ME'],
  ['Maryland', 'MD'], ['Massachusetts', 'MA'], ['Michigan', 'MI'], ['Minnesota', 'MN'],
  ['Mississippi', 'MS'], ['Missouri', 'MO'], ['Montana', 'MT'], ['Nebraska', 'NE'],
  ['Nevada', 'NV'], ['New Hampshire', 'NH'], ['New Jersey', 'NJ'], ['New Mexico', 'NM'],
  ['New York', 'NY'], ['North Carolina', 'NC'], ['North Dakota', 'ND'], ['Ohio', 'OH'],
  ['Oklahoma', 'OK'], ['Oregon', 'OR'], ['Pennsylvania', 'PA'], ['Rhode Island', 'RI'],
  ['South Carolina', 'SC'], ['South Dakota', 'SD'], ['Tennessee', 'TN'], ['Texas', 'TX'],
  ['Utah', 'UT'], ['Vermont', 'VT'], ['Virginia', 'VA'], ['Washington', 'WA'],
  ['West Virginia', 'WV'], ['Wisconsin', 'WI'], ['Wyoming', 'WY'],
];

export const states: StateEntry[] = raw.map(([name, abbr]) => ({
  name,
  abbr,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
}));

/** Match a full name, abbreviation, or slug, case-insensitively. */
export function findState(q: string | null | undefined): StateEntry | undefined {
  if (!q) return undefined;
  const s = q.trim().toLowerCase();
  if (!s) return undefined;
  return states.find(
    (st) => st.name.toLowerCase() === s || st.abbr.toLowerCase() === s || st.slug === s,
  );
}

/** The 12 most-populous states (footer "DSCR loans by state" column). */
export const topStates: string[] = [
  'california', 'texas', 'florida', 'new-york', 'pennsylvania', 'illinois',
  'ohio', 'georgia', 'north-carolina', 'michigan', 'new-jersey', 'virginia',
];
