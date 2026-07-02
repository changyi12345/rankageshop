export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('959') && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith('09') && digits.length >= 9) return `+95${digits.slice(1)}`;
  if (digits.startsWith('9') && digits.length === 9) return `+95${digits}`;
  if (digits.startsWith('95') && digits.length >= 10) return `+${digits}`;
  return raw.trim().startsWith('+') ? raw.trim() : `+${digits}`;
}
