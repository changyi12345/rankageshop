export interface IntegrationSecrets {
  g2bulkApiKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
}

export interface IntegrationSettingsDto {
  g2bulkApiKeyConfigured: boolean;
  g2bulkApiKeyMasked: string | null;
  g2bulkApiKeySource: 'database' | 'environment' | 'none';
  smtpHost: string | null;
  smtpPort: number;
  smtpUser: string | null;
  smtpPassConfigured: boolean;
  smtpPassMasked: string | null;
  smtpFrom: string | null;
  smtpConfigured: boolean;
  smtpSource: 'database' | 'environment' | 'none';
  updatedAt: string;
}

export function maskSecret(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const v = value.trim();
  if (v.length <= 4) return '••••';
  return `••••${v.slice(-4)}`;
}
