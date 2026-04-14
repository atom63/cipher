# Cipher Full Page Plan

## Page Goal

Build a compact product page that presents Cipher as more than a Figma plugin.

Cipher should be framed as a structured token workflow that helps align design and code through generation, updating, management, and round-trip import/export.

The page should communicate:
- what Cipher is
- why it matters
- what users can do with it
- how it connects Figma and code
- why it is easy to try now

The page should feel:
- structured
- calm
- technically credible
- product-led
- opinionated
- modern

The page should not feel:
- generic SaaS
- overly hype-driven
- vague
- too wordy
- too visually noisy

---

# Core Positioning

## Primary headline direction
A token system that aligns design and code

## Supporting positioning
Cipher is a local-first Figma plugin for generating, updating, managing, and round-tripping structured design tokens across design and implementation workflows.

## Core truths to reinforce
- Cipher is in beta
- Cipher is free to use
- Cipher runs locally in Figma
- Cipher does not rely on external servers or telemetry
- Cipher helps users generate an opinionated token structure
- Cipher helps users update existing generated systems
- Cipher supports variable and style management
- Cipher supports round-trip workflows between Figma and code
- Cipher outputs a structure ready for modern CSS workflows, including Tailwind CSS v4 and shadcn/ui-style setups
- Cipher also offers an open-source website starter that applies the token structure in code

---

# Full Page Order

1. Hero
2. Features
3. See the system in code
4. FAQ
5. Footer CTA
6. Footer

This should stay a tight landing page.
Do not add unnecessary marketing sections unless needed later.

---

# 1. Hero

## Goal
Explain the product immediately:
- what it is
- why it matters
- why it is different
- why it is low friction to try

## Content structure
- eyebrow
- headline
- supporting paragraph
- primary CTA
- secondary CTA
- optional tertiary CTA
- trust line
- hero visual

## Recommended copy

### Eyebrow
Beta · Free to use

### Headline
A token system that aligns design and code

### Supporting paragraph
Cipher helps you generate, update, manage, and round-trip structured tokens through an opinionated workflow built to keep design decisions and code implementation aligned.

### Primary CTA
Install plugin

### Secondary CTA
View docs

### Optional tertiary CTA
View boilerplate

### Trust line
Local-only · No telemetry · Ready for modern CSS workflows

## Hero visual direction
Use real product UI, not abstract brand art.

Preferred visual directions:
- generation UI
- token table preview
- variable/style management view
- export/import preview
- a composed montage of multiple product views

## Layout recommendation
Desktop:
- left column = text
- right column = product visual

Mobile:
- single column
- text first
- visual second

## Notes
This section should be clear and direct.
Do not overload the hero with too many claims.

---

# 2. Features

## Goal
Show the core workflow in a compact way.
This is the main section of the page.

## Section title
From raw variables to a usable system

## Section intro
Cipher helps you generate a structured token foundation, evolve it over time, manage variables and styles at scale, and keep design and code aligned through round-trip workflows.

## Layout
Use a bento grid.

Recommended structure:
- 1 large card
- 2 medium cards
- 2 or 3 small supporting cards

Suggested desktop composition:
- large card: Generate + Update
- medium card: Manage
- medium card: Round-trip
- small card: Modern CSS workflow
- small card: Opinionated by design
- small card: Local-only / Beta / Free

---

## Feature Card 1 — Generate + Update

### Title
Generate and evolve your token system

### Goal
Show that Cipher is not just a one-time generator.
It supports both initial setup and later iteration.

### Body
Generate an opinionated token structure from a small set of brand and UI decisions, then come back anytime to preview current values, make updates, and regenerate the system in Figma.

### Bullet points
- configure primary and secondary brand colors
- configure surface colors
- configure status colors
- configure radius ramp
- configure type scale ramp
- generate a structured token table in Figma
- reopen and update existing Cipher-generated systems

### Suggested supporting label
One flow for setup and iteration

### Suggested visual
Generation UI with controls and token preview table

---

## Feature Card 2 — Manage

### Title
Manage variables and styles at scale

### Goal
Show maintenance power.
This is where users understand Cipher is useful beyond setup.

### Body
Maintain your token system with comprehensive CRUD controls and batch actions for variables and styles, making large systems easier to clean up, reorganize, and keep consistent.

### Bullet points
- rename
- edit
- move
- duplicate
- delete
- batch actions for variables and styles

### Suggested supporting label
Built for maintenance, not just setup

### Suggested visual
Management table or list UI showing variable/style operations

---

## Feature Card 3 — Round-trip

### Title
Round-trip between Figma and code

### Goal
Show the design-code alignment story clearly.

### Body
Export structured token files for code workflows, make changes outside Figma, then import them back to update the token table and keep design and implementation aligned.

### Bullet points
- export ready-to-use CSS token files
- use a predefined structure for code workflows
- make changes in code
- import updates back into Figma
- keep the system aligned over time

### Suggested supporting label
Keep implementation in sync

### Suggested visual
Split view showing token table and exported CSS or import preview

---

## Feature Card 4 — Modern CSS workflow

### Title
Ready for modern CSS workflows

### Goal
Show implementation relevance.

### Body
Cipher’s token structure is designed to plug into modern frontend workflows, including Tailwind CSS v4 and shadcn/ui-style setups.

### Suggested visual
Small code snippet or theme preview

### Notes
Keep wording precise.
Do not overstate official integration if it is more about compatibility and workflow fit.

---

## Feature Card 5 — Opinionated by design

### Title
Built with a point of view

### Goal
Turn “opinionated” into a strength.

### Body
Cipher is not trying to support every workflow equally. It is built around a clearer token structure that favors readability, consistency, and maintainability.

### Suggested visual
Simple diagram:
Brand inputs → primitives → aliases → semantics

---

## Feature Card 6 — Low-friction trust

### Title
Free during beta, local by default

### Goal
Reduce hesitation.

### Body
Cipher is currently free to use during beta and runs locally inside Figma without external servers or telemetry.

### Suggested visual
Text-only or icon row

---

# 3. See the system in code

## Goal
Prove that the system actually continues into code.
This should be the second most important section on the page.

## Section title
See the system in code

## Section intro
Preview how Cipher tokens map into a real codebase. Inspect token structure, explore output, and use the open-source website starter as a reference or boilerplate for faster builds.

## Layout recommendation
Two-column layout on desktop:
- left = interactive preview
- right = explanation + CTA

Alternative:
- top = intro
- middle = interactive panel
- bottom = boilerplate CTA

## Section components

### A. Interactive token/code preview

#### Goal
Let users inspect the system, not just read about it.

#### Recommended tabs
- Colors
- Typography
- Radius
- Semantic tokens
- CSS output
- Components

#### Possible left panel content
- token name
- token value
- swatch or sample
- semantic mapping
- hierarchy preview

#### Possible right panel content
- CSS variable output
- theme output
- usage snippet
- sample component implementation

### B. Live component preview

#### Goal
Show the tokens in use.

#### Suggested examples
- button
- card
- input
- badge

This makes the system feel concrete and usable.

### C. Boilerplate block

#### Title
Open-source starter built with Cipher tokens

#### Body
Cipher also includes a public website starter that applies the token structure in code. Use it as a reference implementation or a boilerplate for faster product sites, prototypes, and vibe-coded experiments.

#### CTA
- View GitHub repo
- Use boilerplate

#### Notes
Frame this as:
- starter
- reference implementation
- boilerplate

Do not frame this as a universal framework.

---

# 4. FAQ

## Goal
Answer the main questions that block adoption.

## Section title
FAQ

## Layout
Accordion
Keep it concise.
Recommended 6 to 8 questions.

## Recommended FAQ items

### What does “opinionated” mean?
Cipher is built around a clear token structure and workflow philosophy. Instead of supporting every possible setup equally, it prioritizes readability, consistency, and maintainability.

### Is Cipher free to use?
Yes. Cipher is currently free to use during beta.

### Why is Cipher in beta?
Cipher is already usable today, but the workflow, docs, and feature set are still evolving. The beta label helps set expectations clearly while the product continues to improve.

### What can Cipher generate?
Cipher can generate a structured token system from configurable inputs such as brand colors, surface colors, status colors, radius ramps, and type scale ramps.

### Can I update an existing Cipher-generated system?
Yes. You can reopen the generation workflow, preview the current setup, change core values, and regenerate the system in Figma.

### What can Cipher manage?
Cipher supports CRUD and batch actions for variables and styles, including rename, edit, move, duplicate, and delete.

### Can I export tokens for code and import them back?
Yes. Cipher supports round-trip workflows by exporting structured token files and importing changes back into Figma.

### Does Cipher use cloud sync or external servers?
No. Cipher is local-only and does not use external servers or telemetry.

### Who is Cipher for?
Cipher is for designers and developers who care about readable token systems and stronger alignment between design and code.

### What is the open-source website starter?
It is a public starter repo that applies Cipher’s token structure in code, so you can explore the workflow or build on top of it outside the plugin UI.

---

# 5. Footer CTA

## Goal
Give users one final clear action.

## Layout
Compact but visually distinct callout above the footer.

## Headline
Bring more structure to your design and code workflow

## Supporting paragraph
Generate, update, manage, and round-trip tokens through a workflow built for readability, consistency, and real product use.

## CTA buttons
- Install plugin
- View docs
- View boilerplate

## Optional small text
Free during beta

---

# 6. Footer

## Goal
Close the page cleanly and provide utility links.

## Suggested content
- Cipher logo / wordmark
- short product description
- navigation links
- product/resource links
- trust notes
- copyright

## Suggested short description
A token system that aligns design and code.

## Suggested link groups

### Product
- Plugin
- Docs
- GitHub

### Resources
- Boilerplate
- FAQ

### Notes
- Beta
- Free to use
- Local-only
- No telemetry

---

# Recommended Section Weight

## Hero
Medium-large

## Features
Largest section on page

## See the system in code
Second largest section

## FAQ
Compact

## Footer CTA
Compact but distinct

## Footer
Minimal

---

# Recommended Interaction Notes

## Hero
- keep motion subtle
- product visual can animate in
- CTA visible without scroll

## Features
- bento cards can have hover states
- restrained motion only
- focus on readability and hierarchy

## See the system in code
- use tabs or segmented control
- allow users to switch between token preview and code preview
- keep interaction inspectable and useful, not decorative

## FAQ
- simple accordion
- optionally open first question by default

## Footer CTA
- should feel like a final invitation, not a hard sell

---

# Mobile Behavior

## Order
Keep same order:
Hero → Features → See the system in code → FAQ → Footer CTA → Footer

## Notes
- hero becomes single column
- bento grid becomes vertical stack
- code preview should simplify on smaller screens
- CTA buttons can go full width
- keep spacing generous for readability

---

# Tone Guidance

Use copy that feels:
- direct
- structured
- thoughtful
- technically grounded
- confident

Avoid:
- buzzwords
- inflated claims
- vague branding language
- startup hype tone

---

# Optional Section IDs for Implementation

- hero
- features
- system-in-code
- faq
- footer-cta
- footer

---

# Minimal Wireframe Summary

## Hero
Left: text and CTA
Right: product UI visual

## Features
Bento grid with 4 to 6 cards

## See the system in code
Interactive token/code preview plus boilerplate CTA

## FAQ
Accordion list

## Footer CTA
Headline plus CTA buttons

## Footer
Utility links and trust notes