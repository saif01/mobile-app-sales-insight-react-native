const path = require("path");
const fs = require("fs");
const { withDangerousMod } = require("@expo/config-plugins");

/**
 * Copies a directory recursively.
 */
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Expo config plugin: use native icon sets from assets/images/app_icons/android
 * and assets/images/app_icons/ios for the installed app.
 *
 * - Android: copies app_icons/android/* into android/app/src/main/res/
 * - iOS: copies app_icons/ios/AppIcon.appiconset into the app's Images.xcassets
 */
function withNativeAppIconsPlugin(config) {
  const projectRoot = config.modRequest?.projectRoot || process.cwd();
  const sourceAndroid = path.join(projectRoot, "assets", "images", "app_icons", "android");
  const sourceIos = path.join(projectRoot, "assets", "images", "app_icons", "ios");

  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const platformRoot = cfg.modRequest.platformProjectRoot;
      const resPath = path.join(platformRoot, "app", "src", "main", "res");
      if (fs.existsSync(sourceAndroid)) {
        copyDirSync(sourceAndroid, resPath);
      }
      return cfg;
    },
  ]);

  config = withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const platformRoot = cfg.modRequest.platformProjectRoot;
      const slug = (cfg.slug || config.slug || "SalesInsight").toLowerCase();
      const appIconSetPath = path.join(
        platformRoot,
        slug,
        "Images.xcassets",
        "AppIcon.appiconset"
      );
      const sourceAppIcon = path.join(sourceIos, "AppIcon.appiconset");
      if (fs.existsSync(sourceAppIcon)) {
        copyDirSync(sourceAppIcon, appIconSetPath);
      }
      return cfg;
    },
  ]);

  return config;
}

module.exports = withNativeAppIconsPlugin;
