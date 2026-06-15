import { NativeModules, Platform } from 'react-native';
import * as Device from 'expo-device';
import { GENERATED_LOCAL_API_HOST } from './generatedLocalHost';

/**
 * API Configuration - Auto-detects dev environment
 *
 * Dev mode: Detectează automat IP-ul local din environment variable
 * Prod mode: Folosește backend-ul cloud (Render)
 *
 * Setup: Rulează `npm run setup` înainte de `npm start`
 */

const DEV_BACKEND_PORT = process.env.EXPO_PUBLIC_API_PORT || '3000';
const PROD_API_URL = 'https://your-app.onrender.com/api';
const DEV_API_URL = process.env.EXPO_PUBLIC_API_URL;

// Citește IP din environment variable (setat de scripts/get-local-ip.js)
const DEV_LAN_IP = process.env.EXPO_PUBLIC_API_HOST || GENERATED_LOCAL_API_HOST || 'localhost';

const getMetroHost = (): string | null => {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
    if (!scriptURL) {
      return null;
    }

    return new URL(scriptURL).hostname;
  } catch {
    return null;
  }
};

const getDevHost = (): string => {
  const metroHost = getMetroHost();

  if (Platform.OS === 'android') {
    // Android emulator nu vede localhost-ul mașinii host; folosește 10.0.2.2.
    if (!Device.isDevice) {
      return metroHost && !isLoopbackHost(metroHost) ? metroHost : '10.0.2.2';
    }

    return metroHost && !isLoopbackHost(metroHost) ? metroHost : DEV_LAN_IP;
  }

  if (Platform.OS === 'ios') {
    if (Device.isDevice) {
      return metroHost && !isLoopbackHost(metroHost) ? metroHost : DEV_LAN_IP;
    }

    return metroHost || 'localhost';
  }

  return metroHost || DEV_LAN_IP;
};

const isLoopbackHost = (host: string): boolean => {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
};

const getResolvedDevApiUrl = (): string => {
  const resolvedHost = getDevHost();
  const fallback = `http://${resolvedHost}:${DEV_BACKEND_PORT}/api`;

  if (!DEV_API_URL) {
    return fallback;
  }

  try {
    const parsed = new URL(DEV_API_URL);

    // If env URL points to localhost, rewrite it for the current runtime target.
    if (isLoopbackHost(parsed.hostname)) {
      if (Platform.OS === 'android' && !Device.isDevice) {
        parsed.hostname = '10.0.2.2';
      } else if (Device.isDevice) {
        parsed.hostname = resolvedHost;
      }
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return fallback;
  }
};

const dedupeUrls = (urls: string[]): string[] => {
  return Array.from(new Set(urls.filter(Boolean).map((url) => url.replace(/\/$/, ''))));
};

export const getDevApiUrlCandidates = (): string[] => {
  const lanUrl = `http://${DEV_LAN_IP}:${DEV_BACKEND_PORT}/api`;
  const localhostUrl = `http://localhost:${DEV_BACKEND_PORT}/api`;
  const androidEmulatorUrl = `http://10.0.2.2:${DEV_BACKEND_PORT}/api`;
  const resolved = getResolvedDevApiUrl();

  if (Platform.OS === 'android') {
    return Device.isDevice
      ? dedupeUrls([resolved, lanUrl, localhostUrl])
      : dedupeUrls([resolved, androidEmulatorUrl, localhostUrl, lanUrl]);
  }

  if (Platform.OS === 'ios') {
    return Device.isDevice
      ? dedupeUrls([resolved, lanUrl, localhostUrl])
      : dedupeUrls([resolved, localhostUrl, lanUrl]);
  }

  return dedupeUrls([resolved, lanUrl, localhostUrl]);
};

export const API_URL = __DEV__
  ? getResolvedDevApiUrl()
  : PROD_API_URL;
