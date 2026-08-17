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
