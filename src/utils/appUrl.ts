export function getAppUrl(): string {
  const configuredUrl = import.meta.env.VITE_APP_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:5173';
}

export function isLocalhost(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'localhost' ||
           urlObj.hostname === '127.0.0.1' ||
           urlObj.hostname === '0.0.0.0' ||
           urlObj.hostname.endsWith('.local');
  } catch {
    return false;
  }
}

export function isDevelopmentMode(): boolean {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
}

export function getInviteUrl(token: string): string {
  const baseUrl = getAppUrl();
  return `${baseUrl}/invite/${token}`;
}

export function validateInviteUrl(url: string): { valid: boolean; warning?: string; error?: string } {
  if (!url) {
    return { valid: false, error: 'URL is empty' };
  }

  if (isLocalhost(url)) {
    if (isDevelopmentMode()) {
      return {
        valid: true,
        warning: 'Invite URL uses localhost. Recipients will not be able to access this link. Use ngrok or a similar service for testing invite emails in development.'
      };
    } else {
      return {
        valid: false,
        error: 'Cannot send invite emails with localhost URLs in production. Please configure VITE_APP_URL environment variable.'
      };
    }
  }

  try {
    const urlObj = new URL(url);
    if (!urlObj.protocol.startsWith('http')) {
      return { valid: false, error: 'URL must use http or https protocol' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}
