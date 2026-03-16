const { withAndroidStyles } = require("@expo/config-plugins");

module.exports = function withAndroidSplashBehavior(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;
    const styleGroups = styles.resources?.style ?? [];

    styles.resources.style = styleGroups.map((styleGroup) => {
      if (styleGroup?.$?.name !== "Theme.App.SplashScreen") {
        return styleGroup;
      }

      return {
        ...styleGroup,
        item: (styleGroup.item ?? []).filter(
          (item) => item?.$?.name !== "android:windowSplashScreenBehavior"
        ),
      };
    });

    return config;
  });
};
