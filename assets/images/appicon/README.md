# App icons for the installed app

This folder holds the **native** icon sets used by the **installed** Android and iOS apps.

## Layout

| Folder    | Purpose |
|-----------|--------|
| **android/** | Full Android launcher icon set: `mipmap-*` (ic_launcher, ic_launcher_foreground, ic_launcher_round), `mipmap-anydpi-v26` (adaptive icon XML), and `values/ic_launcher_background.xml`. |
| **ios/**     | iOS app icon set: `AppIcon.appiconset` (Contents.json + all required sizes) and optional `iTunesArtwork*` assets. |

## How they are used

- **Expo** normally generates native icons from `app.json` (single `icon` and `android.adaptiveIcon` images) when you run `npx expo prebuild`.
- This project uses the **withNativeAppIcons** config plugin so that the icons in **android/** and **ios/** are copied into the native projects during prebuild. The **installed** app then uses these assets instead of Expo-generated ones.

So:

1. **Android**: Contents of `android/` are copied to `android/app/src/main/res/` (replacing or providing mipmap-*, values, etc.). The launcher uses `@mipmap/ic_launcher` and `@mipmap/ic_launcher_round` from there.
2. **iOS**: Contents of `ios/AppIcon.appiconset/` are copied to the app’s `Images.xcassets/AppIcon.appiconset/`. The installed app uses this asset catalog for the home screen icon.

## Updating icons

- **Android**: Replace the PNGs/XML in `android/` (keep the same names and folder structure). Then run `npx expo prebuild --clean` (or at least prebuild) so the plugin can copy them again.
- **iOS**: Replace the images in `ios/AppIcon.appiconset/` and keep `Contents.json` in sync with filenames/sizes. Then run prebuild as above.

The plugin is registered in `app.json` as `./plugins/withNativeAppIcons`.
