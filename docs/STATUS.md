# Migration status

The first native implementation is in place. Assignment, rescue-record, photo, and completion payloads were aligned with the supplied backend source archive. TypeScript validation and Expo config checks have passed before adding `expo-system-ui`; the native Android prebuild also completed.

The APK build is pending in GitHub Actions. Physical-device install, screenshot comparisons, real notification delivery, background location sync, and offline mutation recovery are not verified. The audited backend source did not include a location ingestion endpoint or offline queue/idempotency contract, and the existing Firebase app config uses a different Android package ID.

See [migration progress](rescuer-migration-progress.md), [test results](rescuer-test-results.md), [native features](rescuer-native-features.md), and [visual comparison](rescuer-visual-comparison.md) for evidence and limitations.
