---
Task ID: 1
Agent: main
Task: Block reserving rooms that are in RESERVED status

Work Log:
- Cloned repo from GitHub to /tmp/ghms-clone
- Fixed client-side filter in reservations-page.tsx line 261: changed `r.status === "AVAILABLE" || r.status === "RESERVED"` to `r.status === "AVAILABLE"`
- Added server-side validation in reservations API route.ts POST handler: after fetching the room, check if `room.status !== "AVAILABLE"` and return 409 error
- Pushed both fixes to GitHub

Stage Summary:
- Rooms with RESERVED status can no longer be selected for new reservations (both UI dropdown and API blocked)
- Two commits pushed: client-side filter fix + server-side validation