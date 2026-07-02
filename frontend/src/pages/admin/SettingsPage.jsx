import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/Upload";
import SendIcon from "@mui/icons-material/Send";
import HubIcon from "@mui/icons-material/Hub";
import { adminApi } from "../../api/admin";
import { toast } from "react-toastify";
import { resolveUploadUrl } from "../../utils/mediaUrl";

const TABS = [
  { id: "general", label: "General" },
  { id: "payments", label: "Payments" },
  { id: "pricing", label: "Pricing" },
  { id: "features", label: "Features" },
  { id: "g2bulk", label: "G2Bulk" },
  { id: "integrations", label: "Email & API" },
  { id: "security", label: "Security" },
];

const FEATURE_LABELS = {
  registrationEnabled: "User registration",
  googleLoginEnabled: "Google login",
  walletEnabled: "Wallet system",
  walletTopupEnabled: "Wallet top-ups",
  referralEnabled: "Referral program",
  promoCodesEnabled: "Promo codes",
  userOrderCancelEnabled: "User order cancellation",
  gamesTopupEnabled: "Game top-ups",
  voucherShopEnabled: "Voucher shop",
  eventsEnabled: "Shop events",
  emailNotificationsEnabled: "Email notifications",
  liveChatEnabled: "Live chat",
};

const INPUT =
  "w-full rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 text-sm text-blue-900 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-100";

export default function SettingsPage() {
  const location = useLocation();
  const [tab, setTab] = useState(() => location.state?.tab || "general");
  const [shop, setShop] = useState(null);
  const [integrations, setIntegrations] = useState(null);
  const [integrationForm, setIntegrationForm] = useState({
    g2bulkApiKey: "",
    smtpHost: "",
    smtpPort: 465,
    smtpUser: "",
    smtpPass: "",
    smtpFrom: "",
  });
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingG2bulk, setTestingG2bulk] = useState(false);
  const [twoFaStatus, setTwoFaStatus] = useState(null);
  const [twoFaSetup, setTwoFaSetup] = useState(null);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaDisablePassword, setTwoFaDisablePassword] = useState("");
  const [twoFaDisableCode, setTwoFaDisableCode] = useState("");
  const [twoFaBackupCodes, setTwoFaBackupCodes] = useState(null);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const logoRef = useRef(null);
  const faviconRef = useRef(null);

  const fetchSettings = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [shopRes, intRes, tfaRes] = await Promise.all([
        adminApi.getShopSettings(),
        adminApi.getIntegrationSettings(),
        adminApi.get2faStatus().catch(() => ({ data: null })),
      ]);
      const shopData = shopRes.data;
      setShop(shopData);
      setIntegrations(intRes.data);
      setTwoFaStatus(tfaRes.data);
      setIntegrationForm({
        g2bulkApiKey: "",
        smtpHost: intRes.data?.smtpHost || "",
        smtpPort: intRes.data?.smtpPort ?? 465,
        smtpUser: intRes.data?.smtpUser || "",
        smtpPass: "",
        smtpFrom: intRes.data?.smtpFrom || "",
      });
      setTestEmail(shopData?.contactEmail || "");
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const patchShop = (patch) => setShop((prev) => ({ ...prev, ...patch }));

  const patchFlag = (key, value) => {
    setShop((prev) => ({
      ...prev,
      featureFlags: { ...prev.featureFlags, [key]: value },
    }));
  };

  const saveShop = async (payload, label = "Settings saved") => {
    setSaving(true);
    try {
      const res = await adminApi.updateShopSettings(payload);
      setShop(res.data);
      toast.success(label);
    } catch (err) {
      toast.error(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const saveIntegrations = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        smtpHost: integrationForm.smtpHost || null,
        smtpPort: Number(integrationForm.smtpPort) || 465,
        smtpUser: integrationForm.smtpUser || null,
        smtpFrom: integrationForm.smtpFrom || null,
      };
      if (integrationForm.g2bulkApiKey.trim()) {
        payload.g2bulkApiKey = integrationForm.g2bulkApiKey.trim();
      }
      if (integrationForm.smtpPass.trim()) {
        payload.smtpPass = integrationForm.smtpPass.trim();
      }
      const res = await adminApi.updateIntegrationSettings(payload);
      setIntegrations(res.data);
      setIntegrationForm((f) => ({ ...f, g2bulkApiKey: "", smtpPass: "" }));
      toast.success("Integration settings saved");
    } catch (err) {
      toast.error(err?.message || "Failed to save integrations");
    } finally {
      setSaving(false);
    }
  };

  const runSmtpTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Enter a test email address");
      return;
    }
    setTestingSmtp(true);
    try {
      await adminApi.testSmtp(testEmail.trim());
      toast.success("Test email sent");
    } catch (err) {
      toast.error(err?.message || "SMTP test failed");
    } finally {
      setTestingSmtp(false);
    }
  };

  const runG2bulkTest = async () => {
    setTestingG2bulk(true);
    try {
      const pendingKey = integrationForm.g2bulkApiKey.trim();
      if (pendingKey) {
        await adminApi.updateIntegrationSettings({ g2bulkApiKey: pendingKey });
        setIntegrationForm((f) => ({ ...f, g2bulkApiKey: "" }));
        const intRes = await adminApi.getIntegrationSettings();
        setIntegrations(intRes.data);
      }
      const res = await adminApi.testG2bulkConnection();
      toast.success(res.data?.message || "G2Bulk connection OK");
    } catch (err) {
      toast.error(err?.message || "G2Bulk connection failed");
    } finally {
      setTestingG2bulk(false);
    }
  };

  const uploadBranding = async (file, field) => {
    if (!file) return;
    try {
      const res = await adminApi.uploadFile(file);
      const url = res.data?.url;
      if (!url) throw new Error("No URL returned");
      patchShop({ [field]: url });
      toast.success("Image uploaded — save settings to apply");
    } catch {
      toast.error("Upload failed");
    }
  };

  const updatePaymentAccount = (index, patch) => {
    const accounts = [...(shop.paymentAccounts || [])];
    accounts[index] = { ...accounts[index], ...patch };
    patchShop({ paymentAccounts: accounts });
  };

  const addPaymentAccount = () => {
    const accounts = [...(shop.paymentAccounts || [])];
    accounts.push({
      id: `method-${Date.now()}`,
      name: "",
      accountNumber: "",
      accountHolder: shop.shopName || "",
      enabled: true,
    });
    patchShop({ paymentAccounts: accounts });
  };

  const removePaymentAccount = (index) => {
    const accounts = (shop.paymentAccounts || []).filter((_, i) => i !== index);
    patchShop({ paymentAccounts: accounts });
  };

  if (loading || !shop) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-3xl font-extrabold text-transparent">
            Settings
          </h1>
          <p className="mt-2 text-blue-600">Configure your store settings</p>
          {shop.updatedAt ? (
            <p className="mt-1 text-xs text-blue-400">
              Last updated {new Date(shop.updatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => fetchSettings(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
        >
          <RefreshIcon sx={{ fontSize: 18 }} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-md"
                : "border border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <SettingsCard title="General & branding" onSubmit={(e) => {
          e.preventDefault();
          saveShop({
            shopName: shop.shopName,
            shopTagline: shop.shopTagline || null,
            contactEmail: shop.contactEmail || null,
            contactPhone: shop.contactPhone || null,
            supportTelegram: shop.supportTelegram || null,
            liveChatUrl: shop.liveChatUrl || null,
            logoUrl: shop.logoUrl || null,
            faviconUrl: shop.faviconUrl || null,
            maintenanceMode: shop.maintenanceMode,
            maintenanceMessage: shop.maintenanceMessage || null,
          }, "General settings saved");
        }} saving={saving}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shop name">
              <input className={INPUT} value={shop.shopName || ""} onChange={(e) => patchShop({ shopName: e.target.value })} required />
            </Field>
            <Field label="Tagline (footer / about)">
              <input className={INPUT} value={shop.shopTagline || ""} onChange={(e) => patchShop({ shopTagline: e.target.value })} />
              <p className="mt-1 text-xs text-blue-400">Top scrolling bar: Admin → Content → Announcements</p>
            </Field>
            <Field label="Contact email">
              <input type="email" className={INPUT} value={shop.contactEmail || ""} onChange={(e) => patchShop({ contactEmail: e.target.value })} />
            </Field>
            <Field label="Contact phone">
              <input className={INPUT} value={shop.contactPhone || ""} onChange={(e) => patchShop({ contactPhone: e.target.value })} />
            </Field>
            <Field label="Support Telegram">
              <input className={INPUT} value={shop.supportTelegram || ""} onChange={(e) => patchShop({ supportTelegram: e.target.value })} placeholder="@username or t.me/..." />
            </Field>
            <Field label="Live chat URL">
              <input className={INPUT} value={shop.liveChatUrl || ""} onChange={(e) => patchShop({ liveChatUrl: e.target.value })} placeholder="https://" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <BrandingField
              label="Logo"
              url={shop.logoUrl}
              onUrlChange={(v) => patchShop({ logoUrl: v })}
              onUpload={() => logoRef.current?.click()}
              inputRef={logoRef}
              onFile={(f) => uploadBranding(f, "logoUrl")}
            />
            <BrandingField
              label="Favicon"
              url={shop.faviconUrl}
              onUrlChange={(v) => patchShop({ faviconUrl: v })}
              onUpload={() => faviconRef.current?.click()}
              inputRef={faviconRef}
              onFile={(f) => uploadBranding(f, "faviconUrl")}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={Boolean(shop.maintenanceMode)}
                onChange={(e) => patchShop({ maintenanceMode: e.target.checked })}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm font-bold text-slate-800">Maintenance mode</span>
            </label>
            <p className="mt-1 text-xs text-slate-600">When enabled, customers see a maintenance message instead of the store.</p>
            {shop.maintenanceMode ? (
              <textarea
                rows={2}
                className={`${INPUT} mt-3`}
                value={shop.maintenanceMessage || ""}
                onChange={(e) => patchShop({ maintenanceMessage: e.target.value })}
                placeholder="Maintenance message for customers…"
              />
            ) : null}
          </div>
        </SettingsCard>
      )}

      {tab === "payments" && (
        <SettingsCard title="Payment methods" onSubmit={(e) => {
          e.preventDefault();
          saveShop({ paymentAccounts: shop.paymentAccounts }, "Payment methods saved");
        }} saving={saving}>
          <p className="text-sm text-blue-600">These accounts are shown to customers during checkout and wallet top-up.</p>
          <div className="space-y-3">
            {(shop.paymentAccounts || []).map((account, index) => (
              <div key={account.id || index} className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                    <input
                      type="checkbox"
                      checked={account.enabled !== false}
                      onChange={(e) => updatePaymentAccount(index, { enabled: e.target.checked })}
                    />
                    Enabled
                  </label>
                  {(shop.paymentAccounts || []).length > 1 ? (
                    <button type="button" onClick={() => removePaymentAccount(index)} className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-100">
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Method name">
                    <input className={INPUT} value={account.name} onChange={(e) => updatePaymentAccount(index, { name: e.target.value })} />
                  </Field>
                  <Field label="Account number">
                    <input className={INPUT} value={account.accountNumber} onChange={(e) => updatePaymentAccount(index, { accountNumber: e.target.value })} />
                  </Field>
                  <Field label="Account holder" className="sm:col-span-2">
                    <input className={INPUT} value={account.accountHolder} onChange={(e) => updatePaymentAccount(index, { accountHolder: e.target.value })} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addPaymentAccount} className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
            <AddIcon sx={{ fontSize: 18 }} />
            Add payment method
          </button>
        </SettingsCard>
      )}

      {tab === "pricing" && (
        <SettingsCard
          title="Pricing & wallet"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              await adminApi.updateShopSettings({ minWalletTopup: Number(shop.minWalletTopup) });
              const res = await adminApi.updateExchangeSettings({
                usdToMmkRate: Number(shop.usdToMmkRate),
                priceMarkupPercent: Number(shop.priceMarkupPercent),
              });
              patchShop(res.data);
              toast.success("Pricing settings saved");
            } catch (err) {
              toast.error(err?.message || "Failed to save pricing");
            } finally {
              setSaving(false);
            }
          }}
          saving={saving}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="USD → MMK rate">
              <input type="number" min={1} className={INPUT} value={shop.usdToMmkRate ?? 0} onChange={(e) => patchShop({ usdToMmkRate: Number(e.target.value) })} />
            </Field>
            <Field label="Price markup (%)">
              <input type="number" min={0} step={0.1} className={INPUT} value={shop.priceMarkupPercent ?? 0} onChange={(e) => patchShop({ priceMarkupPercent: Number(e.target.value) })} />
            </Field>
            <Field label="Minimum wallet top-up (MMK)">
              <input type="number" min={1} className={INPUT} value={shop.minWalletTopup ?? 1000} onChange={(e) => patchShop({ minWalletTopup: Number(e.target.value) })} />
            </Field>
          </div>
          <p className="text-xs text-blue-500">
            Product prices are calculated from supplier USD cost × rate × (1 + markup%).
          </p>
        </SettingsCard>
      )}

      {tab === "features" && (
        <SettingsCard title="Feature toggles" onSubmit={(e) => {
          e.preventDefault();
          saveShop({ featureFlags: shop.featureFlags }, "Feature settings saved");
        }} saving={saving}>
          <p className="text-sm text-blue-600">Turn store features on or off without deploying code.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(FEATURE_LABELS).map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-blue-100 bg-white px-4 py-3 hover:bg-blue-50/50">
                <input
                  type="checkbox"
                  checked={shop.featureFlags?.[key] !== false}
                  onChange={(e) => patchFlag(key, e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm font-medium text-blue-900">{label}</span>
              </label>
            ))}
          </div>
        </SettingsCard>
      )}

      {tab === "g2bulk" && (
        <SettingsCard title="G2Bulk monitoring" onSubmit={(e) => {
          e.preventDefault();
          saveShop({
            g2bulkLowBalanceThreshold: shop.g2bulkLowBalanceThreshold === "" || shop.g2bulkLowBalanceThreshold == null
              ? null
              : Number(shop.g2bulkLowBalanceThreshold),
            g2bulkPriceAlertMinPct: Number(shop.g2bulkPriceAlertMinPct),
            g2bulkPriceAlertMinUsd: Number(shop.g2bulkPriceAlertMinUsd),
            g2bulkAutoPriceSync: shop.g2bulkAutoPriceSync,
          }, "G2Bulk settings saved");
        }} saving={saving}>
          <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
            <input
              type="checkbox"
              checked={shop.g2bulkAutoPriceSync !== false}
              onChange={(e) => patchShop({ g2bulkAutoPriceSync: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            <div>
              <p className="text-sm font-semibold text-blue-900">Auto price sync</p>
              <p className="text-xs text-blue-500">Automatically sync product prices when supplier costs change.</p>
            </div>
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Low balance alert (USD)">
              <input
                type="number"
                min={0}
                step={0.01}
                className={INPUT}
                value={shop.g2bulkLowBalanceThreshold ?? ""}
                onChange={(e) => patchShop({ g2bulkLowBalanceThreshold: e.target.value === "" ? null : Number(e.target.value) })}
                placeholder="e.g. 10"
              />
            </Field>
            <Field label="Min price change (%)">
              <input type="number" min={0} max={100} step={0.1} className={INPUT} value={shop.g2bulkPriceAlertMinPct ?? 2} onChange={(e) => patchShop({ g2bulkPriceAlertMinPct: Number(e.target.value) })} />
            </Field>
            <Field label="Min price change (USD)">
              <input type="number" min={0} step={0.01} className={INPUT} value={shop.g2bulkPriceAlertMinUsd ?? 0.25} onChange={(e) => patchShop({ g2bulkPriceAlertMinUsd: Number(e.target.value) })} />
            </Field>
          </div>
          {integrations ? (
            <p className="text-xs text-blue-500">
              API key: {integrations.g2bulkApiKeyConfigured ? `Configured (${integrations.g2bulkApiKeyMasked})` : "Not set — add in Email & API tab, then use Test connection"}
            </p>
          ) : null}
          <p className="text-xs text-blue-400">
            Price checks run every 10 minutes. First run saves baseline prices; alerts appear when supplier costs rise on the next check.
          </p>
        </SettingsCard>
      )}

      {tab === "integrations" && (
        <SettingsCard title="Email & API keys" onSubmit={saveIntegrations} saving={saving}>
          <div className="space-y-6">
            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-500">G2Bulk API</h3>
              <Field label={`API key ${integrations?.g2bulkApiKeyConfigured ? `(current: ${integrations.g2bulkApiKeyMasked})` : ""}`}>
                <input
                  type="password"
                  className={INPUT}
                  value={integrationForm.g2bulkApiKey}
                  onChange={(e) => setIntegrationForm((f) => ({ ...f, g2bulkApiKey: e.target.value }))}
                  placeholder={integrations?.g2bulkApiKeyConfigured ? "Leave blank to keep current key" : "Enter API key"}
                  autoComplete="new-password"
                />
              </Field>
              <p className="mt-2 text-xs text-blue-400">
                Paste your key and click Test — it saves automatically. Or set G2BULK_API_KEY in backend/.env and restart the backend.
              </p>
              {integrations?.g2bulkApiKeySource ? (
                <p className="mt-1 text-xs text-blue-400">Source: {integrations.g2bulkApiKeySource}</p>
              ) : null}
              <button
                type="button"
                onClick={runG2bulkTest}
                disabled={testingG2bulk}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
              >
                <HubIcon sx={{ fontSize: 18 }} />
                {testingG2bulk ? "Testing…" : "Test G2Bulk connection"}
              </button>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-500">SMTP email</h3>
              <p className="mb-4 text-sm text-slate-600">
                cPanel Secure SSL/TLS: host <strong>rankage.shop</strong>, port <strong>465</strong>, user{" "}
                <strong>support@rankage.shop</strong> (full email + mailbox password).
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="SMTP host">
                  <input className={INPUT} value={integrationForm.smtpHost} onChange={(e) => setIntegrationForm((f) => ({ ...f, smtpHost: e.target.value }))} placeholder="rankage.shop" />
                </Field>
                <Field label="SMTP port (SSL)">
                  <input type="number" className={INPUT} value={integrationForm.smtpPort} onChange={(e) => setIntegrationForm((f) => ({ ...f, smtpPort: Number(e.target.value) }))} placeholder="465" />
                </Field>
                <Field label="SMTP user">
                  <input className={INPUT} value={integrationForm.smtpUser} onChange={(e) => setIntegrationForm((f) => ({ ...f, smtpUser: e.target.value }))} placeholder="support@rankage.shop" />
                </Field>
                <Field label={`SMTP password ${integrations?.smtpPassConfigured ? `(current: ${integrations.smtpPassMasked})` : ""}`}>
                  <input
                    type="password"
                    className={INPUT}
                    value={integrationForm.smtpPass}
                    onChange={(e) => setIntegrationForm((f) => ({ ...f, smtpPass: e.target.value }))}
                    placeholder="Leave blank to keep current"
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="From address" className="sm:col-span-2">
                  <input className={INPUT} value={integrationForm.smtpFrom} onChange={(e) => setIntegrationForm((f) => ({ ...f, smtpFrom: e.target.value }))} placeholder="RanKageShop <support@rankage.shop>" />
                </Field>
              </div>
              {integrations?.smtpConfigured ? (
                <span className="mt-2 inline-block rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">SMTP configured</span>
              ) : (
                <span className="mt-2 inline-block rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">SMTP not configured</span>
              )}
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
              <h3 className="mb-2 text-sm font-bold text-blue-900">Test email</h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  className={`${INPUT} flex-1`}
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
                <button
                  type="button"
                  onClick={runSmtpTest}
                  disabled={testingSmtp}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  <SendIcon sx={{ fontSize: 16 }} />
                  {testingSmtp ? "Sending…" : "Send test"}
                </button>
              </div>
            </section>
          </div>
        </SettingsCard>
      )}

      {tab === "security" && (
        <div className="rounded-3xl border border-blue-200/70 bg-white/90 p-7 shadow-xl shadow-blue-200/60">
          <h2 className="mb-2 text-xl font-bold text-blue-900">Two-factor authentication (2FA)</h2>
          <p className="mb-6 text-sm text-blue-600">
            Protect admin login with an authenticator app (Google Authenticator, Authy, etc.).
          </p>

          {twoFaStatus?.enabled ? (
            <div className="space-y-4">
              <span className="inline-block rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-800">
                2FA is enabled
              </span>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Current password">
                  <input
                    type="password"
                    className={INPUT}
                    value={twoFaDisablePassword}
                    onChange={(e) => setTwoFaDisablePassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </Field>
                <Field label="Authenticator or backup code">
                  <input
                    className={INPUT}
                    value={twoFaDisableCode}
                    onChange={(e) => setTwoFaDisableCode(e.target.value)}
                    placeholder="6-digit code"
                  />
                </Field>
              </div>
              <button
                type="button"
                disabled={twoFaLoading}
                onClick={async () => {
                  setTwoFaLoading(true);
                  try {
                    await adminApi.disable2fa(twoFaDisablePassword, twoFaDisableCode.trim());
                    toast.success("2FA disabled");
                    setTwoFaStatus({ enabled: false });
                    setTwoFaSetup(null);
                    setTwoFaDisablePassword("");
                    setTwoFaDisableCode("");
                  } catch (err) {
                    toast.error(err?.message || "Failed to disable 2FA");
                  } finally {
                    setTwoFaLoading(false);
                  }
                }}
                className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-200 disabled:opacity-50"
              >
                {twoFaLoading ? "Working…" : "Disable 2FA"}
              </button>
            </div>
          ) : twoFaSetup ? (
            <div className="space-y-4">
              <p className="text-sm text-blue-700">
                Scan the QR code or enter the secret in your authenticator app, then enter the 6-digit code to enable.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(twoFaSetup.otpauthUrl)}`}
                  alt="2FA QR code"
                  className="rounded-xl border border-blue-200 bg-white p-2"
                  width={180}
                  height={180}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-500">Manual secret</p>
                  <code className="block break-all rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-900">
                    {twoFaSetup.secret}
                  </code>
                </div>
              </div>
              <Field label="Verification code">
                <input
                  className={INPUT}
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={twoFaLoading || !twoFaCode.trim()}
                  onClick={async () => {
                    setTwoFaLoading(true);
                    try {
                      const res = await adminApi.enable2fa(twoFaCode.trim());
                      setTwoFaStatus({ enabled: true });
                      setTwoFaBackupCodes(res.data?.backupCodes || []);
                      setTwoFaSetup(null);
                      setTwoFaCode("");
                      toast.success("2FA enabled");
                    } catch (err) {
                      toast.error(err?.message || "Invalid code");
                    } finally {
                      setTwoFaLoading(false);
                    }
                  }}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {twoFaLoading ? "Verifying…" : "Enable 2FA"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTwoFaSetup(null);
                    setTwoFaCode("");
                  }}
                  className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={twoFaLoading}
              onClick={async () => {
                setTwoFaLoading(true);
                try {
                  const res = await adminApi.setup2fa();
                  setTwoFaSetup(res.data);
                  setTwoFaBackupCodes(null);
                } catch (err) {
                  toast.error(err?.message || "Failed to start 2FA setup");
                } finally {
                  setTwoFaLoading(false);
                }
              }}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {twoFaLoading ? "Starting…" : "Set up 2FA"}
            </button>
          )}

          {twoFaBackupCodes?.length ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-bold text-amber-900">Save these backup codes</p>
              <p className="mt-1 text-sm text-amber-800">
                Each code works once if you lose your authenticator. Store them somewhere safe.
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {twoFaBackupCodes.map((code) => (
                  <li key={code} className="rounded-lg bg-white px-3 py-2 font-mono text-sm text-blue-900">
                    {code}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SettingsCard({ title, children, onSubmit, saving }) {
  return (
    <div className="rounded-3xl border border-blue-200/70 bg-white/90 p-7 shadow-xl shadow-blue-200/60">
      <h2 className="mb-6 text-xl font-bold text-blue-900">{title}</h2>
      <form onSubmit={onSubmit} className="space-y-5">
        {children}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:opacity-90 disabled:opacity-50 sm:w-auto"
        >
          <SaveIcon sx={{ fontSize: 18 }} />
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-semibold text-blue-700">{label}</span>
      {children}
    </label>
  );
}

function BrandingField({ label, url, onUrlChange, onUpload, inputRef, onFile }) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input className={`${INPUT} flex-1`} value={url || ""} onChange={(e) => onUrlChange(e.target.value)} placeholder="/uploads/..." />
        <button type="button" onClick={onUpload} className="shrink-0 rounded-xl border border-blue-200 px-3 py-2 text-blue-700 hover:bg-blue-50">
          <UploadIcon sx={{ fontSize: 18 }} />
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      {url ? (
        <img src={resolveUploadUrl(url)} alt="" className="mt-2 h-12 w-12 rounded-lg border border-blue-100 object-contain" />
      ) : null}
    </Field>
  );
}
