# `/signup` Prompt

```text
Responsive sign up page for BoilerSub, a Purdue-only student sublease marketplace, designed to match the existing BoilerSub landing page.

Goal:
Create the account creation page immediately after the landing page. It should feel like part of the same product system: editorial, premium, kinetic, modern, and Purdue-specific, while being clearer and more form-focused than the homepage.

Core Function:
This page is for first-time users to register with a Purdue email and password before entering the OTP verification flow.

Required Elements:
- Persistent top navigation consistent with the landing page branding
- BoilerSub wordmark and subtle link back to home
- Centered or slightly asymmetrical sign up form container
- Clear page heading like “Create your BoilerSub account”
- Supporting text explaining this is only for Purdue students
- Form fields:
  - Purdue email address
  - Password
  - Confirm password
- Primary CTA button: “Create Account”
- Secondary text link: “Already have an account? Log in”
- Small trust/verification note explaining Purdue-only access and email/phone verification
- Inline validation states for invalid Purdue email, weak password, and mismatched passwords
- Success-ready layout that can naturally transition to email OTP verification next

Content Rules:
- Email must clearly indicate `@purdue.edu` only
- Password messaging should communicate minimum requirements
- Copy should feel concise, confident, and student-focused
- The page should feel trustworthy and exclusive, not corporate or generic

Visual Style:
- Match the existing landing page exactly in brand tone and visual language
- Editorial, high-trust, glassmorphic, premium, asymmetrical where appropriate
- More restrained than the landing page hero, but still visually distinctive
- Use tonal layering instead of borders
- Use soft ambient shadows, glass surfaces, and subtle gradients
- Avoid generic boxed auth screens or default SaaS layouts

Branding and Colors:
- Off-white / bone background
- Muted Purdue-inspired gold as brand anchor
- Electric blue for primary actions and focus states
- Kinetic coral only for urgency or important highlights
- Surface blocks should use layered neutrals with soft contrast
- Focus states should use the ghost-border behavior from the design system

Typography:
- Plus Jakarta Sans for headline and key callouts
- Manrope for form labels, helper text, and body copy
- Heading should feel bold and editorial, not plain dashboard-style
- Small uppercase supporting label above the form is welcome

Layout Guidance:
- Desktop: a split or asymmetrical composition is preferred, such as a strong branded text panel on one side and the form on the other
- Mobile: stacked layout with preserved visual hierarchy and generous spacing
- Keep the form highly usable while retaining the premium BoilerSub identity

Optional Supporting Detail:
- Add a short side panel or visual block highlighting “Purdue-only access”, “Verified students”, and “Secure sublease flow”
- This should reinforce trust without distracting from the form

Accessibility:
- Strong text contrast
- Large tap targets
- Clear labels and validation messaging
- Mobile-friendly spacing and input sizing

Platform:
Responsive web for both desktop and mobile
```
