# `/profile/listings` Prompt

```text
Responsive My Listings page for BoilerSub, matching the authenticated BoilerSub marketplace design language.

Goal:
Create the current-user listings management page where a user can review, edit, and delete their own listings. The page should feel like a premium owner dashboard without turning into a sterile admin table.

Core Function:
Show all listings created by the current user with clear owner actions and a path to create new listings.

Required Elements:
- Persistent authenticated top navigation
- Strong page heading like “My Listings”
- Supporting copy explaining this is the user’s active listing management area
- Reusable listing rows or cards showing:
  - title
  - price
  - date range
  - location
  - status if relevant
- Inline actions on each listing: “Edit” and “Delete”
- “Create New Listing” primary CTA
- Empty state for users with no listings, including encouraging call to action
- Confirmation-friendly delete action pattern
- Optional summary count or lightweight owner stats

Content Rules:
- The page should feel like an elevated marketplace management surface, not an internal CMS
- Keep ownership and action clarity high
- Make it easy to scan, act, and create

Visual Style:
- Match the BoilerSub editorial premium system
- Avoid plain tables unless heavily stylized
- Use tonal hierarchy, spacing, soft surfaces, and strong action clarity
- Keep the page practical but still branded and visually intentional

Branding and Colors:
- Off-white / bone background
- Muted Purdue-inspired gold for grounding accents
- Electric blue for primary and edit actions
- Kinetic coral for delete warnings or urgent status accents

Typography:
- Plus Jakarta Sans for heading, counts, and primary emphasis
- Manrope for metadata, action labels, and supporting text

Layout Guidance:
- Desktop: card list or editorial management grid with clear action zones
- Mobile: stacked listing cards with tap-friendly edit/delete actions and visible create CTA
- Ensure the empty state still feels premium and branded

Optional Supporting Detail:
- Include a small owner summary such as total listings or active listing count
- Reserve room for future analytics or listing performance insights

Accessibility:
- Clear action separation
- Strong contrast for edit vs delete
- Mobile-friendly action sizing
- Readable metadata and empty-state content

Platform:
Responsive web for both desktop and mobile
```
