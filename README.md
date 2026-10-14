# ActiveHub / SportCenter Mobile

Expo SDK 57, React Native and Expo Router. Vietnamese mobile homepage with registration and login connected to SportCenter API.

## Run

```sh
npm ci
# Copy .env.example to .env.local and configure the backend origin.
npx expo start
```

Set EXPO_PUBLIC_API_URL without /api or /api-docs:
- Web / iOS simulator: http://localhost:5000
- Android emulator: http://10.0.2.2:5000
- Physical phone: http://<computer-LAN-IP>:5000 on the same Wi-Fi; backend must accept LAN connections.

Restart Expo after changing environment settings. Without an override, web/iOS use localhost and Android uses 10.0.2.2. Use HTTPS for deployed environments.

## Authentication

- POST /api/auth/register sends email, password, role: MEMBER.
- POST /api/auth/login sends email/password and reads data.token.
- GET /api/auth/me sends Authorization: Bearer <token> and populates the homepage.
- Failed requests show server errors; requests time out after 15 seconds. Submission buttons are disabled while waiting.
- Token lives only in memory and is cleared on logout or reload. Passwords are not saved locally.
- Backend accepts only email/password/role for registration, so the form does not collect unsupported profile fields.

Package selection, class booking and recovery remain demo features. Registration does not purchase a package or send a recovery email. Homepage prices, classes and statistics remain sample content.

## Checks

```sh
npx tsc --noEmit
npx expo lint
```

Smoke flow: register a test account, log in, confirm homepage email, log out. Check wrong credentials, duplicate email and unavailable backend. Physical-device UI checks remain manual.

## Person 1: Auth and Members

All 11 endpoint adapters are connected to UI:

| Endpoint | UI |
| --- | --- |
| POST /api/auth/register | /register |
| POST /api/auth/login | /login |
| GET /api/auth/me | login validation and /account refresh |
| POST /api/auth/google | /login Google sign-in (OAuth setup required) |
| GET /api/members/me | /profile |
| POST /api/members/me | /profile when server returns 404 |
| PUT /api/members/me | /profile for existing profile |
| GET /api/members | /members, searchable directory |
| POST /api/members | /members/edit, manager/receptionist |
| PUT /api/members/{id} | /members/edit?id=..., manager/receptionist |
| DELETE /api/members/{id} | /members confirmation, manager only |

The directory refreshes on return from editing and supports pull-to-refresh. A protected 401 clears the matching session; a 403 displays a permission error. Backend remains responsible for enforcing authorization. New member profiles require an existing MEMBER userId; registration and member-profile creation are separate APIs.

### Google configuration

Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your OAuth Web Client ID (matching backend GOOGLE_CLIENT_ID). On web, authorize the exact browser origin (e.g. http://localhost:8082) in Google Cloud Console. The button uses Google Identity Services to obtain an ID token and exchanges it with /api/auth/google.

Native sign-in uses @react-native-google-signin/google-signin and needs a development build, not Expo Go. Android needs an OAuth Android client matching your app package and signing SHA-1 in the same Google Cloud project. iOS needs EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID; app.config.ts adds the corresponding reversed URL scheme. Configure app package/bundle identifiers for your own Google project before building. No client secret belongs in the app. Without Client IDs, the UI explicitly reports that Google is not configured; email authentication remains available.

Tests: node --test tests/auth-api.test.cjs. These verify API contracts and error/permission behavior with mocked responses. Live successful Google sign-in and native-device validation require the developer's OAuth configuration.
