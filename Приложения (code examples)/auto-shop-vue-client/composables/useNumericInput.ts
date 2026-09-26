import type { NumericInputOptions } from "~/types/common/input"

export function useNumericInput(options: NumericInputOptions = {}) {
  const {
    maxLength = 10,
    allowDecimal = false,
    allowNegative = false,
    allowSpaces = false,
  } = options

  const allowedKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "Escape",
    "Enter",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
  ]

  function filterKeyPress(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      return
    }

    if (allowedKeys.includes(event.key)) {
      return
    }
    if (/^[0-9]$/.test(event.key)) {
      return
    }
    if (allowNegative && event.key === "-") {
      return
    }
    if (allowDecimal && (event.key === "." || event.key === ",")) {
      return
    }
    if (allowSpaces && event.key === " ") {
      return
    }

    event.preventDefault()
  }

  function handlePaste(event: ClipboardEvent, onUpdate: (value: string) => void): void {
    const pastedText = event.clipboardData?.getData("text") || ""
    onUpdate(pastedText)
  }

  function sanitize(value: string | number): string {
    const str = String(value)
    let sanitized = str.replace(/\D/g, "")
    if (maxLength) {
      sanitized = sanitized.slice(0, maxLength)
    }
    return sanitized
  }

  return {
    filterKeyPress,
    handlePaste,
    sanitize,
  }
}
