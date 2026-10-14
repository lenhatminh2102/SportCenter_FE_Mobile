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
