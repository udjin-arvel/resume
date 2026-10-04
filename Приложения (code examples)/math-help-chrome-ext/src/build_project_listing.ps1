
#.\build_project_listing.ps1 -AdditionalExcludePaths @(".idea", ".trash","backups", "logs","man") -CopyToClipboard
#
#.\build_project_listing.ps1 -Extensions @("js", "ts") -Architecture -CopyToClipboard
#.\build_project_listing.ps1 -CopyToClipboard
#
## Минификация + лог + ревью + буфер
#.\build_project_listing.ps1 -Minified -CopyToClipboard

# Минифицированный листинг + архитектурный анализ
#.\build_project_listing.ps1 -Minified -Architecture
param(
    [string[]]$Extensions            = @("js", "ts","tsx", "css", "sql", "json", "env"),
    [string]  $OutputFile            = ".full",
    [string]  $LogFile               = ".full.log",

    [switch]  $Review,
    [switch]  $Debug,
    [switch]  $Refactor,
    [switch]  $SuggestModules,
    [switch]  $Architecture,
    [switch]  $CopyToClipboard,
    [switch]  $Minified,
    [int]     $MinifiedLines         = 30,

    # Ваши доп. исключения — они дополняют встроенный список
    [string[]]$AdditionalExcludePaths = @()
)

# Встроенный базовый набор исключений
$DefaultExcludePaths = @(
    "node_modules", ".git", "dist", "build", ".next", ".vercel",
    "coverage", "tmp", "out", "logs", ".turbo", ".cache",
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml"
)

function Get-PromptText {
    if ($Review -or (-not $Debug -and -not $Refactor -and -not $SuggestModules -and -not $Architecture)) {
        return "Проанализируй следующий проект на Node.js. Выполни детальное code review. Обрати внимание на возможные ошибки, антипаттерны, потенциальные проблемы производительности и предложи улучшения."
    }
    elseif ($Debug) {
        return "Проанализируй следующий проект на Node.js. Найди причины возможных ошибок и нестабильной работы. Укажи проблемные участки и предложи конкретные исправления."
    }
    elseif ($Refactor) {
        return "Проанализируй следующий код и предложи рефакторинг с объяснением. Сфокусируйся на улучшении читаемости, переиспользуемости и соблюдении лучших практик."
    }
    elseif ($SuggestModules) {
        return "Проанализируй следующий проект. Какие модули или функциональные блоки можно добавить для повышения надёжности, безопасности, производительности или удобства поддержки?"
    }
    else {
        return "Проанализируй архитектуру проекта. Оцени модули, связи и масштабируемость. Предложи архитектурные улучшения или перестройку."
    }
}

function Is-Excluded {
    param(
        [string]  $FullPath,
        [string[]]$Patterns,
        [string]  $ProjectRoot
    )
    # Относительный путь
    $rel = $FullPath.Substring($ProjectRoot.Length).TrimStart('\','/',' ')
    # Сегменты пути
    $segments = $rel -split '[\\/]'
    foreach ($p in $Patterns) {
        if ($segments -contains $p.ToLower()) { return $true }
    }
    return $false
}

function Write-FileListing {
    param(
        [string]                  $FullPath,
        [string]                  $ProjectRoot,
        [System.IO.StringWriter]  $Writer
    )
    $ext          = [IO.Path]::GetExtension($FullPath).TrimStart('.').ToLower()
    $relativePath = $FullPath.Substring($ProjectRoot.Length).TrimStart('\','/')

    $Writer.WriteLine()
    $Writer.WriteLine("/*_____ FILE BLOCK START _____*/")
    $Writer.WriteLine("/** FILE PATH: $relativePath **/")
    $Writer.WriteLine("/** FILE CONTENT START **/")

    try {
        $lines = Get-Content -Encoding UTF8 $FullPath

        if ($Minified -and $ext -in @("js","ts","css")) {
            $lines = $lines | ForEach-Object {
                $t = $_.Trim()
                if ($t -eq "") { return }
                ($t -replace "\s+", " ") -replace "\s*([{}();,:])\s*", '$1'
            }
        }
        elseif ($Minified -and $ext -in @("json","sql","env")) {
            $lines = $lines | ForEach-Object { $_.Trim() }
        }

        if ($MinifiedLines -and $Minified) {
            $max = [math]::Min($lines.Count - 1, $MinifiedLines - 1)
            $lines = $lines[0..$max]
        }

        $lines | ForEach-Object { $Writer.WriteLine($_) }
    }
    catch {
        $Writer.WriteLine("// Error reading file: $_")
    }

    $Writer.WriteLine("/** FILE CONTENT END **/")
    $Writer.WriteLine("/*_____ FILE BLOCK END _____*/")
}

function Build-ProjectListing {
    $projectRoot       = (Get-Location).ProviderPath
    # Объединяем встроенные и дополнительные
    $effectiveExcludes = ($DefaultExcludePaths + $AdditionalExcludePaths) `
        | ForEach-Object { $_.ToLower() } `
        | Select-Object -Unique

    $allFiles = Get-ChildItem -Path $projectRoot -Recurse -File -ErrorAction SilentlyContinue
    $included = @();  $excluded = @()

    foreach ($f in $allFiles) {
        $ext = $f.Extension.TrimStart('.').ToLower()
        if ($Extensions -contains $ext -and `
            -not (Is-Excluded -FullPath $f.FullName -Patterns $effectiveExcludes -ProjectRoot $projectRoot)
        ) {
            $included += $f
        }
        else {
            $excluded += $f
        }
    }

    $sw = [System.IO.StringWriter]::new()
    $sw.WriteLine('```')
    $sw.WriteLine((Get-PromptText))
    $sw.WriteLine()
    $sw.WriteLine('/* === BEGIN PROJECT STRUCTURE LISTING === */')
    $sw.WriteLine("/* Project Root: $projectRoot */")
    $sw.WriteLine("/* Included extensions: $($Extensions -join ', ') */")
    $sw.WriteLine("/* Excluded patterns: $($effectiveExcludes -join ', ') */")
    $sw.WriteLine()

    foreach ($f in $included) {
        Write-FileListing -FullPath $f.FullName -ProjectRoot $projectRoot -Writer $sw
    }

    $sw.WriteLine('/* === END PROJECT STRUCTURE LISTING === */')
    $sw.WriteLine('```')
    $finalText = $sw.ToString()

    if ($CopyToClipboard) {
        $finalText | Set-Clipboard
        Write-Host "✅ Содержимое скопировано в буфер обмена."
    }

    $finalText | Out-File -FilePath (Join-Path $projectRoot $OutputFile) -Encoding UTF8
    Write-Host "📄 Project listing saved to $OutputFile"

    # Записываем лог
    $logLines = @(
        "=== PROJECT LISTING LOG ===",
        "Project Root: $projectRoot",
        "Included Files: $($included.Count)",
        "Excluded Files: $($excluded.Count)",
        "Excluded Patterns: $($effectiveExcludes -join ', ')",
        "",
        "---- Excluded List: ----"
    ) + ($excluded | ForEach-Object { $_.FullName })

    $logLines | Set-Content -Path (Join-Path $projectRoot $LogFile) -Encoding UTF8
    Write-Host "📝 Log saved to $LogFile"
}

Build-ProjectListing
