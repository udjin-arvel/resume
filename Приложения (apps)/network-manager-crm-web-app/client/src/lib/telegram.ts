const TELEGRAM_SDK_URL = "https://telegram.org/js/telegram-web-app.js";
const SDK_LOAD_TIMEOUT_MS = 8_000;

let sdkLoadPromise: Promise<void> | null = null;

/** True when opened inside Telegram WebView or SDK is already present. */
export function isLikelyTelegramMiniApp(): boolean {
  if (typeof window === "undefined") return false;
  if (window.Telegram?.WebApp) return true;
  if (/Telegram/i.test(navigator.userAgent)) return true;
  const href = window.location.href;
  return href.includes("tgWebAppData") || href.includes("tgwebappdata");
}

/** Loads telegram-web-app.js only in Mini App context; no-op in a regular browser. */
export function ensureTelegramScript(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (window.Telegram?.WebApp) return Promise.resolve();
  if (!isLikelyTelegramMiniApp()) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve) => {
    const finish = () => resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TELEGRAM_SDK_URL}"]`,
    );
    if (existing) {
      if (window.Telegram?.WebApp) {
        finish();
        return;
      }
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", finish, { once: true });
      window.setTimeout(finish, SDK_LOAD_TIMEOUT_MS);
      return;
    }

    const script = document.createElement("script");
    script.src = TELEGRAM_SDK_URL;
    script.async = true;

    const timeoutId = window.setTimeout(finish, SDK_LOAD_TIMEOUT_MS);
    script.onload = () => {
      window.clearTimeout(timeoutId);
      finish();
    };
    script.onerror = () => {
      window.clearTimeout(timeoutId);
      finish();
    };
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

type TelegramWebApp = {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  ready: () => void;
  expand: () => void;
  close: () => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  MainButton: {
    text: string;
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    setText: (text: string) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
};

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

export function getInitData(): string {
  return getTelegramWebApp()?.initData ?? "";
}

export function initTelegramApp(): TelegramWebApp | null {
  const webApp = getTelegramWebApp();
  if (!webApp) return null;

  webApp.ready();
  webApp.expand();
  return webApp;
}

export function getTelegramTheme(): "light" | "dark" {
  return getTelegramWebApp()?.colorScheme ?? "light";
}

export function showTelegramAlert(message: string): void {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.showAlert(message);
    return;
  }
  window.alert(message);
}

export function showTelegramConfirm(
  message: string,
): Promise<boolean> {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    return Promise.resolve(window.confirm(message));
  }

  return new Promise((resolve) => {
    webApp.showConfirm(message, resolve);
  });
}

export function normalizeTelegramUsername(value: string) {
  return value.trim().replace(/^@+/, "");
}

export function formatTelegramDisplay(username?: string | null) {
  if (!username) return "—";
  return username.startsWith("@") ? username : `@${username}`;
}
