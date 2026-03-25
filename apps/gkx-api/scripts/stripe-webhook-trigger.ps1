$ErrorActionPreference = "Stop"

function Resolve-StripeCliPath {
    if ($env:STRIPE_CLI_PATH -and (Test-Path $env:STRIPE_CLI_PATH)) {
        return $env:STRIPE_CLI_PATH
    }

    $stripeCmd = Get-Command stripe -ErrorAction SilentlyContinue
    if ($stripeCmd) {
        return $stripeCmd.Source
    }

    $commonPaths = @(
        "$env:LOCALAPPDATA\Microsoft\WinGet\Links\stripe.exe",
        "$env:USERPROFILE\scoop\shims\stripe.exe",
        "$env:ProgramFiles\Stripe\stripe.exe"
    )

    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            return $path
        }
    }

    $winGetPackagesRoot = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"
    if (Test-Path $winGetPackagesRoot) {
        $wingetStripeExe = Get-ChildItem -Path $winGetPackagesRoot -Filter stripe.exe -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($wingetStripeExe) {
            return $wingetStripeExe.FullName
        }
    }

    return $null
}

$stripePath = Resolve-StripeCliPath
if (-not $stripePath) {
    Write-Error "Stripe CLI no esta instalado o no esta en PATH. Instala con: winget install Stripe.StripeCli"
    Write-Host "Tip: tambien puedes definir STRIPE_CLI_PATH con la ruta de stripe.exe" -ForegroundColor Yellow
    exit 1
}

Write-Host "Disparando eventos de suscripcion de prueba..." -ForegroundColor Cyan

& $stripePath trigger customer.subscription.created
& $stripePath trigger customer.subscription.updated
& $stripePath trigger customer.subscription.deleted

Write-Host "Eventos enviados." -ForegroundColor Green
