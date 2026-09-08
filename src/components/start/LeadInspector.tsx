// /test-leads island (BRIEF section 3): lists the TEST MODE leads this browser
// captured (localStorage['ild_variant_test_leads']), newest first, pretty JSON
// per lead, with a Clear button. This is how Tanner inspects what WOULD have
// been sent to the Zap. No monospace: the JSON renders in the brand body face.

import { useEffect, useState } from 'react';
import { type LeadPayload, TEST_LEADS_KEY, clearTestLeads, readTestLeads } from '../../lib/flow';

const str = (v: unknown) => (v == null ? '' : String(v));

function when(iso: unknown): string {
  const d = new Date(str(iso));
  if (Number.isNaN(d.getTime())) return str(iso);
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function LeadInspector() {
  const [leads, setLeads] = useState<LeadPayload[] | null>(null);

  useEffect(() => {
    setLeads(readTestLeads().slice().reverse());
  }, []);

  const clear = () => {
    clearTestLeads();
    setLeads([]);
  };

  if (leads === null) {
    return <p className="prose-body">Reading this browser&rsquo;s test leads&hellip;</p>;
  }

  return (
    <div data-lead-inspector>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="label" data-lead-count={leads.length}>
          {leads.length === 0 ? 'No test leads in this browser' : `${leads.length} test lead${leads.length === 1 ? '' : 's'} in this browser`}
        </p>
        {leads.length > 0 ? (
          <button type="button" onClick={clear} className="btn-ghost" data-action="clear">
            Clear
          </button>
        ) : null}
      </div>

      {leads.length === 0 ? (
        <p className="prose-body mt-4">
          Submit the form on <a href="/start" className="link">/start</a> and the accepted payload shows up here. Nothing is
          forwarded anywhere while the variant is in test mode; the key is <strong>{TEST_LEADS_KEY}</strong>.
        </p>
      ) : (
        <ol className="mt-6 grid gap-5">
          {leads.map((lead, i) => (
            <li key={`${str(lead.submittedAt)}-${i}`} className="card p-5 md:p-6" data-lead>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="h-step">
                  {str(lead.firstName)} {str(lead.lastName)}
                  <span className="ml-2 text-[0.85rem] font-semibold text-ink/55">{str(lead.goalLabel)}</span>
                </p>
                <p className="label">{when(lead.submittedAt)}</p>
              </div>
              <p className="mt-1 text-[0.9rem] text-ink/70">
                {str(lead.propertyTypeLabel)} · {str(lead.state)} · {str(lead.priceDisplay)} · {str(lead.scenarioDetail)} · credit {str(lead.credit)}
              </p>
              <pre className="lead-json mt-4">{JSON.stringify(lead, null, 2)}</pre>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
