# ScanLock test guide

The automated test system uses Jest with Expo's `jest-expo` preset and React Native Testing Library. Tests run in Node, so native APIs such as the camera, haptics, AsyncStorage, and Screen Time are replaced with deterministic mocks.

Use Node 22.13 or newer. React Native Testing Library 14 requires that runtime, while Expo SDK 54 remains pinned to React 19.1. `test-renderer` is therefore pinned to the React 19.1-compatible 1.1 release; update those packages together when upgrading Expo or React.

## Commands

Run these commands from the `scanlock` directory:

```sh
npm test
```

Runs the complete test suite once. This is the command to use in CI.

```sh
npm run test:watch
```

Runs affected tests as files change during development.

```sh
npm run test:coverage
```

Prints a coverage summary and creates `coverage/lcov-report/index.html`. Coverage output is ignored by Git. Coverage is a diagnostic signal rather than a substitute for testing important behavior.

## Organization

Tests mirror the application structure:

```text
tests/
  components/  User-visible rendering and interactions
  hooks/       Hook state machines and native-service interactions
  services/    Business rules, parsing, and persistence
  jest.setup.ts
```

Name files `*.test.ts` or `*.test.tsx`. Keep test data and mocks close to the suite that owns them; add shared helpers only after multiple suites need the same behavior.

## Test style

- Assert user-visible behavior and public return values, not implementation details.
- Use Arrange, Act, Assert sections when a test is long enough to benefit from them.
- Give tests behavior-oriented names such as `rejects a QR payload for a different key`.
- Reset mutable mocks in `beforeEach` so tests can run independently and in any order.
- Use `renderHook`, `act`, and `waitFor` for hooks. Never manually call React hooks.
- Prefer controlled promises for in-flight behavior and fake timers only for timer-specific behavior.
- Avoid broad snapshots. Explicit assertions produce clearer failures for this app's state transitions.

## Native-code boundary

Jest verifies the TypeScript contract with the native AppBlocker module, but it cannot prove that Apple's Family Controls shield is active. Native persistence and shielding should also be tested with XCTest, and the final lock/unlock flow should be exercised on a physical iPhone. Android currently reports AppBlocker as unavailable, so its device test should verify that error path.

When adding a native method:

1. Update the TypeScript contract in `services/appBlocker.ts`.
2. Add or update the Jest mock in every affected suite.
3. Test successful, denied, unexpected-result, and thrown-error paths.
4. Add a native XCTest or Android test when the behavior lives below the JavaScript bridge.

## Adding a test

```tsx
import { act, renderHook } from "@testing-library/react-native";

describe("useExample", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("describes the behavior being protected", async () => {
    const { result } = await renderHook(() => useExample());

    await act(async () => {
      await result.current.performAction();
    });

    expect(result.current.status).toBe("success");
  });
});
```

Mock the smallest external boundary possible. For example, hook tests mock `services/appBlocker` rather than reproducing the native module internally. Service tests then cover the service itself.
