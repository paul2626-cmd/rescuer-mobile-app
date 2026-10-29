# Rescuer native features

## Location and maps

The assignment route renders a MapLibre native map with incident and configured team-base markers. A location control requests foreground permission and a current device fix. It reports permission denial, unavailable location, and coordinates outside the configured Philippines bounds. The map can show the native user-location indicator.

The audited API source contains no route for a Rescuer to upload their coordinates. The client therefore does not start background tracking or claim to share a live position. A server-owned endpoint and data contract are required before syncing location.

## Camera and gallery

The operation record requests camera or photo-library access only when a Rescuer adds photos. It supports multiple gallery selection and camera capture, validates JPEG/PNG and 5 MB per file, limits the total to five saved plus new files, and submits multipart data to the existing record route. Existing photos are displayed using signed URLs. Failed uploads remain on the form for retry.

## Push notifications

On Android the app requests notification permission, creates a rescue updates channel, obtains the native device token, registers it with the existing endpoint, and routes taps with an `assignment_id` to the assignment. Foreground notifications are shown by Expo Notifications.

The source archive's Firebase config has a different Android package ID from `com.rescuer.mobile`, so it is not bundled. Real FCM delivery needs an authorized Firebase config for this exact package and verification on a physical device. Until then, registration may fail and in-app notification history remains available.

## Offline and background limits

The source did not provide a GPS ingestion endpoint, offline mutation queue, idempotency key, or conflict-resolution behavior. The app keeps server-confirmed status and record updates online; it does not mark local attempts as synchronized. Background GPS synchronization and offline writes remain blocked until the server contract is defined.

## PDF

Resolved/closed completion PDFs are downloaded with the current bearer token into app cache and passed to the operating system share sheet.
