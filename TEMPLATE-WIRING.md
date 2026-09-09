# WIRING: lead payload -> Zapier -> GoHighLevel

`/api/lead` forwards ONE JSON POST per complete lead to the Zapier catch hook in
`LEAD_WEBHOOK_URL` (never a GHL inbound webhook; Tanner maps the Zap into GHL
himself). No partial leads ever fire: the server returns 400 unless name, email,
phone, and TCPA consent are all present. Bots (honeypot) and sub-620 credit get a
silent 200 and never reach the hook.

Set the hook from Git Bash (PowerShell pipes append CRLF and break the fetch):

```
printf '%s' 'https://hooks.zapier.com/hooks/catch/...' | npx vercel env add LEAD_WEBHOOK_URL production
```

After deploy, submit a test lead on `/?qa=1` (real webhook fire, Ads conversion
suppressed) and confirm every mapped field lands in GHL before sending traffic.

## Field map

Keys are the CRM contract; they never get renamed and new keys only append at the
end. "null on other branches" means the key is always present but null when the
goal branch does not use it. `gclid` and `utm_*` are OMITTED entirely (not null)
when absent, so make those Zap mappings optional.

### Identity + source

| Key | Type | Example | GHL field suggestion |
| --- | --- | --- | --- |
| `source` | string, constant | `dscr-funnel-template-4` | Custom: Lead Source Detail (Single Line) |
| `mode` | string | `network` | Custom: Funnel Mode (Single Line) |
| `firstName` | string (FULL typed name, ILD semantics) | `Tanner Kauffman` | Contact: Full Name (split in the Zap if First/Last needed) |
| `email` | string | `tanner@example.com` | Contact: Email |
| `phone` | string, exactly 10 digits | `2085550143` | Contact: Phone |

### Deal

| Key | Type | Example | GHL field suggestion |
| --- | --- | --- | --- |
| `goal` | string: `purchase` / `refinance` / `bridge` | `purchase` | Custom: Loan Goal (Single Line or Dropdown) |
| `goalLabel` | string | `Purchase` | Custom: Loan Goal Label (Single Line) |
| `stage` | string, always `''` | `` | skip (reserved) |
| `stageLabel` | string, always `''` | `` | skip (reserved) |
| `propertyType` | string: `sfr` / `2-4` / `5+` / `condo` / `str` / `other` | `sfr` | Custom: Property Type (Single Line) |
| `propertyTypeLabel` | string | `Single family` | Custom: Property Type Label (Single Line) |
| `credit` | string band | `700-739` | Custom: Credit Band (Single Line) |
| `price` | number, or string `2000000+` at slider max | `300000` | Custom: Property Price (Single Line, not Numeric, because of the `+` case) |
| `priceDisplay` | string | `$300,000` | Custom: Property Price Display (Single Line) |
| `downPct` | number (slider value regardless of goal) | `25` | Custom: Down Percent (Numeric) |
| `downPctDisplay` | string or null (purchase only) | `25%` | Custom: Down Percent Display (Single Line) |
| `downPayment` | number or null (purchase only) | `75000` | Custom: Down Payment (Numeric) |
| `downPaymentDisplay` | string or null | `$75,000` | Custom: Down Payment Display (Single Line) |
| `balance` | number (slider value regardless of goal) | `150000` | Custom: Loan Balance (Numeric) |
| `balanceDisplay` | string or null (refinance only) | `$150,000` | Custom: Loan Balance Display (Single Line) |
| `equity` | number or null (refinance only) | `150000` | Custom: Equity (Numeric) |
| `equityDisplay` | string or null | `$150,000` | Custom: Equity Display (Single Line) |
| `rehab` | number (slider value regardless of goal) | `50000` | Custom: Rehab Budget (Numeric) |
| `rehabDisplay` | string or null (bridge only) | `$50,000` | Custom: Rehab Budget Display (Single Line) |
| `scenarioDetail` | string, human summary of the money step | `25% down (about $75,000)` | Custom: Scenario Detail (Single Line) |
| `city` | string, always `''` | `` | skip (reserved) |
| `state` | string, full name | `Texas` | Contact: State, or Custom: Property State (Single Line) |
| `stateSlug` | string | `texas` | Custom: Property State Slug (Single Line) |
| `partial` | boolean, always `false` | `false` | skip, or Custom: Partial (Single Line) for auditing |

### TCPA consent record (client-stamped)

| Key | Type | Example | GHL field suggestion |
| --- | --- | --- | --- |
| `tcpaConsent` | boolean, always `true` on a delivered lead | `true` | Custom: TCPA Consent (Single Line) |
| `tcpaConsentText` | string, ~554 chars, the VERBATIM text agreed to | `By checking this box you expressly consent to having...` | Custom: TCPA Consent Text (**Multi Line**, mandatory; Single Line truncates it) |
| `tcpaConsentAt` | ISO timestamp of the checkbox click | `2026-09-01T18:22:04.511Z` | Custom: TCPA Consent At (Single Line) |
| `tcpaConsentUrl` | string, page URL at consent | `https://dscrlenders.example/dscr-loans/texas` | Custom: TCPA Consent URL (Single Line) |
| `tcpaConsentMode` | string | `network` | Custom: TCPA Consent Mode (Single Line) |
| `tcpaConsentParties` | array of strings (Zapier renders comma-joined) | `["DSCR Lenders Network LLC"]` | Custom: TCPA Consent Parties (Multi Line) |

### TCPA consent record (server-stamped, added by /api/lead)

| Key | Type | Example | GHL field suggestion |
| --- | --- | --- | --- |
| `tcpaConsentIp` | string or null | `73.14.220.8` | Custom: TCPA Consent IP (Single Line) |
| `tcpaConsentUserAgent` | string or null | `Mozilla/5.0 (iPhone...)` | Custom: TCPA Consent User Agent (Multi Line) |
| `tcpaConsentReceivedAt` | ISO timestamp, server clock | `2026-09-01T18:22:06.030Z` | Custom: TCPA Consent Received At (Single Line) |
| `receivedAt` | ISO timestamp, same value as above | `2026-09-01T18:22:06.030Z` | skip, or Custom: Received At |

### Attribution + quality

| Key | Type | Example | GHL field suggestion |
| --- | --- | --- | --- |
| `gclid` | string, OMITTED when absent | `Cj0KCQjw...` | Custom: GCLID (Single Line) |
| `utm_source` | string, OMITTED when absent | `google` | Custom: UTM Source (Single Line) |
| `utm_medium` | string, OMITTED when absent | `cpc` | Custom: UTM Medium (Single Line) |
| `utm_campaign` | string, OMITTED when absent | `dscr-texas` | Custom: UTM Campaign (Single Line) |
| `utm_term` | string, OMITTED when absent | `dscr loan texas` | Custom: UTM Term (Single Line) |
| `utm_content` | string, OMITTED when absent | `ad2` | Custom: UTM Content (Single Line) |
| `landingPage` | string, first-touch URL | `https://dscrlenders.example/?gclid=...` | Custom: Landing Page (Multi Line) |
| `referrer` | string, may be `''` | `https://www.google.com/` | Custom: Referrer (Single Line) |
| `secondsToComplete` | number or null | `74` | Custom: Seconds To Complete (Numeric) |
| `website` | string, honeypot, `''` on real leads | `` | skip (bots never reach the hook anyway) |
| `submittedAt` | ISO timestamp, client clock at submit | `2026-09-01T18:22:05.900Z` | Custom: Submitted At (Single Line) |
