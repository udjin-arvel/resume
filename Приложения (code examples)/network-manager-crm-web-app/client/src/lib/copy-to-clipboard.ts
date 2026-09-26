function copyWithExecCommand(text: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  try {
    const ok = document.execCommand("copy");
    if (!ok) {
      throw new Error("execCommand copy failed");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

/** Copy text to clipboard. Works on HTTP (unlike navigator.clipboard alone). */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof document === "undefined") {
    throw new Error("Clipboard unavailable");
  }

  if (typeof window !== "undefined" && window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through to legacy copy
    }
  }

  copyWithExecCommand(text);
}
