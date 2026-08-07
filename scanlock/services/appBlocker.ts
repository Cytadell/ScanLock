// services/appBlocker.ts

export type BlockedAppSelection = {
  count: number;
};

export async function requestAuthorization(): Promise<boolean> {
  console.log("Mock: request Screen Time authorization");
  return true;
}

export async function selectApps(): Promise<BlockedAppSelection> {
  console.log("Mock: open app picker");

  // Fake result while developing in Expo Go
  return {
    count: 3,
  };
}

export async function getSelectedAppCount(): Promise<number> {
  //Fake count for now should g
  return 0;
}

export async function enableBlocking(): Promise<void> {
  console.log("Mock: blocking enabled");
}

export async function disableBlocking(): Promise<void> {
  console.log("Mock: blocking disabled");
}