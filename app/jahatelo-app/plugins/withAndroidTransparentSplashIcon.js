const { withAndroidStyles, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const TRANSPARENT_SPLASH_DRAWABLE = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
  <solid android:color="@android:color/transparent" />
  <size android:width="1dp" android:height="1dp" />
</shape>
`;

module.exports = function withAndroidTransparentSplashIcon(config) {
  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const drawableDir = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app/src/main/res/drawable'
      );
      fs.mkdirSync(drawableDir, { recursive: true });
      fs.writeFileSync(
        path.join(drawableDir, 'splashscreen_transparent.xml'),
        TRANSPARENT_SPLASH_DRAWABLE
      );
      return modConfig;
    },
  ]);

  return withAndroidStyles(config, (modConfig) => {
    const splashStyle = modConfig.modResults.resources.style?.find(
      (style) => style.$?.name === 'Theme.App.SplashScreen'
    );
    const iconItem = splashStyle?.item?.find(
      (item) => item.$?.name === 'windowSplashScreenAnimatedIcon'
    );
    if (iconItem) iconItem._ = '@drawable/splashscreen_transparent';
    return modConfig;
  });
};
