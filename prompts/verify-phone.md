# `/verify-phone` Prompt

```text
Responsive phone verification page for BoilerSub, matching the existing BoilerSub landing page, signup page, and email verification page design system.

Goal:
Create the next onboarding step after email verification. This page should collect the user’s US phone number, send the SMS verification code, and prepare them for final phone OTP verification. It should feel secure, premium, and visually consistent with the BoilerSub brand.

Core Function:
Allow the user to enter a US phone number in `+1` format and trigger the SMS OTP flow.

Required Elements:
- BoilerSub branding at the top, visually aligned with prior onboarding pages
- Minimal auth header or simplified top navigation
- Strong page heading like “Verify your phone number”
- Supporting text explaining that phone verification is required to keep the Purdue sublease marketplace trusted and student-only
- Phone number input with clear US `+1` prefix treatment
- Input guidance for valid 10-digit US number format
- Primary CTA button: “Send Code”
- Secondary helper text explaining that the next screen will ask for the SMS code
- Inline validation for invalid phone number format
- Error state and loading state for the send action
- Optional back action to return to the previous onboarding step
- Optional small progress indicator showing this is the next verification step

Content Rules:
- Messaging should emphasize trust, safety, and verified participation in the marketplace
- Keep copy concise and direct
- Explain that the number is used only for verification and account security
- Avoid making the page feel like a generic telecom or banking screen

Visual Style:
- Must match the BoilerSub brand language from the existing landing page
- Editorial, premium, modern, calm, high-trust, slightly kinetic
- Cleaner and more focused than the landing page, but still distinctive
- Use glassmorphism, tonal layering, and soft depth
- No hard gray outlines or generic auth-card styling
- Inputs should feel custom, polished, and branded

Branding and Colors:
- Off-white / bone background
- Muted Purdue-inspired gold as a grounding accent
- Electric blue for primary CTA, focus states, and active controls
- Kinetic coral only for warnings or urgency
- Layered surfaces rather than outlined boxes

Typography:
- Plus Jakarta Sans for the main heading and emphasized phrases
- Manrope for labels, body text, helper text, and form guidance
- The heading should feel bold and editorial, not plain utility UI

Layout Guidance:
- Desktop: form-focused composition with premium spacing, possibly asymmetrical with a supporting trust panel
- Mobile: stacked layout with large input and button targets, comfortable spacing, and fast completion
- The page should clearly feel like part of the same multi-step onboarding sequence

Optional Supporting Detail:
- Add a small supporting block with trust signals such as:
  - Verified Purdue students
  - Secure sublease marketplace
  - Phone used only for verification
- A subtle visual cue that the SMS code step comes next

Accessibility:
- High contrast text and buttons
- Large touch-friendly phone input and CTA
- Clear focus styles
- Clear validation and helper messaging
- Mobile-friendly spacing and interaction patterns

Platform:
Responsive web for both desktop and mobile
```
