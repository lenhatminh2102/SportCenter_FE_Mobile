# Google Sign-In + email OTP

Set EXPO_PUBLIC_API_URL in .env to the backend reachable from your device. Android emulator uses http://10.0.2.2:5000; a phone needs the computer LAN IP.

Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to the OAuth Web client matching backend GOOGLE_CLIENT_ID. Authorize the exact web origin in Google Cloud (preview: http://localhost:8083). Restart Expo after changes. No client secret belongs in the app.

Android needs an OAuth Android client with the correct package and signing SHA-1. iOS also needs EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID; app.config.ts derives its reversed URL scheme. Native Google Sign-In needs a development build, not Expo Go.

Use the newer SportCenter-BE supplied on 2026-10-17. Configure GOOGLE_CLIENT_ID, GOOGLE_OTP_CHALLENGE_SECRET and backend SMTP settings, including SMTP_USER / SMTP_PASS. Check backend mail configuration for host, port and sender. Never put SMTP credentials in EXPO_PUBLIC variables.

## Sequence

1. POST /api/auth/google with {idToken} from Google.
2. Verified accounts return data.token / data.user. Unverified accounts return top-level requiresOTP:true and data.email / data.challengeToken; no session is created yet.
3. /verify-otp sends POST /api/auth/google/verify-otp with {challengeToken,otp}. Six digits preserve leading zeroes.
4. Only a returned session and successful GET /api/auth/me allow sign-in and role-based routing.
5. Resend repeats /api/auth/google with the ID token kept in memory. Cooldown is 60 seconds, expiration 5 minutes, with server 429 handling. Backend enforces attempts.

Challenges and ID tokens remain in memory, never route parameters or persistent storage. Reloading restarts sign-in. Ordinary email/password registration does not send OTP in this backend; Google OTP does not reset passwords.

## Validation

85 mocked API/permission/dashboard tests cover challenge parsing, OTP payloads and invalid/expired/resend errors. Lint and TypeScript pass. Real Google OAuth and email delivery still require client IDs and working backend SMTP; mocked tests do not prove delivery. Native device testing remains necessary.

## Design source

The supplied src.zip PublicPages.tsx and index.css inform the cream/orange home, rounded forms, black staff sidebar and warm cards. Unsplash photo URLs and credits come from that reference. Guest examples are labeled; signed-in classes come from backend data. Mobile forms use one column and staff navigation uses a drawer.
