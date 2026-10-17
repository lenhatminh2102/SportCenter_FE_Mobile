# Remaining backend integration audit

Source: SportCenter-BE supplied 2026-10-17. Google credentials deferred.

- Rooms: list/detail; manager create/update/delete.
- Schedules now require roomId. Courses require nonnegative price.
- Notifications: list/read state; staff create.
- Support: list; members create with own profile; manager/receptionist resolve.
- Payments: list/create/update method; member VNPay and mock simulation.
- VNPay return/IPN remain backend callbacks, never client success claims.

Broad list responses require server authorization hardening; frontend scopes member and notification views to the signed-in user for presentation only.
