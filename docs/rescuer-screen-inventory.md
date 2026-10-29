# Rescuer screen inventory

| Source route | Native route | Main content and interactions | Data / native requirements |
| --- | --- | --- | --- |
| `/rescuer` | `/(tabs)` | Shift status, team availability, active mission, team metrics, recent outcomes | Team, active assignments, stats, history; pull to refresh; availability mutation |
| `/rescuer/assignments` | `/(tabs)/assignments` | Pending, active, and completed assignment lists | Active assignments and rescue history; tap opens assignment details |
| `/rescuer/assignments/:id` | `/assignment/:id` | Incident brief, ordered progress, accept/decline, map, rescue record, dispatch facts, timeline | Assignment detail, report photo, record, history; foreground location, phone link, map gestures |
| `/rescuer/incidents/:id/record` | `/assignment/:assignmentId/record` | Rescued/injured/evacuated/missing counts, actions, assets, notes, photos; draft/final save | GET/POST/PUT record; camera and photo library; multipart upload; read-only after resolution |
| `/rescuer/incidents/:id/completion` | `/assignment/:assignmentId/completion` | Timing/team, outcome counts, action/resource/notes, photo review, completion submit, PDF | Record summary, completion POST, PDF download/share |
| `/rescuer/history` | `/(tabs)/history` | Team totals, date/type filters, paginated completed missions | Stats and history query parameters; validates date order |
| `/rescuer/profile` | `/(tabs)/team` | Team/base/coverage, contact number, availability, members | Team profile GET/PUT and active assignment lock |
| `/rescuer/notifications` | `/(tabs)/notifications` | Notification list, read state, read all | Notification endpoints; push tap routes to assignment when `assignment_id` exists |

## Shared UI

- Kalinga header with theme, notification, and account actions.
- Dark/light palettes and rounded panel controls.
- Floating four-tab navigation: Home, Assignments, History, Team.
- Shared loading, empty, and error states.
- App-level session restore and server role gate.

## Visual states still to compare

Loading, empty, server error, pending response, decline-reason validation, every mission status, unavailable/denied location, no incident coordinates, incomplete rescue record, saved photos, resolved read-only record, invalid history filters, notifications, and light theme require device screenshot evidence before the visual exit criterion can be marked complete.
