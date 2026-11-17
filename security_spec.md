# Security Specification — Quiz Firestore Rules

## 1. Data Invariants

1. **Authenticated & Verified Access Only**: Every Firestore read and write requires `request.auth != null` and `request.auth.token.email_verified == true`.
2. **Strict Ownership & PII Isolation**: `/users/{userId}` documents contain personal progression and are readable/writable strictly by `request.auth.uid == userId`. No blanket `isSignedIn()` reads or public listing exist on `/users`.
3. **Master Gate on Subcollections**: `/users/{userId}/history/{entryId}` single-document operations (`get`, `create`, `delete`) verify parent `/users/{userId}` exists and belongs to `request.auth.uid` via `exists()`/`get()`. History `list` queries never call `get()`/`exists()` and strictly enforce `resource.data.userId == request.auth.uid`.
4. **Immutable Ownership & Creation Timestamps**: `userId`, `creatorUserId`, and `createdAt` cannot be modified after creation. All `createdAt` and `updatedAt` timestamps must strictly equal `request.time`.
5. **Action-Based Updates & Terminal State Locking**:
   - `/users/{userId}` updates only allow updating player metadata (`syncCode`, `playerName`, `countryCode`, `rivalCode`, `updatedAt`) or progression state (`userPoints`, `wins`, `losses`, `currentStreak`, `bestStreak`, `answeredCount`, `solvedIds`, `categoryStats`, `playerName`, `countryCode`, `rivalCode`, `syncCode`, `updatedAt`) with `isValidUserProfile(incoming())` wrapping the entire update block.
   - `/sharedChallenges/{shareId}` locks outcome updates once `creatorFinished == true`.
6. **Bounded Strings & Arrays**: Every string enforces `.size()` bounds; `solvedIds` enforces `size() <= 2000` and type checking. Every document ID enforces `isValidId()` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)

1. **Unauthenticated Profile Read**: Anonymous client attempts `get(/users/uid_alice)`.
2. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts `set(/users/uid_bob, validProfile)`.
3. **Cross-User Profile Hijack (Identity Spoofing)**: `uid_alice` attempts `create(/users/uid_alice, { userId: "uid_bob", ... })`.
4. **Cross-User Profile Read (PII / Progression Leak)**: `uid_alice` attempts `get(/users/uid_bob)`.
5. **Blanket Users List Scrape**: `uid_alice` attempts `list(/users)`.
6. **Shadow / Ghost Field Injection**: `uid_alice` attempts `create(/users/uid_alice, { ...validProfile, isAdmin: true })` or `update` with `affectedKeys` outside the allowlist.
7. **Resource / ID Poisoning (1KB+ ID)**: `uid_alice` attempts `create(/users/uid_alice/history/<200-char-id>, validEntry)`.
8. **Timestamp Forgery**: `uid_alice` attempts `create(/users/uid_alice, { ...validProfile, createdAt: "2020-01-01T00:00:00Z" })` instead of `request.time`.
9. **Orphaned Subcollection Entry**: `uid_alice` attempts `create(/users/uid_alice/history/e1, validEntry)` when parent `/users/uid_alice` does not exist.
10. **Unbounded or Malformed Array Injection**: `uid_alice` attempts `update(/users/uid_alice, { solvedIds: ["not-an-int"], updatedAt: request.time })`.
11. **Terminal State Bypass on SharedChallenge**: `uid_alice` attempts `update(/sharedChallenges/s1, { creatorWon: false, updatedAt: request.time })` after `creatorFinished == true`.
12. **History Immutability Tampering**: `uid_alice` attempts `update(/users/uid_alice/history/e1, { won: true, userPointsDelta: 99999 })`.
