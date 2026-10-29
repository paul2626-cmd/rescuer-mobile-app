# Rescuer migration plan

## Work sequence

1. Audit source routes, design references, auth, API schemas, assets, and native behavior.
2. Establish Expo Router, server-backed role gating, shared visual tokens, navigation, and shared UI.
3. Implement the four primary tabs and the assignment, record, and completion routes using source API contracts.
4. Add supported native map/location, camera/photo, push-registration, and PDF-share integrations.
5. Typecheck, resolve Expo/native dependency issues, and run a CI Android APK build.
6. Compare every screen/state on a same-size Android device or emulator; record platform differences.
7. Validate backend workflows, permissions, native notifications, location behavior, and offline recovery on real devices.

## Current completion evidence

- Source and target repository condition examined; target was empty and source URL unavailable, with supplied source archive used as audit basis.
- Core Expo routes and server role gate implemented.
- Assignment response/status payloads checked against backend schemas and implemented with correct HTTP verbs and field names.
- Rescue record multipart shape, final-save rule, photo limit/type/size and completion preconditions checked against backend source.
- The Android debug APK built successfully in GitHub Actions run [#2](https://github.com/paul2626-cmd/rescuer-mobile-app/actions/runs/40797161729), and the downloaded artifact was verified.

## Exit criteria not met

- Device-level screenshot comparison and physical-device validation.
- Matching Firebase Android configuration and real notification delivery.
- Background GPS synchronization (no backend ingestion contract was found).
- Offline mutation queue (no source behavior/idempotency contract was found).
- APK install and launch check on an Android device.
