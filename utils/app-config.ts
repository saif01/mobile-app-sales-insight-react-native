import Constants from 'expo-constants';

type ExtraConfig = {
  appUat?: boolean;
  webViewToken?: string;
};

function toObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function getExtraFromManifest2(): ExtraConfig | null {
  const manifest2 = toObject((Constants as { manifest2?: unknown }).manifest2);
  const extra = toObject(manifest2?.extra);
  const expoClient = toObject(extra?.expoClient);
  const expoClientExtra = toObject(expoClient?.extra);

  return expoClientExtra as ExtraConfig | null;
}

export function getAppExtra(): ExtraConfig {
  const expoConfigExtra = toObject(Constants.expoConfig?.extra);
  if (expoConfigExtra) {
    return expoConfigExtra as ExtraConfig;
  }

  const manifestExtra = toObject((Constants as { manifest?: { extra?: unknown } }).manifest?.extra);
  if (manifestExtra) {
    return manifestExtra as ExtraConfig;
  }

  return getExtraFromManifest2() ?? {};
}

export function isUatEnabled(): boolean {
  return getAppExtra().appUat === true;
}

export function getWebViewToken(): string {
  const token = getAppExtra().webViewToken;
  return typeof token === 'string' ? token.trim() : '';
}

export function getAppName(): string {
  const name = Constants.expoConfig?.name;
  return typeof name === 'string' && name.trim().length > 0 ? name.trim() : 'SalesInsight';
}
