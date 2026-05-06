# Security Specification for Habitly

## Data Invariants
- Use UUIDs/Auto-generated IDs for all entities.
- `userId` must always match `request.auth.uid`.
- `date` in `HabitLog` must be in `YYYY-MM-DD` format.
- `habitLogs` can only be created/updated for habits that belong to the user.
- Futures logs are restricted? The prompt says "Bloqueio de Futuro: Não é permitido registrar hábitos em datas futuras." I'll implement this by comparing the `date` string with the server date.

## The Dirty Dozen Payloads (to be blocked)
1. Write habit with someone else's `userId`.
2. Update someone else's habit.
3. Create habit log with a future date.
4. Create habit log for a habit you don't own.
5. Update habit log to set a negative count.
6. Delete someone else's habit.
7. Read all users' profiles.
8. Injection in document IDs.
9. Excessively large strings in habit names.
10. Spoofing `createdAt`/`updatedAt` with client values instead of server timestamp.
11. Modifying `userId` of an existing habit.
12. Creating a habit without selecting any frequency days.

## Test Cases
- Verify owner access to their own data.
- Verify denial for cross-user data access.
- Verify data validation (types, sizes).
- Verify server timestamp enforcement.
