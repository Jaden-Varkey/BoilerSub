# `/verify-email` Prompt

```text
Responsive email OTP verification page for BoilerSub, matching the existing BoilerSub landing page and signup page design system.

Goal:
Create the page users see immediately after signing up. This page should collect the 6-digit verification code sent to the user’s Purdue email and move them into the next step of the onboarding flow. It should feel premium, focused, and highly trustworthy.

Core Function:
Verify the user’s Purdue email with a 6-digit OTP code.

Required Elements:
- Persistent BoilerSub branding at the top, visually consistent with the landing page and signup page
- Optional minimal top navigation or a simplified auth header
- Strong page heading like “Verify your Purdue email”
- Supporting copy explaining that a 6-digit code was sent to the user’s Purdue inbox
- Display the user’s email address in a clear but elegant way
- OTP input area with 6 separate input boxes or a refined grouped code-entry component
- Primary CTA button: “Verify Email”
- Secondary action: “Resend Code”
- Countdown or disabled resend state area
- Small back or change-email action if appropriate
- Helper text indicating that the next step is phone verification
- Error state for incorrect or expired code
- Loading / verifying state for the submit button

Content Rules:
- Messaging should be calm, clear, and student-focused
- Reinforce that BoilerSub is Purdue-only and verification is part of keeping the marketplace trusted
- The page should feel like a secure onboarding checkpoint, not a generic OTP screen

Visual Style:
- Match the existing BoilerSub brand direction exactly
- Editorial, premium, clean, glassmorphic, high-trust
- More focused and minimal than the landing page
- Avoid generic centered OTP templates with plain white cards
- Use layered surfaces, subtle blur, soft ambient shadows, and tonal depth instead of hard borders
- Preserve a modern kinetic feel without making the verification task visually noisy

Branding and Colors:
- Off-white / bone background
- Muted Purdue-inspired gold for grounding accents
- Electric blue for primary actions, active input states, and verification emphasis
- Kinetic coral only for urgency or error emphasis
- Inputs should feel polished and premium, not default form controls

Typography:
- Plus Jakarta Sans for headline and key emphasis
- Manrope for supporting text, labels, helper text, and actions
- Use a bold editorial headline with calm supporting copy

Layout Guidance:
- Desktop: centered or slightly asymmetrical OTP module with surrounding breathing room
- Mobile: compact but comfortable code-entry experience with large touch-friendly OTP inputs
- The page should visually connect to signup and make the flow feel continuous

Optional Supporting Detail:
- Include a subtle trust panel or caption such as “Verified Purdue students only”
- Add a small progress indicator showing this is step 2 in the onboarding flow

Accessibility:
- Large touch-friendly OTP boxes
- Strong contrast for text and actions
- Clear focus state on each OTP input
- Clear error message and resend state
- Mobile-first usability for fast code entry

Platform:
Responsive web for both desktop and mobile
```
