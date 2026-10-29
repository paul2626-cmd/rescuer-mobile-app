# Rescuer visual comparison

## Reference set

The user supplied mobile screenshots for Home (two matching captures), Rescue history, Team profile, and Assignment detail with the rescue record. These screenshots are the baseline visual references.

## Implemented visual system

- Charcoal background with a dark blue-black upper gradient, muted gray text, and coral/red action color.
- Kalinga mark and name in a compact top bar; theme, notification, and profile actions.
- Rounded cards, thin neutral borders, compact labels, and the four-item glass bottom navigation.
- Native map, controls, text fields, confirmation surfaces, and photos rather than a WebView.

## Comparison status

No paired Android screenshots have been captured yet. The runner initially had no Android SDK or emulator, and the APK workflow is not complete. Therefore no screen is marked pixel-equivalent. On-device typography, safe-area spacing, map rendering, system dialogs, and OS picker surfaces remain to be compared and tuned.

## Required capture matrix

| Screen | Required states |
| --- | --- |
| Home | available/off duty/on mission; loaded/empty/error; dark and light |
| Assignments | pending, active, completed, each empty state |
| Assignment detail | pending response, each status step, missing coordinates, photo, timeline, error |
| Record | blank, draft, validation error, selected/saved photos, resolved read-only |
| Completion | eligible submit, missing record, submitted/resolved, PDF error |
| History | unfiltered, active filters, invalid date, no results, next page |
| Team | profile, edit contact, on mission lock, save error |
| Notifications | unread, read, empty, tap-to-assignment |
