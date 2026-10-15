const CYRILLIC_MULTI: Record<string, string> = {
  shch: "shch",
  sh: "sh",
  ch: "ch",
  kh: "kh",
  ts: "ts",
  zh: "zh",
  yu: "yu",
  ya: "ya",
  yo: "yo",
  ye: "ye",
}

const CYRILLIC_SINGLE: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
}

function transliterateCyrillicChar(char: string, nextChar?: string): string {
  const lower = char.toLowerCase()
  const pair = nextChar ? lower + nextChar.toLowerCase() : lower

  if (nextChar && CYRILLIC_MULTI[pair]) {
    return applyCase(CYRILLIC_MULTI[pair], char, nextChar)
  }

  if (CYRILLIC_MULTI[lower]) {
    return applyCase(CYRILLIC_MULTI[lower], char)
  }

  const latin = CYRILLIC_SINGLE[lower]
  if (latin === undefined) {
    return char
  }

  return applyCase(latin, char)
}

function applyCase(latin: string, ...sourceChars: string[]): string {
  const isUpper = sourceChars.every(char => char === char.toUpperCase() && char !== char.toLowerCase())

  if (!isUpper) {
    return latin
  }

  if (latin.length === 1) {
    return latin.toUpperCase()
  }

  return latin.charAt(0).toUpperCase() + latin.slice(1)
}

function isCyrillic(char: string): boolean {
  return /[\u0400-\u04FF]/.test(char)
}

/**
 * Transliterate Cyrillic text to Latin (BGN-style) for invoice fields.
 * Example: Ксения → Kseniya
 */
export function transliterateToLatin(value: string): string {
  if (!value) {
    return value
  }

  let result = ""

  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    const nextChar = value[i + 1]

    if (!isCyrillic(char)) {
      result += char
      continue
    }

    const lower = char.toLowerCase()
    const pair = nextChar ? lower + nextChar.toLowerCase() : null

    if (pair && CYRILLIC_MULTI[pair]) {
      result += transliterateCyrillicChar(char, nextChar)
      i++
      continue
    }

    result += transliterateCyrillicChar(char)
  }

  return result
}

const INVOICE_LATIN_FIELD_PATTERN = /[^a-zA-Z0-9\s.,\-/]/g

/**
 * Transliterate and keep only characters allowed in invoice payer fields.
 */
export function sanitizeInvoiceLatinField(value: string): string {
  return transliterateToLatin(value).replace(INVOICE_LATIN_FIELD_PATTERN, "")
}
