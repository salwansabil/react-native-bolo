<wizard-report>
# PostHog post-wizard report

The wizard has completed a full PostHog integration for the Bolo language-learning app (Expo / React Native). The SDK is installed and configured via `expo-constants`, a `PostHogProvider` wraps the app in the root layout, screen tracking fires automatically on route changes, user identity is synced with Clerk, and 12 custom events are instrumented across the auth, onboarding, language-selection, and home flows.

## Files created or modified

| File | Change |
|------|--------|
| `app.config.js` | Created — converts `app.json` to dynamic config; exposes `posthogProjectToken` and `posthogHost` via `extra` |
| `src/config/posthog.ts` | Created — PostHog client singleton configured via `expo-constants` |
| `src/app/_layout.tsx` | Added `PostHogProvider`, screen tracking via `usePathname`/`useGlobalSearchParams`, and `PostHogClerkSync` component |
| `src/app/onboarding.tsx` | Captures `onboarding_get_started_pressed` |
| `src/components/auth-screen.tsx` | Captures sign-up, sign-in, social auth, completion, and error events; `captureException` on thrown errors |
| `src/app/language-selection.tsx` | Captures `language_confirmed` with language name and whether it's a first selection |
| `src/app/(tabs)/home.tsx` | Captures `continue_learning_pressed`, `view_all_lessons_pressed`, `ai_video_call_started` |
| `.env` | Created with `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` |

## Events instrumented

| Event name | Description | File |
|------------|-------------|------|
| `onboarding_get_started_pressed` | User tapped the Get Started button on the onboarding screen, entering the sign-up funnel. | `src/app/onboarding.tsx` |
| `sign_up_submitted` | User submitted their email and password to begin the sign-up flow. | `src/components/auth-screen.tsx` |
| `sign_in_submitted` | User submitted their email to receive a sign-in code. | `src/components/auth-screen.tsx` |
| `sign_up_social_initiated` | User tapped a social auth button (Google, Facebook, Apple) on the sign-up screen. | `src/components/auth-screen.tsx` |
| `sign_in_social_initiated` | User tapped a social auth button (Google, Facebook, Apple) on the sign-in screen. | `src/components/auth-screen.tsx` |
| `sign_up_completed` | User successfully verified their email and completed account creation. | `src/components/auth-screen.tsx` |
| `sign_in_completed` | User successfully verified their code and completed sign-in. | `src/components/auth-screen.tsx` |
| `auth_error_occurred` | An authentication error was displayed to the user during sign-up or sign-in. | `src/components/auth-screen.tsx` |
| `language_confirmed` | User tapped Continue to confirm their chosen learning language. | `src/app/language-selection.tsx` |
| `continue_learning_pressed` | User tapped the Continue button on the home screen to resume their current lesson. | `src/app/(tabs)/home.tsx` |
| `ai_video_call_started` | User tapped the play button to start an AI video call practice session. | `src/app/(tabs)/home.tsx` |
| `view_all_lessons_pressed` | User tapped View All from the Today's Plan section to see all lessons. | `src/app/(tabs)/home.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/499000/dashboard/1841347)
- [Signup & Sign-in funnel (wizard)](https://us.posthog.com/project/499000/insights/C7lzIbxN)
- [Daily active learners (wizard)](https://us.posthog.com/project/499000/insights/gH6uXR8q)
- [Language selections (wizard)](https://us.posthog.com/project/499000/insights/G2fXQscV)
- [Auth method breakdown (wizard)](https://us.posthog.com/project/499000/insights/1VT9x3Y2)
- [Auth errors over time (wizard)](https://us.posthog.com/project/499000/insights/FnpRDk7z)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` to `.env.example` and any onboarding scripts so collaborators know what to set.
- [ ] Confirm the returning-visitor path also calls `identify` — the `PostHogClerkSync` component in `_layout.tsx` handles this on every app load, but verify it fires correctly for users who are already signed in when they open the app.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
