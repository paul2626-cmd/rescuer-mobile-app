# Rescuer test results

Updated 2026-10-29. No test suite or physical-device run is claimed here.

| Check | Result | Evidence |
| --- | --- | --- |
| Backend request/payload review | Passed by source inspection | Compared assignment, status, record, completion, evidence, and push routes with supplied backend source |
| TypeScript typecheck | Passed | `npm run typecheck` |
| Expo dependency check | Passed | `npx expo install --check` |
| Expo config/native Android prebuild | Passed | `npx expo prebuild --platform android --no-install --clean` |
| Android JavaScript export | Passed | `npx expo export --platform android` |
| Android APK build | Pending | CI build workflow will run on the destination repository |
| APK install and launch | Not run | No Android device/emulator in this runner |
| Authentication with Rescuer account | Not run | Requires authorized account and reachable service |
| Role rejection | Implemented, not runtime-tested | Server `/api/profile` gate plus backend authorization |
| Record photo upload | Implemented, not runtime-tested | Requires device permission and authenticated backend session |
| Map and foreground GPS | Implemented, not runtime-tested | Requires native Android build and location permission |
| Push delivery | Not run | Matching Firebase config and real device needed |
| Background location synchronization | Not available | No location ingestion contract found in audited server source |
| Offline write synchronization | Not available | No source queue/idempotency rules found |
| Screenshot comparison | Not run | Android capture environment not available |

The first CI APK attempt stopped during Expo module autolinking because npm had resolved an incompatible `expo-font` peer release without its Android publication version. `expo-font` is now pinned to the SDK 54 compatible release; the next CI run will confirm the native build.

Do not treat implementation presence as runtime verification. Update this table only with actual run output and device evidence.
