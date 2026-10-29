# Kalinga Rescuer Mobile

Native Android-first rescuer client built with Expo, React Native, and TypeScript. It connects to the existing Supabase Auth and Express API and only opens Rescuer functionality.

## Start locally

1. Copy `.env.example` to `.env` and supply the publishable Supabase key and CARTO client key.
2. Run `npm ci`.
3. Run `npx expo install --check` and `npm run typecheck`.
4. Generate a native project with `npx expo prebuild --platform android` and run `npx expo run:android` on an Android SDK/device.

The native map, camera, location, and push packages require an Android development build. Expo Go is not sufficient.

## Get an APK

The `Build Android APK` workflow builds a release APK with the JavaScript bundle embedded. It includes ARMv7 and ARM64 libraries and excludes x86 emulator ABIs. The workflow checks the bundle, ABI set, and a 100 MiB size ceiling before uploading the `kalinga-rescuer-arm-apk` artifact. This APK is for ARM Android phones; it is not a Play Store-signed release.

The current build was produced by [GitHub Actions run #5](https://github.com/paul2626-cmd/rescuer-mobile-app/actions/runs/40806738214) on branch `fix/android-release-apk`.

## Migration notes

The app reuses the original server contracts and supplied UI references. Background location synchronization and offline mutation queuing are not enabled because the audited backend source did not define the required location endpoint or offline idempotency/conflict rules. Real push delivery needs Firebase configuration for Android package `com.rescuer.mobile`.

Read the audit, screen inventory, API mapping, native features, setup, visual comparison, and test results in `docs/` before operational use.
