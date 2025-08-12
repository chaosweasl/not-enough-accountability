const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    asar: true,
    name: "Not Enough Accountability",
    executableName:
      process.platform === "win32"
        ? "Not Enough Accountability"
        : "not-enough-accountability",
    appBundleId: "com.accountability.app",
    appVersion: process.env.npm_package_version,
    buildVersion: process.env.npm_package_version,
    icon: "./src/assets/icon", // Will look for icon.ico on Windows, icon.icns on macOS
    extraResource: ["./README.md", "./CONTRIBUTING.md"],
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "not-enough-accountability",
        setupExe: "Not Enough Accountability Setup.exe",
        setupIcon: "./src/assets/icon.ico",
        loadingGif: "./src/assets/loading.gif",
        certificateFile: process.env.CERTIFICATE_FILE,
        certificatePassword: process.env.CERTIFICATE_PASSWORD,
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "win32"],
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        name: "Not Enough Accountability",
        icon: "./src/assets/icon.icns",
        background: "./src/assets/dmg-background.png",
        format: "ULFO",
      },
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          maintainer: "The Accountability App Team",
          homepage:
            "https://github.com/your-username/not-enough-accountability",
          description:
            "Desktop accountability system for monitoring computer usage",
          categories: ["Utility", "Productivity"],
          icon: "./src/assets/icon.png",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          maintainer: "The Accountability App Team",
          homepage:
            "https://github.com/your-username/not-enough-accountability",
          description:
            "Desktop accountability system for monitoring computer usage",
          categories: ["Utility", "Productivity"],
          icon: "./src/assets/icon.png",
        },
      },
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "your-username",
          name: "not-enough-accountability",
        },
        prerelease: false,
        draft: false,
      },
    },
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
