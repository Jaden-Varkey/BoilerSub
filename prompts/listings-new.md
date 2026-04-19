# `/listings/new` Prompt

```text
Responsive create listing page for BoilerSub, matching the existing BoilerSub landing page and authenticated product design system.

Goal:
Create the page where a fully verified Purdue student can publish a new sublease listing. The page should feel premium and guided, making listing creation feel easy, trustworthy, and well-structured rather than like filling out a generic admin form.

Core Function:
Allow a verified user to create a new listing with all required fields for the BoilerSub marketplace.

Required Elements:
- Persistent authenticated top navigation
- Editorial page heading like “List Your Sublease”
- Supporting copy that explains how to create a clear, attractive listing for Purdue students
- Fully structured branded form with fields for:
  - title
  - description
  - price
  - start date
  - end date
  - bedrooms
  - bathrooms
  - address
  - amenities multi-select chips
- Primary CTA button: “Publish Listing”
- Secondary action: “Cancel”
- Trust / verification note confirming only verified users can publish
- Inline validation and error messaging
- Loading state for submit
- Optional helper panel with tips for making a strong listing

Content Rules:
- The form should feel intentional and premium, not like a default internal dashboard form
- Guide users toward clarity and trust
- Make the listing process feel student-friendly and polished
- The page should balance creation utility with the BoilerSub editorial brand

Visual Style:
- Match the BoilerSub design language exactly
- Editorial, premium, modern, high-trust
- Use layered surfaces and spacing instead of divider lines
- Inputs should feel custom and branded, not browser-default
- Keep the page calm and structured, but still visually rich

Branding and Colors:
- Off-white / bone background
- Muted Purdue-inspired gold accents
- Electric blue for primary actions, focus, and selected states
- Kinetic coral only for urgency, warnings, or notable helper emphasis
- Multi-select chips and form surfaces should feel integrated into the brand system

Typography:
- Plus Jakarta Sans for page title and important emphasis
- Manrope for field labels, helper text, body copy, and button labels
- The page title should feel bold and editorial

Layout Guidance:
- Desktop: form plus optional supporting sidebar or guidance panel
- Mobile: single-column stacked form with large tap targets and clear section spacing
- Ensure form completion feels smooth and not overwhelming on smaller screens

Optional Supporting Detail:
- Add a checklist or tip area such as “Great listings include pricing clarity, move-in timing, and top amenities”
- Reserve visual space for future image upload or media support

Accessibility:
- Clear labels and helper text
- Strong contrast and focus states
- Large mobile-friendly form controls
- Error messaging that is easy to parse

Platform:
Responsive web for both desktop and mobile
```
