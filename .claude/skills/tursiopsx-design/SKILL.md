---
name: tursiopsx-design
description: Apply the TursiopsX "Swiss editorial / kinetic grotesk" design language (paper + ink, electric signal green, gradient colour fields, oversized tight type, vertical nav rail) to any website, landing page, waitlist or marketing page. Use when building or restyling a web page for TursiopsX or when the user asks for this advanced editorial design style.
---

# TursiopsX design language

Bold editorial layouts built from flat colour fields and very large, tightly tracked type,
with one electric accent colour for action. The reference implementation is `assets/css/main.css`
in the TursiopsX repo. Reuse its tokens and components; do not invent new ones.

## Tokens (always define on `:root`)

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f2f2f2` | page background |
| `--white` | `#ffffff` | cards on paper, alternating sections |
| `--ink` | `#141414` | text, dark sections, primary buttons |
| `--mute` | `#555555` | secondary text on paper (6.6:1) |
| `--mute-inv` | `#a9a9a9` | secondary text on ink. **Never** use `--mute` on dark surfaces |
| `--signal` | `#00ff00` | the only accent: primary CTA, highlights, selected states. Text on it is ink. Never use it as text colour on paper |
| `--alert` / `--alert-text` | `#ff3b2f` / `#c4160a` | strike-throughs, exceptions; use the `-text` variant for small text on light backgrounds |
| `--sunset` | `linear-gradient(98deg,#ec6a3c,#f9609f 36%,#f3726b 66%,#e8823a)` | warm colour field; put **ink** text on it |
| `--ocean` | `linear-gradient(140deg,#3a3fe0,#2266ec 46%,#1a86f0)` | cool colour field; white text is fine |
| `--r` | `5px` | the only radius; pills use `100px` |
| `--g` | `12–14px` | gutter, deliberately tight |

Font: **Inter Tight** 400/500/600 (Google Fonts, `display=swap`), falling back to Helvetica and Arial.
Weight 500 for headings, never bold display type.

## Type scale

- Display: `clamp(3.25rem, 11.2vw, 11rem)`, line-height `.86`, letter-spacing `-.055em`
- XXL section titles: `clamp(2.6rem, 7.4vw, 7.5rem)`, `.9`, `-.048em`
- XL statements: `clamp(2.1rem, 5.2vw, 5.4rem)`, `.94`, `-.042em`
- Eyebrow: 13px, 600, `.14em`, uppercase, preceded by a 10px signal-green square
- Index marker: `( 03 )`, 13px tabular numbers, on the right of a 1px top rule

## Layout patterns

1. **Split hero**: a sunset field top-left with a giant white wordmark crossing into an ocean field
   on the right; an ink block below holds the eyebrow, H1, lede and CTAs; a white form card sits
   at the bottom of the ocean field. The primary CTA must be visible without scrolling at 390×844.
2. **Section header**: a 1px rule with the eyebrow on the left and the index on the right, then an XXL title
   spanning 9/12 columns, with a short aside in the last 3 columns aligned to the bottom.
3. **Text panel over colour field**: a gradient block offset to one side, overlapped by an ink panel with XL text.
4. **Ruled lists**: rows separated by 1px lines, small tabular numbers, large text. Use these instead of bullet lists.
5. **Vertical rail navigation** (≥1100px): a fixed 64px white rail on the right with a black hamburger square,
   `writing-mode: vertical-rl` links, and a signal-green CTA block at the bottom. Below 1100px, use a sticky
   top bar with the brand, a Menu button and a green CTA; Menu opens a full-screen ink overlay with giant links.
6. **Big numbered steps**: outlined numbers (`-webkit-text-stroke`) that fill with ink on reveal.
7. **Cards**: white on paper (or paper on white), 5px radius, no shadows except the floating hero form.
8. **Oversized footer wordmark**: about `21vw`, with the last letter in signal green.

## Components

- `.btn` is ink. On hover a signal-green fill slides up from the bottom (`::after` translateY) and the arrow nudges ↗.
  Variants: `--signal`, `--ghost`, `--white`, `--lg`. Minimum height is 48px.
- `.chip` / `.status` are pill tags. Filled signal means "active / in development".
- `.circle-btn` is a 50px white circle used for carousel arrows.
- Tabs use the WAI-ARIA tabs pattern with arrow, Home and End keys. Selected state: ink fill, or a 4px signal bar.
- Option pills are visually hidden radio or checkbox inputs with a `span` styled as a pill. The checked state is signal green.

## Motion

- Kinetic headings: split into words and characters, then stagger `translateY(105%) → 0` (total stagger capped at about 900ms).
  Keep an `.sr-only` copy of the text and set `aria-hidden` on the split spans.
- `.reveal` fades and rises 28px when it enters the viewport (IntersectionObserver).
- Gradient fields drift slowly (`background-position`, 16–20s alternate). Orbs float.
- A marquee trust rail that pauses on hover.
- Wrap everything in `prefers-reduced-motion: reduce` so all motion turns off.

## Non-negotiables

- WCAG AA: check every text and background pair. Signal green is a background, never text on light surfaces.
- No invented metrics, logos without permission, fake scarcity ("limited places") or certification claims.
  Mark demos as using synthetic data.
- Performance: no images in the critical path. Build visuals from CSS or SVG, use one CSS and one deferred JS file,
  and no frameworks unless asked. Target Lighthouse mobile ≥ 90.
- The layout must work at 390px with a 12–16px gutter and no horizontal scroll.
- Add a global `[hidden] { display: none !important; }`, because component `display` rules override the UA style.
