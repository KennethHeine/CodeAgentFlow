# Azure Service Principal Setup with Federated Credentials
# This script creates a service principal with federated credentials for GitHub Actions OIDC authentication
# and assigns RBAC permissions to manage Azure Static Web Apps

[CmdletBinding()]
param(
    [string]$GitHubOrg = "KennethHeine",
    
    [string]$GitHubRepo = "CodeAgentFlow",
    
    [string]$ResourceGroup = "codeagentflow-rg",
    [string]$AppName = "codeagentflow-app",
    [string]$ServicePrincipalName = "sp-codeagentflow-github",
    [string]$Location = "westeurope"
)

# Stop on first error
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Azure Service Principal Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "GitHub Org/User: $GitHubOrg"
Write-Host "GitHub Repo: $GitHubRepo"
Write-Host "Resource Group: $ResourceGroup"
Write-Host "App Name: $AppName"
Write-Host "Service Principal: $ServicePrincipalName"
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
    $accountJson = az account show --output json 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not authenticated"
    }
    $accountInfo = $accountJson | ConvertFrom-Json
    $subscriptionId = $accountInfo.id
    $tenantId = $accountInfo.tenantId
} catch {
    Write-Host "Error: You are not logged in to Azure CLI." -ForegroundColor Red
    Write-Host "Please run 'az login' first."
    exit 1
}

Write-Host "✓ Authenticated with Azure" -ForegroundColor Green
Write-Host "Subscription ID: $subscriptionId"
Write-Host "Tenant ID: $tenantId"
Write-Host ""

# Check if resource group exists, create if not
Write-Host "Checking resource group..."
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "false") {
    Write-Host "Resource group does not exist. Creating..."
    az group create `
        --name $ResourceGroup `
        --location $Location `
        --output table
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to create resource group" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Resource group created" -ForegroundColor Green
} else {
    Write-Host "✓ Resource group exists" -ForegroundColor Green
}
Write-Host ""

# Create or get service principal
Write-Host "Creating service principal '$ServicePrincipalName'..."
az ad sp create-for-rbac `
    --name $ServicePrincipalName `
    --role contributor `
    --scopes "/subscriptions/$subscriptionId/resourceGroups/$ResourceGroup" | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Service principal might already exist. Checking..." -ForegroundColor Yellow
}

# Retrieve appId and objectId via --query to avoid JSON parsing issues
$appId = az ad sp list --display-name $ServicePrincipalName --query "[0].appId" --output tsv 2>&1
$objectId = az ad sp list --display-name $ServicePrincipalName --query "[0].id" --output tsv 2>&1

if (-not $appId) {
    Write-Host "Error: Could not retrieve service principal App ID" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Service principal ready" -ForegroundColor Green

Write-Host "App ID (Client ID): $appId"
Write-Host "Object ID: $objectId"
Write-Host ""

# Create federated credentials for GitHub Actions
Write-Host "Creating federated credentials for GitHub Actions..."

# Credential for main branch
$federatedCredentialMain = @"
{
    "name": "github-actions-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:$GitHubOrg/${GitHubRepo}:ref:refs/heads/main",
    "description": "GitHub Actions federated credential for main branch",
    "audiences": [
        "api://AzureADTokenExchange"
    ]
}
"@

$fcMainPath = Join-Path $env:TEMP "federated-credential-main.json"
$federatedCredentialMain | Out-File -FilePath $fcMainPath -Encoding utf8

az ad app federated-credential create `
    --id $appId `
    --parameters $fcMainPath 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Federated credential created for main branch" -ForegroundColor Green
} else {
    Write-Host "! Federated credential for main branch might already exist" -ForegroundColor Yellow
}

# Credential for pull requests
$federatedCredentialPR = @"
{
    "name": "github-actions-pr",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:$GitHubOrg/${GitHubRepo}:pull_request",
    "description": "GitHub Actions federated credential for pull requests",
    "audiences": [
        "api://AzureADTokenExchange"
    ]
}
"@

$fcPRPath = Join-Path $env:TEMP "federated-credential-pr.json"
$federatedCredentialPR | Out-File -FilePath $fcPRPath -Encoding utf8

az ad app federated-credential create `
    --id $appId `
    --parameters $fcPRPath 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Federated credential created for pull requests" -ForegroundColor Green
} else {
    Write-Host "! Federated credential for pull requests might already exist" -ForegroundColor Yellow
}

# Clean up temporary files
Remove-Item -Path $fcMainPath -ErrorAction SilentlyContinue
Remove-Item -Path $fcPRPath -ErrorAction SilentlyContinue
Write-Host ""

# Assign Website Contributor role if Static Web App exists
Write-Host "Checking if Static Web App exists..."
$swaExists = az staticwebapp show `
    --name $AppName `
    --resource-group $ResourceGroup 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Static Web App exists" -ForegroundColor Green
    
    # Get Static Web App resource ID
    $swaInfo = az staticwebapp show `
        --name $AppName `
        --resource-group $ResourceGroup `
        --query "id" `
        --output tsv
    
    # Assign Website Contributor role
    Write-Host "Assigning Website Contributor role..."
    az role assignment create `
        --assignee $appId `
        --role "Website Contributor" `
        --scope $swaInfo 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Website Contributor role assigned" -ForegroundColor Green
    } else {
        Write-Host "! Role assignment might already exist" -ForegroundColor Yellow
    }
} else {
    Write-Host "! Static Web App does not exist yet" -ForegroundColor Yellow
    Write-Host "Run the provisioning script first, then re-run this script for role assignment"
}
Write-Host ""

# Display summary
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Setup Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Principal created with federated credentials!" -ForegroundColor Green
Write-Host ""
Write-Host "Add these secrets to your GitHub repository:" -ForegroundColor Yellow
Write-Host "  Settings > Secrets and variables > Actions > New repository secret"
Write-Host ""
Write-Host "Secret 1:" -ForegroundColor Cyan
Write-Host "  Name: AZURE_CLIENT_ID" -ForegroundColor Yellow
Write-Host "  Value: $appId" -ForegroundColor Yellow
Write-Host ""
Write-Host "Secret 2:" -ForegroundColor Cyan
Write-Host "  Name: AZURE_TENANT_ID" -ForegroundColor Yellow
Write-Host "  Value: $tenantId" -ForegroundColor Yellow
Write-Host ""
Write-Host "Secret 3:" -ForegroundColor Cyan
Write-Host "  Name: AZURE_SUBSCRIPTION_ID" -ForegroundColor Yellow
Write-Host "  Value: $subscriptionId" -ForegroundColor Yellow
Write-Host ""
Write-Host "Secret 4 (if needed for backward compatibility):" -ForegroundColor Cyan
Write-Host "  Name: AZURE_RESOURCE_GROUP" -ForegroundColor Yellow
Write-Host "  Value: $ResourceGroup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Secret 5 (if needed for backward compatibility):" -ForegroundColor Cyan
Write-Host "  Name: AZURE_STATIC_WEB_APP_NAME" -ForegroundColor Yellow
Write-Host "  Value: $AppName" -ForegroundColor Yellow
Write-Host ""
Write-Host "Update your GitHub Actions workflow to use OIDC authentication." -ForegroundColor Green
Write-Host "See the documentation for examples." -ForegroundColor Green
Write-Host ""
Write-Host "To retrieve the deployment token using the service principal:" -ForegroundColor Cyan
Write-Host "  az login --service-principal -u $appId --tenant $tenantId --federated-token `$GITHUB_TOKEN"
Write-Host "  az staticwebapp secrets list --name $AppName --resource-group $ResourceGroup --query 'properties.apiKey' -o tsv"
Write-Host ""
