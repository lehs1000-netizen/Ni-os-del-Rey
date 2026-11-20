# Security Specification — Club Niños del Rey (Firestore)

## 1. Data Invariants
1. **PII Isolation**: Phone numbers and guardian names (`guardianName`, `guardianPhone`, `leader.phone`) are strictly isolated in `/clubs/{clubId}/private/contacts` and are ONLY accessible to verified admins (`lehs1000@gmail.com`) or verified club members (`/clubs/{clubId}/members/{uid}`).
2. **Public Club View vs Authenticated Writes**: Anyone opening the shared link can view non-PII club data (`isPublicClubData == true` and `clubId == 'ninos-del-rey'`) so all devices share the live roster, attendance, and scoreboard immediately. ALL write operations (`create`, `update`, `delete`) require a verified Google user (`request.auth != null && request.auth.token.email_verified == true`) who is either the Admin or a verified Club Member.
3. **Self-Assigned Role Prevention**: Collaborators joining `/clubs/{clubId}/members/{userId}` MUST set `role == 'collaborator'`, `uid == request.auth.uid`, and MUST provide either a matching `accessCode` verified server-side against `/clubs/{clubId}/private/config` OR have a pre-approved invite document in `/clubs/{clubId}/invites/{email}`.
4. **Terminal State Locking**: Once a `WeeklySession` reaches `status == 'completed'`, collaborators cannot mutate the session or its subcollections unless overridden by the Admin.
5. **Temporal Integrity & Immutability**: `createdAt` and `updatedAt` are strictly validated against `request.time`. Immutable IDs (`id`, `clubId`, `sessionId`, `createdAt`) cannot be modified on update.

## 2. The "Dirty Dozen" Attack Payloads (All MUST Return PERMISSION_DENIED)
1. **Unauthenticated Write**: Creating a child document without `request.auth`.
2. **Unverified Email Write**: Creating a child with `email_verified: false`.
3. **Shadow Field Injection**: Creating a child with an extra ghost field `isAdmin: true`.
4. **Role Escalation on Join**: Joining `/clubs/ninos-del-rey/members/{uid}` with `role: 'admin'`.
5. **Wrong Access Code**: Joining `/clubs/ninos-del-rey/members/{uid}` with an invalid `accessCode`.
6. **PII Scraping**: Reading `/clubs/ninos-del-rey/private/contacts` as an unauthenticated user or non-member.
7. **Secret Config Exposure**: Reading `/clubs/ninos-del-rey/private/config` as a non-admin collaborator.
8. **ID Poisoning**: Creating a document with an ID longer than 128 chars or containing invalid characters (`../hack`).
9. **String Exhaustion**: Creating a child with a 5,000-char `fullName`.
10. **Immutable Field Mutation**: Updating a child's `createdAt` or `clubId`.
11. **Timestamp Forgery**: Creating a session with client-forged `createdAt` instead of `request.time`.
12. **Blanket List Query**: Listing `/clubs/ninos-del-rey/children` without matching `clubId == 'ninos-del-rey'` and `isPublicClubData == true`.
