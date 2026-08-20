# First-Text Draft for Paul's Existing GHL Automation (Phase 1, 2026-08-19)

Paul already HAS a follow-up automation in GHL. Nothing here is a new build. This is
the copy + settings to align his existing first touch with what the funnel now promises,
because the thank-you page tells every lead: "Paul Howarth will text you first from
(855) 545-2022. Reply to that text and the conversation starts."

**NEEDS PAUL'S SIGN-OFF on the framing before Tanner pastes it in.**

## The first text (primary draft, once the city field is mapped)

> Hey {{contact.first_name}}, Paul Howarth with Internet Loans Direct. Got your details
> on the {{contact.city}} rental. I can have DSCR pricing options from my top lenders
> back to you today. Want me to run your numbers? Reply YES and I'll get started.

## Variant to use TODAY (until the new city question is mapped in the Zap)

> Hey {{contact.first_name}}, Paul Howarth with Internet Loans Direct. Got your details
> on the Texas rental. I can have DSCR pricing options from my top lenders back to you
> today. Want me to run your numbers? Reply YES and I'll get started.

The funnel's Phase 3 deploy adds a `city` question (answered right before contact info),
so the payload now carries `city`. As soon as Tanner maps it into GHL, switch to the
primary draft. If city can ever be blank, set the merge field's fallback to "Texas".

## Non-negotiable settings (this is the engagement machine, not just copy)

1. **SMS first.** Not email first, not a call first. The thank-you page scripts the lead
   to watch for a text.
2. **Fires within minutes of the lead landing.** The page says Paul is pricing the deal
   NOW. A next-morning text breaks the promise.
3. **From (855) 545-2022.** The thank-you page displays this exact number and tells the
   lead to save it. A different sending number lands as a stranger.
4. **The ask is a reply, not a click and not a booking link.** Reply YES starts the
   conversation; Paul takes it manual from there.
5. **Pricing-options frame, never approval frame.** Investors want their numbers.
   "Want me to run your numbers?" not "Congrats, you're pre-qualified."
6. **No rates in the text. Ever.** Speed to real numbers is the certainty signal.

## Why this text (for Paul, one paragraph)

The LeaderOne funnel got 11 of 13 leads texting back within days because every step made
one promise: a named human is about to text you, watch for it, reply to it. The same
automation firing into an unprimed lead gets silence. The funnel now makes the promise;
this text is the payoff. Same structure: named human, their deal ("the Fort Worth
rental"), a concrete today-outcome (pricing options from my top lenders), one-word ask.
