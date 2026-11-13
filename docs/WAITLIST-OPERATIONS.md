# TursiopsX Waitlist — Operations Pack

Internal document. Not published on the website. Covers the parts of the waitlist brief that
belong to operations rather than the page: qualification, email sequence, metrics and the
publication gate for **WEB-WL-001**.

---

## 1. Internal qualification score (brief §17)

Computed client-side as a *hint* in `assets/js/main.js` → `qualify()` and sent in
`payload.internal.qualification`. **The CRM/backend must recompute it**; never trust the client value.
Only the `organisation` segment is scored.

| Dimension | Weight | Signal used (WL-QS-v1) |
|---|---|---|
| Dor operacional demonstrada | 20 | length of *bottleneck* + *current process*, hours spent per week |
| Volume repetível | 15 | monthly hires (0–2 → 3, 3–10 → 9, 11–30 → 13, >30 → 15); −3 outside 100–2,000 workers |
| Resultado mensurável | 15 | target outcome stated (+9) and quantified with a number (+6) |
| Responsável executivo | 10 | `exec_owner = yes` |
| Dados disponíveis | 10 | yes 10 · partial 5 · no 0 |
| Facilidade de integração | 10 | M365 / Google Workspace / spreadsheets → 10; other systems → 6; none → 3 |
| Risco controlável | 10 | TA / Onboarding 10 · Skills 9 · Compliance 7 · Planning 5 · Other 4 |
| Potencial de repetição | 5 | number of locations |
| Adequação ao mercado inicial | 5 | Moçambique 5 · other African 3 · elsewhere 1 |

| Band | Score | Action |
|---|---|---|
| `priority_interview` | 80–100 | prioritise discovery interview |
| `good_needs_scoping` | 65–79 | good application, needs scoping |
| `product_research` | 50–64 | invite to product research |
| `newsletter_only` | < 50 | keep on newsletter (only if consent given), no immediate pilot |

The score is used to prioritise review. It is not a probability of success and must never
be shown to the applicant. Every application has a named human reviewer (see gate below).

---

## 2. Payload contract (what the CRM receives)

`POST {TX_CONFIG.endpoint}` with JSON:

```jsonc
{
  "type": "waitlist_application",
  "segment": "organisation | operator | partner | investor | talent",
  "applicant": { "name": "…", "email": "…", "organisation": "…", "country": "…", "role": "…", /* + step fields */ },
  "consents": { "contact": true, "product_updates": false, "product_research": false,
                "captured_at": "ISO-8601", "text_version": "WL-2026.11-v1" },
  "source": { "utm": {…}, "referrer": "…", "landing": "/?utm_source=…", "cta": "hero_primary", "page": "/" },
  "mission_builder": { /* present when the visitor used the Mission Builder */ },
  "internal": { "qualification": { "total": 82, "band": "priority_interview", "breakdown": {…}, "model": "WL-QS-v1" } },
  "meta": { "submitted_at": "ISO-8601", "form_version": "…", "completion_ms": 152000, "lang": "pt-MZ" }
}
```

Server-side requirements:
- re-validate every field; recompute the score;
- store each consent separately with timestamp and `text_version` (commercial consent is never required);
- anti-spam: honeypot field `company_fax` must be empty, reject `completion_ms < 4000`, rate-limit per IP/email, add Turnstile/hCaptcha if abuse appears;
- assign an owner to each application on arrival;
- send Email 1 only after storing the record.

Until `endpoint` is set, the site runs in **demo mode**: submissions stay in the visitor's
browser (`localStorage.tx_waitlist_outbox`) and a console warning is printed.

---

## 3. Email sequence (brief §22)

| # | Trigger | Subject | Content |
|---|---|---|---|
| 1 | on submit | You are on the TursiopsX private waitlist | confirm receipt · restate vision · explain next step · link to Mission Assessment · **no launch date** |
| 2 | +3 days | HR software records the work. Who executes it? | execution gap · one example mission · ask for priority workflow |
| 3 | +7 days | An AI agent should never define its own authority | identity · least privilege · human approval · audit trail · kill switch |
| 4 | +12 days | Could your workflow become a TursiopsX mission? | criteria · requirements · benefits · application form |
| 5 | monthly | What we are building, testing and refusing to automate | real progress · product decision · limitation · learning · next milestone |

Emails 2–5 require `consents.product_updates` (or `contact` for Email 4 to organisations).
Email 1 is transactional.

---

## 4. Metrics (brief §23)

**North-star:** number of qualified organisations with a measurable problem, an identified owner
and availability for a pilot. Raw email count is *not* the primary metric.

Funnel events emitted to `window.dataLayer` (and `TX_CONFIG.analyticsEndpoint` if set):

| Funnel stage | Event |
|---|---|
| Visitor | page load (analytics tool) |
| Waitlist started | `waitlist_started` (`segment`, `via`/`cta`) |
| Step progress | `form_step` |
| Waitlist completed | `waitlist_completed` (`segment`, `band`) |
| Qualified organisation → Pilot contracted | CRM stages |

Other events: `cta_click` (every `data-track` element), `tab_select`, `builder_change`,
`simulation_play`, `kill_switch_demo`, `segment_select`, `waitlist_error`, `welcome_view`.

60-day targets (operational estimates, not confirmed benchmarks for Mozambique):

| Metric | Target |
|---|---|
| Qualified visitors | 1,000 |
| Overall waitlist conversion | 8–15% |
| Complete organisational applications | 40–70 |
| Qualified applications | 12–20 |
| Discovery interviews | 8–12 |
| Design partners | 3–5 |
| Candidate missions | 5–10 |

---

## 5. Publication gate (brief §25) — status

| Gate item | Status |
|---|---|
| "MozReg" interface removed or isolated | ✅ new site contains no MozReg / government UI; **old domain content must be taken down at deploy** |
| No fictitious metric presented as real | ✅ only countable facts (7 agents, 4 missions, 7 controls) |
| All synthetic workflows labelled | ✅ simulation banner; Mission TX-TA-001 marked "Exemplo ilustrativo" |
| Form stores consent correctly | ⚠️ client captures 3 separate, optional consents + version; **needs backend** |
| Privacy policy published | ⚠️ `legal.html` is a **draft** pending legal review |
| Confirmation email works | ❌ needs backend + email provider |
| CRM receives origin and segment | ⚠️ payload includes `source` + `segment`; **set `endpoint`** |
| Form prevents spam | ⚠️ honeypot + min time + client throttle; **enforce server-side** |
| CTAs measured | ✅ `data-track` on all CTAs → `dataLayer` |
| Mobile experience validated | ✅ 390 px tested, no horizontal overflow |
| Works on low bandwidth | ✅ no images in critical path, ~1 CSS + 1 JS file, no frameworks |
| No partner logos without authorisation | ✅ integrations shown as text, "Planned" |
| No claim of non-existent certification | ✅ |
| Owner for every application | ❌ CRM assignment rule to be configured |

## 6. WEB-WL-001 acceptance criteria — status

| Criterion | Status |
|---|---|
| Proposition understandable within 15 s | ✅ eyebrow + H1 + lede above the fold |
| Primary CTA visible without scroll | ✅ desktop 1440×900 and mobile 390×844 |
| Four missions · seven agents · governance section | ✅ |
| Advanced pre-seed statement | ✅ under the hero + FAQ |
| Segmented form · post-signup page | ✅ 5 segments, adaptive steps · `welcome.html` |
| Email confirmation · CRM | ❌ backend required |
| Analytics | ✅ dataLayer events (connect a tool) |
| Separate consents | ✅ |
| Zero invented traction · zero governmental look | ✅ + independence disclaimer in footer |
| WCAG AA on main flows | ✅ Lighthouse accessibility 100; keyboard tabs, focus states, reduced motion |
| Lighthouse mobile > 85 | ✅ Performance 97 · Accessibility 100 · Best practices 100 · SEO 100 (local) |
| Main load < 3 s on a reasonable mobile connection | ✅ LCP 2.1 s (Lighthouse simulated mobile throttling) |
