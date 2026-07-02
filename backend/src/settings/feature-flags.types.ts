export interface FeatureFlags {
  registrationEnabled: boolean;
  googleLoginEnabled: boolean;
  walletEnabled: boolean;
  walletTopupEnabled: boolean;
  referralEnabled: boolean;
  promoCodesEnabled: boolean;
  userOrderCancelEnabled: boolean;
  gamesTopupEnabled: boolean;
  voucherShopEnabled: boolean;
  eventsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  liveChatEnabled: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  registrationEnabled: true,
  googleLoginEnabled: true,
  walletEnabled: true,
  walletTopupEnabled: true,
  referralEnabled: true,
  promoCodesEnabled: true,
  userOrderCancelEnabled: true,
  gamesTopupEnabled: true,
  voucherShopEnabled: true,
  eventsEnabled: true,
  emailNotificationsEnabled: true,
  liveChatEnabled: true,
};

export function parseFeatureFlags(raw: unknown): FeatureFlags {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_FEATURE_FLAGS };
  }
  const input = raw as Record<string, unknown>;
  const flags = { ...DEFAULT_FEATURE_FLAGS };
  for (const key of Object.keys(DEFAULT_FEATURE_FLAGS) as (keyof FeatureFlags)[]) {
    if (typeof input[key] === 'boolean') {
      flags[key] = input[key] as boolean;
    }
  }
  return flags;
}
