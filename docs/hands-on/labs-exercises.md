# Hands-On Labs & Exercises

**Learning Objective**: Build real-world DevOps skills through practical, hands-on exercises. Each lab builds on the previous one, culminating in a complete CI/CD pipeline you can showcase in interviews.

---

## How to Use These Labs

**Prerequisites**:
- Salesforce Developer Edition org (free at developer.salesforce.com)
- GitHub account (free)
- VS Code with Salesforce extensions
- Git installed locally
- Node.js and npm installed

**Lab Structure**:
Each lab includes:
- ⏱️ **Time estimate**: How long it typically takes
- 🎯 **Learning goals**: What you'll learn
- 📋 **Prerequisites**: What you need before starting
- 🔨 **Step-by-step instructions**: What to do
- ✅ **Verification**: How to know you succeeded
- 🐛 **Troubleshooting**: Common issues and fixes
- 💼 **Portfolio tip**: How to showcase this in interviews

**Recommended order**: Complete labs 1-8 in sequence for best results.

---

## Lab 1: Set Up Your First Salesforce DX Project

⏱️ **Time**: 30 minutes
🎯 **Goals**: Create a Salesforce DX project, authenticate to an org, retrieve metadata

### Step 1: Create Developer Org

```bash
# Go to developer.salesforce.com and sign up for a free Developer Edition

# After signup, you'll have:
# - Username: your-email@example.com
# - Instance URL: https://login.salesforce.com (or your custom domain)
```

### Step 2: Install Salesforce CLI

```bash
# macOS (using Homebrew)
brew install sf

# Windows (using npm)
npm install -g @salesforce/cli

# Linux
npm install -g @salesforce/cli

# Verify installation
sf --version
# Should output: @salesforce/cli/2.x.x
```

### Step 3: Create Project

```bash
# Create a new directory for your project
mkdir salesforce-devops-project
cd salesforce-devops-project

# Initialize a Salesforce DX project
sf project generate --name "My DevOps Project"

# Your project structure:
# my-devops-project/
# ├── force-app/
# │   └── main/
# │       └── default/
# ├── config/
# ├── scripts/
# ├── .gitignore
# ├── sfdx-project.json
# └── README.md
```

### Step 4: Authenticate to Your Org

```bash
# Authenticate using web login
sf org login web --alias DevOrg --set-default

# This will:
# 1. Open browser
# 2. Prompt for username/password
# 3. Store authentication locally
# 4. Set DevOrg as default org

# Verify authentication
sf org list

# Output should show:
# === Orgs
# ALIAS   USERNAME                    ORG ID             CONNECTED STATUS
# DevOrg  your-email@example.com      00D...             Connected
```

### Step 5: Retrieve Existing Metadata

```bash
# Retrieve Account object metadata
sf project retrieve start --metadata CustomObject:Account

# Retrieve all Apex classes
sf project retrieve start --metadata ApexClass

# Retrieve using manifest file
cat > package.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>*</members>
        <name>ApexClass</name>
    </types>
    <types>
        <members>*</members>
        <name>ApexTrigger</name>
    </types>
    <types>
        <members>Account</members>
        <name>CustomObject</name>
    </types>
    <version>59.0</version>
</Package>
EOF

sf project retrieve start --manifest package.xml
```

### Step 6: Explore Retrieved Metadata

```bash
# List retrieved files
ls -la force-app/main/default/

# You should see:
# - classes/          (Apex classes)
# - triggers/         (Apex triggers)
# - objects/          (Custom objects)
# - lwc/              (Lightning Web Components)

# View an Apex class
cat force-app/main/default/classes/SomeClass.cls
```

### ✅ Verification

**You've succeeded when**:
- `sf org list` shows your authenticated org
- `force-app/` directory contains retrieved metadata
- You can open the project in VS Code

**Test it**:
```bash
# Make a small change to any Apex class
# Add a comment: // Testing deployment

# Deploy the change
sf project deploy start --source-dir force-app/main/default/classes

# Should see: "Deploy Succeeded"
```

### 🐛 Troubleshooting

**Issue**: "sf: command not found"
**Fix**:
```bash
# Reinstall Salesforce CLI
npm install -g @salesforce/cli

# Add to PATH (macOS/Linux)
export PATH="$PATH:$HOME/.local/bin"
```

**Issue**: "ERROR running org login web: We couldn't open a browser"
**Fix**:
```bash
# Use device login instead
sf org login device --alias DevOrg
# Follow the instructions to enter the code
```

**Issue**: "Entity of type 'CustomObject' named 'Account' cannot be found"
**Fix**: Account is a standard object. Use a custom object instead:
```bash
sf project retrieve start --metadata CustomObject:YourCustomObject__c
```

### 💼 Portfolio Tip

**In interviews, say**:
> "I set up a complete Salesforce DX project from scratch, configured authentication, and retrieved metadata from my org. I used the Salesforce CLI to manage deployments and source control."

**Show them**:
- Your project structure
- Authentication setup
- Retrieved metadata files

---

## Lab 2: Create Your First Apex Class with Tests

⏱️ **Time**: 45 minutes
🎯 **Goals**: Write an Apex class, write unit tests, deploy to org, run tests

### Step 1: Create Apex Class

```bash
# Create a new Apex class using CLI
sf apex generate class --name OpportunityScorer --output-dir force-app/main/default/classes
```

Edit `force-app/main/default/classes/OpportunityScorer.cls`:

```apex
/**
 * Scores opportunities based on amount and probability
 * Used for prioritizing sales efforts
 */
public with sharing class OpportunityScorer {

    public class ScoredOpportunity {
        public Id opportunityId;
        public String name;
        public Decimal score;

        public ScoredOpportunity(Id oppId, String oppName, Decimal oppScore) {
            this.opportunityId = oppId;
            this.name = oppName;
            this.score = oppScore;
        }
    }

    /**
     * Calculate opportunity score based on amount and probability
     * Score = Amount * (Probability / 100) * Stage Multiplier
     */
    public static Decimal calculateScore(Opportunity opp) {
        if (opp.Amount == null || opp.Probability == null) {
            return 0;
        }

        Decimal baseScore = opp.Amount * (opp.Probability / 100);
        Decimal stageMultiplier = getStageMultiplier(opp.StageName);

        return baseScore * stageMultiplier;
    }

    /**
     * Get all opportunities with scores above threshold
     */
    public static List<ScoredOpportunity> getHighValueOpportunities(Decimal threshold) {
        List<ScoredOpportunity> scoredOpps = new List<ScoredOpportunity>();

        for (Opportunity opp : [
            SELECT Id, Name, Amount, Probability, StageName
            FROM Opportunity
            WHERE Amount != null
            AND Probability != null
            AND IsClosed = false
            LIMIT 1000
        ]) {
            Decimal score = calculateScore(opp);
            if (score >= threshold) {
                scoredOpps.add(new ScoredOpportunity(opp.Id, opp.Name, score));
            }
        }

        return scoredOpps;
    }

    /**
     * Stage-based multipliers
     */
    private static Decimal getStageMultiplier(String stageName) {
        Map<String, Decimal> multipliers = new Map<String, Decimal>{
            'Prospecting' => 0.5,
            'Qualification' => 0.7,
            'Needs Analysis' => 0.8,
            'Value Proposition' => 0.9,
            'Id. Decision Makers' => 1.0,
            'Perception Analysis' => 1.1,
            'Proposal/Price Quote' => 1.2,
            'Negotiation/Review' => 1.3,
            'Closed Won' => 1.5,
            'Closed Lost' => 0.0
        };

        return multipliers.containsKey(stageName) ? multipliers.get(stageName) : 1.0;
    }

    /**
     * Bulk update opportunity scores
     */
    public static void updateOpportunityScores(Set<Id> opportunityIds) {
        List<Opportunity> oppsToUpdate = new List<Opportunity>();

        for (Opportunity opp : [
            SELECT Id, Amount, Probability, StageName, Score__c
            FROM Opportunity
            WHERE Id IN :opportunityIds
        ]) {
            Decimal score = calculateScore(opp);
            opp.Score__c = score;
            oppsToUpdate.add(opp);
        }

        if (!oppsToUpdate.isEmpty()) {
            update oppsToUpdate;
        }
    }
}
```

### Step 2: Create Test Class

```bash
# Generate test class
sf apex generate class --name OpportunityScorerTest --output-dir force-app/main/default/classes
```

Edit `force-app/main/default/classes/OpportunityScorerTest.cls`:

```apex
@isTest
private class OpportunityScorerTest {

    @TestSetup
    static void setupTestData() {
        // Create test opportunities
        List<Opportunity> testOpps = new List<Opportunity>();

        testOpps.add(new Opportunity(
            Name = 'High Value Opp',
            Amount = 100000,
            Probability = 90,
            StageName = 'Proposal/Price Quote',
            CloseDate = Date.today().addDays(30)
        ));

        testOpps.add(new Opportunity(
            Name = 'Medium Value Opp',
            Amount = 50000,
            Probability = 50,
            StageName = 'Qualification',
            CloseDate = Date.today().addDays(60)
        ));

        testOpps.add(new Opportunity(
            Name = 'Low Value Opp',
            Amount = 10000,
            Probability = 20,
            StageName = 'Prospecting',
            CloseDate = Date.today().addDays(90)
        ));

        insert testOpps;
    }

    @isTest
    static void testCalculateScore_HighValue() {
        Opportunity opp = [SELECT Id, Amount, Probability, StageName FROM Opportunity WHERE Name = 'High Value Opp' LIMIT 1];

        Test.startTest();
        Decimal score = OpportunityScorer.calculateScore(opp);
        Test.stopTest();

        // Expected: 100000 * 0.90 * 1.2 (Proposal stage multiplier) = 108000
        System.assertEquals(108000, score, 'High value opportunity score incorrect');
    }

    @isTest
    static void testCalculateScore_NullAmount() {
        Opportunity opp = new Opportunity(
            Name = 'Null Amount Opp',
            Amount = null,
            Probability = 50,
            StageName = 'Qualification',
            CloseDate = Date.today()
        );

        Test.startTest();
        Decimal score = OpportunityScorer.calculateScore(opp);
        Test.stopTest();

        System.assertEquals(0, score, 'Null amount should return 0 score');
    }

    @isTest
    static void testGetHighValueOpportunities() {
        Test.startTest();
        List<OpportunityScorer.ScoredOpportunity> scoredOpps = OpportunityScorer.getHighValueOpportunities(30000);
        Test.stopTest();

        // Should return high and medium value opps (scores > 30000)
        System.assert(scoredOpps.size() >= 2, 'Should return at least 2 high value opportunities');

        // Verify scores are above threshold
        for (OpportunityScorer.ScoredOpportunity scoredOpp : scoredOpps) {
            System.assert(scoredOpp.score >= 30000, 'All returned opportunities should have score >= threshold');
        }
    }

    @isTest
    static void testUpdateOpportunityScores_Bulk() {
        // Test with 200 opportunities to verify bulkification
        List<Opportunity> bulkOpps = new List<Opportunity>();

        for (Integer i = 0; i < 200; i++) {
            bulkOpps.add(new Opportunity(
                Name = 'Bulk Opp ' + i,
                Amount = 10000 + (i * 100),
                Probability = 50,
                StageName = 'Qualification',
                CloseDate = Date.today().addDays(30)
            ));
        }
        insert bulkOpps;

        Set<Id> oppIds = new Map<Id, Opportunity>(bulkOpps).keySet();

        Test.startTest();
        OpportunityScorer.updateOpportunityScores(oppIds);
        Test.stopTest();

        // Verify scores were calculated
        List<Opportunity> updatedOpps = [SELECT Id, Score__c FROM Opportunity WHERE Id IN :oppIds];
        for (Opportunity opp : updatedOpps) {
            System.assertNotEquals(null, opp.Score__c, 'Score should be calculated for all opportunities');
        }
    }

    @isTest
    static void testCalculateScore_AllStages() {
        // Test all stage multipliers
        List<String> stages = new List<String>{
            'Prospecting', 'Qualification', 'Needs Analysis',
            'Proposal/Price Quote', 'Negotiation/Review', 'Closed Won'
        };

        for (String stage : stages) {
            Opportunity opp = new Opportunity(
                Name = 'Test Opp',
                Amount = 10000,
                Probability = 50,
                StageName = stage,
                CloseDate = Date.today()
            );

            Decimal score = OpportunityScorer.calculateScore(opp);
            System.assertNotEquals(0, score, 'Score should be calculated for stage: ' + stage);
        }
    }
}
```

### Step 3: Add Required Custom Field

Before deploying, we need to add the `Score__c` field to Opportunity:

```bash
# Create field metadata directory
mkdir -p force-app/main/default/objects/Opportunity/fields
```

Create `force-app/main/default/objects/Opportunity/fields/Score__c.field-meta.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Score__c</fullName>
    <label>Score</label>
    <precision>18</precision>
    <required>false</required>
    <scale>2</scale>
    <trackHistory>false</trackHistory>
    <trackTrending>false</trackTrending>
    <type>Number</type>
    <unique>false</unique>
</CustomField>
```

### Step 4: Deploy to Org

```bash
# Deploy all changes
sf project deploy start --source-dir force-app/main/default

# You should see:
# === Deployed Source
# STATE  FULL NAME                    TYPE
# ─────  ───────────────────────────  ──────────────
# Add    OpportunityScorer            ApexClass
# Add    OpportunityScorerTest        ApexClass
# Add    Opportunity.Score__c         CustomField
```

### Step 5: Run Tests

```bash
# Run the test class
sf apex run test --class-names OpportunityScorerTest --result-format human --code-coverage

# Output shows:
# === Test Results
# TEST NAME                                           OUTCOME  MESSAGE  RUNTIME (MS)
# ─────────────────────────────────────────────────  ───────  ───────  ────────────
# OpportunityScorerTest.testCalculateScore_HighValue  Pass              245
# OpportunityScorerTest.testCalculateScore_NullAmount Pass              102
# OpportunityScorerTest.testGetHighValueOpportunities Pass              387
# OpportunityScorerTest.testUpdateOpportunityScores_Bulk Pass           1203
# OpportunityScorerTest.testCalculateScore_AllStages  Pass              156
#
# === Apex Code Coverage
# NAME                   % COVERED  UNCOVERED LINES
# ─────────────────────  ─────────  ───────────────
# OpportunityScorer      96%        Line 87
```

### ✅ Verification

**You've succeeded when**:
- All 5 tests pass
- Code coverage is > 75%
- Class is deployed to your org
- You can see the `Score__c` field on Opportunity

**Test it manually**:
```bash
# Open org
sf org open

# Navigate to Opportunities tab
# Create a test opportunity with Amount and Probability
# Open Developer Console (Gear icon → Developer Console)
# Debug → Open Execute Anonymous Window
# Run this code:

Opportunity opp = [SELECT Id, Amount, Probability, StageName FROM Opportunity LIMIT 1];
Decimal score = OpportunityScorer.calculateScore(opp);
System.debug('Opportunity Score: ' + score);
```

### 🐛 Troubleshooting

**Issue**: "Field Score__c does not exist"
**Fix**: Deploy the custom field first:
```bash
sf project deploy start --metadata CustomField:Opportunity.Score__c
```

**Issue**: "Test coverage is only 60%"
**Fix**: Add more test methods to cover edge cases

**Issue**: "Deployment failed: Test failures"
**Fix**: Check test output for specific failures:
```bash
sf apex run test --class-names OpportunityScorerTest --result-format tap
```

### 💼 Portfolio Tip

**In interviews, say**:
> "I built an Opportunity scoring system that calculates value based on amount, probability, and stage. I wrote comprehensive unit tests achieving 96% code coverage, including bulk testing with 200 records to verify governor limit compliance."

**Show them**:
- The OpportunityScorer class (clean, well-documented code)
- Test class with multiple test methods
- Test results showing 96% coverage
- Explain the scoring algorithm

---

## Lab 3: Set Up Git and Push to GitHub

⏱️ **Time**: 30 minutes
🎯 **Goals**: Initialize Git, create GitHub repository, push code, create branches

### Step 1: Initialize Git Repository

```bash
# Navigate to your project
cd salesforce-devops-project

# Initialize Git
git init

# Check gitignore (should already exist from SFDX project)
cat .gitignore

# Should include:
# .sfdx/
# .localdevserver/
# .sf/
# node_modules/
# etc.

# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit: Salesforce DX project with OpportunityScorer"

# Check status
git status
# Should show: nothing to commit, working tree clean
```

### Step 2: Create GitHub Repository

```bash
# Option 1: Using GitHub CLI (recommended)
# Install: https://cli.github.com/

# Login to GitHub
gh auth login

# Create repository
gh repo create salesforce-devops-project --public --source=. --remote=origin

# Option 2: Using web UI
# 1. Go to github.com
# 2. Click "New repository"
# 3. Name it "salesforce-devops-project"
# 4. Don't initialize with README (we already have code)
# 5. Click "Create repository"
```

### Step 3: Push to GitHub

```bash
# If you used web UI, add remote:
git remote add origin https://github.com/YOUR_USERNAME/salesforce-devops-project.git

# Verify remote
git remote -v

# Push to GitHub
git push -u origin main

# Visit your repository
# https://github.com/YOUR_USERNAME/salesforce-devops-project
```

### Step 4: Create Branch Protection

```bash
# Using GitHub CLI
gh repo edit --enable-branch-protection main

# Or via web UI:
# Settings → Branches → Add rule
# Branch name pattern: main
# ✓ Require pull request reviews before merging
# ✓ Require status checks to pass before merging
# ✓ Include administrators
```

### Step 5: Create Feature Branch

```bash
# Create and switch to feature branch
git checkout -b feature/add-opportunity-trigger

# Verify current branch
git branch
# * feature/add-opportunity-trigger
#   main
```

### Step 6: Make Changes on Feature Branch

Create a trigger to auto-score opportunities:

```bash
# Create trigger directory
mkdir -p force-app/main/default/triggers

# Create trigger file
cat > force-app/main/default/triggers/OpportunityTrigger.trigger << 'EOF'
trigger OpportunityTrigger on Opportunity (after insert, after update) {
    OpportunityTriggerHandler.handleAfterInsert(Trigger.new);
}
EOF

# Create trigger metadata
cat > force-app/main/default/triggers/OpportunityTrigger.trigger-meta.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<ApexTrigger xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <status>Active</status>
</ApexTrigger>
EOF
```

Create trigger handler:

```bash
cat > force-app/main/default/classes/OpportunityTriggerHandler.cls << 'EOF'
public with sharing class OpportunityTriggerHandler {

    public static void handleAfterInsert(List<Opportunity> newOpps) {
        Set<Id> oppIds = new Set<Id>();
        for (Opportunity opp : newOpps) {
            if (opp.Amount != null && opp.Probability != null) {
                oppIds.add(opp.Id);
            }
        }

        if (!oppIds.isEmpty()) {
            OpportunityScorer.updateOpportunityScores(oppIds);
        }
    }
}
EOF

cat > force-app/main/default/classes/OpportunityTriggerHandler.cls-meta.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <status>Active</status>
</ApexClass>
EOF
```

### Step 7: Commit and Push Feature Branch

```bash
# Stage changes
git add force-app/main/default/triggers/
git add force-app/main/default/classes/OpportunityTriggerHandler.*

# Commit
git commit -m "Add opportunity trigger for auto-scoring"

# Push feature branch to GitHub
git push -u origin feature/add-opportunity-trigger
```

### Step 8: Create Pull Request

```bash
# Using GitHub CLI
gh pr create --title "Add opportunity auto-scoring trigger" --body "Automatically calculates opportunity scores on insert/update"

# Or via web UI:
# GitHub → Pull requests → New pull request
# base: main ← compare: feature/add-opportunity-trigger
# Click "Create pull request"
```

### ✅ Verification

**You've succeeded when**:
- Code is visible on GitHub
- You have main and feature branches
- Pull request is open
- Branch protection is enabled

**Test it**:
```bash
# Try to push directly to main (should fail)
git checkout main
echo "# Test" >> README.md
git add README.md
git commit -m "Test commit"
git push origin main
# Should see error: "protected branch hook declined"
```

### 🐛 Troubleshooting

**Issue**: "Permission denied (publickey)"
**Fix**:
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com"

# Add to GitHub
# GitHub → Settings → SSH and GPG keys → New SSH key
# Paste contents of ~/.ssh/id_ed25519.pub
```

**Issue**: "Branch protection doesn't work"
**Fix**: Make sure you enabled "Include administrators" in branch protection settings

### 💼 Portfolio Tip

**In interviews, say**:
> "I set up a complete Git workflow with branch protection, pull requests, and feature branches. I follow a trunk-based development model where all changes go through code review via pull requests before merging to main."

**Show them**:
- Your GitHub repository with clean commit history
- Pull request workflow
- Branch protection rules

---

## Lab 4: Create Your First CI/CD Pipeline with GitHub Actions

⏱️ **Time**: 60 minutes
🎯 **Goals**: Set up GitHub Actions, automate testing, deploy on merge

### Step 1: Set Up SFDX Auth URL

```bash
# Authenticate to your org (if not already)
sf org login web --alias DevOrg

# Get SFDX auth URL
sf org display --verbose --target-org DevOrg

# Look for "Sfdx Auth Url"
# It looks like: force://PlatformCLI::CryptoToken@instance.salesforce.com
# Copy this entire string
```

### Step 2: Add Secret to GitHub

```bash
# Using GitHub CLI
gh secret set SFDX_AUTH_URL_DEV --body "force://PlatformCLI::YOUR_CRYPTO_TOKEN@instance.salesforce.com"

# Or via web UI:
# GitHub → Settings → Secrets and variables → Actions
# New repository secret
# Name: SFDX_AUTH_URL_DEV
# Value: [paste your auth URL]
```

### Step 3: Create GitHub Actions Workflow

```bash
# Create workflows directory
mkdir -p .github/workflows
```

Create `.github/workflows/ci.yml`:

```yaml
name: Salesforce CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  validate:
    name: Validate Code
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Salesforce CLI
        run: |
          npm install -g @salesforce/cli
          sf --version

      - name: Authenticate to Salesforce
        run: |
          echo "${{ secrets.SFDX_AUTH_URL_DEV }}" > authfile
          sf org login sfdx-url --sfdx-url-file authfile --alias DevOrg --set-default
          rm authfile

      - name: Validate deployment
        run: |
          sf project deploy validate --manifest manifest/package.xml --test-level RunLocalTests

  test:
    name: Run Apex Tests
    runs-on: ubuntu-latest
    needs: validate

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Salesforce CLI
        run: |
          npm install -g @salesforce/cli
          sf --version

      - name: Authenticate to Salesforce
        run: |
          echo "${{ secrets.SFDX_AUTH_URL_DEV }}" > authfile
          sf org login sfdx-url --sfdx-url-file authfile --alias DevOrg --set-default
          rm authfile

      - name: Run Apex tests
        run: |
          sf apex run test --test-level RunLocalTests --code-coverage --result-format human --wait 20

      - name: Check code coverage
        run: |
          COVERAGE=$(sf apex get test --test-run-id latest --json | jq '.result.summary.orgWideCoverage' | tr -d '"')
          echo "Code coverage: $COVERAGE%"
          if [ $(echo "$COVERAGE < 75" | bc) -eq 1 ]; then
            echo "ERROR: Code coverage is below 75%"
            exit 1
          fi

  deploy:
    name: Deploy to Dev
    runs-on: ubuntu-latest
    needs: [validate, test]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install Salesforce CLI
        run: |
          npm install -g @salesforce/cli
          sf --version

      - name: Authenticate to Salesforce
        run: |
          echo "${{ secrets.SFDX_AUTH_URL_DEV }}" > authfile
          sf org login sfdx-url --sfdx-url-file authfile --alias DevOrg --set-default
          rm authfile

      - name: Deploy to Salesforce
        run: |
          sf project deploy start --manifest manifest/package.xml --test-level RunLocalTests --wait 20

      - name: Deploy status
        if: success()
        run: echo "✅ Deployment successful!"

      - name: Deploy failed
        if: failure()
        run: |
          echo "❌ Deployment failed"
          exit 1
```

### Step 4: Create Package Manifest

```bash
# Create manifest directory
mkdir -p manifest

# Create package.xml
cat > manifest/package.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>*</members>
        <name>ApexClass</name>
    </types>
    <types>
        <members>*</members>
        <name>ApexTrigger</name>
    </types>
    <types>
        <members>Opportunity.Score__c</members>
        <name>CustomField</name>
    </types>
    <version>59.0</version>
</Package>
EOF
```

### Step 5: Commit and Push

```bash
# Add workflow files
git add .github/workflows/ci.yml
git add manifest/package.xml

# Commit
git commit -m "Add CI/CD pipeline with GitHub Actions"

# Push
git push origin feature/add-opportunity-trigger
```

### Step 6: Watch Pipeline Run

```bash
# View workflow runs
gh run list

# Watch specific run
gh run watch

# Or visit:
# https://github.com/YOUR_USERNAME/salesforce-devops-project/actions
```

You should see:
```
✓ Validate Code (1m 23s)
✓ Run Apex Tests (2m 45s)
⚪ Deploy to Dev (skipped - not on main branch)
```

### Step 7: Merge PR and Deploy

```bash
# Merge the pull request
gh pr merge --merge

# Watch the deployment
gh run watch

# You should see all jobs including deploy:
✓ Validate Code (1m 23s)
✓ Run Apex Tests (2m 45s)
✓ Deploy to Dev (1m 56s)
```

### ✅ Verification

**You've succeeded when**:
- Pipeline runs on every push
- Tests run automatically
- Deployment happens on merge to main
- You see green checkmarks in GitHub

**Test it**:
```bash
# Make a small change
echo "// Pipeline test" >> force-app/main/default/classes/OpportunityScorer.cls

# Commit and push
git add force-app/main/default/classes/OpportunityScorer.cls
git commit -m "Test pipeline"
git push

# Watch pipeline run
gh run watch
```

### 🐛 Troubleshooting

**Issue**: "Authentication failed"
**Fix**:
```bash
# Verify your secret is set
gh secret list

# Re-set the secret
sf org display --verbose --target-org DevOrg
# Copy the new auth URL
gh secret set SFDX_AUTH_URL_DEV --body "your-new-auth-url"
```

**Issue**: "Package.xml not found"
**Fix**: Make sure the manifest directory and package.xml are committed:
```bash
git add manifest/package.xml
git commit -m "Add package manifest"
git push
```

**Issue**: "Tests are failing in CI but pass locally"
**Fix**: The org might be in a different state. Check test data dependencies.

### 💼 Portfolio Tip

**In interviews, say**:
> "I built a complete CI/CD pipeline using GitHub Actions that automatically validates code, runs all Apex tests, checks code coverage, and deploys to Salesforce on merge. The pipeline includes quality gates ensuring 75% code coverage before deployment."

**Show them**:
- GitHub Actions workflow file
- Successful pipeline runs
- Coverage reports
- Deployment logs

---

## Lab 5: Implement Continuous Testing with PMD

⏱️ **Time**: 45 minutes
🎯 **Goals**: Add static code analysis, enforce code quality, fail builds on violations

### Step 1: Install PMD

```bash
# Download PMD
cd ~
wget https://github.com/pmd/pmd/releases/download/pmd_releases%2F7.0.0/pmd-dist-7.0.0-bin.zip

# Extract
unzip pmd-dist-7.0.0-bin.zip

# Add to PATH
export PATH=$PATH:~/pmd-bin-7.0.0/bin

# Verify
pmd --version
```

### Step 2: Create PMD Ruleset

In your project, create `.pmd/ruleset.xml`:

```xml
<?xml version="1.0"?>
<ruleset name="Salesforce DevOps Ruleset"
    xmlns="http://pmd.sourceforge.net/ruleset/2.0.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://pmd.sourceforge.net/ruleset/2.0.0 https://pmd.sourceforge.io/ruleset_2_0_0.xsd">

    <description>Custom PMD rules for Salesforce projects</description>

    <!-- Best Practices -->
    <rule ref="category/apex/bestpractices.xml/ApexUnitTestClassShouldHaveAsserts" />
    <rule ref="category/apex/bestpractices.xml/ApexUnitTestShouldNotUseSeeAllDataTrue" />
    <rule ref="category/apex/bestpractices.xml/AvoidGlobalModifier" />
    <rule ref="category/apex/bestpractices.xml/AvoidLogicInTrigger" />
    <rule ref="category/apex/bestpractices.xml/UnusedLocalVariable" />

    <!-- Code Style -->
    <rule ref="category/apex/codestyle.xml/ClassNamingConventions" />
    <rule ref="category/apex/codestyle.xml/MethodNamingConventions" />
    <rule ref="category/apex/codestyle.xml/VariableNamingConventions" />
    <rule ref="category/apex/codestyle.xml/IfStmtsMustUseBraces" />
    <rule ref="category/apex/codestyle.xml/WhileLoopsMustUseBraces" />

    <!-- Design -->
    <rule ref="category/apex/design.xml/AvoidDeeplyNestedIfStmts">
        <properties>
            <property name="problemDepth" value="3" />
        </properties>
    </rule>
    <rule ref="category/apex/design.xml/CyclomaticComplexity">
        <properties>
            <property name="classReportLevel" value="40" />
            <property name="methodReportLevel" value="10" />
        </properties>
    </rule>
    <rule ref="category/apex/design.xml/ExcessiveClassLength">
        <properties>
            <property name="minimum" value="1000" />
        </properties>
    </rule>
    <rule ref="category/apex/design.xml/ExcessiveParameterList">
        <properties>
            <property name="minimum" value="4" />
        </properties>
    </rule>
    <rule ref="category/apex/design.xml/NcssMethodCount">
        <properties>
            <property name="minimum" value="100" />
        </properties>
    </rule>

    <!-- Error Prone -->
    <rule ref="category/apex/errorprone.xml/AvoidDirectAccessTriggerMap" />
    <rule ref="category/apex/errorprone.xml/AvoidHardcodingId" />
    <rule ref="category/apex/errorprone.xml/EmptyCatchBlock" />
    <rule ref="category/apex/errorprone.xml/EmptyIfStmt" />
    <rule ref="category/apex/errorprone.xml/EmptyStatementBlock" />
    <rule ref="category/apex/errorprone.xml/EmptyTryOrFinallyBlock" />
    <rule ref="category/apex/errorprone.xml/EmptyWhileStmt" />

    <!-- Performance -->
    <rule ref="category/apex/performance.xml/AvoidDebugStatements" />
    <rule ref="category/apex/performance.xml/EagerlyLoadedDescribeSObjectResult" />

    <!-- Security -->
    <rule ref="category/apex/security.xml/ApexBadCrypto" />
    <rule ref="category/apex/security.xml/ApexCRUDViolation" />
    <rule ref="category/apex/security.xml/ApexDangerousMethods" />
    <rule ref="category/apex/security.xml/ApexInsecureEndpoint" />
    <rule ref="category/apex/security.xml/ApexOpenRedirect" />
    <rule ref="category/apex/security.xml/ApexSOQLInjection" />
    <rule ref="category/apex/security.xml/ApexSuggestUsingNamedCred" />
    <rule ref="category/apex/security.xml/ApexXSSFromEscapeFalse" />
    <rule ref="category/apex/security.xml/ApexXSSFromURLParam" />

</ruleset>
```

### Step 3: Run PMD Locally

```bash
# Run PMD on your code
pmd check \
  --dir force-app/main/default/classes \
  --rulesets .pmd/ruleset.xml \
  --format text

# You'll see output like:
# OpportunityScorer.cls:45: AvoidDebugStatements: Remove System.debug statements before deploying
```

### Step 4: Fix PMD Violations

Let's say PMD found a debug statement. Fix it:

```apex
// Before (PMD violation)
public static void someMethod() {
    System.debug('This is a debug statement');  // ❌ Violation
    // ... logic
}

// After (Fixed)
public static void someMethod() {
    // Debug statement removed for production
    // ... logic
}
```

### Step 5: Add PMD to GitHub Actions

Update `.github/workflows/ci.yml` to include PMD:

```yaml
name: Salesforce CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Code Quality Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup PMD
        run: |
          wget https://github.com/pmd/pmd/releases/download/pmd_releases%2F7.0.0/pmd-dist-7.0.0-bin.zip
          unzip pmd-dist-7.0.0-bin.zip
          chmod +x pmd-bin-7.0.0/bin/pmd

      - name: Run PMD
        run: |
          ./pmd-bin-7.0.0/bin/pmd check \
            --dir force-app/main/default/classes \
            --rulesets .pmd/ruleset.xml \
            --format text \
            --fail-on-violation true

      - name: Upload PMD results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: pmd-results
          path: pmd-report.txt

  validate:
    name: Validate Code
    runs-on: ubuntu-latest
    needs: lint  # Only run after linting passes

    steps:
      # ... rest of your validation steps
```

### Step 6: Add Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "Running PMD analysis..."

# Run PMD
pmd check \
  --dir force-app/main/default/classes \
  --rulesets .pmd/ruleset.xml \
  --format text \
  --fail-on-violation true

if [ $? -ne 0 ]; then
  echo "❌ PMD analysis failed. Fix violations before committing."
  exit 1
fi

echo "✅ PMD analysis passed"
exit 0
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

### ✅ Verification

**You've succeeded when**:
- PMD runs locally without errors
- PMD is integrated into GitHub Actions
- Pre-commit hook prevents bad code from being committed
- Pipeline fails if PMD violations exist

**Test it**:
```bash
# Add a violation
echo "System.debug('test');" >> force-app/main/default/classes/OpportunityScorer.cls

# Try to commit
git add force-app/main/default/classes/OpportunityScorer.cls
git commit -m "Test commit"

# Should see:
# ❌ PMD analysis failed. Fix violations before committing.
```

### 💼 Portfolio Tip

**In interviews, say**:
> "I implemented automated code quality checks using PMD with a custom ruleset enforcing 30+ rules across best practices, security, and performance. PMD runs on every commit via pre-commit hooks and in CI/CD, failing builds if violations are detected."

**Show them**:
- PMD ruleset configuration
- GitHub Actions with PMD integration
- Examples of violations caught and fixed

---

## Lab 6: Advanced Git Workflow and Code Review

⏱️ **Time**: 60 minutes
🎯 **Goals**: Implement professional code review workflow, enforce quality standards, practice team collaboration

### Step 1: Set Up CODEOWNERS File

```bash
# Create CODEOWNERS file
mkdir -p .github
cat > .github/CODEOWNERS << 'EOF'
# Code Owners
# These owners will be automatically requested for review when files are changed

# Global owners (always notified)
* @your-username

# Apex classes owned by backend team
/force-app/main/default/classes/ @backend-team @your-username

# LWC components owned by frontend team
/force-app/main/default/lwc/ @frontend-team @your-username

# Triggers require senior review
/force-app/main/default/triggers/ @senior-devs @your-username

# CI/CD changes require DevOps review
/.github/workflows/ @devops-team @your-username
/.pmd/ @devops-team @your-username

# Infrastructure
/manifest/ @devops-team @your-username
EOF
```

### Step 2: Create Pull Request Template

```bash
cat > .github/pull_request_template.md << 'EOF'
## Description
<!-- Describe your changes in detail -->

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Refactoring (no functional changes)
- [ ] Documentation update

## Related Issue
<!-- Link to related issue: Fixes #123 -->

## Changes Made
<!-- List the specific changes -->
-
-
-

## Testing
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Test coverage maintained/improved
- [ ] Tested manually in dev org

### Test Evidence
<!-- Paste test results or screenshots -->
```
Test Results:
- OpportunityScorerTest: ✅ All 5 tests passed
- Code Coverage: 96%
```

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No PMD violations
- [ ] No console.log or System.debug statements
- [ ] Secrets/credentials not committed

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## Deployment Notes
<!-- Any special deployment instructions -->

## Rollback Plan
<!-- How to rollback if this causes issues -->
EOF
```

### Step 3: Configure Branch Protection Rules

```bash
# Using GitHub CLI
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["lint","validate","test"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null

# Or via web UI:
# Settings → Branches → Add branch protection rule
# Branch name pattern: main
#
# Protect matching branches:
# ✅ Require a pull request before merging
#    ✅ Require approvals: 1
#    ✅ Dismiss stale pull request approvals when new commits are pushed
#    ✅ Require review from Code Owners
# ✅ Require status checks to pass before merging
#    ✅ Require branches to be up to date before merging
#    Status checks: lint, validate, test
# ✅ Require conversation resolution before merging
# ✅ Include administrators
```

### Step 4: Practice Complete PR Workflow

**Scenario: Add email notification feature**

```bash
# 1. Create feature branch from main
git checkout main
git pull
git checkout -b feature/add-email-notification

# 2. Make changes
cat > force-app/main/default/classes/EmailNotificationService.cls << 'EOF'
public with sharing class EmailNotificationService {

    /**
     * Send email notification when opportunity is scored
     */
    public static void sendScoreNotification(List<Id> opportunityIds) {
        List<Opportunity> opps = [
            SELECT Id, Name, Score__c, OwnerId, Owner.Email
            FROM Opportunity
            WHERE Id IN :opportunityIds
            AND Score__c != null
        ];

        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

        for (Opportunity opp : opps) {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(new String[]{ opp.Owner.Email });
            email.setSubject('Opportunity Scored: ' + opp.Name);
            email.setPlainTextBody(
                'Your opportunity "' + opp.Name + '" has been scored.\n\n' +
                'Score: ' + opp.Score__c + '\n\n' +
                'Please review and take appropriate action.'
            );
            emails.add(email);
        }

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }
}
EOF

cat > force-app/main/default/classes/EmailNotificationService.cls-meta.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <status>Active</status>
</ApexClass>
EOF

# 3. Write tests
cat > force-app/main/default/classes/EmailNotificationServiceTest.cls << 'EOF'
@isTest
private class EmailNotificationServiceTest {

    @TestSetup
    static void setup() {
        Opportunity opp = new Opportunity(
            Name = 'Test Opp',
            Amount = 100000,
            Probability = 90,
            StageName = 'Qualification',
            CloseDate = Date.today().addDays(30),
            Score__c = 90000
        );
        insert opp;
    }

    @isTest
    static void testSendScoreNotification() {
        Opportunity opp = [SELECT Id FROM Opportunity LIMIT 1];

        Test.startTest();
        EmailNotificationService.sendScoreNotification(new List<Id>{ opp.Id });
        Test.stopTest();

        // Verify email was sent
        Integer invocations = Limits.getEmailInvocations();
        System.assertEquals(1, invocations, 'Email should have been sent');
    }

    @isTest
    static void testSendScoreNotification_NoOpps() {
        Test.startTest();
        EmailNotificationService.sendScoreNotification(new List<Id>());
        Test.stopTest();

        // Verify no email was sent
        Integer invocations = Limits.getEmailInvocations();
        System.assertEquals(0, invocations, 'No email should be sent for empty list');
    }

    @isTest
    static void testSendScoreNotification_BulkOpps() {
        List<Opportunity> bulkOpps = new List<Opportunity>();
        for (Integer i = 0; i < 50; i++) {
            bulkOpps.add(new Opportunity(
                Name = 'Bulk Opp ' + i,
                Amount = 10000,
                Probability = 50,
                StageName = 'Qualification',
                CloseDate = Date.today().addDays(30),
                Score__c = 5000
            ));
        }
        insert bulkOpps;

        Set<Id> oppIds = new Map<Id, Opportunity>(bulkOpps).keySet();

        Test.startTest();
        EmailNotificationService.sendScoreNotification(new List<Id>(oppIds));
        Test.stopTest();

        // Verify emails were sent (max 10 per transaction in test context)
        Integer invocations = Limits.getEmailInvocations();
        System.assert(invocations > 0, 'Emails should have been sent');
    }
}
EOF

cat > force-app/main/default/classes/EmailNotificationServiceTest.cls-meta.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <status>Active</status>
</ApexClass>
EOF

# 4. Update trigger to call email service
cat > force-app/main/default/classes/OpportunityTriggerHandler.cls << 'EOF'
public with sharing class OpportunityTriggerHandler {

    public static void handleAfterInsert(List<Opportunity> newOpps) {
        Set<Id> oppIds = new Set<Id>();
        for (Opportunity opp : newOpps) {
            if (opp.Amount != null && opp.Probability != null) {
                oppIds.add(opp.Id);
            }
        }

        if (!oppIds.isEmpty()) {
            OpportunityScorer.updateOpportunityScores(oppIds);
            // Send email notification after scoring
            EmailNotificationService.sendScoreNotification(new List<Id>(oppIds));
        }
    }
}
EOF

# 5. Run tests locally
sf apex run test --class-names EmailNotificationServiceTest --result-format human --code-coverage

# 6. Run PMD
pmd check --dir force-app/main/default/classes --rulesets .pmd/ruleset.xml --format text

# 7. Commit changes
git add force-app/main/default/classes/EmailNotificationService*
git add force-app/main/default/classes/OpportunityTriggerHandler.cls
git commit -m "feat: add email notification for scored opportunities

- Created EmailNotificationService to send emails
- Added 3 test methods with 100% coverage
- Updated OpportunityTriggerHandler to call email service
- Supports bulk operations (50+ opps)

Closes #123"

# 8. Push and create PR
git push -u origin feature/add-email-notification

gh pr create \
  --title "Add email notification for scored opportunities" \
  --body "## Description
Automatically send email to opportunity owner when score is calculated.

## Type of Change
- [x] New feature

## Changes Made
- Created EmailNotificationService
- Added 3 test methods (100% coverage)
- Integrated with OpportunityTriggerHandler

## Testing
- [x] All tests pass
- [x] Code coverage: 100%
- [x] Tested in dev org with 50 opportunities

## Deployment Notes
No special deployment steps required.

## Rollback Plan
Remove call to EmailNotificationService.sendScoreNotification() in OpportunityTriggerHandler"
```

### Step 5: Code Review Process

**As the PR author**:
1. Wait for CI/CD checks to pass
2. Request review from code owners
3. Address review comments
4. Update PR based on feedback

**As a reviewer**:
```bash
# Check out the PR locally
gh pr checkout 1

# Review the code
git diff main

# Run tests
sf apex run test --class-names EmailNotificationServiceTest --result-format human

# Test in your dev org
sf project deploy start --source-dir force-app/main/default/classes

# Leave review comments
gh pr review 1 --comment --body "LGTM! Great test coverage. One suggestion: add error handling for email send failures."

# Or request changes
gh pr review 1 --request-changes --body "Please add error handling for Messaging.sendEmail() failures."

# Or approve
gh pr review 1 --approve --body "Excellent work! Well tested and follows best practices."
```

### Step 6: Address Review Feedback

```bash
# Make requested changes
cat > force-app/main/default/classes/EmailNotificationService.cls << 'EOF'
public with sharing class EmailNotificationService {

    public static void sendScoreNotification(List<Id> opportunityIds) {
        List<Opportunity> opps = [
            SELECT Id, Name, Score__c, OwnerId, Owner.Email
            FROM Opportunity
            WHERE Id IN :opportunityIds
            AND Score__c != null
        ];

        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

        for (Opportunity opp : opps) {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(new String[]{ opp.Owner.Email });
            email.setSubject('Opportunity Scored: ' + opp.Name);
            email.setPlainTextBody(
                'Your opportunity "' + opp.Name + '" has been scored.\n\n' +
                'Score: ' + opp.Score__c + '\n\n' +
                'Please review and take appropriate action.'
            );
            emails.add(email);
        }

        if (!emails.isEmpty()) {
            try {
                Messaging.SendEmailResult[] results = Messaging.sendEmail(emails);

                // Log failures
                for (Messaging.SendEmailResult result : results) {
                    if (!result.isSuccess()) {
                        System.debug('Email send failed: ' + result.getErrors());
                    }
                }
            } catch (Exception e) {
                System.debug('Exception sending emails: ' + e.getMessage());
                // Don't fail the transaction just because email failed
            }
        }
    }
}
EOF

# Commit fix
git add force-app/main/default/classes/EmailNotificationService.cls
git commit -m "fix: add error handling for email send failures

Added try-catch around Messaging.sendEmail() and log failures.
This prevents transaction rollback if email delivery fails."

git push
```

### Step 7: Merge PR

```bash
# After approval and all checks pass
gh pr merge 1 --squash --delete-branch

# Or via web UI:
# Click "Squash and merge"
# Confirm merge
# Delete branch
```

### ✅ Verification

**You've succeeded when**:
- CODEOWNERS file automatically assigns reviewers
- PR template is pre-filled on new PRs
- Can't push directly to main
- All checks must pass before merge
- At least 1 approval required
- Successfully completed full PR workflow

**Test it**:
```bash
# Try to push directly to main (should fail)
git checkout main
echo "test" >> README.md
git add README.md
git commit -m "test"
git push origin main
# Should see: "protected branch hook declined"
```

### 🐛 Troubleshooting

**Issue**: CODEOWNERS not working
**Fix**: Ensure file is in `.github/CODEOWNERS` and usernames are correct

**Issue**: Can't merge even after approval
**Fix**: Check all required status checks are passing

**Issue**: PR template not showing
**Fix**: Ensure file is `.github/pull_request_template.md` (exact name)

### 💼 Portfolio Tip

**In interviews, say**:
> "I implemented a complete code review workflow with CODEOWNERS, PR templates, and branch protection. Every change goes through automated quality gates and peer review before merging. I practiced both sides - submitting PRs and reviewing others' code."

**Show them**:
- PR template with detailed checklist
- Successful PR with review comments and approvals
- CODEOWNERS file
- Branch protection rules

---

## Lab 7: Multi-Environment Deployment Pipeline

⏱️ **Time**: 90 minutes
🎯 **Goals**: Deploy to multiple environments (Dev → UAT → Prod) with environment-specific configurations

### Step 1: Create Additional Sandboxes

**Via Salesforce UI**:
1. Go to Setup → Sandboxes
2. Click "New Sandbox"
3. Create:
   - Name: UAT
   - Type: Developer (or Partial Copy if available)
   - Purpose: User acceptance testing
4. Repeat for Production (if you have a separate production org)

**Wait for sandbox creation** (can take several hours)

### Step 2: Authenticate to Multiple Orgs

```bash
# Authenticate to Dev sandbox
sf org login web --alias DevSandbox --instance-url https://test.salesforce.com

# Authenticate to UAT sandbox
sf org login web --alias UATSandbox --instance-url https://test.salesforce.com

# Authenticate to Production (if you have one)
sf org login web --alias Production --instance-url https://login.salesforce.com

# Get auth URLs for all orgs
sf org display --verbose --target-org DevSandbox
sf org display --verbose --target-org UATSandbox
sf org display --verbose --target-org Production

# Copy the "Sfdx Auth Url" for each
```

### Step 3: Add Secrets to GitHub

```bash
# Add secrets for each environment
gh secret set SFDX_AUTH_URL_DEV --body "force://PlatformCLI::TOKEN@instance.salesforce.com"
gh secret set SFDX_AUTH_URL_UAT --body "force://PlatformCLI::TOKEN@instance.salesforce.com"
gh secret set SFDX_AUTH_URL_PROD --body "force://PlatformCLI::TOKEN@instance.salesforce.com"
```

### Step 4: Create Environment-Specific Configuration

**Create custom metadata for environment configs**:

```bash
# Create metadata type
mkdir -p force-app/main/default/objects/Environment_Config__mdt/fields

cat > force-app/main/default/objects/Environment_Config__mdt/Environment_Config__mdt.object-meta.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Environment Config</label>
    <pluralLabel>Environment Configs</pluralLabel>
    <visibility>Public</visibility>
</CustomObject>
EOF

# Add fields
cat > force-app/main/default/objects/Environment_Config__mdt/fields/Send_Email_Notifications__c.field-meta.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Send_Email_Notifications__c</fullName>
    <defaultValue>false</defaultValue>
    <label>Send Email Notifications</label>
    <type>Checkbox</type>
</CustomField>
EOF

cat > force-app/main/default/objects/Environment_Config__mdt/fields/Min_Score_Threshold__c.field-meta.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Min_Score_Threshold__c</fullName>
    <label>Min Score Threshold</label>
    <precision>18</precision>
    <required>false</required>
    <scale>2</scale>
    <type>Number</type>
</CustomField>
EOF

# Create metadata records for each environment
mkdir -p force-app/main/default/customMetadata

cat > force-app/main/default/customMetadata/Environment_Config.Dev_Config.md-meta.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Dev Config</label>
    <protected>false</protected>
    <values>
        <field>Send_Email_Notifications__c</field>
        <value xsi:type="xsd:boolean" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">false</value>
    </values>
    <values>
        <field>Min_Score_Threshold__c</field>
        <value xsi:type="xsd:double" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">10000</value>
    </values>
</CustomMetadata>
EOF

cat > force-app/main/default/customMetadata/Environment_Config.UAT_Config.md-meta.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>UAT Config</label>
    <protected>false</protected>
    <values>
        <field>Send_Email_Notifications__c</field>
        <value xsi:type="xsd:boolean" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">true</value>
    </values>
    <values>
        <field>Min_Score_Threshold__c</field>
        <value xsi:type="xsd:double" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">25000</value>
    </values>
</CustomMetadata>
EOF

cat > force-app/main/default/customMetadata/Environment_Config.Prod_Config.md-meta.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Prod Config</label>
    <protected>false</protected>
    <values>
        <field>Send_Email_Notifications__c</field>
        <value xsi:type="xsd:boolean" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">true</value>
    </values>
    <values>
        <field>Min_Score_Threshold__c</field>
        <value xsi:type="xsd:double" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">50000</value>
    </values>
</CustomMetadata>
EOF
```

### Step 5: Update Code to Use Environment Config

```bash
cat > force-app/main/default/classes/EnvironmentUtil.cls << 'EOF'
public with sharing class EnvironmentUtil {

    private static Environment_Config__mdt config;

    static {
        // Detect environment and load appropriate config
        String environment = detectEnvironment();
        String configName = environment + '_Config';

        config = [
            SELECT Send_Email_Notifications__c, Min_Score_Threshold__c
            FROM Environment_Config__mdt
            WHERE DeveloperName = :configName
            LIMIT 1
        ];
    }

    public static String detectEnvironment() {
        String orgId = UserInfo.getOrganizationId();
        String domain = URL.getOrgDomainUrl().toExternalForm();

        if (domain.contains('--uat')) {
            return 'UAT';
        } else if (domain.contains('--dev') || domain.contains('sandbox')) {
            return 'Dev';
        } else {
            return 'Prod';
        }
    }

    public static Boolean shouldSendEmailNotifications() {
        return config != null && config.Send_Email_Notifications__c;
    }

    public static Decimal getMinScoreThreshold() {
        return config != null ? config.Min_Score_Threshold__c : 0;
    }
}
EOF

# Update EmailNotificationService to use config
cat > force-app/main/default/classes/EmailNotificationService.cls << 'EOF'
public with sharing class EmailNotificationService {

    public static void sendScoreNotification(List<Id> opportunityIds) {
        // Check if emails should be sent in this environment
        if (!EnvironmentUtil.shouldSendEmailNotifications()) {
            System.debug('Email notifications disabled for this environment');
            return;
        }

        Decimal minThreshold = EnvironmentUtil.getMinScoreThreshold();

        List<Opportunity> opps = [
            SELECT Id, Name, Score__c, OwnerId, Owner.Email
            FROM Opportunity
            WHERE Id IN :opportunityIds
            AND Score__c != null
            AND Score__c >= :minThreshold
        ];

        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

        for (Opportunity opp : opps) {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(new String[]{ opp.Owner.Email });
            email.setSubject('High-Value Opportunity Scored: ' + opp.Name);
            email.setPlainTextBody(
                'Your opportunity "' + opp.Name + '" has been scored above the threshold.\n\n' +
                'Score: ' + opp.Score__c + '\n' +
                'Threshold: ' + minThreshold + '\n\n' +
                'Please review and take appropriate action.'
            );
            emails.add(email);
        }

        if (!emails.isEmpty()) {
            try {
                Messaging.SendEmailResult[] results = Messaging.sendEmail(emails);

                for (Messaging.SendEmailResult result : results) {
                    if (!result.isSuccess()) {
                        System.debug('Email send failed: ' + result.getErrors());
                    }
                }
            } catch (Exception e) {
                System.debug('Exception sending emails: ' + e.getMessage());
            }
        }
    }
}
EOF
```

### Step 6: Create Multi-Environment Pipeline

Update `.github/workflows/ci.yml`:

```yaml
name: Multi-Environment CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Quality checks (runs on all branches)
  lint:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run PMD
        run: |
          wget -q https://github.com/pmd/pmd/releases/download/pmd_releases%2F7.0.0/pmd-dist-7.0.0-bin.zip
          unzip -q pmd-dist-7.0.0-bin.zip
          ./pmd-bin-7.0.0/bin/pmd check --dir force-app --rulesets .pmd/ruleset.xml --format text

  # Validate deployment (runs on all PRs)
  validate:
    name: Validate Deployment
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - name: Install SF CLI
        run: npm install -g @salesforce/cli
      - name: Authenticate
        run: |
          echo "${{ secrets.SFDX_AUTH_URL_DEV }}" > authfile
          sf org login sfdx-url --sfdx-url-file authfile --alias DevOrg
          rm authfile
      - name: Validate
        run: sf project deploy validate --manifest manifest/package.xml --test-level RunLocalTests

  # Deploy to Dev (automatic on push to develop)
  deploy-dev:
    name: Deploy to Dev
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    needs: lint
    environment:
      name: Development
      url: https://dev-sandbox.my.salesforce.com
    steps:
      - uses: actions/checkout@v4
      - name: Install SF CLI
        run: npm install -g @salesforce/cli
      - name: Authenticate to Dev
        run: |
          echo "${{ secrets.SFDX_AUTH_URL_DEV }}" > authfile
          sf org login sfdx-url --sfdx-url-file authfile --alias DevOrg --set-default
          rm authfile
      - name: Deploy to Dev
        run: |
          sf project deploy start --manifest manifest/package.xml --test-level RunLocalTests --wait 20
      - name: Run smoke tests
        run: |
          echo "Running smoke tests..."
          sf data query --query "SELECT COUNT() FROM Opportunity WHERE Score__c != null"

  # Deploy to UAT (automatic on push to main)
  deploy-uat:
    name: Deploy to UAT
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: lint
    environment:
      name: UAT
      url: https://uat-sandbox.my.salesforce.com
    steps:
      - uses: actions/checkout@v4
      - name: Install SF CLI
        run: npm install -g @salesforce/cli
      - name: Authenticate to UAT
        run: |
          echo "${{ secrets.SFDX_AUTH_URL_UAT }}" > authfile
          sf org login sfdx-url --sfdx-url-file authfile --alias UATOrg --set-default
          rm authfile
      - name: Deploy to UAT
        run: |
          sf project deploy start --manifest manifest/package.xml --test-level RunLocalTests --wait 30
      - name: Run smoke tests
        run: |
          echo "Running UAT smoke tests..."
          sf data query --query "SELECT COUNT() FROM Opportunity WHERE Score__c != null"
      - name: Notify stakeholders
        run: echo "UAT deployment complete. Ready for testing."

  # Deploy to Production (manual approval required)
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    needs: [lint, deploy-uat]
    environment:
      name: Production
      url: https://company.my.salesforce.com
    steps:
      - uses: actions/checkout@v4
      - name: Install SF CLI
        run: npm install -g @salesforce/cli
      - name: Authenticate to Production
        run: |
          echo "${{ secrets.SFDX_AUTH_URL_PROD }}" > authfile
          sf org login sfdx-url --sfdx-url-file authfile --alias ProdOrg --set-default
          rm authfile
      - name: Create pre-deployment backup
        run: |
          echo "Creating backup..."
          sf project retrieve start --manifest manifest/package.xml --output-dir backup-$(date +%Y%m%d)
      - name: Deploy to Production
        run: |
          sf project deploy start --manifest manifest/package.xml --test-level RunLocalTests --wait 60
      - name: Run production smoke tests
        run: |
          echo "Running production smoke tests..."
          sf data query --query "SELECT COUNT() FROM Opportunity WHERE Score__c != null"
      - name: Send deployment notification
        run: |
          echo "Production deployment complete!"
          echo "Deployed at: $(date)"
          echo "Commit: ${{ github.sha }}"
```

### Step 7: Test the Multi-Environment Flow

```bash
# 1. Create feature branch
git checkout -b feature/multi-env-config

# 2. Commit environment config
git add force-app/main/default/objects/Environment_Config__mdt/
git add force-app/main/default/customMetadata/
git add force-app/main/default/classes/EnvironmentUtil*
git commit -m "feat: add environment-specific configuration

- Created Environment_Config__mdt custom metadata
- Added Dev, UAT, and Prod configurations
- Created EnvironmentUtil to detect environment
- Updated EmailNotificationService to use config

Environment-specific settings:
- Dev: No emails, 10K threshold
- UAT: Emails enabled, 25K threshold
- Prod: Emails enabled, 50K threshold"

# 3. Push and create PR
git push -u origin feature/multi-env-config
gh pr create --title "Add multi-environment configuration" --fill

# 4. After approval, merge to develop
gh pr merge --merge

# 5. Verify Dev deployment
# GitHub Actions will automatically deploy to Dev

# 6. Merge develop to main for UAT
git checkout main
git pull
git merge develop
git push

# 7. UAT deploys automatically
# Monitor in GitHub Actions

# 8. Approve Production deployment
# Go to GitHub Actions → Deploy to Production → Review deployment
```

### ✅ Verification

**You've succeeded when**:
- Code deploys automatically to Dev on merge to develop
- Code deploys automatically to UAT on merge to main
- Production requires manual approval
- Environment-specific configs work correctly
- Each environment has different behavior

**Test it**:
```bash
# Test in each environment
# Dev: sf org open --target-org DevOrg
# UAT: sf org open --target-org UATOrg
# Prod: sf org open --target-org ProdOrg

# Create test opportunity and verify:
# - Dev: No email sent, scores 10K+ opportunities
# - UAT: Email sent, scores 25K+ opportunities
# - Prod: Email sent, scores 50K+ opportunities
```

### 💼 Portfolio Tip

**In interviews, say**:
> "I built a multi-environment deployment pipeline with automated promotion from Dev → UAT → Production. Each environment has specific configurations using custom metadata, and production deployments require manual approval. The pipeline handles environment detection automatically."

**Show them**:
- GitHub Actions workflow with 3 environments
- Environment-specific custom metadata
- Successful deployments to each environment
- Approval workflow for production

---

## Lab 8: Monitoring and Slack Notifications

⏱️ **Time**: 60 minutes
🎯 **Goals**: Set up monitoring, add Slack notifications, create deployment dashboards

### Step 1: Create Slack Webhook

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. App Name: "Salesforce DevOps Bot"
4. Choose your workspace
5. Click "Incoming Webhooks"
6. Toggle "Activate Incoming Webhooks" to On
7. Click "Add New Webhook to Workspace"
8. Select channel (e.g., #deployments)
9. Copy the Webhook URL

### Step 2: Add Slack Webhook to GitHub Secrets

```bash
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### Step 3: Create Notification Scripts

```bash
mkdir -p scripts

cat > scripts/slack-notify.sh << 'EOF'
#!/bin/bash

# Slack notification script
# Usage: ./slack-notify.sh "message" "color" "title"

MESSAGE=$1
COLOR=$2  # good, warning, danger
TITLE=$3

WEBHOOK_URL=$SLACK_WEBHOOK_URL

curl -X POST $WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d "{
    \"attachments\": [
      {
        \"color\": \"$COLOR\",
        \"title\": \"$TITLE\",
        \"text\": \"$MESSAGE\",
        \"footer\": \"Salesforce DevOps Bot\",
        \"ts\": $(date +%s)
      }
    ]
  }"
EOF

chmod +x scripts/slack-notify.sh

# Create deployment summary script
cat > scripts/deployment-summary.sh << 'EOF'
#!/bin/bash

# Generate deployment summary

ENVIRONMENT=$1
STATUS=$2  # success or failure
DURATION=$3

# Get commit info
COMMIT_SHA=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)
AUTHOR=$(git log -1 --pretty=%an)

# Count changes
APEX_CLASSES=$(git diff --name-only HEAD~1 HEAD | grep "\.cls$" | wc -l)
TRIGGERS=$(git diff --name-only HEAD~1 HEAD | grep "\.trigger$" | wc -l)
LWC=$(git diff --name-only HEAD~1 HEAD | grep "/lwc/" | wc -l)

if [ "$STATUS" == "success" ]; then
  COLOR="good"
  EMOJI=":white_check_mark:"
else
  COLOR="danger"
  EMOJI=":x:"
fi

MESSAGE="*$EMOJI Deployment to $ENVIRONMENT*\n\n"
MESSAGE+="*Status:* $STATUS\n"
MESSAGE+="*Duration:* $DURATION\n"
MESSAGE+="*Commit:* \`$COMMIT_SHA\`\n"
MESSAGE+="*Author:* $AUTHOR\n"
MESSAGE+="*Message:* $COMMIT_MSG\n\n"
MESSAGE+="*Changes:*\n"
MESSAGE+="• Apex Classes: $APEX_CLASSES\n"
MESSAGE+="• Triggers: $TRIGGERS\n"
MESSAGE+="• LWC Components: $LWC\n"

./scripts/slack-notify.sh "$MESSAGE" "$COLOR" "Deployment Summary"
EOF

chmod +x scripts/deployment-summary.sh
```

### Step 4: Update Pipeline with Notifications

Update `.github/workflows/ci.yml` to add notifications:

```yaml
deploy-production:
  name: Deploy to Production
  runs-on: ubuntu-latest
  environment:
    name: Production
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 2  # Need history for diff

    - name: Send deployment started notification
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      run: |
        curl -X POST $SLACK_WEBHOOK_URL \
          -H 'Content-Type: application/json' \
          -d '{
            "text": ":rocket: Production deployment started",
            "attachments": [{
              "color": "warning",
              "fields": [
                {"title": "Environment", "value": "Production", "short": true},
                {"title": "Triggered By", "value": "'"${{ github.actor }}"'", "short": true},
                {"title": "Commit", "value": "'"${{ github.sha }}"'", "short": true}
              ]
            }]
          }'

    - name: Install SF CLI
      run: npm install -g @salesforce/cli

    - name: Authenticate to Production
      run: |
        echo "${{ secrets.SFDX_AUTH_URL_PROD }}" > authfile
        sf org login sfdx-url --sfdx-url-file authfile --alias ProdOrg --set-default
        rm authfile

    - name: Deploy to Production
      id: deploy
      run: |
        START_TIME=$(date +%s)
        sf project deploy start --manifest manifest/package.xml --test-level RunLocalTests --wait 60
        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))
        echo "duration=${DURATION}s" >> $GITHUB_OUTPUT

    - name: Run smoke tests
      run: |
        sf data query --query "SELECT COUNT() FROM Opportunity WHERE Score__c != null"

    - name: Send success notification
      if: success()
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      run: |
        curl -X POST $SLACK_WEBHOOK_URL \
          -H 'Content-Type: application/json' \
          -d '{
            "text": ":white_check_mark: Production deployment successful!",
            "attachments": [{
              "color": "good",
              "fields": [
                {"title": "Environment", "value": "Production", "short": true},
                {"title": "Duration", "value": "'"${{ steps.deploy.outputs.duration }}"'", "short": true},
                {"title": "Deployed By", "value": "'"${{ github.actor }}"'", "short": true},
                {"title": "Commit", "value": "'"${{ github.sha }}"'", "short": true}
              ],
              "actions": [
                {
                  "type": "button",
                  "text": "View Deployment",
                  "url": "'"${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"'"
                }
              ]
            }]
          }'

    - name: Send failure notification
      if: failure()
      env:
        SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      run: |
        curl -X POST $SLACK_WEBHOOK_URL \
          -H 'Content-Type: application/json' \
          -d '{
            "text": ":x: Production deployment failed!",
            "attachments": [{
              "color": "danger",
              "fields": [
                {"title": "Environment", "value": "Production", "short": true},
                {"title": "Failed Step", "value": "Deployment", "short": true},
                {"title": "Commit", "value": "'"${{ github.sha }}"'", "short": true}
              ],
              "actions": [
                {
                  "type": "button",
                  "text": "View Logs",
                  "url": "'"${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"'"
                }
              ]
            }]
          }'
```

### Step 5: Create Deployment Dashboard

Create a simple deployment tracking script:

```bash
cat > scripts/deployment-metrics.sh << 'EOF'
#!/bin/bash

# Generate deployment metrics

echo "=== Deployment Metrics (Last 30 Days) ==="
echo ""

# Total deployments
TOTAL=$(gh run list --workflow=ci.yml --limit 1000 --json conclusion | jq '[.[] | select(.conclusion != null)] | length')
echo "Total Deployments: $TOTAL"

# Successful deployments
SUCCESS=$(gh run list --workflow=ci.yml --limit 1000 --json conclusion | jq '[.[] | select(.conclusion == "success")] | length')
echo "Successful: $SUCCESS"

# Failed deployments
FAILED=$(gh run list --workflow=ci.yml --limit 1000 --json conclusion | jq '[.[] | select(.conclusion == "failure")] | length')
echo "Failed: $FAILED"

# Success rate
if [ $TOTAL -gt 0 ]; then
  SUCCESS_RATE=$(echo "scale=2; $SUCCESS * 100 / $TOTAL" | bc)
  echo "Success Rate: $SUCCESS_RATE%"
fi

echo ""
echo "=== Recent Deployments ==="
gh run list --workflow=ci.yml --limit 10
EOF

chmod +x scripts/deployment-metrics.sh
```

### Step 6: Test Notifications

```bash
# Commit all changes
git add scripts/ .github/workflows/ci.yml
git commit -m "feat: add Slack notifications and monitoring

- Created Slack notification scripts
- Added notifications to deployment pipeline
- Created deployment metrics dashboard
- Notify on deployment start, success, and failure"

git push

# Trigger a deployment
git tag v1.0.0
git push --tags

# Check Slack channel for notifications
```

### ✅ Verification

**You've succeeded when**:
- Slack receives notifications on deployment start
- Slack receives success notification with deployment details
- Slack receives failure notification if deployment fails
- Notifications include links to GitHub Actions
- Deployment metrics script works

**Test it**:
```bash
# Run metrics script
./scripts/deployment-metrics.sh

# Should output:
# === Deployment Metrics (Last 30 Days) ===
# Total Deployments: 15
# Successful: 14
# Failed: 1
# Success Rate: 93.33%
```

### 💼 Portfolio Tip

**In interviews, say**:
> "I implemented comprehensive monitoring with Slack notifications for all deployments. The team gets real-time updates on deployment status, duration, and any failures. I also created a deployment metrics dashboard to track success rates and identify trends."

**Show them**:
- Slack notifications with rich formatting
- Deployment metrics dashboard
- GitHub Actions integration
- Notification scripts

---

## Portfolio Project: Complete DevOps Platform

**After completing all 8 labs**, you have a production-ready DevOps platform:

### What You Built

1. ✅ Salesforce DX project with source control
2. ✅ Apex classes with 96%+ test coverage
3. ✅ Automated triggers for business logic
4. ✅ Git workflow with branch protection
5. ✅ Code review process with PR templates
6. ✅ Multi-environment CI/CD (Dev → UAT → Prod)
7. ✅ Environment-specific configurations
8. ✅ Automated code quality with PMD
9. ✅ Slack notifications and monitoring
10. ✅ Deployment metrics and dashboards

### Tech Stack

- Salesforce DX
- GitHub / Git
- GitHub Actions
- PMD (static analysis)
- Slack (notifications)
- Custom Metadata (config)
- Apex (business logic)
- Bash (automation scripts)

### Metrics

- Test Coverage: 96%+
- Deployment Time: ~15 minutes
- Environments: 3 (Dev, UAT, Prod)
- Quality Gates: 4 (PMD, tests, coverage, approvals)
- Automation: 95% (manual approval only for prod)

### Interview Showcase

Create an amazing README for your portfolio:

```markdown
# Enterprise Salesforce DevOps Platform

A complete CI/CD platform for Salesforce development with multi-environment deployment, automated testing, code quality gates, and real-time monitoring.

## 🚀 Features

- **Multi-Environment Pipeline**: Automated deployment from Dev → UAT → Production
- **Quality Gates**: PMD static analysis, 75% minimum code coverage, all tests must pass
- **Code Review**: CODEOWNERS, PR templates, branch protection
- **Environment Configs**: Environment-specific settings using Custom Metadata
- **Real-Time Monitoring**: Slack notifications for all deployments
- **Metrics Dashboard**: Track deployment success rates and trends

## 📊 Metrics

- **Test Coverage**: 96%
- **Deployment Frequency**: Daily to Dev, Weekly to UAT/Prod
- **Success Rate**: 95%+
- **Mean Time to Deploy**: 15 minutes
- **Rollback Time**: <5 minutes

## 🛠️ Tech Stack

- Salesforce DX
- GitHub Actions
- PMD
- Slack
- Bash

## 📖 Architecture

[Include architecture diagram]

## 🎯 Deployment Workflow

1. Developer creates feature branch
2. Code review via pull request
3. Automated quality checks (PMD, tests, coverage)
4. Auto-deploy to Dev on merge to `develop`
5. Auto-deploy to UAT on merge to `main`
6. Manual approval required for Production
7. Slack notifications at each step
8. Automated rollback on failure

## 📈 Results

- Reduced deployment time by 90% (8 hours → 45 minutes)
- Increased deployment frequency by 10x (monthly → daily)
- Reduced production incidents by 75%
- Zero-downtime deployments

## 🔗 Live Demo

[Link to GitHub repo]
[Link to Slack channel]
[Link to deployment dashboard]
```

---

**Congratulations!** You now have a complete, production-ready Salesforce DevOps platform that demonstrates professional-level skills. This portfolio project alone can land you a DevOps engineer role.

**Next steps**:
1. Deploy this to a real project
2. Add advanced features (feature flags, canary deployments)
3. Scale to multiple teams
4. Share your learnings through blog posts or talks

**Keep improving!** The best DevOps engineers never stop learning and iterating on their processes.

## Portfolio Project: Complete CI/CD Pipeline

After completing Labs 1-5, you have a complete portfolio project:

### What You Built

1. **Salesforce DX project** with source control
2. **Apex class** with comprehensive unit tests (96% coverage)
3. **Automated trigger** for business logic
4. **Git workflow** with branch protection
5. **GitHub Actions CI/CD** with automated deployment
6. **Code quality gates** with PMD

### How to Showcase in Interviews

**GitHub README**:
```markdown
# Salesforce DevOps Project

Complete CI/CD pipeline for Salesforce development.

## Features
- ✅ Automated testing (96% code coverage)
- ✅ Static code analysis (PMD)
- ✅ Continuous deployment
- ✅ Branch protection and PR workflow
- ✅ Quality gates (coverage, PMD, tests)

## Tech Stack
- Salesforce DX
- GitHub Actions
- PMD
- Apex
- Git

## Pipeline
1. Push code → GitHub
2. Lint with PMD
3. Validate deployment
4. Run Apex tests
5. Check coverage (must be ≥75%)
6. Deploy to Salesforce

## Live Demo
[Link to your repo]
```

**In Interviews**:
- Walk them through your GitHub repo
- Show a successful pipeline run
- Explain your design decisions
- Demonstrate the deployed functionality
- Discuss how you'd scale it

---

**Pro tip**: Keep this project updated! As you learn new DevOps concepts, add them to this project. It becomes your living portfolio that demonstrates continuous learning.
