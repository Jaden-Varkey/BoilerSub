# `/verify-phone/code` Prompt

```text
Responsive phone OTP verification page for BoilerSub, matching the existing BoilerSub landing page and all previous onboarding screens.

Goal:
Create the final onboarding verification page where the user enters the 6-digit SMS code sent to their phone. This page completes account verification and should feel polished, secure, and clearly like the last step before entering the product.

Core Function:
Verify the user’s phone number with a 6-digit SMS OTP code and complete the BoilerSub account setup.

Required Elements:
- BoilerSub branding at the top, visually aligned with the landing page and previous auth pages
- Minimal auth header or simplified top navigation
- Strong page heading like “Enter your verification code” or “Verify your phone”
- Supporting text explaining that a 6-digit code was sent to the provided phone number
- Display the phone number in an elegant masked format
- OTP input area with 6 separate input boxes or a refined grouped entry component
- Primary CTA button: “Verify Phone”
- Secondary action: “Resend Code”
- Countdown / resend timer area
- Error state for incorrect, expired, or invalid code
- Loading / verifying button state
- Optional back action to return to phone entry
- Clear success-ready layout that transitions naturally into the listings experience
- Optional small progress indicator showing this is the final verification step

Content Rules:
- Messaging should reinforce that BoilerSub is a trusted Purdue-only marketplace and this is the final step
- Copy should be concise, calm, and confidence-building
- Make the page feel like a completion checkpoint rather than a generic OTP form

Visual Style:
- Match the BoilerSub brand system exactly
- Editorial, premium, glassmorphic, modern, high-trust
- More focused and minimal than the homepage, but still branded and distinctive
- Avoid generic OTP templates and plain white auth cards
- Use layered surfaces, soft blur, ambient shadows, and tonal depth
- Keep the experience visually clean so the task remains fast and clear

Branding and Colors:
- Off-white / bone background
- Muted Purdue-inspired gold accents
- Electric blue for primary CTA, active OTP inputs, focus states, and success-forward emphasis
- Kinetic coral only for urgency or verification errors
- Use tonal surfaces instead of heavy borders

Typography:
- Plus Jakarta Sans for the heading and key emphasis
- Manrope for helper text, labels, error states, and actions
- Use a bold but elegant editorial hierarchy

Layout Guidance:
- Desktop: centered or slightly asymmetrical verification module with premium spacing
- Mobile: large touch-friendly OTP inputs, stacked actions, clear hierarchy, and quick completion
- The page should visually signal that the user is one step away from entering the marketplace

Optional Supporting Detail:
- Include a subtle line such as “Final step before browsing listings”
- Add a compact trust badge or completion note like “Verified Purdue students only”
- You may include a visual success-forward cue to suggest progress completion

Accessibility:
- Large, touch-friendly OTP inputs
- High contrast for all text and buttons
- Strong visible focus states
- Clear resend state and error messaging
- Fast, easy code entry on mobile devices

Platform:
Responsive web for both desktop and mobile
```
