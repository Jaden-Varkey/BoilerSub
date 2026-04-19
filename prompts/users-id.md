# `/users/[id]` Prompt

```text
Responsive public user profile page for BoilerSub, matching the BoilerSub marketplace design system.

Goal:
Create the page where one Purdue student can view another user’s public profile from a listing. The page should build trust and context while remaining clean, selective, and marketplace-focused.

Core Function:
Display a public-facing user profile with name, bio, verification cues, and their active listings.

Required Elements:
- Persistent authenticated top navigation
- Profile header with avatar placeholder, user name, and public verification indicators
- Short public bio section
- Clear but restrained trust cues showing this is a verified BoilerSub member if applicable
- Listings section showing that user’s active subleases using reusable listing cards
- Strong heading such as “Listings by [Name]” or similar
- Empty state if user has no active listings
- Linkage back into browsing or listing details

Content Rules:
- This page should help users trust the person behind the listing
- It should not expose private account detail
- Keep it curated and selective rather than overloaded
- The profile should feel human and marketplace-relevant

Visual Style:
- Match the BoilerSub editorial premium system
- Human-centered, clean, trustworthy, modern
- Use layered surfaces and spacing instead of dividers
- Avoid generic social-profile or directory-profile templates

Branding and Colors:
- Off-white / bone base
- Muted Purdue-inspired gold for grounding and identity accents
- Electric blue for interactive elements
- Kinetic coral only for small energetic accents when appropriate

Typography:
- Plus Jakarta Sans for name, section titles, and major emphasis
- Manrope for bio, metadata, and listing support text

Layout Guidance:
- Desktop: profile intro followed by listings section with strong visual rhythm
- Mobile: stacked profile-first layout with clear transition into listings
- Keep the focus on trust + active listings

Optional Supporting Detail:
- Include a subtle Purdue trust message like “Verified BoilerSub member”
- Add a compact count of active listings if useful

Accessibility:
- Clear hierarchy and readable bio text
- Strong contrast and tap-friendly listing cards
- Good spacing across mobile and desktop

Platform:
Responsive web for both desktop and mobile
```
