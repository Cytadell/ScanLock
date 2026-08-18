const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

if (process.platform !== "darwin") {
  throw new Error("iOS XCTest requires a macOS runner with Xcode installed.");
}

const devices = JSON.parse(
  execFileSync("xcrun", ["simctl", "list", "devices", "available", "--json"], {
    encoding: "utf8",
  })
);

const candidates = Object.entries(devices.devices)
  .filter(([runtime]) => runtime.includes("iOS"))
  .flatMap(([runtime, runtimeDevices]) =>
    runtimeDevices
      .filter((device) => device.isAvailable && device.name.startsWith("iPhone"))
      .map((device) => ({ ...device, runtime }))
  )
  .sort((a, b) => b.runtime.localeCompare(a.runtime));

if (candidates.length === 0) {
  throw new Error("No available iPhone simulator was found on the EAS macOS worker.");
}

const destination = `platform=iOS Simulator,id=${candidates[0].udid}`;
const resultDirectory = path.join(process.cwd(), "test-results", "ios");
const resultBundle = path.join(resultDirectory, "ScanLockTests.xcresult");
fs.mkdirSync(resultDirectory, { recursive: true });
fs.rmSync(resultBundle, { recursive: true, force: true });

const workspace = fs
  .readdirSync(path.join(process.cwd(), "ios"))
  .find((entry) => entry.endsWith(".xcworkspace"));
if (!workspace) {
  throw new Error("No generated iOS workspace was found. Run Expo Prebuild and pod install first.");
}

const result = spawnSync(
  "xcodebuild",
  [
    "test",
    "-workspace",
    path.join("ios", workspace),
    "-scheme",
    "ScanLockTests",
    "-destination",
    destination,
    "-only-testing:ScanLockTests",
    "-resultBundlePath",
    resultBundle,
  ],
  { stdio: "inherit" }
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
