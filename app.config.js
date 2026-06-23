import 'dotenv/config';

export default {
  name: "ToidFX",
  slug: "ToidFX",
  scheme: "toidfx",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    buildNumber: "1.0.0",
    supportsTablet: true
  },
  android: {
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.king_ibele.ToidFX"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    eas: {
      projectId: "cd51b50a-eef4-4013-b124-f0fad619a2c1"
    }
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-web-browser",
    "expo-asset",
    "expo-mail-composer",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#0A66C2",
        sounds: [],
        modes: ["alwaysSendAsAndroidManaged"],
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "The app accesses your photos to let you share them with your friends.",
      },
    ],
  ]
};
