# Rescuer mobile setup

## Configuration

Create `.env` from `.env.example` and provide these client configuration values:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_CARTO_KEY=
```

The Supabase key must be a publishable/anon client key. Never use a service-role key in the application. Expo embeds `EXPO_PUBLIC_` values in the client bundle.

## Development

```bash
npm install
npx expo install --check
npm run typecheck
npx expo prebuild --platform android
npx expo run:android
```

The MapLibre map, camera, native location, and device push require a development/native build; Expo Go does not contain these native modules.

## APK build

The repository includes an Android GitHub Actions workflow that builds an installable debug APK and uploads it as a workflow artifact. A debug APK does not require a production signing key. When workflow completes, download the `kalinga-rescuer-apk` artifact and install `app-debug.apk` on an Android device.

For a local EAS preview APK, configure EAS credentials and use `eas build --platform android --profile preview`.

## Device requirements and limitations

- Android location, camera, photo library, and notifications permissions are requested when used.
- Foreground GPS is only sampled from the assignment map.
- No background location upload is enabled because the audited backend has no matching route.
- Push delivery requires Firebase configuration that matches package `com.rescuer.mobile`; it is not supplied by the old app because that config uses another package ID.
- Offline status and record writes are not queued; wait for server confirmation before treating the operation as saved.

See the native feature, visual comparison, and test-results documents for outstanding verification.
