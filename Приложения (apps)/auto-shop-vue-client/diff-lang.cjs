const fs = require("fs")
const path = require("path")

const SOURCE_LANG = "ru"
const TARGET_LANG = "zh"
const LANG_DIR = path.join(__dirname, "lang")
const OUTPUT_DIR = path.join(__dirname, "missing_translations")

function getMissingKeys(source, target) {
  let diff = {}
  let hasDiff = false

  if (target === undefined || target === null) {
    return source
  }

  Object.keys(source).forEach((key) => {
    const sourceVal = source[key]
    const targetVal = target[key]

    if (typeof sourceVal === "object" && sourceVal !== null && !Array.isArray(sourceVal)) {
      const nestedDiff = getMissingKeys(sourceVal, targetVal)

      if (nestedDiff && Object.keys(nestedDiff).length > 0) {
        diff[key] = nestedDiff
        hasDiff = true
      }
    }
    else {
      if (targetVal === undefined) {
        diff[key] = sourceVal
        hasDiff = true
      }
    }
  })

  return hasDiff ? diff : null
}

function scanDirectory(relativePath = "") {
  const sourcePath = path.join(LANG_DIR, SOURCE_LANG, relativePath)

  if (!fs.existsSync(sourcePath)) {
    console.error(`Папка не найдена: ${sourcePath}`)
    return
  }

  const items = fs.readdirSync(sourcePath, {
    withFileTypes: true,
  })

  items.forEach((item) => {
    const itemRelativePath = path.join(relativePath, item.name)

    if (item.isDirectory()) {
      scanDirectory(itemRelativePath)
    }
    else if (item.isFile() && item.name.endsWith(".json")) {
      processFile(itemRelativePath)
    }
  })
}

function processFile(relativePath) {
  const sourceFilePath = path.join(LANG_DIR, SOURCE_LANG, relativePath)
  const targetFilePath = path.join(LANG_DIR, TARGET_LANG, relativePath)

  try {
    const sourceContent = JSON.parse(fs.readFileSync(sourceFilePath, "utf8"))

    let targetContent = {}
    if (fs.existsSync(targetFilePath)) {
      targetContent = JSON.parse(fs.readFileSync(targetFilePath, "utf8"))
    }

    const diff = getMissingKeys(sourceContent, targetContent)

    if (diff) {
      saveDiff(relativePath, diff)
    }
  }
  catch (err) {
    console.error(`Ошибка при обработке ${relativePath}:`, err.message)
  }
}

function saveDiff(relativePath, content) {
  const outputPath = path.join(OUTPUT_DIR, relativePath)
  const outputDir = path.dirname(outputPath)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {
      recursive: true,
    })
  }

  fs.writeFileSync(outputPath, JSON.stringify(content, null, 2))
  console.log(`[+] Сохранено: ${relativePath}`)
}

console.log(`--- Начало поиска пропущенных ключей (${SOURCE_LANG} -> ${TARGET_LANG}) ---`)

if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, {
    recursive: true,
    force: true,
  })
}

scanDirectory()

console.log(`--- Готово! Результат в папке: ${OUTPUT_DIR} ---`)
