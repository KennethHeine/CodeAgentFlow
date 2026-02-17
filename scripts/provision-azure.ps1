# Azure Static Web App Provisioning Script (PowerShell)
# This script creates a resource group and an Azure Static Web App with the Free SKU

[CmdletBinding()]
param(
    [string]$ResourceGroup = "codeagentflow-rg",
    [string]$Location = "westeurope",
    [string]$AppName = "codeagentflow-app",
    [string]$Sku = "Free"
)

# Stop on first error
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Azure Static Web App Provisioning" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resource Group: $ResourceGroup"
Write-Host "Location: $Location"
Write-Host "App Name: $AppName"
Write-Host "SKU: $Sku"
Write-Host ""

# Check if Azure CLI is installed
try {
    $null = Get-Command az -ErrorAction Stop
} catch {
    Write-Host "Error: Azure CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Check if user is logged in
Write-Host "Checking Azure CLI authentication..."
try {
    $null = az account show 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not authenticated"
    }
} catch {
    Write-Host "Error: You are not logged in to Azure CLI." -ForegroundColor Red
    Write-Host "Please run 'az login' first."
    exit 1
}

Write-Host "✓ Authenticated with Azure" -ForegroundColor Green
Write-Host ""

# Create resource group
Write-Host "Creating resource group '$ResourceGroup' in '$Location'..."
az group create `
    --name $ResourceGroup `
    --location $Location `
    --output table

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to create resource group" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Resource group created" -ForegroundColor Green
Write-Host ""

# Create Static Web App (idempotent — skip if already exists)
Write-Host "Checking if Static Web App '$AppName' already exists..."
$null = az staticwebapp show --name $AppName --resource-group $ResourceGroup 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Static Web App already exists, skipping creation" -ForegroundColor Yellow
} else {
    Write-Host "Creating Azure Static Web App '$AppName'..."
    az staticwebapp create `
        --name $AppName `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku $Sku `
        --output table

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to create Static Web App" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Static Web App created" -ForegroundColor Green
}
Write-Host ""

# Get the deployment token
Write-Host "Retrieving deployment token..."
$deploymentToken = az staticwebapp secrets list `
    --name $AppName `
    --resource-group $ResourceGroup `
    --query "properties.apiKey" `
    --output tsv

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to retrieve deployment token" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Deployment token retrieved" -ForegroundColor Green
Write-Host ""

# Display summary
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Static Web App URL: https://$AppName.azurestaticapps.net" -ForegroundColor Yellow
Write-Host ""
Write-Host "To deploy via GitHub Actions, add this secret to your repository:"
Write-Host "Secret Name: AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor Yellow
Write-Host "Secret Value: $deploymentToken" -ForegroundColor Yellow
Write-Host ""
Write-Host "Note: Keep the deployment token secure!" -ForegroundColor Red
Write-Host ""
Write-Host "To view your app details:"
Write-Host "  az staticwebapp show --name $AppName --resource-group $ResourceGroup"
Write-Host ""
Write-Host "To delete the app:"
Write-Host "  az staticwebapp delete --name $AppName --resource-group $ResourceGroup"
Write-Host "  az group delete --name $ResourceGroup"
Write-Host ""
