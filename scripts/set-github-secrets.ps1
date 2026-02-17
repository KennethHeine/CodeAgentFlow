# GitHub Actions Secrets Setup Script
# Sets all Azure secrets required by the deploy workflows in this repo.
# Prerequisites: gh CLI installed and authenticated (gh auth login)

[CmdletBinding()]
param(
    [string]$GitHubOrg          = "KennethHeine",
    [string]$GitHubRepo         = "CodeAgentFlow",

    [Parameter(Mandatory = $true)]
    [string]$AzureClientId,

    [Parameter(Mandatory = $true)]
    [string]$AzureTenantId,

    [Parameter(Mandatory = $true)]
    [string]$AzureSubscriptionId,

    [Parameter(Mandatory = $true)]
    [string]$AzureResourceGroup,

    [Parameter(Mandatory = $true)]
    [string]$AzureStaticWebAppName
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "GitHub Actions Secrets Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository : $GitHubOrg/$GitHubRepo"
Write-Host ""

# Check gh CLI is installed
try {
    $null = Get-Command gh -ErrorAction Stop
} catch {
    Write-Host "Error: GitHub CLI (gh) is not installed." -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com/"
    exit 1
}

# Check gh CLI is authenticated
Write-Host "Checking GitHub CLI authentication..."
$null = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Not authenticated with GitHub CLI." -ForegroundColor Red
    Write-Host "Please run: gh auth login"
    exit 1
}
Write-Host "✓ Authenticated with GitHub CLI" -ForegroundColor Green
Write-Host ""

$repoFlag = "$GitHubOrg/$GitHubRepo"

$secrets = @{
    AZURE_CLIENT_ID          = $AzureClientId
    AZURE_TENANT_ID          = $AzureTenantId
    AZURE_SUBSCRIPTION_ID    = $AzureSubscriptionId
    AZURE_RESOURCE_GROUP     = $AzureResourceGroup
    AZURE_STATIC_WEB_APP_NAME = $AzureStaticWebAppName
}

Write-Host "Setting secrets on $repoFlag ..."
Write-Host ""

foreach ($name in $secrets.Keys) {
    $value = $secrets[$name]
    $value | gh secret set $name --repo $repoFlag
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $name" -ForegroundColor Green
    } else {
        Write-Host "✗ $name — failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "All secrets set successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Secrets configured:"
Write-Host "  AZURE_CLIENT_ID"
Write-Host "  AZURE_TENANT_ID"
Write-Host "  AZURE_SUBSCRIPTION_ID"
Write-Host "  AZURE_RESOURCE_GROUP"
Write-Host "  AZURE_STATIC_WEB_APP_NAME"
Write-Host ""
Write-Host "Your GitHub Actions deploy workflows are ready to use." -ForegroundColor Green
Write-Host ""
