# Rescuer API mapping

All calls use the configured Express API base URL and `Authorization: Bearer <Supabase access token>`. The API helper parses the server's JSON envelope and reports server errors. These paths and payloads were checked against the supplied backend source archive; no backend endpoint or schema was added.

| Workflow | Request | Contract used |
| --- | --- | --- |
| Resolve account role | `GET /api/profile` | Server-returned profile role must be `RESCUER` |
| Home stats | `GET /api/rescuer/stats` | Team mission/rescue totals and average response seconds |
| Team profile | `GET /api/rescuer/profile` | Team metadata, availability, members |
| Edit team details | `PUT /api/rescuer/profile` | Existing `contact_number` and `availability` fields only |
| Active assignments | `GET /api/rescuer/assignments?tab=active&page_size=…` | Pending/accepted assignments and incident details |
| Assignment detail | `GET /api/rescuer/assignments/:id` | `assignment_status`, incident, team, report, history, evidence metadata |
| Accept/decline | `PATCH /api/rescuer/assignments/:id/respond` | `{ decision: 'ACCEPT' }` or `{ decision: 'DECLINE', decline_reason }` |
| Advance incident | `PATCH /api/rescuer/incidents/:id/status` | `{ status: 'EN_ROUTE' | 'ON_SCENE' | 'IN_PROGRESS', note? }`; one server-approved step at a time |
| Read operation record | `GET /api/rescuer/incidents/:id/record` | `{ incident, editable, record, summary }` |
| Save record | `POST` to create, `PUT` to edit `/api/rescuer/incidents/:id/record` | Multipart fields `is_draft`, four counts, `actions_taken`, `resources_used`, `operation_notes`; repeated `photos` files |
| Submit completion | `POST /api/rescuer/incidents/:id/complete` | Requires `IN_PROGRESS` and saved non-empty actions; server locks record and resolves incident |
| Download completion PDF | `GET /api/rescuer/incidents/:id/record/pdf` | Bearer-authenticated PDF for a resolved/closed incident |
| View reporter evidence | `GET /api/incidents/:id/image` | Returns a short-lived signed URL for authorized incident evidence |
| History | `GET /api/rescuer/history?page=&page_size=&from=&to=&type=` | Paginated team outcome rows |
| Notifications | Existing `/api/notifications` read/list routes | Read state and notification data |
| Device token | `POST` / `DELETE /api/notifications/device-tokens` | `{ token, platform: 'ANDROID' }` registration and token removal |

## Validation and server ownership

Record counts are whole nonnegative numbers up to 100,000. Final record save requires at least five action-description characters. A maximum of five JPEG/PNG photos are accepted, each no larger than 5 MB. Declining requires a reason. Status changes are validated by the backend state machine. UI state is refreshed after a stale `404`/`409` response; the app does not treat an unacknowledged mutation as complete.

## Contracts not found

The audited server source had no rescuer GPS ingestion endpoint, offline action idempotency contract, or mobile-specific assignment alarm acknowledgment contract. The app does not make up these APIs.
