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

## Persons 2 and 3: 23 endpoints

Open Account → Lịch tập, khóa học & trung tâm to access all six groups. Every list uses real backend data, search, retry and pull-to-refresh. Manager accounts can create/update/delete; other authenticated roles can read, matching the supplied routes. Activity logs have list/create only.

| Group | Endpoints | Screen |
| --- | --- | --- |
| Coaches | GET/POST /api/coaches; PUT/DELETE /api/coaches/{id} | /workspace/coaches |
| Schedules | GET/POST /api/schedules; GET /api/schedules/my; PUT/DELETE /api/schedules/{id} | /workspace/schedules |
| Activity logs | GET/POST /api/activity-logs | /workspace/activity-logs |
| Subjects | GET/POST /api/subjects; PUT/DELETE /api/subjects/{id} | /workspace/subjects |
| Courses | GET/POST /api/courses; PUT/DELETE /api/courses/{id} | /workspace/courses |
| Lessons | GET/POST /api/lessons; PUT/DELETE /api/lessons/{id} | /workspace/lessons |

A MEMBER starts with personal schedules, with an option to view all schedules. Personal schedules only include confirmed registrations. Creating a coach requires the User ID of an existing COACH account. Lesson and schedule forms provide searchable selectors using GET /api/learning-paths, GET /api/classes and GET /api/lessons for related records. These read-only lookups do not implement the remaining groups' management flows.

Schedule input validates calendar dates (YYYY-MM-DD), 24-hour times and a later end time on the same day. Lesson order is sent as a positive integer. Deletion asks for confirmation and preserves backend conflict messages for referenced records. Role restrictions in UI supplement server authorization.

Run `npm test` for Auth/Members/operations contract tests with mocked responses. Swagger contracts were checked against the running local backend. Successful live writes with manager/member accounts and native-device interaction still require manual testing; no production data was changed during checks.
