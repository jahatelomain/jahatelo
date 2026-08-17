const {
  withAppDelegate,
  withInfoPlist,
  withPodfile,
} = require('@expo/config-plugins');

const GOOGLE_MAPS_SETUP = `    if let googleMapsApiKey = Bundle.main.object(forInfoDictionaryKey: "GoogleMapsApiKey") as? String,
       !googleMapsApiKey.isEmpty,
       !googleMapsApiKey.contains("$(") {
      GMSServices.provideAPIKey(googleMapsApiKey)
    }
\n`;

function withGoogleMapsIos(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.GoogleMapsApiKey = '$(GOOGLE_MAPS_IOS_API_KEY)';
    return config;
  });

  config = withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes('import GoogleMaps')) {
      contents = contents.replace('import Expo', 'import Expo\nimport GoogleMaps');
    }

    if (!contents.includes('GMSServices.provideAPIKey')) {
      contents = contents.replace(
        /(didFinishLaunchingWithOptions[\s\S]*?\) -> Bool \{\n)/,
        `$1${GOOGLE_MAPS_SETUP}`
      );
    }

    config.modResults.contents = contents;
    return config;
  });

  config = withPodfile(config, (config) => {
    if (!config.modResults.contents.includes("pod 'react-native-google-maps'")) {
      config.modResults.contents = config.modResults.contents.replace(
        "  use_expo_modules!\n",
        "  use_expo_modules!\n\n  pod 'react-native-google-maps', :path => '../node_modules/react-native-maps'\n"
      );
    }

    return config;
  });

  return config;
}

module.exports = withGoogleMapsIos;
