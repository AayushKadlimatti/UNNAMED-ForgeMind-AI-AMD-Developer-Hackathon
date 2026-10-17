param([switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$pythonCandidates = @((Join-Path $projectRoot '.venv\Scripts\python.exe'), (Join-Path $projectRoot '..\.venv\Scripts\python.exe'))
$demoPython = $pythonCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $demoPython) { throw 'Create a Python environment and install requirements first. See INTEGRATION.md.' }
& $demoPython (Join-Path $PSScriptRoot 'preflight.py')
if ($LASTEXITCODE -ne 0) { throw 'Complete the NEEDS SETUP items before starting the demo.' }
if ($CheckOnly) { exit 0 }
foreach ($demoPort in @(8001, 5173)) {
    if (Get-NetTCPConnection -State Listen -LocalPort $demoPort -ErrorAction SilentlyContinue) {
        throw "Port $demoPort is already in use. Keep your existing servers, or stop them before starting another demo."
    }
}
$demoLogs = Join-Path $projectRoot 'data'
New-Item -ItemType Directory -Force -Path $demoLogs | Out-Null
$apiProcess = $null
$uiProcess = $null
try {
    $apiProcess = Start-Process -FilePath $demoPython -ArgumentList @('-m','uvicorn','backend.main_integrated:app','--host','127.0.0.1','--port','8001','--no-access-log') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $demoLogs 'backend-out.log') -RedirectStandardError (Join-Path $demoLogs 'backend-error.log')
    $nodeExecutable = (Get-Command node -ErrorAction Stop).Source
    $viteEntry = Join-Path $projectRoot 'frontend\node_modules\vite\bin\vite.js'
    $uiProcess = Start-Process -FilePath $nodeExecutable -ArgumentList @('"' + $viteEntry + '"','--host','127.0.0.1','--strictPort') -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $demoLogs 'frontend-out.log') -RedirectStandardError (Join-Path $demoLogs 'frontend-error.log')
    Write-Host 'ForgeMind starting at http://127.0.0.1:5173/ . Keep this terminal open; Ctrl+C stops these demo processes.'
    Write-Host 'Local startup logs are in data/. No browser credentials are printed.'
    while (-not $apiProcess.HasExited -and -not $uiProcess.HasExited) {
        Start-Sleep -Seconds 1
        $apiProcess.Refresh()
        $uiProcess.Refresh()
    }
    throw 'A demo process stopped. Check data/backend-error.log and data/frontend-error.log.'
} finally {
    foreach ($ownedProcess in @($apiProcess, $uiProcess)) {
        if ($ownedProcess -and -not $ownedProcess.HasExited) { & taskkill.exe /PID $ownedProcess.Id /T /F 2>$null | Out-Null }
    }
}
