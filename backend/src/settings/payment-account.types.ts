export interface PaymentAccount {
  id: string;
  name: string;
  accountNumber: string;
  accountHolder: string;
  enabled?: boolean;
}

export const DEFAULT_PAYMENT_ACCOUNTS: PaymentAccount[] = [
  { id: 'kbz', name: 'KBZ Pay', accountNumber: '', accountHolder: '' },
  { id: 'wave', name: 'Wave Pay', accountNumber: '', accountHolder: '' },
  { id: 'bank', name: 'Bank Transfer', accountNumber: '', accountHolder: '' },
];

export function slugPaymentId(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('kbz')) return 'kbz';
  if (lower.includes('wave')) return 'wave';
  if (lower.includes('bank')) return 'bank';
  return lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'payment';
}

export function parsePaymentAccounts(
  paymentAccounts: unknown,
  paymentMethods: string[],
  contactPhone: string | null,
  shopName: string,
): PaymentAccount[] {
  if (Array.isArray(paymentAccounts) && paymentAccounts.length > 0) {
    return paymentAccounts
      .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
      .map((item, index) => ({
        id: String(item.id ?? slugPaymentId(String(item.name ?? `method-${index}`))),
        name: String(item.name ?? '').trim(),
        accountNumber: String(item.accountNumber ?? '').trim(),
        accountHolder: String(item.accountHolder ?? '').trim(),
        enabled: item.enabled === false ? false : true,
      }))
      .filter((item) => item.name.length > 0);
  }

  const methods = paymentMethods.length > 0 ? paymentMethods : DEFAULT_PAYMENT_ACCOUNTS.map((a) => a.name);
  return methods.map((name, index) => ({
    id: slugPaymentId(name) || `method-${index}`,
    name,
    accountNumber: contactPhone ?? '',
    accountHolder: shopName,
  }));
}
