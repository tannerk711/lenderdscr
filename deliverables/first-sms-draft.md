# First-Text Draft for Paul's Existing GHL Automation (v2, 2026-08-24)

Paul already HAS a follow-up automation in GHL. Nothing here is a new build. This is
the copy + settings to align his existing first touch with what the funnel now promises.
The thank-you page tells every lead: "Paul or Mike will text you from (855) 545-2022 to
answer any questions you have and, if you're interested, run some numbers for you."

**The frame is a CONVERSATION OPENER (Tanner's call, 2026-08-24): reach out, chat about
the deal, answer questions. NOT "here are your results" and NOT an approval verdict.**

**NEEDS PAUL'S SIGN-OFF on the framing before Tanner pastes it in.**

## The first text

> Hey {{contact.first_name}}, Paul Howarth with Internet Loans Direct. Your eligibility
> check on the Texas rental just came through. Happy to answer any questions about the
> programs or your deal, and if you're interested I can run your numbers across my
> lenders. What questions can I answer for you?

If the automation sends as Mike instead, swap the name; the thank-you page names both
Paul and Mike, so either lands as the person the lead was told to expect.

(The 8/19 city question was removed in the 2026-08-24 PMF-model rebuild, so `city` in
the payload is always blank now. "the Texas rental" is the permanent wording; do not
use a {{contact.city}} merge field.)

## Non-negotiable settings (this is the engagement machine, not just copy)

1. **SMS first.** Not email first, not a call first. The thank-you page scripts the lead
   to watch for a text.
2. **Fires within minutes of the lead landing.** The page says a text is on the way.
   A next-morning text breaks the promise.
3. **From (855) 545-2022.** The thank-you page displays this exact number and tells the
   lead to save it. A different sending number lands as a stranger.
4. **The ask is a reply, not a click and not a booking link.** An open question starts
   the conversation; Paul takes it manual from there.
5. **Conversation frame, never approval frame.** Answer questions, talk the deal, offer
   to run numbers when they're interested. Never "Congrats, you're pre-qualified" and
   never "here are your results."
6. **No rates in the text. Ever.** Speed to real numbers is the certainty signal.

## Why this text (for Paul, one paragraph)

The LeaderOne funnel got 11 of 13 leads texting back within days because every step made
one promise: a named human is about to text you, watch for it, reply to it. The same
automation firing into an unprimed lead gets silence. The funnel now makes exactly this
promise (questions answered, numbers run if you want them); this text is the payoff.
Same structure: named human, their deal (the Texas rental), a genuine offer with zero
pressure, and an open question that is easy to answer.
