import { APP_VERSION } from '@/constants/app-version';
import { getMobileDetailsForLogin } from '@/utils/deviceInfo';
import axios from 'axios';

// const AUTH_ENDPOINT = 'https://it-uat.cpbangladesh.com/api/mobileapp/cpbit_auth';
// const AUTH_ENDPOINT = 'http://cpbit/api/mobileapp/cpbit_auth';
const AUTH_ENDPOINT = 'https://it.cpbangladesh.com/api/mobileapp/cpbit_auth';

/** Base URL (origin) of the auth API, for building asset URLs e.g. user images. */
export function getAuthHost(): string {
  try {
    const url = new URL(AUTH_ENDPOINT);
    return url.origin;
  } catch {
    return 'https://it.cpbangladesh.com';
  }
}

function getLoginPayload(login: string, pass: string): Record<string, string> {
  const body: Record<string, string> = { login, password: pass };
  try {
    if (typeof APP_VERSION === 'string') body.app_version = APP_VERSION;
    body.mobile_details = getMobileDetailsForLogin();
  } catch {
    // omit app_version / mobile_details if they throw (e.g. Platform not available)
  }
  return body;
}

const DEMO_LOGIN = 'syful.isl';
const DEMO_PASSWORD = 'cpbit@uat';

export type LoginResult = {
  token: string;
  userId: string;
  name?: string;
  image?: string | null;
  message?: string;
  accessPermissions: AccessPermissions;
};

type JsonRecord = Record<string, unknown>;

export type AccessPermissions = {
  canAccessQsrReports: boolean;
  canAccessQsrSales: boolean;
  canAccessQsrSalesSummary: boolean;
};

function isObject(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null;
}

function pickString(source: unknown, keys: string[]): string | null {
  if (!isObject(source)) {
    return null;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

function pickToken(payload: unknown): string | null {
  if (!isObject(payload)) {
    return null;
  }

  const directToken = pickString(payload, ['token', 'access_token', 'accessToken', 'jwt']);
  if (directToken) {
    return directToken;
  }

  const nestedData = payload.data;
  if (nestedData) {
    const nestedToken = pickString(nestedData, ['token', 'access_token', 'accessToken', 'jwt']);
    if (nestedToken) {
      return nestedToken;
    }
  }

  return null;
}

function pickUserName(payload: unknown): string | null {
  const direct = pickString(payload, ['name', 'fullName', 'displayName', 'userName', 'username']);
  if (direct) {
    return direct;
  }

  if (!isObject(payload)) {
    return null;
  }

  const nestedSources = [payload.user, payload.profile, payload.data];
  for (const source of nestedSources) {
    const nested = pickString(source, ['name', 'fullName', 'displayName', 'userName', 'username']);
    if (nested) {
      return nested;
    }
  }

  if (isObject(payload.data)) {
    return pickString(payload.data.user, ['name', 'fullName', 'displayName', 'userName', 'username']);
  }

  return null;
}

function pickUserImage(payload: unknown): string | null {
  const direct = pickString(payload, ['image', 'avatar', 'photo', 'profileImage', 'profile_photo']);
  if (direct) {
    return direct;
  }

  if (!isObject(payload)) {
    return null;
  }

  const nestedSources = [payload.user, payload.profile, payload.data];
  for (const source of nestedSources) {
    const nested = pickString(source, ['image', 'avatar', 'photo', 'profileImage', 'profile_photo']);
    if (nested) {
      return nested;
    }
  }

  if (isObject(payload.data)) {
    return pickString(payload.data.user, ['image', 'avatar', 'photo', 'profileImage', 'profile_photo']);
  }

  return null;
}

function pickMessage(payload: unknown): string | null {
  const direct = pickString(payload, ['message', 'error', 'detail']);
  if (direct) {
    return direct;
  }

  if (isObject(payload) && payload.data) {
    return pickString(payload.data, ['message', 'error', 'detail']);
  }

  return null;
}

function normalizeLoginError(message: string | null, status?: number): string {
  const fallback = 'Login failed. Please verify your credentials.';
  const normalized = message?.trim();
  const lower = normalized?.toLowerCase() ?? '';

  if (status === 401 || status === 403) {
    return 'Invalid login ID or password.';
  }

  if (lower.includes('method not support')) {
    return 'Invalid login ID or password.';
  }

  if (lower.includes('invalid') && (lower.includes('password') || lower.includes('credential'))) {
    return 'Invalid login ID or password.';
  }

  return normalized && normalized.length > 0 ? normalized : fallback;
}

function parseAccessPermissions(payload: unknown): AccessPermissions {
  const visitedCodes = new Set<string>();

  function visitNode(node: unknown) {
    if (!isObject(node)) {
      return;
    }

    const code = typeof node.code === 'string' ? node.code.trim().toLowerCase() : '';
    const name = typeof node.name === 'string' ? node.name.trim().toLowerCase() : '';

    if (code) {
      visitedCodes.add(code);
    }
    if (name === 'qsr') {
      visitedCodes.add('qsr');
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(visitNode);
    }
  }

  function pickAccessList(source: unknown): unknown[] {
    if (!isObject(source)) {
      return [];
    }

    if (Array.isArray(source.access_list)) {
      return source.access_list;
    }

    if (isObject(source.data) && Array.isArray(source.data.access_list)) {
      return source.data.access_list;
    }

    return [];
  }

  pickAccessList(payload).forEach(visitNode);

  const canAccessQsrReports = visitedCodes.has('qsr');
  const canAccessQsrSales = canAccessQsrReports && (visitedCodes.has('qsr_sales') || visitedCodes.has('sale_report'));
  const canAccessQsrSalesSummary =
    canAccessQsrReports &&
    (visitedCodes.has('qsr_sales_summary') || visitedCodes.has('qsr_summary_report'));

  return {
    canAccessQsrReports,
    canAccessQsrSales,
    canAccessQsrSalesSummary,
  };
}

function mockSuccess(userId: string): LoginResult {
  return {
    token: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`,
    userId,
    name: 'Syful Islam',
    image: 'https://i.pravatar.cc/200?u=syful.isl',
    message: 'Logged in with local mock response.',
    accessPermissions: {
      canAccessQsrReports: true,
      canAccessQsrSales: true,
      canAccessQsrSalesSummary: true,
    },
  };
}

export async function loginWithMockApi(loginId: string, password: string): Promise<LoginResult> {
  const login = loginId.trim();
  const pass = password.trim();

  await new Promise((resolve) => setTimeout(resolve, 800));

  try {
    const response = await axios.post(
      AUTH_ENDPOINT,
      getLoginPayload(login, pass),
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const payload = response.data;

    const token = pickToken(payload);
    if (token) {
      return {
        token,
        userId: login,
        name: pickUserName(payload) ?? undefined,
        image: pickUserImage(payload),
        message: pickMessage(payload) ?? undefined,
        accessPermissions: parseAccessPermissions(payload),
      };
    }
  } catch (error) {
    if (login === DEMO_LOGIN && pass === DEMO_PASSWORD) {
      return mockSuccess(login);
    }

    if (axios.isAxiosError(error)) {
      throw new Error(normalizeLoginError(pickMessage(error.response?.data), error.response?.status));
    }

    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unable to complete login. Please try again.');
  }

  if (login === DEMO_LOGIN && pass === DEMO_PASSWORD) {
    return mockSuccess(login);
  }

  throw new Error('Invalid login ID or password.');
}
