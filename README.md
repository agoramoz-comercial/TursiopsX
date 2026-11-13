# TursiopsX — Waitlist Website

The private-waitlist homepage for **TursiopsX, the workforce agentic operating layer**.
It is a static site with no build step and no dependencies.

```
index.html            Homepage (all 18 sections of the brief)
welcome.html          Post-signup page (no ranking or queue position)
legal.html            Privacy, terms, acceptable use and cookies (DRAFT, pending legal review)
assets/css/main.css   Design system and every component
assets/js/config.js   Runtime configuration (endpoint, analytics, contact email)
assets/js/main.js     Interactions: menu, kinetic type, tabs, simulation, Mission Builder, form
docs/WAITLIST-OPERATIONS.md  Scoring, payload contract, emails, metrics, publication gate
.claude/skills/tursiopsx-design/  Reusable design-system skill for Claude Code
```

## Run locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Configure before launch

Edit `assets/js/config.js`:

- `endpoint` is the CRM or form backend that receives the application JSON. While it is empty, the site
  runs in **demo mode**: applications stay in the browser and are never sent anywhere.
- `analyticsEndpoint` is optional and receives beacon events.
- `contactEmail` is the public contact address. `hello@tursiopsx.com` is a placeholder; confirm or replace it.

Before publishing, check `docs/WAITLIST-OPERATIONS.md` §5. The confirmation email, CRM ownership
and the final privacy notice still need a backend and a legal review.

## Interactive features

| Feature | Where |
|---|---|
| Live Mission Simulation (synthetic data, labelled) | Product vision |
| Agent Authority Visualiser (observe → cannot perform) | Agent workforce |
| Mission Builder (preliminary assessment that pre-fills the form) | Initial missions |
| Constitution Explorer + Kill-switch demo | Agent constitution |
| Architecture Explorer (7 clickable layers) | Architecture |
| Adaptive multi-step application (5 segments) | Waitlist form |

All motion respects `prefers-reduced-motion`. The tab widgets support arrow keys, Home and End.

## Quality (local Lighthouse, mobile)

Performance 97 · Accessibility 100 · Best Practices 100 · SEO 100 · LCP 2.1 s · CLS 0.
