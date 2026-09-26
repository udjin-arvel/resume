export function useCopyToClipboard() {
  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    }
    catch {
      // clipboard access denied — silently ignore, the link is still visible to copy manually
      return false
    }
  }

  return { copy }
}
