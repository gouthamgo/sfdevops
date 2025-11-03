# Quick Reference Cheat Sheets

**Purpose**: Fast reference for common commands, workflows, and troubleshooting. Bookmark this page!

---

## SFDX CLI Commands

### Authentication

```bash
# Web login
sf org login web --alias MyOrg --set-default

# JWT login (CI/CD)
sf org login jwt --username user@example.com --jwt-key-file server.key --client-id CONSUMER_KEY --alias ProdOrg

# Device login (no browser)
sf org login device --alias MyOrg

# Auth URL login (CI/CD)
sf org login sfdx-url --sfdx-url-file authfile.txt --alias MyOrg

# Display org info
sf org display --target-org MyOrg --verbose

# List all authenticated orgs
sf org list

# Logout
sf org logout --target-org MyOrg --no-prompt
```

### Deployment

```bash
# Deploy source
sf project deploy start --source-dir force-app/

# Deploy with manifest
sf project deploy start --manifest package.xml

# Deploy and run tests
sf project deploy start --source-dir force-app/ --test-level RunLocalTests

# Validate only (check deploy)
sf project deploy validate --source-dir force-app/ --test-level RunLocalTests

# Quick deploy (after validation)
sf project deploy quick --job-id 0Af...

# Check deployment status
sf project deploy report --job-id 0Af...

# Deploy with wait time
sf project deploy start --source-dir force-app/ --wait 30

# Deploy specific metadata
sf project deploy start --metadata ApexClass:MyClass

# Deploy to specific org
sf project deploy start --source-dir force-app/ --target-org ProdOrg
```

### Retrieval

```bash
# Retrieve with manifest
sf project retrieve start --manifest package.xml

# Retrieve specific metadata
sf project retrieve start --metadata ApexClass:MyClass

# Retrieve all Apex classes
sf project retrieve start --metadata ApexClass

# Retrieve from source tracking
sf project retrieve start --source-dir force-app/

# Retrieve and unpack
sf project retrieve start --manifest package.xml --target-dir retrieved/
```

### Testing

```bash
# Run all tests
sf apex run test --test-level RunLocalTests --result-format human

# Run specific test class
sf apex run test --class-names MyTestClass --result-format human --code-coverage

# Run multiple test classes
sf apex run test --class-names MyTestClass,AnotherTestClass

# Run specific test method
sf apex run test --tests MyTestClass.testMethod1

# Get test results
sf apex get test --test-run-id 707...

# Run tests with JSON output
sf apex run test --test-level RunLocalTests --result-format json > test-results.json
```

### Data

```bash
# Query records
sf data query --query "SELECT Id, Name FROM Account LIMIT 10"

# Query and output to file
sf data query --query "SELECT Id, Name FROM Account" --result-format csv > accounts.csv

# Create record
sf data create record --sobject Account --values "Name='Test Account' Industry='Technology'"

# Update record
sf data update record --sobject Account --record-id 001... --values "Name='Updated Name'"

# Delete record
sf data delete record --sobject Account --record-id 001...

# Export data
sf data export tree --query "SELECT Id, Name FROM Account" --output-dir ./data

# Import data
sf data import tree --plan ./data/Account-plan.json
```

### Scratch Orgs

```bash
# Create scratch org
sf org create scratch --definition-file config/project-scratch-def.json --alias MyScratchOrg --duration-days 7

# Open scratch org
sf org open --target-org MyScratchOrg

# Push source to scratch org
sf project deploy start --source-dir force-app/ --target-org MyScratchOrg

# Pull from scratch org
sf project retrieve start --target-org MyScratchOrg

# Delete scratch org
sf org delete scratch --target-org MyScratchOrg --no-prompt

# List scratch orgs
sf org list --all
```

### Limits and Info

```bash
# Display limits
sf limits api display

# Display org info
sf org display

# Display user info
sf org display user
```

---

## Git Commands

### Basic Workflow

```bash
# Initialize repo
git init

# Clone repo
git clone https://github.com/user/repo.git

# Check status
git status

# Stage files
git add file.txt
git add .  # Stage all changes

# Commit
git commit -m "Commit message"

# Push
git push origin main

# Pull
git pull origin main

# View log
git log --oneline --graph --decorate --all
```

### Branching

```bash
# Create branch
git branch feature/new-feature

# Switch to branch
git checkout feature/new-feature

# Create and switch (shortcut)
git checkout -b feature/new-feature

# List branches
git branch  # Local branches
git branch -a  # All branches (local + remote)

# Delete branch
git branch -d feature/old-feature  # Safe delete
git branch -D feature/old-feature  # Force delete

# Rename branch
git branch -m old-name new-name

# Push new branch to remote
git push -u origin feature/new-feature
```

### Merging

```bash
# Merge branch into current branch
git merge feature/new-feature

# Merge with no fast-forward (creates merge commit)
git merge --no-ff feature/new-feature

# Abort merge (if conflicts)
git merge --abort
```

### Rebasing

```bash
# Rebase current branch onto main
git rebase main

# Interactive rebase (squash commits)
git rebase -i HEAD~3  # Last 3 commits

# Continue rebase after resolving conflicts
git rebase --continue

# Abort rebase
git rebase --abort
```

### Stashing

```bash
# Stash changes
git stash

# Stash with message
git stash save "Work in progress"

# List stashes
git stash list

# Apply stash
git stash apply  # Keeps stash
git stash pop    # Applies and removes stash

# Apply specific stash
git stash apply stash@{2}

# Delete stash
git stash drop stash@{0}

# Clear all stashes
git stash clear
```

### Undoing Changes

```bash
# Discard changes in working directory
git checkout -- file.txt

# Unstage file
git reset HEAD file.txt

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert commit (creates new commit)
git revert abc123

# Amend last commit
git commit --amend -m "New message"
```

### Remote Operations

```bash
# Add remote
git remote add origin https://github.com/user/repo.git

# List remotes
git remote -v

# Fetch from remote
git fetch origin

# Pull from remote
git pull origin main

# Push to remote
git push origin main

# Force push (dangerous!)
git push --force origin main

# Delete remote branch
git push origin --delete feature/old-feature
```

### Resolving Conflicts

```bash
# During merge/rebase, conflicts appear in files:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> branch-name

# Steps:
1. Open file and manually resolve conflicts
2. Remove conflict markers
3. git add file.txt
4. git commit (for merge) or git rebase --continue (for rebase)
```

---

## GitHub Actions Quick Reference

### Basic Workflow Structure

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run script
        run: ./script.sh
```

### Common Actions

```yaml
# Checkout code
- uses: actions/checkout@v4

# Setup Node.js
- uses: actions/setup-node@v4
  with:
    node-version: '18'

# Cache dependencies
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# Upload artifacts
- uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: test-results/

# Download artifacts
- uses: actions/download-artifact@v4
  with:
    name: test-results
    path: test-results/
```

### Salesforce Deployment

```yaml
- name: Authenticate
  run: |
    echo "${{ secrets.SFDX_AUTH_URL }}" > authfile
    sf org login sfdx-url --sfdx-url-file authfile --alias DevOrg
    rm authfile

- name: Deploy
  run: |
    sf project deploy start --manifest package.xml --test-level RunLocalTests
```

### Conditional Execution

```yaml
# Run only on specific branch
if: github.ref == 'refs/heads/main'

# Run only on push (not PR)
if: github.event_name == 'push'

# Run only if previous step succeeded
if: success()

# Run only if previous step failed
if: failure()

# Run always (even if previous steps failed)
if: always()
```

### Matrix Builds

```yaml
strategy:
  matrix:
    node-version: [14, 16, 18]
    os: [ubuntu-latest, windows-latest]

steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

---

## Troubleshooting Guide

### Problem: Deployment Failed

```bash
# 1. Check deployment status
sf project deploy report --job-id 0Af...

# 2. Check for specific errors
sf project deploy report --job-id 0Af... --verbose

# 3. Validate before deploying
sf project deploy validate --source-dir force-app/ --test-level RunLocalTests

# 4. Deploy with debug
SF_LOG_LEVEL=debug sf project deploy start --source-dir force-app/
```

### Problem: Test Failures

```bash
# 1. Run tests locally
sf apex run test --test-level RunLocalTests --result-format human

# 2. Run specific failing test
sf apex run test --class-names FailingTest --result-format human --code-coverage

# 3. Check test results
sf apex get test --test-run-id 707...

# 4. Enable debug logs
sf apex tail log
```

### Problem: Merge Conflicts

```bash
# 1. Identify conflicted files
git status

# 2. Open files and resolve conflicts manually

# 3. Mark as resolved
git add file.txt

# 4. Complete merge
git commit

# Or abort and start over
git merge --abort
```

### Problem: Authentication Issues

```bash
# 1. Check authenticated orgs
sf org list

# 2. Re-authenticate
sf org logout --target-org MyOrg
sf org login web --alias MyOrg

# 3. Verify authentication
sf org display --target-org MyOrg

# 4. For CI/CD, regenerate auth URL
sf org display --verbose --target-org MyOrg
# Copy the "Sfdx Auth Url" value
```

### Problem: Coverage Below 75%

```bash
# 1. Check current coverage
sf apex run test --test-level RunLocalTests --code-coverage

# 2. Identify uncovered lines
sf apex get test --test-run-id 707... --code-coverage

# 3. Write additional tests for uncovered code

# 4. Re-run tests
sf apex run test --test-level RunLocalTests --code-coverage
```

---

## Keyboard Shortcuts

### VS Code (Salesforce Extensions)

```
Cmd/Ctrl + Shift + P    Open Command Palette
Cmd/Ctrl + Shift + P → "SFDX: Create Apex Class"
Cmd/Ctrl + Shift + P → "SFDX: Deploy Source to Org"
Cmd/Ctrl + Shift + P → "SFDX: Retrieve Source from Org"
Cmd/Ctrl + Shift + P → "SFDX: Execute SOQL Query"
Cmd/Ctrl + Shift + P → "SFDX: Open Default Org"

Cmd/Ctrl + S            Save and push to org (if enabled)
```

### Git in VS Code

```
Cmd/Ctrl + Shift + G    Open Source Control
Cmd/Ctrl + Enter        Commit staged changes
Cmd/Ctrl + Shift + P → "Git: Push"
Cmd/Ctrl + Shift + P → "Git: Pull"
Cmd/Ctrl + Shift + P → "Git: Checkout to..."
```

---

## Common Metadata Types

| Type | Extension | Description |
|------|-----------|-------------|
| ApexClass | `.cls` | Apex classes |
| ApexTrigger | `.trigger` | Apex triggers |
| ApexPage | `.page` | Visualforce pages |
| ApexComponent | `.component` | Visualforce components |
| LightningComponentBundle | directory | Lightning Web Components |
| CustomObject | `.object-meta.xml` | Custom objects |
| CustomField | `.field-meta.xml` | Custom fields |
| PermissionSet | `.permissionset-meta.xml` | Permission sets |
| Profile | `.profile-meta.xml` | Profiles |
| Layout | `.layout-meta.xml` | Page layouts |
| Flow | `.flow-meta.xml` | Flows |
| ValidationRule | `.validationRule-meta.xml` | Validation rules |
| CustomTab | `.tab-meta.xml` | Custom tabs |
| CustomApplication | `.app-meta.xml` | Custom apps |

---

## Test Levels

| Test Level | Description | When to Use |
|------------|-------------|-------------|
| `NoTestRun` | No tests run | Sandbox deployments (not recommended) |
| `RunSpecifiedTests` | Run specific test classes | Testing specific functionality |
| `RunLocalTests` | Run all tests except managed packages | Standard deployments |
| `RunAllTestsInOrg` | Run ALL tests including managed packages | Production deployments (not recommended) |

---

## Package.xml Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <!-- Apex Classes -->
    <types>
        <members>*</members>
        <name>ApexClass</name>
    </types>

    <!-- Apex Triggers -->
    <types>
        <members>*</members>
        <name>ApexTrigger</name>
    </types>

    <!-- Lightning Web Components -->
    <types>
        <members>*</members>
        <name>LightningComponentBundle</name>
    </types>

    <!-- Custom Objects -->
    <types>
        <members>MyCustomObject__c</members>
        <name>CustomObject</name>
    </types>

    <!-- Custom Fields -->
    <types>
        <members>Account.MyCustomField__c</members>
        <name>CustomField</name>
    </types>

    <!-- Flows -->
    <types>
        <members>My_Flow</members>
        <name>Flow</name>
    </types>

    <!-- Permission Sets -->
    <types>
        <members>My_Permission_Set</members>
        <name>PermissionSet</name>
    </types>

    <version>59.0</version>
</Package>
```

---

## Quick Decision Tree

### Should I use merge or rebase?

```
Are commits already pushed to shared branch?
├─ Yes → Use merge (safe, preserves history)
└─ No → Use rebase (clean history)
```

### Which test level should I use?

```
Deploying to...
├─ Sandbox → RunLocalTests
├─ Production → RunLocalTests
└─ Production (first deployment) → RunLocalTests
```

### How should I handle deployment failures?

```
Deployment failed...
├─ Test failures → Fix tests, redeploy
├─ Coverage below 75% → Write more tests
├─ Metadata errors → Fix dependencies, redeploy
├─ Governor limits → Optimize code, redeploy
└─ Unknown → Check deployment report, check logs
```

---

## One-Liners

```bash
# Get org ID
sf data query --query "SELECT Id FROM Organization" --json | jq -r '.result.records[0].Id'

# Get all Apex classes
sf data query --query "SELECT Name FROM ApexClass ORDER BY Name" --result-format csv

# Get code coverage
sf apex get test --test-run-id latest --code-coverage --json | jq '.result.summary.orgWideCoverage'

# Get all users
sf data query --query "SELECT Username, Profile.Name FROM User WHERE IsActive = true"

# Export all accounts
sf data query --query "SELECT Id, Name, Industry FROM Account" --result-format csv > accounts.csv

# Create scratch org and push
sf org create scratch --definition-file config/project-scratch-def.json --alias scratch --set-default && sf project deploy start --source-dir force-app/

# Deploy and run specific tests
sf project deploy start --source-dir force-app/ --tests MyTestClass --test-level RunSpecifiedTests

# Quick validation (no deployment)
sf project deploy validate --source-dir force-app/ --test-level RunLocalTests --wait 10

# Get last deployment status
sf project deploy report --job-id latest
```

---

**Print this page** and keep it near your desk for quick reference!
