# WIRING: /api/lead → GHL → the promise chain

**What this wires.** The funnel promises three things in its own copy: "your
eligibility summary lands in your inbox" (contact step), a strategy call where
the scenario is priced across 100+ lenders (thank-you page), and "reply to the
email we just sent to lock in a time" (thank-you page, phone-CTA variant). The
assets in this folder make those promises real. This doc is the one-pass build
guide for wiring them into a GHL location.

> **INTERNET LOANS DIRECT OVERRIDES (2026-07-27). Read these before the rest of
> this doc, which is the generic template build guide and is now partly stale
> for this client:**
>
> 1. **Destination is a Zapier catch hook, not a GHL inbound webhook.** Standing
>    decision for every project: `/api/lead` forwards to Zapier, Tanner maps into
>    GHL by hand. Sections 3-6 below (Workflow A/B/C) are REFERENCE ONLY here.
>    Section 1 (payload) and section 2 (field map) are still exactly right and
>    are what you map on the Zapier side.
> 2. **No partial leads.** The form fires ONE webhook, from submit, with name +
>    email + phone all present. `partial` is hardcoded `false` in the payload.
>    Ignore every "partial" branch, re-entry rule, and tag guard below.
> 3. **No booking calendar and no email sequence.** Paul declined the calendar;
>    no automation sends the emails in this folder. The funnel copy no longer
>    promises an email. The email masters here are unused until that changes.

**Status: TEMPLATE MASTERS.** For a client that DOES run the GHL build, the
`ghl-mcp` server (`ghl_create_email_template`, `ghl_raw_request`) and the
`ghl-email-template` skill exist for pushing templates into a location.

The chain, end to end:

```
form submit → /api/lead (server-side forward)
  → GHL Inbound Webhook (Workflow A)
    → map payload → create/update contact + tag
    → send Email 1 (eligibility summary) immediately (once; tag-guarded)
    → add to Workflow B (no-book follow-up)
  → Workflow B: day 0 SMS → day 1 email → day 3 email → day 4 SMS → day 5 email
      (goal event "appointment booked" pulls the contact out at any point;
       email/SMS replies notify the specialist and pause the sequence)
  → Workflow C (booked): remove from B, notify specialist
```

**Partial leads.** The form fires a capture the moment a lead advances past
name+email (`partial: true`, no phone), so the promised summary email still
sends if they stall at the phone step. If they finish, a second webhook
arrives with `partial: false` and the phone number. Workflow A must therefore
allow re-entry and guard Email 1 with a tag so it never sends twice.

---

## 1. The payload

`/api/lead` forwards the form's JSON body verbatim to `LEAD_WEBHOOK_URL`
(the Workflow A inbound-webhook URL). As of 2026-07-13 the payload includes
display-ready strings computed in `FunnelForm.tsx` at submit time, so GHL
never has to format a number. Redeploy the funnel if the client's copy was
built before that date.

Sample payload (completed purchase lead):

```json
{
  "goal": "purchase",
  "propertyType": "sfr",
  "credit": "700-739",
  "price": 350000,
  "downPct": 25,
  "balance": 175000,
  "rehab": 75000,
  "state": "Georgia",
  "firstName": "Tanner",
  "email": "lead@example.com",
  "phone": "8555452022",
  "partial": false,
  "downPayment": 87500,
  "goalLabel": "Buy a rental",
  "propertyTypeLabel": "Single family",
  "priceDisplay": "$350,000",
  "downPctDisplay": "25%",
  "downPaymentDisplay": "$87,500",
  "balanceDisplay": null,
  "equity": null,
  "equityDisplay": null,
  "rehabDisplay": null,
  "scenarioDetail": "25% down (about $87,500)",
  "gclid": "TEST_GCLID",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "dscr-ga",
  "utm_term": "dscr loan georgia",
  "utm_content": "ad-1",
  "landingPage": "/?gclid=TEST_GCLID",
  "secondsToComplete": 58,
  "website": "",
  "submittedAt": "2026-07-13T18:22:00.000Z"
}
```

Notes on shape:
- `partial` is `true` when the lead advanced past name+email but has not
  (yet) submitted a phone number. Partial payloads have `phone: ""` and no
  honeypot value. A lead who completes the form produces a SECOND webhook
  with `partial: false`.
- `price` becomes the string `"2000000+"` when the slider maxes out;
  `priceDisplay` is then `"$2,000,000+"`. Map both, merge only the display.
- `downPct`, `balance`, and `rehab` are ALWAYS present (slider defaults, e.g.
  `downPct: 25` on a refinance lead). IGNORE them unless the goal makes them
  meaningful; `scenarioDetail` already contains the correct one-line reading
  per goal.
- Goal-conditional fields are `null` when not applicable: purchase leads carry
  `downPayment`, `downPctDisplay`, `downPaymentDisplay`; refinance and cashout
  carry `balanceDisplay`, `equity`, `equityDisplay`; bridge carries
  `rehabDisplay`.
- `website` is the honeypot. Bots are dropped inside `/api/lead` (they get a
  silent 200 and are never forwarded), so it always arrives as `""`. Do not map.
- `firstName` arrives as typed. GHL title-cases first_name in most views, but
  the merge renders raw; acceptable as-is.
- gclid and UTMs only exist when the visit carried them; absent keys simply
  do not appear in the JSON.

## 2. Field map: payload → GHL

Native contact fields:

| Payload field | GHL native field |
| --- | --- |
| `firstName` | Contact › First Name (`{{contact.first_name}}`) |
| `email` | Contact › Email |
| `phone` | Contact › Phone (10 digits, no formatting; GHL normalizes; empty on partials) |

Custom fields. Create all of them under a **"DSCR Funnel"** folder, type
**Single Line Text** for every one (numbers arrive fine as text, and text
merges render everywhere). Name them EXACTLY as below: GHL auto-generates the
unique key from the name, and the key column is what the email templates merge
on (`{{contact.<key>}}`), so a different name produces a different key and
breaks the merges.

| Payload field | GHL custom field name | Key (merge: `{{contact.<key>}}`) | Used by |
| --- | --- | --- | --- |
| `partial` | DSCR Partial | `dscr_partial` | Workflow A branch |
| `goal` | DSCR Goal | `dscr_goal` | segmentation |
| `goalLabel` | DSCR Goal Label | `dscr_goal_label` | Email 1, Email day 5, SMS 2 |
| `propertyType` | DSCR Property Type | `dscr_property_type` | segmentation |
| `propertyTypeLabel` | DSCR Property Label | `dscr_property_label` | Email 1, Email day 5 |
| `credit` | DSCR Credit Band | `dscr_credit_band` | Email 1 |
| `price` | DSCR Price | `dscr_price` | reporting |
| `priceDisplay` | DSCR Price Display | `dscr_price_display` | Emails 1, day 3, day 5, SMS 2 |
| `downPct` | DSCR Down Pct | `dscr_down_pct` | reporting (purchase only; ignore otherwise) |
| `downPctDisplay` | DSCR Down Pct Display | `dscr_down_pct_display` | optional |
| `downPayment` | DSCR Down Payment | `dscr_down_payment` | lead scoring |
| `downPaymentDisplay` | DSCR Down Payment Display | `dscr_down_payment_display` | optional |
| `balanceDisplay` | DSCR Balance Display | `dscr_balance_display` | optional |
| `equity` | DSCR Equity | `dscr_equity` | lead scoring |
| `equityDisplay` | DSCR Equity Display | `dscr_equity_display` | optional |
| `rehabDisplay` | DSCR Rehab Display | `dscr_rehab_display` | optional |
| `scenarioDetail` | DSCR Scenario Detail | `dscr_scenario_detail` | Email 1 ("Position" row) |
| `state` | DSCR State | `dscr_state` | Emails 1, day 5, SMS 2 |
| `gclid` | DSCR GCLID | `dscr_gclid` | offline conversion upload |
| `utm_source` | DSCR UTM Source | `dscr_utm_source` | attribution |
| `utm_medium` | DSCR UTM Medium | `dscr_utm_medium` | attribution |
| `utm_campaign` | DSCR UTM Campaign | `dscr_utm_campaign` | attribution |
| `utm_term` | DSCR UTM Term | `dscr_utm_term` | attribution |
| `utm_content` | DSCR UTM Content | `dscr_utm_content` | ad-variant tracking |
| `landingPage` | DSCR Landing Page | `dscr_landing_page` | attribution |
| `secondsToComplete` | DSCR Seconds To Complete | `dscr_seconds_to_complete` | lead-quality scoring |
| `submittedAt` | DSCR Submitted At | `dscr_submitted_at` | reporting |

Merge fields the templates actually consume (the minimum viable set if you
want to trim): `first_name`, `dscr_goal_label`, `dscr_property_label`,
`dscr_credit_band`, `dscr_price_display`, `dscr_scenario_detail`,
`dscr_state`. Everything else is scoring/attribution.

## 3. Build steps (one pass, in order)

### Step 0: prerequisites
- **Premium Triggers & Actions enabled** for this location (agency settings /
  rebilling). The Inbound Webhook trigger in Step 3 does not appear in the
  trigger picker otherwise.
- GHL location has LC Email + LC Phone (or SMTP/Twilio) configured and a
  sending domain authenticated (SPF/DKIM), or Email 1 lands in spam and the
  whole promise chain dies at hello.
- **The sending address / reply-to resolves to a monitored inbox** (the
  specialist's). Every email says "reply and we will set a time by hand" and
  the thank-you page says "reply to the email we just sent"; an unmonitored
  default subdomain address silently kills that promise.
- A booking calendar for the strategy call exists; grab its scheduling link
  (this replaces `https://REPLACE-BOOKING-LINK` in all four emails + 2 SMS)
  and optionally its embed URL for `brand.bookingEmbedUrl` in `funnel.ts`.
- The funnel is deployed; note the domain (replaces
  `https://REPLACE-FUNNEL-DOMAIN`; the prep sheet is live at `/call-prep`).

### Step 1: create the custom fields
Create every field in the section-2 table (Settings › Custom Fields › folder
"DSCR Funnel"), or do it via `ghl-mcp` with `ghl_raw_request` against
`POST /locations/{locationId}/customFields`. Use the exact names so the
auto-generated keys match the key column.

### Step 2: import the four email templates
For each of `eligibility-summary-email.html`,
`followup/email-day1-no-commitment.html`, `followup/email-day3-the-math.html`,
`followup/email-day5-last-note.html`:
1. REBRAND TOKENS: **already applied for Internet Loans Direct** (2026-07-24
   sweep: brand name, phone (855) 545-2022, Paul Howarth as specialist, and
   lenderdscr.com plus the lead-gen disclaimer in place of an NMLS line,
   because the client publishes no NMLS). Spot-check only.
2. Claims are already aligned to the client's own published claims: `100+`
   lender count and same-day income and credit approval (the old "24 hours"
   pre-approval P.S. was rewritten). Soften or cut anything Paul says he
   cannot actually deliver.
3. **Strip the header comment block** (everything before `<!DOCTYPE html>`)
   so internal template notes never ship in sent email source.
4. Push via the `ghl-email-template` skill or `ghl_create_email_template`
   (the HTML goes in as a custom-code template).
5. Subject lines and preview text are in each file's header comment; primary
   subject goes on the template, variants A/B test later.
6. Send yourself a test and confirm: merges render, the unsubscribe link
   resolves (`{{unsubscribe_link}}`; if the location uses a different tag,
   swap it in the footer), and the layout holds in Gmail dark mode.

### Step 3: Workflow A · "DSCR Funnel · Lead Intake"
1. Trigger: **Inbound Webhook**. Copy the generated URL into the funnel's
   Vercel env as `LEAD_WEBHOOK_URL` and redeploy. Submit one test lead
   through the real form so GHL captures the payload shape for mapping.
2. Map payload keys to the contact + custom fields per section 2.
3. Workflow settings: **allow re-entry** (a partial lead re-enters when they
   complete the form).
4. Actions, in order:
   - Create/Update Contact (email as the dedupe key)
   - If/Else on `dscr_partial`:
     - `true` → Add Tag `dscr-funnel-partial`
     - `false` → Remove Tag `dscr-funnel-partial`, Add Tag `dscr-funnel-lead`
   - If/Else on tag `dscr-email1-sent`:
     - absent → **Send Email 1 (eligibility summary) immediately** (no
       delay; the thank-you page says "reply to the email we just sent"),
       then Add Tag `dscr-email1-sent`
     - present → skip (this is the partial-then-complete second webhook)
   - Add to Workflow B (skip if already in it).

### Step 4: booking and reply checks
The "booking check" is a standing exit, not an If/Else step:
- In Workflow B, set the **Goal Event: Appointment Booked** (strategy-call
  calendar) so any contact who books jumps straight out of the sequence no
  matter where they are in it.
- Workflow C (below) belt-and-suspenders the same thing and handles the
  human side.
- Enable "stop on reply" for the SMS steps, and add a **Customer Replied
  (Email)** trigger (can live inside Workflow C) that notifies the specialist
  and removes the contact from Workflow B. A reply is a human asking for a
  human; automation stops.

### Step 5: Workflow B · "DSCR Funnel · No-Book Follow-Up"
Entry: only from Workflow A. Partial leads enter too: they get the emails,
and GHL skips the SMS steps automatically because they have no phone number.
Steps:

| When | Asset | Notes |
| --- | --- | --- |
| Day 0: Wait until 6:30pm contact-local | SMS 1 (`followup/sms.md`) | GHL's native Wait rolls a past-due 6:30pm to the next day, so an evening lead gets SMS 1 the following evening. That is the intended build. Respect the location SMS window (8am to 9pm). |
| Day 1 | Email: `email-day1-no-commitment.html` | Objection: hard pull / commitment |
| Day 3 | Email: `email-day3-the-math.html` | The 1.25x worked example |
| Day 4, 10:30am | SMS 2 (`followup/sms.md`) | Scenario-specific nudge |
| Day 5 | Email: `email-day5-last-note.html` | Last call, then End |

After the day 5 email the workflow ends. No further automation; the copy
promises "last note" and we keep that promise.

### Step 6: Workflow C · "DSCR Funnel · Booked"
Trigger: **Customer Booked Appointment** (strategy-call calendar).
Actions: Remove From Workflow B → internal notification to the specialist
(include `dscr_scenario_detail`, `dscr_price_display`, `dscr_state`,
`dscr_credit_band` in the notification body so the broker walks in ready) →
optional: send a short confirmation email linking the prep sheet at
`https://REPLACE-FUNNEL-DOMAIN/call-prep`.

### Step 7: test checklist
- [ ] `curl -X POST <funnel-domain>/api/lead -H "Content-Type: application/json" -d @sample.json`
      with the section-1 sample → contact appears with every non-null field
      populated (the four goal-conditional displays are null for a purchase
      lead; empty is correct there)
- [ ] Email 1 arrives within a minute, merges filled, no `{{...}}` leaks
- [ ] Ledger "Position" row reads correctly for all four goals (submit one
      test lead per goal: purchase / refinance / cashout / bridge)
- [ ] Partial test: fill the form through name+email, stop at the phone step
      → contact exists, tagged `dscr-funnel-partial`, Email 1 arrives; then
      finish the form → phone lands, tag flips to `dscr-funnel-lead`, and
      Email 1 does NOT send a second time
- [ ] Reply to Email 1 → specialist gets notified and Workflow B stops
- [ ] Unsubscribe link resolves and actually suppresses
- [ ] Book a test appointment mid-sequence → Workflow B exits, no day 3 email
- [ ] Reply STOP to SMS 1 → SMS 2 never sends
- [ ] `/call-prep` loads on the live domain and prints to one page

## 4. Compliance notes
- Consent basis: the funnel's TCPA checkbox copy (`tcpaCopy` in `funnel.ts`).
  Its "automated technology / prerecorded" clause is the load-bearing part:
  that is what qualifies the consent as prior express written consent for
  automated marketing SMS. Do not trim it when rebranding. Keep sends inside
  8am to 9pm contact-local.
- Every email carries: the lenderdscr.com lead-gen disclaimer (in place of a
  company NMLS and physical address, which the client does not publish),
  licensing link, "not a commitment to lend," educational-illustration
  disclaimer, Equal Housing Opportunity, unsubscribe. Keep all of it. If Paul
  supplies an NMLS or address later, add them to the footers and funnel.ts.
- Both SMS carry "Reply STOP to opt out." If the location auto-appends
  opt-out language, delete the manual line so it does not double.
- VERIFY with Paul before launch, same rule as the funnel itself: the `100+`
  lender count, same-day income and credit approval, and the 15-25 day
  close range. All three come from his own lenderdscr.com copy, but confirm
  he still stands behind them.

## 5. Asset inventory (this folder)

| File | What it is |
| --- | --- |
| `eligibility-summary-email.html` | Email 1, the core promise. Sent immediately on submit. |
| `followup/email-day1-no-commitment.html` | No-book email, day 1 |
| `followup/email-day3-the-math.html` | No-book email, day 3 |
| `followup/email-day5-last-note.html` | No-book email, day 5 (last) |
| `followup/sms.md` | SMS 1 (day 0 evening) + SMS 2 (day 4) |
| `call-prep-onepager.html` | Print-master prep sheet (live twin: `/call-prep`) |
| `WIRING.md` | This doc |

Rebrand rule for all of it: the header comment in each file lists its tokens
(replace in the listed order; some tokens are substrings of others); the
values mirror `src/config/funnel.ts`, so rebranding the funnel and the emails
is the same checklist.
