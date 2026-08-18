export type BlockedAppSelection = {
  count: number;
  applicationCount: number;
  categoryCount: number;
  webDomainCount: number;
};

export type BlockingResult = {
  status: "locked" | "unlocked";
  locked: boolean;
};
