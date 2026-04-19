# Design System Specification: The Academic Kinetic

## 1. Overview & Creative North Star
**Creative North Star: "The Kinetic Curator"**

This design system rejects the static, spreadsheet-like nature of traditional real-estate platforms. For the Purdue student community, we are moving beyond "utilitarian" into "aspirational editorial." The Kinetic Curator blends the prestige of Purdue’s heritage with the high-velocity energy of student life. 

We break the "template" look by utilizing **intentional asymmetry** and **tonal layering**. Instead of a rigid grid, think of the UI as a series of rhythmic overlaps—large, bold typography scales paired with fluid, glass-like containers. We are building a "Digital Magazine" for housing: high-energy, high-trust, and hyper-modern.

---

## 2. Colors & The New Purdue Palette
We take the foundational "Boiler Gold" and "Black" and inject them with high-octane accents to create a palette that feels electric.

### Color Logic
- **Primary (`#6a5a32`)**: A sophisticated, muted gold. This is our anchor of trust.
- **Secondary (`#0052d0`)**: "Electric Blue." Use this for primary actions to signal tech-forward energy.
- **Tertiary (`#a03a0f`)**: "Kinetic Coral." Used for high-energy highlights and urgency.
- **Surface & Background (`#f9f6f5`)**: An off-white, "bone" texture that feels more premium than pure white.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To define space, you must use background color shifts or tonal transitions. For example, a search bar should not have a grey outline; it should be a `surface-container-highest` shape sitting on a `surface` background.

### The "Glass & Gradient" Rule
To elevate the system, use **Glassmorphism** for floating elements (e.g., navigation bars or "Quick View" cards). 
- **Effect:** Use `surface-container-lowest` at 70% opacity with a `24px` backdrop-blur.
- **Signature Textures:** Apply subtle linear gradients to primary CTAs (Transitioning from `secondary` to `secondary_dim`) to add "soul" and depth.

---

## 3. Typography: Editorial Authority
We utilize two distinct sans-serifs to create a "Newsroom meets Tech Lab" aesthetic.

*   **Display & Headlines (Plus Jakarta Sans):** A high-character, modern sans-serif. Use `display-lg` for hero sections with tight letter-spacing (-0.02em) to create a bold, "stunning" impact.
*   **Body & Labels (Manrope):** A clean, geometric sans-serif optimized for readability. Its wide apertures ensure that even at `body-sm`, sublease details remain crisp.

**Hierarchy Strategy:** 
Pair a `display-md` headline with a `label-md` (All Caps, tracked out +10%) to create a sophisticated, high-end editorial contrast.

---

## 4. Elevation & Depth: Tonal Layering
We do not use structural lines. We use physics.

### The Layering Principle
Depth is achieved by "stacking" the surface-container tiers. 
- **Base Layer:** `surface`
- **Section Layer:** `surface-container-low` 
- **Card Layer:** `surface-container-lowest` (This creates a soft "lift" naturally).

### Ambient Shadows
When a floating effect is required (e.g., a "Book Now" drawer), use an **Ambient Shadow**:
- **Offset:** 0px 12px 32px
- **Color:** `on-surface` at 6% opacity. 
- *Note:* Never use pure black shadows. Shadows must be a tinted version of the surface color to feel integrated.

### The "Ghost Border" Fallback
If contrast is legally required for accessibility, use a **Ghost Border**: `outline-variant` at 15% opacity. Never use a 100% opaque border.

---

## 5. Components & Interaction

### Buttons
- **Primary:** `secondary` background, `on-secondary` text. Roundedness: `md` (0.75rem). Use a subtle gradient to `secondary_dim`.
- **Tertiary (Ghost):** No background, `primary` text. Interaction state: `surface-container-high` background on hover.

### Cards (The Sublease Tile)
- **Rule:** Forbid divider lines. 
- **Structure:** Use `surface-container-lowest` for the card body. Use `xl` (1.5rem) corner radius for a friendly, modern feel. Separate the "Price" from "Location" using a 24px vertical spacing gap rather than a line.

### Input Fields
- **Style:** "Plinth Style." No bottom line. A solid block of `surface-container-highest`.
- **States:** On focus, the background remains, but a 2px "Ghost Border" of `secondary` appears.

### The "Pulse" Chip
- For "Available Now" status, use a `tertiary_container` chip with `on-tertiary-container` text. Apply a `full` (9999px) roundedness.

### Relevant Custom Components
- **The "Vibe" Filter:** A horizontal scroll of glassmorphic chips (`surface-variant` at 40% blur) allowing students to filter by "Quiet," "Party-Friendly," or "Gym-Access."

---

## 6. Do’s and Don’ts

### Do:
- **Do** lean into asymmetry. A hero image can bleed off the right side of the screen while text is indented.
- **Do** use `display-lg` for numbers. If a sublease is $600, make the "600" massive and authoritative.
- **Do** use `secondary_container` for large background washes to break up long scrolling pages.

### Don't:
- **Don't** use 1px grey lines. They make the platform look like a legacy bank app.
- **Don't** use standard "Drop Shadows." If it looks like a shadow from 2010, it’s too heavy.
- **Don't** use `error` red for anything other than critical system failures. Use `tertiary` (Coral) for "Urgency" or "Low Stock" messages to keep the energy positive.

---

## 7. Accessibility Note
While we prioritize high-energy aesthetics, contrast ratios must never fall below 4.5:1 for body text. Use `on-surface-variant` for secondary text to ensure the "stunning" visuals remain inclusive to all Boilermakers.