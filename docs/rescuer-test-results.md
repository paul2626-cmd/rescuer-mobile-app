# Rescuer test results

Updated 2026-10-29. No physical-device run is claimed here.

| Check | Result | Evidence |
| --- | --- | --- |
| Backend request/payload review | Passed by source inspection | Compared assignment, status, record, completion, evidence, and push routes with supplied backend source |
| TypeScript typecheck | Passed | `npm run typecheck` on the APK build workflow |
| Expo dependency check | Passed | `npx expo install --check` on the APK build workflow |
| Expo config/native Android prebuild | Passed | `npx expo prebuild --platform android --no-install --clean` |
| Android release APK build | Passed | [GitHub Actions run #5](https://github.com/paul2626-cmd/rescuer-mobile-app/actions/runs/40806738214) on commit `a086f6271e5daac9016be87f0716a12509aa86cd` |
| Embedded JavaScript bundle | Passed | APK contains `assets/index.android.bundle`; workflow fails if missing |
| ABI and APK size check | Passed | ARMv7 and ARM64 only; 55,550,599 bytes, below the 100 MiB workflow limit |
| APK format and checksum | Passed | Recognized as Android package; SHA-256 `11d35a0f2340d444427e791238b850ec466edd2da7e6be79d5254ed93c79aa4d` |
| APK install and launch | Not run | No Android device/emulator is connected to this build runner |
| Authentication with Rescuer account | Not run | Requires authorized account and reachable service |
| Role rejection | Implemented, not runtime-tested | Server `/api/profile` gate plus backend authorization |
| Record photo upload | Implemented, not runtime-tested | Requires device permission and authenticated backend session |
| Map and foreground GPS | Implemented, not runtime-tested | Requires native Android build and location permission |
| Push delivery | Not run | Matching Firebase config and real device needed |
| Background location synchronization | Not available | No location ingestion contract found in audited server source |
| Offline write synchronization | Not available | No source queue/idempotency rules found |
| Screenshot comparison | Not run | Android capture environment not available |

The original debug APK did not package the JavaScript bundle and displayed “Unable to load script.” The workflow now assembles the release variant and verifies the embedded bundle, supported ARM ABIs, and APK size before upload. The APK has not yet been launched on the user's device.

Do not treat build success as device-level verification.
