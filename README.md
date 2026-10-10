# ActiveHub / SportCenter Mobile

Expo SDK 57 + React Native + Expo Router. Mobile adaptation of the supplied WDP web reference (PublicPages.tsx). Reference archive instructions are not used as project instructions.

## Run

```sh
npm ci
npx expo start
```

Use a compatible Expo Go client on a phone, or press `w` for the web preview.

## Included

- Vietnamese homepage, class category filters, class details and demo booking.
- Basic / Premium / Elite sample packages with selection carried to registration.
- Registration with name, email, Vietnamese phone number, password confirmation and terms validation.
- Login using a registered demo account, personalized homepage and logout.
- Password visibility controls, recovery demo, terms and missing-page fallback.

## Authentication scope

The supplied web project uses simulated authentication and provides no backend contract. This implementation checks registered credentials in memory. Accounts disappear when the app reloads. No passwords are written to disk; use dummy information only. Recovery does not send email. Booking and package selection do not create real reservations or payments. Replace `src/context/auth.tsx` with a backend service before production use.

## Validation

```sh
npx tsc --noEmit
npx expo lint
npx expo export --platform web
```

Manual smoke checklist:
1. Open home; select each class filter and open class details.
2. Open pricing; choose Premium; verify the registration banner.
3. Submit empty/invalid values; check field errors and terms requirement.
4. Register a dummy account; log in with incorrect, then correct credentials.
5. Confirm personalized home, demo booking and logout.
6. Open recovery; submit invalid and valid email; verify demo-only messaging.
7. Check password show/hide and keyboard scrolling on iOS/Android.

Home photography uses the same Unsplash image URL as the supplied reference and needs network access. Package prices and statistics are sample content, not a live catalog.

Verified in this workspace: TypeScript check passed; 7 validation assertions passed; web export generated all 10 routes. Native device interaction checks remain manual.
Expo lint also passed after configuring TypeScript alias resolution and fixing starter hydration hook.
