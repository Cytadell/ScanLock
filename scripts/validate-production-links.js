const REQUIRED_PRODUCTION_LINKS = [
  "EXPO_PUBLIC_SCANLOCK_PRIVACY_URL",
  "EXPO_PUBLIC_SCANLOCK_SUPPORT_URL",
];

function missingProductionLinks(environment) {
  return REQUIRED_PRODUCTION_LINKS.filter(
    (name) => !environment[name] || !environment[name].trim(),
  );
}

if (process.env.EAS_BUILD_PROFILE === "production") {
  const missing = missingProductionLinks(process.env);

  if (missing.length > 0) {
    console.error(
      `Production build stopped: configure ${missing.join(
        ", ",
      )} in the EAS production environment.`,
    );
    process.exit(1);
  }
}

module.exports = { missingProductionLinks };
