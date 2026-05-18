# ============================================================
#  START-NOW.ps1 - Nexus Global Web3
#  Backend  : porta 7001
#  Frontend : porta 7002
# ============================================================

param(
    [switch]$SkipChecks
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Status  { param($msg) Write-Host "[INFO]  $msg" -ForegroundColor Yellow }
function Write-Success { param($msg) Write-Host "[OK]    $msg" -ForegroundColor Green }
function Write-Fail    { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   NEXUS GLOBAL WEB3 - Iniciando Ambiente  " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. VERIFICAR PORTAS LIVRES ---
Write-Status "Verificando portas 7001 e 7002..."
$port7001 = Get-NetTCPConnection -LocalPort 7001 -State Listen -ErrorAction SilentlyContinue
$port7002 = Get-NetTCPConnection -LocalPort 7002 -State Listen -ErrorAction SilentlyContinue

if ($port7001) {
    Write-Fail "Porta 7001 ja esta em uso. Encerre o processo antes de continuar."
    exit 1
}
if ($port7002) {
    Write-Fail "Porta 7002 ja esta em uso. Encerre o processo antes de continuar."
    exit 1
}
Write-Success "Portas 7001 e 7002 disponiveis"

# --- 2. VERIFICACOES DE PRE-REQUISITOS ---
if (-not $SkipChecks) {
    Write-Status "Verificando pre-requisitos..."

    try {
        $nodeVersion = node --version 2>&1
        Write-Success "Node.js: $nodeVersion"
    } catch {
        Write-Fail "Node.js nao encontrado. Instale em: https://nodejs.org"
        exit 1
    }

    try {
        $pnpmVersion = pnpm --version 2>&1
        Write-Success "pnpm: v$pnpmVersion"
    } catch {
        Write-Fail "pnpm nao encontrado. Execute: npm install -g pnpm"
        exit 1
    }

    $nodeModulesPath = Join-Path $ScriptDir "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Fail "node_modules ausente. Execute: pnpm install --ignore-scripts"
        exit 1
    }
    Write-Success "node_modules encontrado"

    # Binarios nativos Windows
    foreach ($pkg in @(
        @{ name = "lightningcss-win32-x64-msvc"; path = "node_modules\lightningcss-win32-x64-msvc" },
        @{ name = "@rollup/rollup-win32-x64-msvc"; path = "node_modules\@rollup\rollup-win32-x64-msvc" },
        @{ name = "@tailwindcss/oxide-win32-x64-msvc"; path = "node_modules\@tailwindcss\oxide-win32-x64-msvc" }
    )) {
        $fullPath = Join-Path $ScriptDir $pkg.path
        if (-not (Test-Path $fullPath)) {
            Write-Status "$($pkg.name) ausente. Instalando..."
            pnpm add -D $pkg.name -w --ignore-scripts 2>&1 | Out-Null
            Write-Success "$($pkg.name) instalado"
        } else {
            Write-Success "$($pkg.name) OK"
        }
    }
}

# --- 3. CRIAR DIRETORIO data/ ---
$dataDir = Join-Path $ScriptDir "data"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    Write-Success "Diretorio data/ criado"
}

# --- 4. COPIAR sql-wasm.wasm ---
$distDir  = Join-Path $ScriptDir "artifacts\api-server\dist"
$wasmDest = Join-Path $distDir "sql-wasm.wasm"
$pnpmDir  = Join-Path $ScriptDir "node_modules\.pnpm"
$wasmSrc  = $null

if (Test-Path $pnpmDir) {
    $sqlEntry = Get-ChildItem $pnpmDir -Directory | Where-Object { $_.Name -like "sql.js@*" } | Select-Object -First 1
    if ($sqlEntry) {
        $candidate = Join-Path $sqlEntry.FullName "node_modules\sql.js\dist\sql-wasm.wasm"
        if (Test-Path $candidate) { $wasmSrc = $candidate }
    }
}

if ($wasmSrc) {
    if (-not (Test-Path $distDir)) { New-Item -ItemType Directory -Path $distDir -Force | Out-Null }
    Copy-Item -Path $wasmSrc -Destination $wasmDest -Force
    Write-Success "sql-wasm.wasm copiado para dist/"
}

# --- 5. INICIAR BACKEND (porta 7001) ---
$backendCmd = @"
`$env:NODE_ENV = 'development'
`$env:PORT = '7001'
`$env:DATABASE_URL = 'file:$($dataDir.Replace('\','/'))/database.sqlite'
`$env:AI_INTEGRATIONS_OPENAI_API_KEY = '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'
`$env:AI_INTEGRATIONS_OPENAI_BASE_URL = 'https://api.groq.com/openai/v1'
Set-Location '$ScriptDir'
Write-Host '--- NEXUS BACKEND (porta 7001) ---' -ForegroundColor Cyan
pnpm --filter @workspace/api-server run dev
Write-Host 'Backend encerrado. Pressione qualquer tecla...' -ForegroundColor Yellow
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@

Write-Status "Iniciando Backend na porta 7001..."
$b64 = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($backendCmd))
Start-Process powershell.exe -ArgumentList "-NoExit", "-EncodedCommand", $b64
Write-Success "Backend iniciado em nova janela"

# --- 6. AGUARDAR ---
Write-Status "Aguardando 5 segundos..."
Start-Sleep -Seconds 5

# --- 7. INICIAR FRONTEND (porta 7002) ---
$frontendCmd = @"
`$env:NODE_ENV = 'development'
`$env:PORT = '7002'
`$env:BASE_PATH = '/'
Set-Location '$ScriptDir'
Write-Host '--- NEXUS FRONTEND (porta 7002) ---' -ForegroundColor Cyan
pnpm --filter @workspace/nexus run dev
Write-Host 'Frontend encerrado. Pressione qualquer tecla...' -ForegroundColor Yellow
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@

Write-Status "Iniciando Frontend na porta 7002..."
$b64f = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($frontendCmd))
Start-Process powershell.exe -ArgumentList "-NoExit", "-EncodedCommand", $b64f
Write-Success "Frontend iniciado em nova janela"

# --- 8. RESUMO ---
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   NEXUS GLOBAL WEB3 - Servicos Iniciados  " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend  API : " -NoNewline; Write-Host "http://localhost:7001" -ForegroundColor Cyan
Write-Host "  Backend  WS  : " -NoNewline; Write-Host "ws://localhost:7001/metrics" -ForegroundColor Cyan
Write-Host "  Frontend App : " -NoNewline; Write-Host "http://localhost:7002" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Feche as janelas abertas para parar os servicos." -ForegroundColor Gray
Write-Host ""
