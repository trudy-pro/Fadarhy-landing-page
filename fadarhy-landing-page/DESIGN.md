## Overview
### Project brief
Assemblio: AI-supported digital work instructions and MBOM automation for industrial manufacturers. Primary action: Schedule a demo. English. Faithful recreation of the supplied screenshot.
Headline: "Combines engineering and production. AI-supported, digital, automated." (supplied). Tagline tests: unverified (copy supplied by user).
### Content to replace
Client logos rendered as text wordmarks; product mockups are CSS illustrations.

## Colors
Near-white canvas, ink text, one violet accent (--primary), soft grey borders, black announcement bar.

## Typography
Inter throughout; semibold tight headlines, regular muted body.

## Layout
### Composition
Centered hero, tab pills, product mockup with arrows, logo row, centered section title, bento of four bordered cards (7/5 then 6/6).
### Asset direction
Logo: typographic "Assemblio" wordmark with A glyph in SVG/CSS. No raster assets.

## Elevation & Depth
Soft shadows on pills and mockup windows; content cards are flat with a 1px light border, no shadow.

## Shapes
Rounded 8-16px; pill tabs radius 12px.

## Components
### Primary flow
Header "Schedule a demo" button and nav links; tabs switch the active industry.
### Cards
Every content card uses the shared utilities in `src/styles.css`: `surface-card` (12px radius, 1px line border, card background) with `p-6`, and an `icon-tile` (44px soft square, 12px radius, section background, blue 20px lucide outline icon at 1.75 stroke). Stack: icon → `card-label` (optional) → `card-title` or `card-stat` → `card-desc`. Text utilities set type only; add the colour (`text-ink` for titles, `text-link` for numbers, `text-ink-muted` for labels and descriptions).

## Do's and Don'ts
Do keep violet as the only accent. Don't add gradients or glass.
