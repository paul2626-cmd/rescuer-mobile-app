# Rescuer migration progress

Updated 2026-10-29.

| Area | State | Evidence / remaining work |
| --- | --- | --- |
| Source audit and route inventory | Implemented | Supplied original source archive and backend contract inspected; destination repo was empty |
| Expo shell, role gate, session persistence | Implemented in code | Requires typecheck and device auth validation |
| Home, assignments, history, team, notifications | Implemented in code | Screenshot comparison and live API validation remain |
| Assignment detail and ordered status | Implemented in code | Uses `PATCH` response contract and status machine; validate with staging account |
| Rescue record, drafts, images, completion, PDF | Implemented in code | Uses API contract and Expo ImagePicker; live upload/download test remains |
| Native map and foreground location | Implemented in code | Requires native build and device location permission test |
| Native push registration and foreground assignment alarm | Implemented in code | Background/closed full-screen alarm and real delivery blocked pending correct Firebase app config and device test |
| Background location sync | Blocked by source contract | No server location-ingestion route was found; no speculative route added |
| Offline mutation queue | Not implemented | Source did not provide queue/idempotency rules; mutations require server acknowledgment |
| Typecheck | Passed | `npm run typecheck` |
| Expo dependency/config check and Android prebuild | Passed | `npx expo install --check`; `npx expo prebuild --platform android --no-install --clean`; Expo font pin now matches SDK 54 |
| Android JavaScript export | Passed | `npx expo export --platform android` |
| Android APK | Built | GitHub Actions run `40797161729` succeeded for commit `61e82092abfbefb927a3d50103bf4d92adc043d1`; the downloaded APK was verified as an Android package |
| Device visual comparison | Pending | No Android device/emulator capture has been produced |
