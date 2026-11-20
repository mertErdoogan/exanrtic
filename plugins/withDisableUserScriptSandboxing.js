/**
 * Newer Xcode versions turn on "User Script Sandboxing" by default. The React
 * Native / Expo build scripts write files (e.g. ip.txt for the dev server
 * address) into the app bundle, which the sandbox blocks with:
 *   Sandbox: bash(...) deny(1) file-write-create .../DedektorAsistani.app/ip.txt
 *
 * This config plugin turns sandboxing off for every build configuration of the
 * iOS project, so the fix survives `npx expo prebuild --clean`.
 */
const { withXcodeProject } = require('expo/config-plugins');

module.exports = function withDisableUserScriptSandboxing(config) {
  return withXcodeProject(config, (cfg) => {
    const configurations = cfg.modResults.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(configurations)) {
      const entry = configurations[key];
      if (typeof entry === 'object' && entry.buildSettings) {
        entry.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = 'NO';
      }
    }
    return cfg;
  });
};
