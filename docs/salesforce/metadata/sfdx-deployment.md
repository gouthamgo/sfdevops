---
sidebar_position: 3
title: SFDX & Deployment
description: Master Salesforce DX, org management, source-driven development, and deploying changes across environments
---

# SFDX & Deployment: Source-Driven Development

Master Salesforce DX (SFDX) for source-driven development, version control, and deploying changes across scratch orgs, sandboxes, and production.

## 🎯 What You'll Master

- SFDX CLI commands
- Creating and managing scratch orgs
- Source-driven development workflow
- Deploying metadata
- Retrieving changes from orgs
- Package development
- CI/CD integration
- Deployment strategies
- Best practices

## 🚀 Setup SFDX

### Installation

```bash
# Install Salesforce CLI
# macOS (Homebrew)
brew install salesforce-cli

# Windows (Chocolatey)
choco install sfdx

# Or download installer from:
# https://developer.salesforce.com/tools/sfdxcli

# Verify installation
sf --version
# or legacy command
sfdx --version

# Update CLI
sf update
```

### Authenticate with Orgs

```bash
# Authenticate with Production/Developer org
sf org login web --alias myProd

# Authenticate with Sandbox
sf org login web --alias mySandbox --instance-url https://test.salesforce.com

# Authenticate using SFDX Auth URL (for CI/CD)
sf org login sfdx-url --sfdx-url-file authurl.txt --alias ciOrg

# List authenticated orgs
sf org list

# Set default org
sf config set target-org myProd

# Open org in browser
sf org open --target-org myProd
```

## 📦 Project Structure

### Create SFDX Project

```bash
# Create new project
sf project generate --name my-salesforce-project

cd my-salesforce-project

# Project structure
my-salesforce-project/
├── force-app/                 # Source code
│   └── main/
│       └── default/
│           ├── classes/       # Apex classes
│           ├── triggers/      # Apex triggers
│           ├── lwc/           # Lightning Web Components
│           ├── objects/       # Custom objects
│           ├── tabs/          # Tabs
│           └── ...
├── config/                    # Scratch org configs
├── scripts/                   # Deployment scripts
├── .sfdx/                     # SFDX metadata
├── sfdx-project.json          # Project configuration
└── .forceignore               # Ignore file (like .gitignore)
```

### sfdx-project.json

```json
{
  "packageDirectories": [
    {
      "path": "force-app",
      "default": true,
      "package": "MyPackage",
      "versionName": "ver 1.0",
      "versionNumber": "1.0.0.NEXT"
    }
  ],
  "namespace": "",
  "sfdcLoginUrl": "https://login.salesforce.com",
  "sourceApiVersion": "59.0"
}
```

### .forceignore

```bash
# Ignore these items from deployment

# LWC local dev
**/.localdevserver/**
**/.eslintcache
**/node_modules/**

# Profiles (deploy specific profiles only)
**/profiles/**
!**/profiles/Admin.profile-meta.xml

# Standard objects (don't deploy)
**/standardValueSets/**
**/standardValueSetTranslations/**

# Specific files
**/*.dup
**/*.zip
.sfdx/**
```

## 🏗️ Scratch Org Development

### Create Scratch Org

```bash
# Create scratch org definition
# config/project-scratch-def.json
{
  "orgName": "My Company",
  "edition": "Developer",
  "features": ["MultiCurrency", "PersonAccounts"],
  "settings": {
    "lightningExperienceSettings": {
      "enableS1DesktopEnabled": true
    },
    "mobileSettings": {
      "enableS1EncryptedStoragePref2": false
    }
  }
}

# Create scratch org (7 days default)
sf org create scratch --definition-file config/project-scratch-def.json --alias myScratch --set-default

# Create scratch org (30 days - requires Dev Hub)
sf org create scratch --definition-file config/project-scratch-def.json --alias myScratch --duration-days 30 --set-default

# Open scratch org
sf org open --target-org myScratch

# Check org info
sf org display --target-org myScratch
```

### Push/Pull Source

```bash
# Push local changes to scratch org
sf project deploy start

# Pull changes from scratch org to local
sf project retrieve start

# View changes before pull
sf project retrieve preview

# View deployment status
sf project deploy report
```

## 📤 Deploy Metadata

### Deploy to Sandbox/Production

```bash
# Deploy specific metadata
sf project deploy start --source-dir force-app/main/default/classes

# Deploy specific files
sf project deploy start --source-dir force-app/main/default/classes/PropertyController.cls

# Deploy with tests
sf project deploy start --source-dir force-app --test-level RunLocalTests

# Validate deployment (check-only)
sf project deploy start --source-dir force-app --test-level RunLocalTests --dry-run

# Deploy and run specific tests
sf project deploy start --source-dir force-app --tests PropertyControllerTest,PropertyTriggerHandlerTest

# Quick deploy (after validation)
sf project deploy quick --job-id 0Af...

# Check deployment status
sf project deploy report --job-id 0Af...

# Cancel deployment
sf project deploy cancel --job-id 0Af...
```

### Retrieve Metadata from Org

```bash
# Retrieve specific metadata
sf project retrieve start --source-dir force-app/main/default/classes

# Retrieve metadata by name
sf project retrieve start --metadata ApexClass:PropertyController

# Retrieve multiple types
sf project retrieve start --metadata "ApexClass:PropertyController,CustomObject:Property__c"

# Retrieve everything (not recommended)
sf project retrieve start --metadata "*"

# Retrieve package
sf project retrieve start --package-name "MyPackage"
```

## 📋 Deployment Strategies

### Strategy 1: Feature Branch Workflow

```bash
# 1. Create feature branch
git checkout -b feature/property-validation

# 2. Create scratch org for feature
sf org create scratch --definition-file config/project-scratch-def.json --alias feature-scratch

# 3. Develop in scratch org
sf project deploy start
# Make changes in org
sf project retrieve start

# 4. Commit changes
git add .
git commit -m "Add property validation logic"

# 5. Merge to main
git checkout main
git merge feature/property-validation

# 6. Deploy to UAT sandbox
sf project deploy start --target-org uat-sandbox --test-level RunLocalTests

# 7. Deploy to Production
sf project deploy start --target-org production --test-level RunLocalTests
```

### Strategy 2: Change Set Alternative

```bash
# Instead of change sets, use manifest

# Create package.xml
force-app/manifest/package.xml:
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>PropertyController</members>
        <members>PropertyTriggerHandler</members>
        <name>ApexClass</name>
    </types>
    <types>
        <members>Property__c</members>
        <name>CustomObject</name>
    </types>
    <version>59.0</version>
</Package>

# Deploy using manifest
sf project deploy start --manifest force-app/manifest/package.xml --target-org production

# Retrieve using manifest
sf project retrieve start --manifest force-app/manifest/package.xml
```

### Strategy 3: Continuous Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy to Salesforce

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install SFDX
        run: |
          npm install -g @salesforce/cli

      - name: Authenticate
        run: |
          echo "${{ secrets.SFDX_AUTH_URL }}" > authurl.txt
          sf org login sfdx-url --sfdx-url-file authurl.txt --alias target-org

      - name: Deploy
        run: |
          sf project deploy start --target-org target-org --test-level RunLocalTests

      - name: Run Tests
        run: |
          sf apex run test --target-org target-org --code-coverage --result-format human
```

## 🧪 Testing During Deployment

### Test Level Options

```bash
# NoTestRun - No tests (sandbox only)
sf project deploy start --test-level NoTestRun

# RunSpecifiedTests - Run specific tests
sf project deploy start --test-level RunSpecifiedTests --tests PropertyControllerTest

# RunLocalTests - Run all tests except managed packages
sf project deploy start --test-level RunLocalTests

# RunAllTestsInOrg - Run all tests (production default)
sf project deploy start --test-level RunAllTestsInOrg
```

### Run Tests Separately

```bash
# Run all tests
sf apex run test --result-format human --code-coverage

# Run specific test class
sf apex run test --class-names PropertyControllerTest --result-format human

# Run multiple test classes
sf apex run test --class-names "PropertyControllerTest,PropertyTriggerHandlerTest" --result-format human

# Run tests in suite
sf apex run test --suite-names "PropertyTestSuite" --result-format human

# Get test results
sf apex get test --test-run-id 707...

# View code coverage
sf apex get test --test-run-id 707... --code-coverage
```

## 📦 Package Development

### Create Unlocked Package

```bash
# Create package
sf package create --name "Property Management" --package-type Unlocked --path force-app

# Create package version
sf package version create --package "Property Management" --installation-key-bypass --wait 10

# Install package in org
sf package install --package 04t... --target-org myOrg --wait 10

# List package versions
sf package version list --package "Property Management"

# Promote package version to released
sf package version promote --package 04t...
```

## 🔧 Common Workflows

### Retrieve Changes from Sandbox

```bash
# 1. Authenticate to sandbox
sf org login web --alias mySandbox --instance-url https://test.salesforce.com

# 2. Retrieve specific metadata
sf project retrieve start --metadata "ApexClass:PropertyController,CustomObject:Property__c" --target-org mySandbox

# 3. Review changes
git status
git diff

# 4. Commit changes
git add .
git commit -m "Update PropertyController from sandbox"

# 5. Deploy to other orgs
sf project deploy start --target-org production
```

### Deploy Single Component

```bash
# Deploy single class
sf project deploy start --source-dir force-app/main/default/classes/PropertyController.cls

# Deploy with dependencies
sf project deploy start --source-dir force-app/main/default/classes/PropertyController.cls --metadata "CustomObject:Property__c"
```

### Rollback Deployment

```bash
# 1. Cancel ongoing deployment
sf project deploy cancel --job-id 0Af...

# 2. Retrieve previous version from git
git checkout <previous-commit-hash> -- force-app/

# 3. Deploy previous version
sf project deploy start --source-dir force-app
```

## 🚨 Troubleshooting

### Common Errors

**Error: Missing Dependency**
```bash
# Error: CustomField Property__c.Status__c requires CustomObject Property__c

# Solution: Deploy object first
sf project deploy start --metadata "CustomObject:Property__c"
# Then deploy field
sf project deploy start --metadata "CustomField:Property__c.Status__c"
```

**Error: Test Coverage**
```bash
# Error: Average test coverage is 74%, required 75%

# Solution: Write more tests or deploy with specific tests
sf project deploy start --test-level RunLocalTests --tests PropertyControllerTest
```

**Error: Deployment Failed**
```bash
# Check deployment details
sf project deploy report --job-id 0Af...

# View error messages
sf project deploy report --job-id 0Af... --verbose
```

### Debug Deployment

```bash
# Set debug level
sf data create record --sobject DebugLevel --values "DeveloperName=SFDC_DevConsole ApexCode=FINEST"

# View debug logs
sf apex get log --log-id 07L...

# Tail logs (watch in real-time)
sf apex tail log
```

## 💡 Best Practices

### ✅ DO:

1. **Always Validate Before Production Deploy**
   ```bash
   sf project deploy start --target-org production --test-level RunLocalTests --dry-run
   ```

2. **Use Scratch Orgs for Development**
   ```bash
   # Create scratch org per feature
   sf org create scratch --definition-file config/project-scratch-def.json
   ```

3. **Version Control Everything**
   ```bash
   git add force-app/
   git commit -m "Add property management feature"
   ```

4. **Use .forceignore**
   ```bash
   # Don't deploy profiles, permission sets you don't own
   **/profiles/**
   ```

5. **Run Tests During Deployment**
   ```bash
   sf project deploy start --test-level RunLocalTests
   ```

### ❌ DON'T:

1. **Don't Deploy to Production Without Testing**
   ```bash
   # ❌ BAD
   sf project deploy start --target-org production --test-level NoTestRun

   # ✅ GOOD
   sf project deploy start --target-org production --test-level RunLocalTests
   ```

2. **Don't Deploy Everything at Once**
   ```bash
   # ❌ BAD - Deploy all metadata
   sf project deploy start --source-dir force-app

   # ✅ GOOD - Deploy incrementally
   sf project deploy start --metadata "ApexClass,CustomObject"
   ```

3. **Don't Skip Validation**
   ```bash
   # ❌ BAD - Deploy directly
   sf project deploy start

   # ✅ GOOD - Validate first
   sf project deploy start --dry-run
   ```

## 📚 Quick Reference

```bash
# Authentication
sf org login web --alias myOrg
sf org list
sf org open

# Scratch Orgs
sf org create scratch -f config/project-scratch-def.json -a myScratch
sf org delete scratch -o myScratch

# Deploy/Retrieve
sf project deploy start --source-dir force-app
sf project retrieve start --source-dir force-app

# Testing
sf apex run test --test-level RunLocalTests
sf apex get test --test-run-id 707...

# Packages
sf package create --name "MyPackage"
sf package version create --package "MyPackage"

# Data
sf data import tree --plan data/plan.json
sf data export tree --query "SELECT Id, Name FROM Account"
```

## 🚀 Next Steps

**[→ Metadata Fundamentals](/docs/salesforce/metadata/metadata-fundamentals)** - Understand metadata

**[→ CI/CD Guide](/docs/devops-center/)** - Automated deployment

**[→ Real-World Project](/docs/salesforce/apex/real-world-project)** - Build and deploy

---

**You now master SFDX and deployment!** Build, version control, and deploy like a pro. 🚀
