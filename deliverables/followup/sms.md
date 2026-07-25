# No-Book Follow-Up SMS (2 messages)

Part of the no-book branch in [WIRING.md](../WIRING.md). Both messages stay
under 320 characters after merge fields resolve, with real headroom (counts
below). A long booking URL is the one thing that can push the count up, so
prefer a short branded link; the counts below already assume a full-length
GHL widget URL (~70 chars) as the worst case.

REBRAND TOKENS (replace in the order listed; keep consistent with
`src/config/funnel.ts`):

| Token | Replace with |
| --- | --- |
| `Paul Howarth` | brand.specialist.name (use FIRST NAME in SMS) |
| `Internet Loans Direct` | brand.shortName |
| `100+` | brand.lenderCount (verify per client) |
| `https://REPLACE-BOOKING-LINK` | booking / scheduling URL |

Compliance notes:
- The funnel's TCPA checkbox (`tcpaCopy` in `funnel.ts`, includes the
  automated-technology clause) is the consent basis. Keep sends between
  8am and 9pm contact-local time.
- "Reply STOP to opt out" stays in BOTH messages. If the GHL location
  auto-appends opt-out language, remove the manual line so it does not double.
- Partial leads (see WIRING.md) have no phone number; GHL skips SMS steps for
  them automatically. No extra branching needed.

---

## SMS 1 · Day 0, evening

Timing: a Wait step set to 6:30pm contact-local. GHL's native behavior when
6:30pm has already passed is to roll to 6:30pm the NEXT day, so an evening
lead gets SMS 1 the following evening. That is the intended build; do not
invent a same-night send for late leads.

```
{{contact.first_name}}, it's Paul at Internet Loans Direct. Your eligibility summary is sitting in your inbox. When you're ready, pick a call time here: https://REPLACE-BOOKING-LINK. Reply STOP to opt out.
```

~205 chars raw; ~235 with typical merged names and a full GHL widget URL.
Deliberately does NOT repeat the no-credit-pull reassurance; the day 1 email
owns that objection. It also names no subject line, so it survives any
Email 1 subject A/B test.

## SMS 2 · Day 4, late morning (10:30am contact-local)

```
{{contact.first_name}}, still holding your DSCR file: {{contact.dscr_goal_label}}, {{contact.dscr_state}}, {{contact.dscr_price_display}}. Worth 30 minutes to price it across 100+ lenders? Grab a time: https://REPLACE-BOOKING-LINK. If timing's off, all good. Reply STOP to opt out.
```

~230 chars raw; ~285 with typical merges and a full-length URL. The three
merge fields double as proof we actually read their file, which is the point
of the message.
