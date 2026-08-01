const { withXcodeProject } = require("expo/config-plugins");

// Persists the local iOS signing team across `expo prebuild`, which regenerates the gitignored ios/
// project and otherwise drops DEVELOPMENT_TEAM (so every prebuild would fall back to whichever team
// Xcode happens to auto-pick — e.g. the wrong Apple account). The team id is read from the
// APPLE_TEAM_ID env var, loaded from .env alongside the other build vars, so it stays out of
// committed config and each developer can point at their own team. A team id is not a secret — it
// ships in every provisioning profile — keeping it in .env just avoids hardcoding one person's team.
//
// Inert when APPLE_TEAM_ID is unset: the config passes through untouched, so a Simulator-only build
// (which does not enforce code signing) is completely unaffected. Set APPLE_TEAM_ID in .env once you
// want device or distribution builds signed with that team.
const withIosDevelopmentTeam = (config) => {
  const teamId = process.env.APPLE_TEAM_ID;
  if (!teamId) {
    return config;
  }
  return withXcodeProject(config, (xcodeConfig) => {
    const project = xcodeConfig.modResults;
    const buildConfigurations = project.pbxXCBuildConfigurationSection();
    for (const key of Object.keys(buildConfigurations)) {
      const entry = buildConfigurations[key];
      // The section interleaves real configuration objects with `<uuid>_comment` strings; only the
      // objects carry buildSettings, so guard on it before stamping the team.
      if (entry && typeof entry === "object" && entry.buildSettings) {
        entry.buildSettings.DEVELOPMENT_TEAM = teamId;
      }
    }
    return xcodeConfig;
  });
};

module.exports = withIosDevelopmentTeam;
