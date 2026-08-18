const { withInfoPlist } = require("expo/config-plugins");

module.exports = function withCameraOnlyPermissions(config) {
  return withInfoPlist(config, (configWithInfoPlist) => {
    delete configWithInfoPlist.modResults.NSMicrophoneUsageDescription;
    return configWithInfoPlist;
  });
};
