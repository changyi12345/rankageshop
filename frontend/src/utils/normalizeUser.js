/** Map backend user payload to fields the UI expects. */
export function normalizeUser(user) {
  if (!user || typeof user !== "object") return user;

  const walletBalance =
    user.wallet_balance ?? user.walletBalance ?? 0;
  const avatarUrl = user.avatar_url ?? user.avatarUrl ?? null;

  return {
    ...user,
    role: user.role,
    wallet_balance: Number(walletBalance),
    walletBalance: Number(walletBalance),
    avatarUrl,
    profile: user.profile ?? avatarUrl,
    phone: user.phone ?? null,
    email_verified: user.email_verified ?? user.emailVerified ?? false,
    emailVerified: user.email_verified ?? user.emailVerified ?? false,
  };
}
