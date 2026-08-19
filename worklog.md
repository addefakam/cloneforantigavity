---
Task ID: 3
Agent: Main Agent
Task: Implement Guest Communication, Group Booking Management, and Staff Activity Log features

Work Log:
- Updated Prisma schema: added GroupBooking, StaffLog, MessageTemplate, MessageLog models + 3 new enums
- Updated init-db.ts: added new enums, 4 CREATE TABLE statements, 7 foreign keys, migration for groupBookingId column, 17 indexes
- Generated Prisma client successfully
- Created /src/lib/staff-log.ts: fire-and-forget staff activity logger with getLogUserInfo helper
- Wired staff logging into checkin and checkout API endpoints
- Created 7 new API routes: group-bookings (GET/POST), group-bookings/[id] (GET/PUT/DELETE), staff-logs (GET), messages/templates (GET/POST), messages/templates/[id] (PUT/DELETE), messages/send (POST), messages/bulk-send (POST), messages/logs (GET)
- Added 11 new API client functions to api.ts
- Built 3 complete frontend pages: staff-logs-page.tsx, group-bookings-page.tsx, guest-communication-page.tsx
- Registered 3 new pages in sidebar (ALL_NAV_ITEMS + PERMISSION_PAGE_MAP) and page-renderer (lazy imports + PAGE_MAP)
- Fixed TypeScript compilation errors - all new files compile cleanly

Stage Summary:
- 3 new database tables: GroupBooking, StaffLog, MessageTemplate, MessageLog
- 7 new API endpoints with full CRUD operations
- 3 new sidebar navigation items: Group Bookings, Messages, Staff Activity
- 4 default message templates auto-seeded: Check-in Reminder, Welcome, Check-out Reminder, Reservation Confirmation
- Bulk SMS/WhatsApp send capability (simulated - needs external API integration)
- Staff activity auto-logged on checkin and checkout operations
- All new TypeScript files compile with zero errors

---
Task ID: 4
Agent: Main Agent
Task: Implement Notification Dispatch System for Police and Admin modules

Work Log:
- Updated ensure-tables.ts: added BroadcastPriority enum, NotificationBroadcast table, telegramChatId column on Provider
- Created /api/messages/broadcast/route.ts (GET): returns list of approved providers with contact info for broadcast targeting
- Created /api/notifications/broadcast/route.ts (GET/POST): broadcast history + send broadcast to all/selected providers
- Broadcast API supports 4 channels: In-App Notification, SMS, WhatsApp, Telegram
- Broadcast API supports 4 priority levels: LOW, NORMAL, HIGH, URGENT
- In-App channel creates real Notification records for all active users of each provider
- SMS/WhatsApp/Telegram channels are logged in NotificationBroadcast (external API integration needed for actual delivery)
- Added 3 API client functions: apiGetBroadcastProviders, apiSendBroadcast, apiGetBroadcastHistory
- Added 'notification-dispatch' to POLICE_NAV_ITEMS and SUPERUSER_NAV_ITEMS in sidebar.tsx
- Added Megaphone icon import to sidebar.tsx
- Added 'notification-dispatch' to police permissions for ADMIN, DETECTIVE, OFFICER ranks (not VIEWER)
- Built notification-dispatch-page.tsx: full compose form + provider selection + broadcast history with pagination
- Registered 'notification-dispatch' in page-renderer.tsx (lazy import + PAGE_MAP)

Stage Summary:
- New NotificationBroadcast table tracks all broadcast dispatches with delivery stats
- Police (OFFICER+) and Admin/Superuser can send broadcasts to all or selected providers
- Police VIEWER rank can view history but cannot send (read-only)
- 4 delivery channels: In-App (working), SMS/WhatsApp/Telegram (logged, need external API integration)
- 4 priority levels with visual indicators (LOW/NORMAL/HIGH/URGENT)
- Channel availability warnings shown in UI (e.g., '3 of 10 providers have Telegram configured')
- Provider list shows contact capabilities (phone, telegram, in-app user count)
- Broadcast history with pagination, delivery stats (sent/failed), and filter by date---
Task ID: 1
Agent: main
Task: Fix subscription tables not created on existing databases

Work Log:
- Identified root cause: init-db.ts skipped TABLES_SQL when User table already existed
- Subscription, SubscriptionPayment, SubscriptionPlan tables were only in TABLES_SQL
- On existing production DB, init-db ran only MIGRATIONS_SQL + INDEXES_SQL, skipping table creation
- Fixed both Strategy 1 (pg) and Strategy 2 (Prisma fallback) to always run TABLES_SQL + FKS_SQL
- Added SubscriptionPlan seeding to the existing-DB path
- Improved error message in my-subscription-page.tsx to show actual error
- Pushed fix to GitHub

Stage Summary:
- Root cause: init-db.ts optimization skipped new table creation on existing DBs
- Fix: Run all SQL blocks (TABLES, FKS, MIGRATIONS, INDEXES) since they use IF NOT EXISTS
- Committed as 8135cff and pushed to main
- Vercel will auto-deploy; subscription should work after redeployment
---
Task ID: 2
Agent: main
Task: Fix execViaPrisma DO block compatibility with Prisma

Work Log:
- Identified that Prisma $executeRawUnsafe cannot execute DO $$ ... END $$ PL/pgSQL blocks
- On Vercel, pg native module fails, falling back to Prisma path
- All ALTER TABLE ADD COLUMN/CONSTRAINT migrations used DO blocks with EXCEPTION handlers
- These silently failed, so configJson and other columns were never added
- Rewrote execViaPrisma with extractStatements() that unwraps DO blocks via regex
- Inner SQL runs individually; duplicate errors caught at JS level
- Tested regex against ENUMS, MIGRATIONS, FKS, and mixed SQL patterns
- Pushed as commit 83adb96

Stage Summary:
- Root cause: Prisma driver cannot execute anonymous PL/pgSQL DO blocks
- Fix: extractStatements() parses DO blocks, extracts inner SQL, runs individually
- This fixes configJson missing column AND all previous/future column migrations
- Vercel will auto-deploy; subscription should work after redeployment
---
Task ID: 3
Agent: main
Task: Fix warm instance schema staleness on Vercel

Work Log:
- Identified that Vercel warm instances cache _initDone=true from old code
- New deployments don’t re-run migrations on warm instances
- Rewrote db.ts with withSchemaRetry() wrapper around all Prisma calls
- Detects schema errors: "column does not exist", "relation does not exist", etc.
- On schema error: resets init flag, re-runs migrations, retries query once
- Added resetInitFlag() export to init-db.ts
- Guard against concurrent migration runs with _migrating flag
- Pushed as commit d73d1d6

Stage Summary:
- Root cause: _initDone=true cached in warm serverless instances
- Fix: db.ts auto-detects schema errors and triggers migration re-run
- Self-healing: any missing column/table gets fixed on first failed request
- No more dependency on cold starts for schema updates
