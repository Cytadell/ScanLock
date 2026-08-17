# ScanLock

ScanLock is an Expo and React Native app that uses a QR code as a physical key for selected apps, categories, and websites. On iOS, it integrates with Apple's Family Controls and Managed Settings frameworks to apply and remove Screen Time shields.

The project is under active development and is not release-ready. In particular, the Family Controls entitlement and all recovery paths must be validated on physical Apple devices before distribution.

## How it works

1. The user grants Screen Time authorization and chooses apps, categories, or websites with Apple's private activity picker.
2. ScanLock creates a random identifier and encodes it in a versioned QR payload.
3. Scanning the matching QR requests a lock or unlock transition.
4. The native module journals the requested shield change, applies it, verifies the resulting state, and rolls back or recovers after an interrupted operation when necessary.

ScanLock never receives the names of items chosen in Apple's picker. It stores Apple's opaque selection tokens locally and passes them back to the system when applying shields.

## Technology

- Expo SDK 54, React Native 0.81, and React 19
- Expo Router for navigation
- TypeScript for application and native-bridge contracts
- Swift with Family Controls and Managed Settings on iOS
- Kotlin native module using an Accessibility Service and native blocking screen on Android
- Jest and React Native Testing Library for automated application tests

The minimum configured iOS deployment target is 16.0. Tablet support is enabled.

## Repository layout

```text
app/                         Expo Router screens and layouts
components/                  Reusable UI and onboarding/scanner views
hooks/                       Screen state machines and UI workflows
services/                    QR, persistence, and native-module boundary
modules/app-blocker/
  src/                       TypeScript native-module contract
  ios/                       Swift Family Controls implementation
  android/                   Kotlin Android implementation
tests/                       Jest component, hook, and service tests
native-tests/ios/            XCTest state-machine and persistence tests
plugins/                     Expo Prebuild configuration, including XCTest target generation
.eas/workflows/              Cloud test and build gates
```

`services/appBlocker.ts` is the application-facing boundary. It selects the real native module in development and production builds, and the in-memory `services/appBlocker.expoGo.ts` implementation in Expo Go. Jest mocks this boundary when testing UI workflows.

## Requirements

- Node.js 22.13 or newer
- npm
- An Expo account for EAS builds
- For native iOS work: an Apple Developer account, Family Controls entitlement access, and a physical iPhone or iPad

Install dependencies from this directory:

```sh
npm install
```

## Development

Start Metro:

```sh
npm start
```

Expo Go can exercise most JavaScript UI and the simulated app-blocker service, but it cannot validate real Family Controls shields. Use an iOS development build for the native picker, Screen Time authorization, shield state, and interruption recovery.

Common commands:

```sh
npm run web
npm run android
npm run ios
```

On Windows PowerShell systems that block `.ps1` command shims, use `npm.cmd` and `npx.cmd` instead.

## Verification

Run all local checks before opening a pull request:

```sh
npx tsc --noEmit
npm run lint
npm test
npm run test:coverage
```

Automated tests verify the TypeScript state machines, persistence, QR validation, and the native-module contract through mocks. On macOS, generate the native project and run the Swift tests with:

```sh
npx expo prebuild --clean --platform ios --no-install
cd ios && pod install && cd ..
npm run test:ios
```

The committed XCTest sources live outside the generated `ios/` directory. The local Expo config plugin recreates the `ScanLockTests` target and shared scheme during Prebuild. Native unit tests verify the lock transaction, rollback, interrupted-operation recovery, and persistence, but they do not prove that Apple shields were visibly applied. Use the repository's `NATIVE_IOS_MANUAL_TESTS.txt` checklist for physical-device validation.

## Builds

EAS profiles are defined in `eas.json`:

- `development`: internal development-client build
- `preview`: internal build with the universal debug QR enabled
- `production`: store-oriented build with the universal debug QR disabled

Typical commands are:

```sh
npx eas-cli build --platform ios --profile development
npx eas-cli build --platform ios --profile preview
npx eas-cli build --platform ios --profile production
```

The gated iOS workflow runs Jest, then XCTest on an EAS macOS simulator, and creates a preview build only if both pass:

```sh
npx eas-cli@latest workflow:run .eas/workflows/test-and-build.yml
```

The workflow is manual-only, so pushes do not consume EAS resources. Run it explicitly when you want a gated preview build. Invoking `eas build` directly does not run the separate workflow test jobs.

JavaScript-only changes can be exercised against a compatible installed development client without rebuilding native code. Changes to Swift, Kotlin, native dependencies, entitlements, or native configuration require a new compatible build.

## Security model

- QR payloads contain a type, schema version, and random key identifier; they do not contain Screen Time tokens or selected-app names.
- The QR identifier is stored locally with AsyncStorage. It is a capability used to authorize transitions, not an encryption key or account credential.
- The universal debug QR is enabled in development and preview configurations. Production builds must keep it disabled and must verify that it is rejected.
- Selection tokens remain local. Avoid logging QR payloads, tokens, or private selection data.
- Unlocking remains available even when selection data or Screen Time authorization is missing. The native layer treats clearing shields as the recovery-first operation.
- Native lock changes are journaled and verified to reduce the chance that an interrupted or partially failed transition leaves stale shields.

This design cannot replace Apple platform protections. Anyone who possesses the active QR code can request the corresponding lock or unlock transition.

## Release status

Before release, complete the open items in the repository-level `TODO` file, the native manual-test checklist, App Store privacy metadata, support and privacy URLs, production assets, and Family Controls distribution-entitlement approval.

## Contributing

Keep native-module changes synchronized across the TypeScript contract, platform implementation, and tests. Do not commit generated `ios/`, `android/`, `.expo/`, `coverage/`, credentials, provisioning profiles, or local environment files.

This repository does not currently declare an open-source license. All rights remain with the copyright holder unless a license is added.
