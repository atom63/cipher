# Cipher Product Page Plan

## Page Goal

Introduce Cipher as a highly opinionated token system for Figma.
Help users understand:
1. what Cipher is
2. why its point of view matters
3. what it can do today
4. why they should try it now

The page should feel:
- precise
- calm
- system-minded
- readable
- quietly confident

Avoid making it feel:
- overly promotional
- vague
- generic SaaS
- overly playful
- AI-hyped

---

## Core Messaging Anchor

Primary positioning:
Cipher is a highly opinionated token system for Figma that helps teams import, export, and maintain design tokens with more clarity, consistency, and less manual overhead.

Supporting narrative:
Make hidden structure readable.

Key product truths to reflect:
- local-only Figma plugin
- generate structured token systems
- manage variables and styles at scale
- export production-ready CSS and JSON
- import and round-trip tokens back into Figma
- currently beta
- free to use

---

## Recommended Page Structure

1. Hero
2. Why Cipher Exists
3. Feature Bento Grid
4. Open Source Boilerplate Section
5. Trust / Beta / Free Strip
6. FAQ
7. Final CTA

This should be a relatively tight landing page, not a long marketing page.

---

## 1. Hero

### Goal
Immediately explain what Cipher is, what kind of tool it is, and why it is worth trying.

### Content
- eyebrow
- headline
- supporting paragraph
- primary CTA
- secondary CTA
- metadata / trust strip

### Suggested copy direction

Eyebrow:
Beta · Free to use

Headline options:
- A highly opinionated token system for Figma
- From Figma variables to a real token system
- Generate, manage, and round-trip tokens between Figma and code

Recommended headline:
A highly opinionated token system for Figma

Supporting paragraph:
Cipher helps you generate structured token systems, manage variables and styles at scale, and round-trip production-ready tokens between Figma and code with more clarity and less manual overhead.

CTA buttons:
- Install plugin
- View docs

Optional third CTA:
- View boilerplate

Trust/meta line:
Local-only · No external servers · No telemetry · Free during beta

### Visual suggestion
Use a real product screenshot or lightweight product montage.
Best hero visual candidates:
- generator panel
- export preview
- variable manager
Do not use abstract 3D branding art as the primary hero proof.

---

## 2. Why Cipher Exists

### Goal
Explain the problem in a short and credible way.
This section should set up why an opinionated workflow is valuable.

### Structure
Short section, ideally 2 columns or a compact text block.

### Suggested section title
Figma gives you variables. Cipher gives you a system.

### Suggested body copy
Design token workflows often become fragmented across files, tools, and codebases. Naming drifts, structure gets harder to maintain, and exports still need cleanup before they are useful. Cipher is built to make that hidden system logic more readable, more portable, and easier to keep aligned.

### Supporting points
- structure over sprawl
- clarity beats configurability
- readable systems scale better

### UX note
Keep this section short. It should frame the problem, not become an essay.

---

## 3. Feature Bento Grid

### Goal
Show the core product capabilities in one compact section instead of multiple long feature bands.

### Section title options
- Everything you need to build and maintain a readable token system
- From raw variables to a usable system
- Structured token workflows, end to end

Recommended title:
From raw variables to a usable system

### Section intro
Cipher helps you generate, manage, export, and re-import tokens through a workflow built around structure, readability, and control.

### Grid recommendation
Use a 6-card bento grid.
Have 1 or 2 larger anchor cards and 4 smaller supporting cards.

Suggested layout:
- large card: Generate
- large card: Round-trip
- medium card: Manage variables
- medium card: Manage styles
- small card: Production-ready export
- small card: Opinionated by design

---

### Card 1 — Generate
Title:
Generate a full token system

Body:
Create primitives, aliases, and semantics from a small set of design inputs like color, surfaces, radius, type scale, and font mappings.

Bullets:
- three-tier token model
- supports first-time setup
- supports updating existing Cipher-style systems

Visual:
generator UI screenshot

---

### Card 2 — Manage Variables
Title:
Manage variables at scale

Body:
Search, rename, move, duplicate, delete, edit by mode, scale values, and swap references with less one-by-one cleanup.

Bullets:
- bulk operations
- dependency-aware delete
- undo for key actions

Visual:
variable manager screenshot

---

### Card 3 — Manage Styles
Title:
Fix and maintain styles faster

Body:
Browse paint, text, effect, and grid styles, detect broken bindings, and apply rebind suggestions in batch.

Bullets:
- visual previews
- rebind suggestions
- batch rebind with undo

Visual:
styles rebind screenshot

---

### Card 4 — Export for Code
Title:
Export tokens that are ready to use

Body:
Export structured JSON and CSS token files with options that fit real frontend workflows.

Bullets:
- JSON and CSS export
- Tailwind v4 @theme inline
- split token files
- color format selection

Visual:
export preview screenshot

---

### Card 5 — Round-trip
Title:
Round-trip between Figma and code

Body:
Import JSON, CSS, folders, or ZIP files back into Figma with preview, conflict checks, and reference-aware creation.

Bullets:
- preview before write
- import or override modes
- undo import

Visual:
import preview/conflict table screenshot

---

### Card 6 — Opinionated by design
Title:
Built with a point of view

Body:
Cipher is not trying to support every possible workflow equally. It is built around a clearer and more readable way to organize token systems.

Bullets:
- structure over sprawl
- clarity over configurability
- system-first workflow

Visual:
could be text-only or use simple diagram
Brand inputs → primitives → aliases → semantics

---

## 4. Open Source Boilerplate Section

### Goal
Show proof that Cipher’s token structure continues into code.
This should feel like a practical extension of the product, not just an extra resource.

### Section title options
- See the system in code
- Start from a token-ready boilerplate
- An open-source starter built with Cipher tokens

Recommended title:
See the system in code

### Suggested body copy
Alongside the plugin, Cipher also includes an open-source website starter that applies the Cipher token structure in code. Use it as a reference implementation or a boilerplate for faster product sites, experiments, and vibe-coded builds.

### Supporting points
- demonstrates Cipher tokens in a real codebase
- useful as a starter for web projects
- helps bridge design token structure into development
- good for design engineers and rapid prototyping

### CTA buttons
- View GitHub repo
- Use boilerplate

### Visual suggestion
Use a screenshot of the website starter or code snippet preview.
Could also show:
- token files
- theme layer
- applied UI components

### Important framing note
Do not position this as a universal website framework for everyone.
Frame it as:
- starter
- reference implementation
- boilerplate built around Cipher token structure

---

## 5. Trust / Beta / Free Strip

### Goal
Reduce adoption friction and reinforce trust.

### Format
A slim band or compact card row.

### Recommended items
- Beta
- Free to use
- Local-only
- No external servers
- No telemetry

### Suggested copy
Currently in beta and free to use.
Cipher runs locally inside Figma with no external servers and no telemetry.

### UX note
Some of this can also appear in the hero.
If repeated here, keep the phrasing short.

---

## 6. FAQ

### Goal
Answer the main adoption questions quickly.

### Recommended questions

#### What does “opinionated” mean?
Cipher is built around a clear token structure and workflow philosophy. Instead of trying to support every possible setup equally, it prioritizes readability, consistency, and maintainability.

#### Is Cipher free to use?
Yes. Cipher is currently free to use during beta.

#### Why is Cipher in beta?
Cipher is already usable today, but the workflow, docs, and feature set are still evolving. The beta label helps set expectations clearly while the product continues to improve.

#### What can Cipher export?
Cipher exports JSON token files and CSS token files, including support for Tailwind v4-friendly @theme inline output.

#### Can I import token files back into Figma?
Yes. Cipher supports importing JSON, CSS, folders, and ZIP archives with preview, conflict handling, and undo.

#### Does Cipher use cloud sync or external servers?
No. Cipher is local-only and does not use external servers or telemetry.

#### Who is Cipher for?
Cipher is for designers and developers who care about structured token workflows, readable systems, and better alignment between design and code.

#### What is the open-source website starter?
It is a public starter repo that applies Cipher’s token structure in code, so you can explore or build on the workflow outside the plugin UI.

---

## 7. Final CTA

### Goal
Close the page with a clear and simple next step.

### Suggested headline
Bring more structure to your token workflow

### Suggested supporting copy
Generate, manage, export, and re-import tokens with a workflow built for readability, consistency, and real product use.

### CTA buttons
- Install plugin
- View docs
- View boilerplate

---

## Visual / Content Notes

### Screenshot priority
Use real UI screenshots over abstract illustrations.

Best captures to prepare:
1. Generate page with color/type/radius config
2. Variable manager with bulk actions
3. Styles page with rebind suggestions
4. Export preview with CSS files
5. Import review table with conflicts
6. Boilerplate website preview

### Tone guidance
The copy should sound:
- clear
- deliberate
- calm
- technical without sounding cold
- confident without overselling

### Avoid claims like
- real-time collaboration
- cloud sync
- AI token generation
- zero-conflict imports
- universal workflow for every team
- works outside Figma

---

## Suggested Content Hierarchy

Priority order on page:
1. What Cipher is
2. Why its workflow matters
3. What it can do today
4. Why it is credible
5. Why trying it is low-risk

This means:
- keep hero very clear
- make bento grid the main content block
- use boilerplate section as proof
- use beta/free/trust to reduce friction

---

## Optional section labels for implementation

hero
why
features
boilerplate
trust
faq
cta

---

## Optional reusable microcopy

- Beta · Free to use
- Local-only
- No telemetry
- No external servers
- Built with a point of view
- Structure over sprawl
- Clarity over configurability
- From raw variables to a usable system
- See the system in code
- Built for readable token workflows