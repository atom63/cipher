## Feature Breakdown

### 1. Generate
Cipher generates an opinionated token structure in one flow.

Users can configure:
- brand colors such as primary and secondary
- surface colors
- status colors
- radius ramp
- type scale ramp

From those inputs, Cipher creates a structured token system in Figma that is ready to export as CSS and use in modern code workflows, including Tailwind CSS v4 and shadcn/ui.

Suggested short version:
Generate a structured token system from a small set of brand and UI foundations.

Suggested UI emphasis:
- one-click generation
- opinionated structure
- ready for code export

---

### 2. Update
If a Cipher-generated token system already exists in Figma, users can return to the generation UI, preview the current values, and update the system without rebuilding everything manually.

Users can adjust values such as:
- colors
- type scale
- radius

Cipher then regenerates and updates the token table in Figma based on the new configuration.

Suggested short version:
Update an existing Cipher token system through the same generation workflow.

Suggested UI emphasis:
- preview current setup
- adjust core values
- regenerate the system in place

---

### 3. Manage
Cipher provides comprehensive CRUD and batch actions for variables and styles, making large systems easier to maintain.

Supported actions include:
- rename
- edit
- move
- duplicate
- delete

This helps users clean up, reorganize, and maintain token systems without slow one-by-one editing.

Suggested short version:
Manage variables and styles with batch actions and better control.

Suggested UI emphasis:
- comprehensive CRUD
- batch actions
- easier maintenance at scale

---

### 4. Import / Export
Cipher supports round-trip workflows between Figma and code.

Users can export ready-to-use CSS files with a predefined token structure, make changes in code, and then import those files back into Cipher to update the token table in Figma.

This makes Cipher useful not only for generating tokens, but also for maintaining alignment between design and implementation over time.

Suggested short version:
Export token files for code, then import them back to keep Figma and code aligned.

Suggested UI emphasis:
- round-trip workflow
- predefined CSS structure
- update Figma from code changes