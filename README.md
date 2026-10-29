# Kalinga Rescuer Mobile

Native Android-first rescuer client built with Expo, React Native, and TypeScript. It connects to the existing Supabase Auth and Express API and only opens Rescuer functionality.

## Start locally

1. Copy `.env.example` to `.env` and supply the publishable Supabase key and CARTO client key.
2. Run `npm ci`.
3. Run `npx expo install --check` and `npm run typecheck`.
4. Generate a native project with `npx expo prebuild --platform android` and run `npx expo run:android` on an Android SDK/device.

The native map, camera, location, and push packages require an Android development build. Expo Go is not sufficient.

## Get an APK

The `Build Android APK` GitHub Actions workflow runs on pushes to `main` and on manual dispatch. It uploads an installable debug APK as the `kalinga-rescuer-apk` workflow artifact. Download and extract the artifact, then install `app-debug.apk` on an Android device.

## Migration notes

The app reuses the original server contracts and supplied UI references. Background location synchronization and offline mutation queuing are not enabled because the audited backend source did not define the required location endpoint or offline idempotency/conflict rules. Real push delivery needs Firebase configuration for Android package `com.rescuer.mobile`.

Read the audit, screen inventory, API mapping, native features, setup, visual comparison, and test results in `docs/` before operational use.
