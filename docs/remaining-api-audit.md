# Remaining backend integration audit

Source: SportCenter-BE supplied 2026-10-17. Google credentials deferred.

- Rooms: list/detail; manager create/update/delete.
- Schedules now require roomId. Courses require nonnegative price.
- Notifications: list/read state; staff create.
- Support: list; members create with own profile; manager/receptionist resolve.
- Payments: list/create/update method; member VNPay and mock simulation.
- VNPay return/IPN remain backend callbacks, never client success claims.

Broad list responses require server authorization hardening; frontend scopes member and notification views to the signed-in user for presentation only.

## Completed scope

19 client operations added: rooms (5), notifications (3), support requests (3), payments including VNPay/mock requests (5), coach profile/students/teaching schedules (3). Payment update supports MEMBER as well as CENTER_MANAGER/RECEPTIONIST in the supplied routes. Backend gateway callbacks are not client requests.

Manual validation: sign in as MEMBER, complete /profile, register a class, create a payment request, verify server amount and pending status, open sandbox checkout and reload status. Sign in as manager to create rooms, choose them in schedules, set course tuition, send an in-app notification and resolve support. Sign in as coach to check scoped teaching schedules/students. Use separate test users to verify own-record UI filters. Never treat these UI filters as backend authorization.
