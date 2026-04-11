# `/listings/[id]/edit` Prompt

```text
Responsive edit listing page for BoilerSub, matching the create listing page and the full BoilerSub product design language.

Goal:
Create the owner-only edit page for an existing listing. This page should feel like a refined continuation of the create-listing experience, with pre-populated fields and strong confidence that the user is updating a live listing in a premium marketplace.

Core Function:
Allow the owner of a listing to update listing details and save changes.

Required Elements:
- Persistent authenticated top navigation
- Page heading like “Edit Listing”
- Supporting text that communicates the user is updating an active listing
- Pre-populated branded form with all listing fields:
  - title
  - description
  - price
  - start date
  - end date
  - bedrooms
  - bathrooms
  - address
  - amenities
- Primary CTA button: “Save Changes”
- Secondary action: “Cancel”
- Optional tertiary or danger action placement for delete if desired
- Inline validation states and error handling
- Loading and saving states
- Optional helper note about keeping listing details current

Content Rules:
- The page should clearly differentiate editing from creating while retaining the same visual system
- It should feel premium and owner-focused, not administrative or plain
- The experience should suggest control, trust, and polish

Visual Style:
- Match BoilerSub’s editorial premium product system
- Use the same form language as create listing
- Soft surfaces, tonal hierarchy, no heavy border-based forms
- Avoid generic CRUD editor visuals

Branding and Colors:
- Off-white / bone surfaces
- Purdue-inspired muted gold accents
- Electric blue for primary actions and focus states
- Kinetic coral only for warning or destructive emphasis

Typography:
- Plus Jakarta Sans for page heading and major emphasis
- Manrope for labels, form content, helper text, and actions

Layout Guidance:
- Desktop: same structure as create listing with optional guidance or status sidebar
- Mobile: stacked prefilled form with clear save action and strong spacing
- Keep save/cancel actions always understandable and easy to reach

Optional Supporting Detail:
- Add subtle status messaging such as “Your listing is live” or “Changes update instantly after save”
- Include a compact owner summary or listing preview block if helpful

Accessibility:
- Clear labels and focus states
- Strong error visibility
- Mobile-friendly controls and spacing
- Distinct styling for destructive actions

Platform:
Responsive web for both desktop and mobile
```
