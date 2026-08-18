# ScanLock

Are you losing time to doomscrolling? Unlock your time with ScanLock!
ScanLock is an Expo and React Native app that provides you a printable a QR code that can be scanned to lock/unlock selected apps.
By placing the lock away from you, you can create a physical barrier between you and the apps that waste your time.

The project is under active development and is experimental. Note that as of 8/18/2026 only the ios version has been heavily 
test while the android system has only been tested with an emulator. 

## How it works

1. The user grants Screen Time authorization and chooses the apps they want to lock.
2. ScanLock creates a random identifier and encodes it in a printable QR code.
3. Scanning the matching QR locks/unlocks those selected apps.
4. By placing the QR code away from you, it allows you stay focused and be distraction-free.


## Technology

- Expo SDK 54, React Native 0.81, and React 19
- Expo Router for navigation
- TypeScript for application and native-bridge contracts
- Swift with Family Controls and Managed Settings on iOS
- Kotlin native module using an Accessibility Service and native blocking screen on Android
- Jest and React Native Testing Library for automated application tests

The minimum configured iOS deployment target is 16.0. Tablet support is enabled.


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
npm run android
npm run ios
```
Note: 'run android' requires Android Studio and Android SDK and 'run ios' only works on macOS with Xcode. To build without easier use EAS (details below).

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

For Android:
```sh
npx eas-cli build --platform ios --profile development
npx eas-cli build --platform ios --profile preview
npx eas-cli build --platform ios --profile production
```

The gated iOS workflow runs Jest, then XCTest on an EAS macOS simulator, and creates a preview build only if both pass:

```sh
npx eas-cli@latest workflow:run .eas/workflows/test-and-build.yml
```

## Release status

Before release, complete the open items in the repository-level `TODO` file, the native manual-test checklist, App Store privacy metadata, support and privacy URLs, production assets, and Family Controls distribution-entitlement approval.

## Contributing

Keep native-module changes synchronized across the TypeScript contract, platform implementation, and tests. Do not commit generated `ios/`, `android/`, `.expo/`, `coverage/`, credentials, provisioning profiles, or local environment files.