#requires -Version 5.1
# Background flutter run for Windows (invoked from Makefile).
# Keep $Device and $ApiBaseUrl in sync with RUN_FLAGS in ../Makefile.

param(
    [Parameter(Position = 0)]
    [ValidateSet('start', 'stop', 'restart')]
    [string]$Action = 'start'
)

$Device = 'TFY LX1'
$ApiBaseUrl = 'http://10.170.185.188:8080'

$AppRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$PidFile = Join-Path $AppRoot '.flutter_run.pid'
$LogFile = Join-Path $AppRoot '.flutter_run.log'

function Stop-FlutterBg {
    if (-not (Test-Path -LiteralPath $PidFile)) {
        Write-Host 'No .flutter_run.pid, nothing to stop.'
        return
    }
    $raw = (Get-Content -LiteralPath $PidFile -Raw).Trim()
    if (-not $raw) {
        Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
        return
    }
    $processId = [int]$raw
    $null = & taskkill.exe /PID $processId /T /F 2>&1
    Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped process tree (PID $processId)."
}

function Start-FlutterBg {
    $flutterLine = "flutter run -d `"$Device`" --dart-define=API_BASE_URL=$ApiBaseUrl"
    $cmdLine = "$flutterLine > `"$LogFile`" 2>&1"
    $p = Start-Process -FilePath cmd.exe -ArgumentList @('/c', $cmdLine) `
        -WorkingDirectory $AppRoot -WindowStyle Hidden -PassThru
    if (-not $p) {
        Write-Error 'Start-Process failed.'
        exit 1
    }
    $p.Id | Out-File -LiteralPath $PidFile -Encoding ascii -NoNewline
    Write-Host "flutter run (background) PID $($p.Id); log: $LogFile"
}

switch ($Action) {
    'stop' { Stop-FlutterBg }
    'start' { Start-FlutterBg }
    'restart' {
        Stop-FlutterBg
        Start-Sleep -Seconds 1
        Start-FlutterBg
    }
}
