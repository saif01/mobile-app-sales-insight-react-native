import { Platform } from 'react-native';

/**
 * Returns a JSON string of device/platform details for login log.
 * Safe to call in tests (expo-constants may be undefined).
 */
export function getMobileDetailsForLogin(): string {
  try {
    const details: Record<string, unknown> = {
      platform: Platform.OS,
      version: Platform.Version,
    };
    const Constants = require('expo-constants').default;
    if (Constants?.deviceName != null) {
      details.deviceName = Constants.deviceName;
    }
    if (Constants?.platform != null) {
      details.platformInfo = Constants.platform;
    }
    return JSON.stringify(details);
  } catch {
    return JSON.stringify({ platform: Platform.OS ?? 'unknown', version: Platform.Version ?? '' });
  }
}
