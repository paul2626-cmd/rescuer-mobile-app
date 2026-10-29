# Rescuer test results

Updated 2026-10-29. No test suite or physical-device run is claimed here.

| Check | Result | Evidence |
| --- | --- | --- |
| Backend request/payload review | Passed by source inspection | Compared assignment, status, record, completion, evidence, and push routes with supplied backend source |
| TypeScript typecheck | Passed | `npm run typecheck` |
| Expo dependency check | Passed | `npx expo install --check` |
| Expo config/native Android prebuild | Passed | `npx expo prebuild --platform android --no-install --clean` |
| Android JavaScript export | Passed | `npx expo export --platform android` |
| Android APK build | Passed | [GitHub Actions run #2](https://github.com/paul2626-cmd/rescuer-mobile-app/actions/runs/40797161729) succeeded for commit `61e82092abfbefb927a3d50103bf4d92adc043d1`; the artifact contains `app-debug.apk` |
| APK artifact verification | Passed | `file` identified an Android package; 183,238,833 bytes; SHA-256 `07d56c4e7dce05d66db9b84cf032ff9c86590ba65353e6395bfec07cd67bc4f5` |
| APK install and launch | Not run | No Android device/emulator in this runner |
| Authentication with Rescuer account | Not run | Requires authorized account and reachable service |
| Role rejection | Implemented, not runtime-tested | Server `/api/profile` gate plus backend authorization |
| Record photo upload | Implemented, not runtime-tested | Requires device permission and authenticated backend session |
| Map and foreground GPS | Implemented, not runtime-tested | Requires native Android build and location permission |
| Push delivery | Not run | Matching Firebase config and real device needed |
| Background location synchronization | Not available | No location ingestion contract found in audited server source |
| Offline write synchronization | Not available | No source queue/idempotency rules found |
| Screenshot comparison | Not run | Android capture environment not available |

The first CI APK attempt stopped during Expo module autolinking because npm had resolved an incompatible `expo-font` peer release without its Android publication version. Pinning `expo-font` to the Expo SDK 54 compatible release fixed the issue, and the next CI run built the APK successfully. The APK has not been installed or launched on an Android device.

Do not treat implementation presence as runtime verification. Update this table only with actual run output and device evidence.
