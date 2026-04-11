# `/login` Prompt

```text
Responsive login page for BoilerSub, matching the existing BoilerSub landing page and the full onboarding design system.

Goal:
Create the returning-user login page for BoilerSub. This page should feel premium, secure, and visually consistent with the rest of the product while being simpler and more direct than the signup and verification flow.

Core Function:
Allow returning Purdue users to sign in with email and password and continue into the marketplace or return to pending verification if needed.

Required Elements:
- BoilerSub branding at the top, consistent with the landing page and auth flow
- Minimal auth header or simplified top navigation
- Strong page heading like “Welcome back to BoilerSub”
- Supporting text explaining that users can sign in to continue browsing or managing subleases
- Email input field
- Password input field
- Primary CTA button: “Log In”
- Secondary text link: “Don’t have an account? Sign up”
- Optional “Forgot password?” style utility link placement, even if inactive for now
- Inline error state for invalid credentials
- Loading state for login submission
- Optional trust/supporting note reminding users that BoilerSub is Purdue-only
- A layout that can gracefully redirect partially verified users back into the verification flow

Content Rules:
- Messaging should feel calm, premium, and campus-specific
- Avoid generic corporate SaaS copy
- Make the sign-in experience feel fast and trusted
- Reinforce Purdue-only access without overloading the page

Visual Style:
- Match the BoilerSub landing page and auth screens exactly
- Editorial, premium, modern, glassmorphic, high-trust
- More restrained than the homepage, but still visually designed and distinctive
- Avoid generic centered login cards or default auth templates
- Use tonal layering, soft ambient shadows, subtle blur, and premium spacing
- Preserve the BoilerSub identity rather than making it feel like a generic productivity app

Branding and Colors:
- Off-white / bone background
- Muted Purdue-inspired gold for grounding accents
- Electric blue for primary actions and focus states
- Kinetic coral only for error or urgency states
- Surface layering should replace heavy borders or rigid boxes

Typography:
- Plus Jakarta Sans for the main heading and key highlighted phrases
- Manrope for body text, labels, helper text, and utility links
- Heading should feel editorial and confident, not plain dashboard UI

Layout Guidance:
- Desktop: asymmetrical or split composition is preferred, with a strong branded content area and a focused login form
- Mobile: stacked layout with large tap targets and clear spacing
- The page should connect visually to signup so the auth system feels unified

Optional Supporting Detail:
- Add a side panel or subtle block reinforcing:
  - Purdue-only sublease marketplace
  - Verified student community
  - Fast access to browse and manage listings
- Include a visual suggestion that this is the gateway into the live marketplace

Accessibility:
- Strong contrast for text and controls
- Clear labels for all fields
- Large tap targets and mobile-friendly spacing
- Clear focus states and error messages
- Password visibility toggle if appropriate

Platform:
Responsive web for both desktop and mobile
```
