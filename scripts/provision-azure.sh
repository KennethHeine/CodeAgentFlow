#!/bin/bash

# Azure Static Web App Provisioning Script
# This script creates a resource group and an Azure Static Web App with the Free SKU

set -e

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-codeagentflow-rg}"
LOCATION="${LOCATION:-westeurope}"
APP_NAME="${APP_NAME:-codeagentflow-app}"
SKU="${SKU:-Free}"

echo "========================================="
echo "Azure Static Web App Provisioning"
echo "========================================="
echo ""
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "App Name: $APP_NAME"
echo "SKU: $SKU"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it first."
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in
echo "Checking Azure CLI authentication..."
az account show &> /dev/null || {
    echo "Error: You are not logged in to Azure CLI."
    echo "Please run 'az login' first."
    exit 1
}

echo "✓ Authenticated with Azure"
echo ""

# Create resource group
echo "Creating resource group '$RESOURCE_GROUP' in '$LOCATION'..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output table

echo "✓ Resource group created"
echo ""

# Create Static Web App
echo "Creating Azure Static Web App '$APP_NAME'..."
az staticwebapp create \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku "$SKU" \
    --output table

echo "✓ Static Web App created"
echo ""

# Get the deployment token
echo "Retrieving deployment token..."
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" \
    --output tsv)

echo "✓ Deployment token retrieved"
echo ""

# Display summary
echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo ""
echo "Static Web App URL: https://$APP_NAME.azurestaticapps.net"
echo ""
echo "To deploy via GitHub Actions, add this secret to your repository:"
echo "Secret Name: AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "Secret Value: $DEPLOYMENT_TOKEN"
echo ""
echo "Note: Keep the deployment token secure!"
echo ""
echo "To view your app details:"
echo "  az staticwebapp show --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "To delete the app:"
echo "  az staticwebapp delete --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo "  az group delete --name $RESOURCE_GROUP"
echo ""
