# Rescuer migration audit

## Source examined

The requested source URL, `paul2626-cmd/disaster-response-system`, was unavailable during this migration. The supplied source archive was available locally and was used as the implementation reference. The destination repository, `paul2626-cmd/rescuer-mobile-app`, was empty when work began. The web Rescuer code remains unchanged in that source archive.

The source is a Vite React application using React Router, shared UI and API helpers, Supabase Auth, an Express API, and Capacitor for native wrappers. Rescuer routes are role guarded with `RequireRole('RESCUER')`. The backend also enforces `RESCUER` on protected routes and resolves the caller's team from the authenticated account.

## Rescuer screens

The source has eight routes: home, assignments, assignment detail, rescue record, completion report, history, team profile, and notifications. Their route and API mapping is in [rescuer-screen-inventory.md](rescuer-screen-inventory.md) and [rescuer-api-mapping.md](rescuer-api-mapping.md).

The supplied screenshots cover Home, History, Team profile, and Assignment detail. They establish a charcoal interface, red accent, compact Kalinga header, rounded panels, and a glass bottom navigation bar. The implementation uses the supplied logo artwork and a shared native theme. A device screenshot comparison has not yet been completed.

## Architecture and dependencies

- **Mobile:** Expo SDK 54, React Native 0.81, TypeScript, Expo Router, Supabase JS, AsyncStorage session persistence, MapLibre React Native, Expo Location, Expo ImagePicker, Expo Notifications, Expo FileSystem, and Expo Sharing.
- **Server:** existing Express routes and Supabase data/storage; no backend code or database schema is changed by this project.
- **Authentication:** Supabase password auth; the app fetches `/api/profile` and blocks non-Rescuer roles. Backend route authorization remains authoritative.
- **Secrets:** the mobile client only consumes publishable/client configuration. Never put a Supabase service-role key in this app.
- **Android identity:** `com.rescuer.mobile`. The source archive's Firebase `google-services.json` used a different package ID, so it is not copied.

## Native feature findings and risks

- The assignment screen displays the incident on a native MapLibre map and can request a foreground location fix. The source backend archive did not contain a rescuer-location ingestion route. Uploading or queuing location updates would require an existing server contract; none was found, so the app does not invent one.
- Rescue-record camera and photo-library selection use Expo ImagePicker. The API accepts up to five JPEG/PNG photos, 5 MB each.
- Native notification registration uses the Android device token endpoint. Delivery cannot be verified without a Firebase configuration whose Android package matches this app and a device build.
- The source does not define an offline mutation queue or idempotency contract. State changes remain server-confirmed; offline status changes are not queued.
- Expo background location requires native permissions and a development build. Even with those configured, reliable updates depend on platform and device behavior. The present app does not claim background location synchronization.

## Screen replication strategy

Keep the shared header, status pills, panels, buttons, input styling, theme and bottom navigation centralized. Implement screens with native controls and preserve source labels, API shapes, status order, and server-side validation. Treat the supplied screenshots as reference evidence. Pixel-level completion requires comparable emulator/device captures and iteration; that evidence is still outstanding.
