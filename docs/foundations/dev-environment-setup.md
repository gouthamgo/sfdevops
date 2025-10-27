# Setting Up Your Development Environment

**Learning Objective**: Install and configure all the tools you need for professional Salesforce DevOps work.

---

## Your Complete DevOps Toolbox

You've learned the concepts. Now it's time to get your hands dirty with the actual tools.

Here's everything you'll need:

**Essential Tools** (must have):
- **Salesforce CLI (SFDX)**: Command-line tool to interact with Salesforce
- **VS Code**: Your code editor
- **Git**: Version control
- **Node.js**: Required for many Salesforce tools

**Extensions and Plugins** (highly recommended):
- Salesforce Extension Pack for VS Code
- GitLens (see Git history visually)
- Prettier (code formatting)

**Nice-to-Have**:
- SFDX Scanner (code quality checks)
- Org Browser extension (view metadata in VS Code)

---

## Step-by-Step Installation Guide

###  Step 1: Install Git

Git is the foundation. Install it first.

**Mac**:
```bash
# Check if already installed
git --version

# If not, install via Homebrew
brew install git

# Verify
git --version
```

**Windows**:
1. Download from https://git-scm.com/download/win
2. Run installer (use default settings)
3. Open Git Bash
4. Verify: `git --version`

**Linux**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install git

# RedHat/CentOS
sudo yum install git

# Verify
git --version
```

**Configure Git**:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global init.defaultBranch main

# Verify
git config --list
```

---

### Step 2: Install Node.js

Salesforce CLI requires Node.js.

**Download**: https://nodejs.org/

**Choose**: LTS (Long Term Support) version

**Verify installation**:
```bash
node --version
# Should show: v20.x.x or v22.x.x

npm --version
# Should show: 10.x.x
```

**Mac alternative** (using Homebrew):
```bash
brew install node
```

---

### Step 3: Install Salesforce CLI

**Mac**:
```bash
# Using npm (recommended)
npm install --global @salesforce/cli

# Or using Homebrew
brew install --cask salesforce-cli

# Verify
sf --version
```

**Windows**:
1. Download installer from: https://developer.salesforce.com/tools/salesforcecli
2. Run the `.exe` file
3. Follow installation wizard
4. Open new Command Prompt
5. Verify: `sf --version`

**Linux**:
```bash
npm install --global @salesforce/cli

# Verify
sf --version
```

**Note**: The command changed from `sfdx` to `sf` in recent versions. Both work, but `sf` is the newer unified CLI.

---

### Step 4: Install VS Code

**Download**: https://code.visualstudio.com/

**Install**: Follow the installer for your OS

**Verify**: Open VS Code, you should see the welcome screen

---

### Step 5: Install VS Code Extensions

Open VS Code, then install these extensions:

**Salesforce Extension Pack** (Must Have):

1. Click Extensions icon (or press Cmd+Shift+X / Ctrl+Shift+X)
2. Search for "Salesforce Extension Pack"
3. Click Install

This pack includes:
- Salesforce CLI Integration
- Apex language support
- Lightning Web Components support
- Visualforce support
- Aura Components support

**GitLens** (Highly Recommended):

1. Search for "GitLens"
2. Click Install

Shows Git blame, history, and more inline in your code.

**Prettier** (Code Formatter):

1. Search for "Prettier - Code formatter"
2. Click Install
3. Set as default formatter:
   - File → Preferences → Settings
   - Search for "default formatter"
   - Select "Prettier - Code formatter"

**Additional Recommended**:
- Error Lens (inline error messages)
- Bracket Pair Colorizer (easier to read nested code)
- Material Icon Theme (better file icons)

---

## Configure Your First SFDX Project

### Step 1: Create Project Structure

```bash
# Create project directory
mkdir salesforce-devops-project
cd salesforce-devops-project

# Create SFDX project
sf project generate --name myproject

# Navigate into project
cd myproject
```

**What this creates**:
```
myproject/
  ├── config/                   # Scratch org config files
  ├── force-app/                # Your Salesforce metadata
  │   └── main/default/
  │       ├── classes/          # Apex classes
  │       ├── triggers/         # Apex triggers
  │       ├── lwc/              # Lightning Web Components
  │       └── objects/          # Custom objects & fields
  ├── scripts/                  # Utility scripts
  ├── .gitignore               # Files to exclude from Git
  ├── sfdx-project.json        # Project configuration
  └── README.md                # Project documentation
```

### Step 2: Initialize Git

```bash
# Initialize Git repository
git init

# Add all files
git add .

# Make first commit
git commit -m "Initial SFDX project setup"

# View status
git status
```

### Step 3: Open in VS Code

```bash
code .
```

This opens the project in VS Code. You should see:
- File explorer on the left
- Your project structure visible
- Salesforce extensions loaded

---

## Connect to Salesforce Orgs

### Authenticate to Your Developer Org

```bash
# Authenticate (opens browser)
sf org login web --alias DevOrg

# Alternative: Use device auth (no browser)
sf org login device --alias DevOrg

# List authenticated orgs
sf org list
```

**What happens**:
1. Browser opens to Salesforce login
2. You log in with your credentials
3. CLI gets authorized
4. Org is saved locally with alias "DevOrg"

###  Set Default Org

```bash
# Set as default for this project
sf config set target-org DevOrg

# Verify
sf org display
```

Now SFDX commands use this org by default.

### Authorize Multiple Orgs

```bash
# Dev org
sf org login web --alias DevOrg

# Integration sandbox
sf org login web --alias Integration

# UAT sandbox
sf org login web --alias UAT

# Production (be careful!)
sf org login web --alias Production

# List all
sf org list
```

**Switch between orgs**:
```bash
sf config set target-org Integration
```

---

## Pull Metadata from Your Org

### Retrieve Specific Metadata

```bash
# Retrieve all Apex classes
sf project retrieve start --metadata ApexClass

# Retrieve specific object
sf project retrieve start --metadata CustomObject:Account

# Retrieve specific field
sf project retrieve start --metadata CustomField:Account.Industry
```

### Retrieve Using Manifest

Create `manifest/package.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <name>ApexClass</name>
        <members>*</members>
    </types>
    <types>
        <name>ApexTrigger</name>
        <members>*</members>
    </types>
    <types>
        <name>CustomObject</name>
        <members>Account</members>
        <members>Contact</members>
    </types>
    <version>59.0</version>
</Package>
```

Then retrieve:
```bash
sf project retrieve start --manifest manifest/package.xml
```

---

## Essential SFDX Commands Cheat Sheet

### Org Management
```bash
# Login to org
sf org login web --alias MyOrg

# Logout
sf org logout --target-org MyOrg

# List orgs
sf org list

# Display org info
sf org display --target-org MyOrg

# Open org in browser
sf org open --target-org MyOrg
```

### Retrieve Metadata
```bash
# Retrieve by metadata type
sf project retrieve start --metadata ApexClass

# Retrieve by manifest
sf project retrieve start --manifest package.xml

# Retrieve source in package directories
sf project retrieve start --source-dir force-app
```

### Deploy Metadata
```bash
# Deploy all metadata
sf project deploy start --source-dir force-app

# Deploy specific file
sf project deploy start --source-dir force-app/main/default/classes/MyClass.cls

# Deploy with tests
sf project deploy start --source-dir force-app --test-level RunLocalTests

# Validate (check-only, no actual deployment)
sf project deploy start --source-dir force-app --dry-run
```

### Run Tests
```bash
# Run all tests
sf apex run test

# Run specific test class
sf apex run test --class-names MyTestClass

# Run with code coverage
sf apex run test --code-coverage

# Run tests during deployment
sf project deploy start --source-dir force-app --test-level RunLocalTests
```

### Data Operations
```bash
# Export data
sf data export tree --query "SELECT Name, Industry FROM Account" --output-dir data

# Import data
sf data import tree --plan data/Account-plan.json
```

---

## Troubleshooting Common Issues

### Issue 1: "Command not found: sf"

**Problem**: PATH not set correctly

**Solution**:

Mac/Linux:
```bash
# Add to ~/.zshrc or ~/.bashrc
export PATH="/usr/local/bin:$PATH"

# Reload shell
source ~/.zshrc
```

Windows:
- Add Salesforce CLI bin directory to System PATH
- Restart Command Prompt

### Issue 2: "Authentication failed"

**Problem**: Credentials expired or incorrect

**Solution**:
```bash
# Logout and login again
sf org logout --target-org MyOrg
sf org login web --alias MyOrg
```

### Issue 3: "Deployment failed: Missing dependency"

**Problem**: Trying to deploy metadata that depends on other metadata not yet deployed

**Solution**:
- Deploy dependencies first
- Use `sf project deploy start --manifest` with correct order
- Check deployment errors for specific missing components

### Issue 4: "This directory doesn't contain a valid SFDX project"

**Problem**: Missing `sfdx-project.json` file

**Solution**:
```bash
# Make sure you're in project directory
cd /path/to/your/project

# Or create new project
sf project generate --name myproject
```

---

## Configure VS Code for Salesforce

### Settings.json Configuration

Open VS Code settings (Cmd+, or Ctrl+,), then click "Open Settings (JSON)" icon.

Add these settings:

```json
{
  "salesforcedx-vscode-core.show-cli-success-msg": false,
  "salesforcedx-vscode-core.telemetry.enabled": false,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[apex]": {
    "editor.defaultFormatter": "salesforce.salesforcedx-vscode-apex"
  },
  "[xml]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "salesforcedx-vscode-apex.java.home": "/Library/Java/JavaVirtualMachines/jdk-11.jdk/Contents/Home",
  "git.autofetch": true,
  "git.enableSmartCommit": true
}
```

### Keyboard Shortcuts

Learn these VS Code shortcuts:

**Salesforce-specific**:
- `Cmd+Shift+P` (Ctrl+Shift+P): Command palette
- Type "SFDX" to see all Salesforce commands

**Common operations**:
- `SFDX: Create Apex Class`
- `SFDX: Deploy Source to Org`
- `SFDX: Retrieve Source from Org`
- `SFDX: Execute Anonymous Apex`

**General**:
- `Cmd+P` (Ctrl+P): Quick file open
- `Cmd+Shift+F` (Ctrl+Shift+F): Search in files
- `Cmd+B` (Ctrl+B): Toggle sidebar

---

## Verify Your Setup

Run these commands to verify everything works:

```bash
# Check Git
git --version
# Expected: git version 2.x.x

# Check Node.js
node --version
# Expected: v20.x.x or higher

# Check Salesforce CLI
sf --version
# Expected: @salesforce/cli/2.x.x

# Check VS Code (from terminal)
code --version
# Expected: 1.x.x

# List authenticated orgs
sf org list
# Should show your dev org

# Display org info
sf org display
# Should show org details
```

If all these work, you're ready to start building!

---

## Quick Check: Setup Verification

**Task 1**: Create a simple Apex class using VS Code

1. Open your SFDX project in VS Code
2. Press `Cmd+Shift+P` (Ctrl+Shift+P)
3. Type "SFDX: Create Apex Class"
4. Name it "HelloWorld"
5. Add simple code:
```apex
public class HelloWorld {
    public static String greet() {
        return 'Hello from DevOps!';
    }
}
```
6. Save the file
7. Deploy: `sf project deploy start --source-dir force-app/main/default/classes/HelloWorld.cls`

**If this works**: Your setup is complete!

---

## Key Takeaways

✅ **Git is the foundation** - Version control for all your code

✅ **Salesforce CLI is your workhorse** - Interact with orgs from command line

✅ **VS Code + extensions** - Professional development environment

✅ **Multiple org authentication** - Switch between Dev, UAT, Production easily

✅ **SFDX project structure** - Organized, Git-friendly metadata format

---

## Congratulations! Foundations Complete

You've finished the Foundations section. You now understand:

1. **What Salesforce DevOps is** - And why it matters for your career
2. **Salesforce environments** - Production, sandboxes, scratch orgs
3. **Version control with Git** - Track every change, forever
4. **Salesforce metadata** - The XML behind your clicks
5. **CI/CD concepts** - Automate testing and deployment
6. **Automated testing** - The safety net that makes DevOps safe
7. **Development environment** - All tools configured and ready

**You're now ready to BUILD.**

---

## Up Next: Building Your First CI/CD Pipeline

The theory is done. Let's get hands-on.

In Section 2, we'll build a real CI/CD pipeline from scratch:
- Create a GitLab repository
- Write a `.gitlab-ci.yml` pipeline file
- Automate Salesforce deployments
- Run tests automatically
- Deploy to multiple environments

**Your first pipeline will**:
- Validate code on every commit
- Run Apex tests automatically
- Deploy to Dev sandbox on merge to main
- Give you Slack notifications

By the end of Section 2, you'll have a working pipeline you can show in interviews.

Let's build: **[GitLab CI/CD Basics →](/docs/pipelines/gitlab-basics)**

---

**Pro tip**: Bookmark this page. You'll reference these commands constantly. The Salesforce CLI documentation is also excellent: https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/
