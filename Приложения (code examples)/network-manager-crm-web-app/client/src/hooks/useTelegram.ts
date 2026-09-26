import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  ensureTelegramScript,
  getInitData,
  getTelegramTheme,
  getTelegramWebApp,
  initTelegramApp,
  showTelegramAlert,
  showTelegramConfirm,
} from "@/lib/telegram";

export function useTelegram() {
  const router = useRouter();
  const [isTelegram, setIsTelegram] = useState(false);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    let cancelled = false;

    void ensureTelegramScript().then(() => {
      if (cancelled) return;
      const webApp = initTelegramApp();
      setIsTelegram(!!webApp);
      const scheme = getTelegramTheme();
      setColorScheme(scheme);
      document.documentElement.classList.toggle("dark", scheme === "dark");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const initData = useMemo(() => getInitData(), [isTelegram]);

  const showBackButton = useCallback(
    (onBack?: () => void) => {
      const webApp = getTelegramWebApp();
      if (!webApp) return () => {};
      const handler = onBack ?? (() => router.history.back());
      webApp.BackButton.show();
      webApp.BackButton.onClick(handler);
      return () => {
        webApp.BackButton.offClick(handler);
        webApp.BackButton.hide();
      };
    },
    [router],
  );

  const setMainButton = useCallback(
    (text: string, onClick: () => void, visible = true) => {
      const webApp = getTelegramWebApp();
      if (!webApp) return () => {};
      webApp.MainButton.setText(text);
      if (visible) webApp.MainButton.show();
      else webApp.MainButton.hide();
      webApp.MainButton.onClick(onClick);
      return () => {
        webApp.MainButton.offClick(onClick);
        webApp.MainButton.hide();
      };
    },
    [],
  );

  return {
    isTelegram,
    initData,
    colorScheme,
    showAlert: showTelegramAlert,
    showConfirm: showTelegramConfirm,
    showBackButton,
    setMainButton,
  };
}
