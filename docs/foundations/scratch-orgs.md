# Scratch Orgs and Ephemeral Environments

## The Sandbox Bottleneck

Your team has 8 developers. You have 3 Developer sandboxes.

Developer 1 is testing a feature that modifies the Account trigger. Developer 2 needs to test their Account trigger changes. They conflict. One developer has to wait.

Developer 3 accidentally breaks the Lead assignment flow while testing. Now no one can test Lead features until it's fixed.

Developer 4 needs a fresh org to test a new feature, but all sandboxes are cluttered with weeks of test data and half-finished features.

The sandbox refresh limit is 1 per day. You used yours yesterday.

Sound familiar? This is the sandbox bottleneck. And it kills productivity.

**Scratch orgs solve this problem.**

## What Are Scratch Orgs?

Scratch orgs are temporary, disposable Salesforce orgs you can create in seconds. Think of them as Docker containers for Salesforce development.

**Key characteristics:**

- **Ephemeral**: Automatically deleted after 1-30 days
- **Source-driven**: Created from configuration files in your repository
- **Isolated**: Each developer gets their own clean environment
- **Fast**: Created in 2-6 minutes, not hours/days like sandboxes
- **Free**: Included with Dev Hub (no additional license cost)
- **Configurable**: Define exact features, settings, and editions

**Traditional sandbox workflow:**
```
Request sandbox → Wait for admin → Wait for refresh (1 day) →
Share sandbox with team → Conflicts and contamination →
Wait for next refresh cycle
```

**Scratch org workflow:**
```
Run command → Wait 3 minutes → Fresh org ready →
Develop → Delete when done → Repeat anytime
```

Let's implement this.

## Setting Up Dev Hub

Before you can create scratch orgs, you need to enable Dev Hub in your production or Dev Edition org.

### Enable Dev Hub

1. Log into your production org (or create a free Dev Edition org at developer.salesforce.com)
2. Setup → Dev Hub → Enable Dev Hub
3. Click "Enable"

That's it. Dev Hub is now active.

### Authenticate to Dev Hub

```bash
# Authenticate to your Dev Hub org
sf org login web --set-default-dev-hub --alias devhub

# Verify Dev Hub is set
sf org list
```

You should see your org marked as `(D)` for Dev Hub:

```
=== Orgs
  ALIAS   USERNAME              ORG ID          STATUS
  devhub  admin@company.com     00D...          (D)
```

## Creating Your First Scratch Org

### Define Org Configuration

Create `config/project-scratch-def.json`:

```json
{
  "orgName": "My Company Dev Org",
  "edition": "Developer",
  "features": ["EnableSetPasswordInApi"],
  "settings": {
    "lightningExperienceSettings": {
      "enableS1DesktopEnabled": true
    },
    "mobileSettings": {
      "enableS1EncryptedStoragePref2": false
    },
    "securitySettings": {
      "passwordPolicies": {
        "minimumPasswordLength": 8
      }
    }
  }
}
```

### Create the Scratch Org

```bash
# Create a 7-day scratch org
sf org create scratch \
  --definition-file config/project-scratch-def.json \
  --alias my-scratch \
  --set-default \
  --duration-days 7

# This takes 2-6 minutes
```

Output:
```
Creating scratch org... done
Successfully created scratch org: 00D..., username: test-abc@example.com
```

### Open Your Scratch Org

```bash
sf org open --target-org my-scratch
```

Your browser opens to a fresh, empty Salesforce org. No data, no customizations. Just the features you specified.

## Deploying Your Code to Scratch Orgs

You have an empty org. Now deploy your application:

```bash
# Deploy all metadata
sf project deploy start --target-org my-scratch

# Or deploy specific components
sf project deploy start \
  --source-dir force-app/main/default/classes \
  --target-org my-scratch
```

Within seconds, your customizations are deployed.

## Scratch Org Configuration Deep Dive

### Available Editions

```json
{
  "edition": "Developer"  // Free, most common for development
}
```

Options:
- `Developer` (default, recommended)
- `Enterprise`
- `Group`
- `Professional`

### Enable Features

```json
{
  "features": [
    "Communities",
    "ServiceCloud",
    "MarketingUser",
    "PersonAccounts",
    "MultiCurrency"
  ]
}
```

Common features:
- `Communities`: Enable Experience Cloud
- `PersonAccounts`: Enable B2C account model
- `MultiCurrency`: Multiple currency support
- `ServiceCloud`: Service Cloud features
- `Sales`: Sales Cloud features

Full list: `sf org list shape --json | jq '.result.features'`

### Configure Settings

```json
{
  "settings": {
    "securitySettings": {
      "passwordPolicies": {
        "minimumPasswordLength": 8,
        "complexity": "NoRestriction"
      }
    },
    "languageSettings": {
      "enableTranslationWorkbench": true
    },
    "mobileSettings": {
      "enableS1EncryptedStoragePref2": false
    }
  }
}
```

### Admin User Configuration

```json
{
  "orgName": "My Dev Org",
  "edition": "Developer",
  "adminEmail": "developer@company.com",
  "settings": {
    "orgPreferenceSettings": {
      "s1DesktopEnabled": true
    }
  }
}
```

## Loading Sample Data

Empty orgs are useful for testing, but sometimes you need data.

### Option 1: Data Import with JSON

Create `data/sample-accounts.json`:

```json
{
  "records": [
    {
      "attributes": {"type": "Account", "referenceId": "AccountRef1"},
      "Name": "Acme Corporation",
      "Industry": "Technology",
      "AnnualRevenue": 1000000
    },
    {
      "attributes": {"type": "Account", "referenceId": "AccountRef2"},
      "Name": "Global Industries",
      "Industry": "Manufacturing",
      "AnnualRevenue": 5000000
    }
  ]
}
```

Load data:

```bash
sf data import tree \
  --plan data/sample-data-plan.json \
  --target-org my-scratch
```

### Option 2: Automated Data Seeding Script

Create `scripts/seed-data.sh`:

```bash
#!/bin/bash
set -e

TARGET_ORG=${1:-my-scratch}

echo "Seeding data to $TARGET_ORG..."

# Create Accounts
sf data create record \
  --sobject Account \
  --values "Name='Acme Corp' Industry='Technology'" \
  --target-org $TARGET_ORG

sf data create record \
  --sobject Account \
  --values "Name='Global Inc' Industry='Manufacturing'" \
  --target-org $TARGET_ORG

# Create Contacts
sf data create record \
  --sobject Contact \
  --values "FirstName='John' LastName='Doe' Email='john@acme.com'" \
  --target-org $TARGET_ORG

echo "✅ Data seeded successfully"
```

Run after creating scratch org:

```bash
sf org create scratch --definition-file config/project-scratch-def.json --alias my-scratch
sf project deploy start --target-org my-scratch
./scripts/seed-data.sh my-scratch
```

### Option 3: Copy Data from Another Org

```bash
# Export data from sandbox
sf data export tree \
  --query "SELECT Id, Name, Industry FROM Account LIMIT 100" \
  --target-org sandbox \
  --output-dir data/export

# Import to scratch org
sf data import tree \
  --plan data/export/Account-plan.json \
  --target-org my-scratch
```

## Scratch Orgs in CI/CD Pipelines

The real power of scratch orgs: automated testing in isolated environments.

### Basic Pipeline Integration

```yaml
# .gitlab-ci.yml
validate_feature:
  stage: test
  only:
    - merge_requests
  script:
    # Create fresh scratch org
    - sf org create scratch
        --definition-file config/project-scratch-def.json
        --alias ci-scratch
        --duration-days 1
        --wait 10

    # Deploy code
    - sf project deploy start --target-org ci-scratch

    # Run tests
    - sf apex run test
        --target-org ci-scratch
        --test-level RunLocalTests
        --wait 10
        --result-format human

    # Cleanup (automatic after 1 day anyway)
    - sf org delete scratch --target-org ci-scratch --no-prompt

  after_script:
    # Always cleanup, even if tests fail
    - sf org delete scratch --target-org ci-scratch --no-prompt || true
```

### Benefits in CI/CD

**1. Isolation**: Each PR gets its own org. No conflicts.

**2. Parallelization**: Run multiple pipelines simultaneously.

```yaml
test_parallel:
  stage: test
  parallel: 5  # Run 5 parallel jobs
  script:
    - SCRATCH_ALIAS="ci-scratch-${CI_CONCURRENT_ID}"
    - sf org create scratch --alias $SCRATCH_ALIAS --duration-days 1
    - sf project deploy start --target-org $SCRATCH_ALIAS
    - sf apex run test --target-org $SCRATCH_ALIAS
```

**3. Clean slate**: Every test starts with a fresh org. No contamination.

**4. Cost-effective**: No need for dozens of sandboxes.

## Developer Workflow with Scratch Orgs

### Daily Workflow

**Morning:**
```bash
# Create today's scratch org
sf org create scratch \
  --definition-file config/project-scratch-def.json \
  --alias today-scratch \
  --set-default \
  --duration-days 1

# Deploy your branch
sf project deploy start

# Load test data
./scripts/seed-data.sh

# Open and start developing
sf org open
```

**During development:**
```bash
# Pull latest from repo
git pull origin main

# Push changes to scratch org
sf project deploy start --source-dir force-app/main/default/classes/MyClass.cls

# Run specific tests
sf apex run test --tests MyClassTest --target-org today-scratch

# Retrieve any changes made in UI
sf project retrieve start --source-dir force-app
```

**End of day:**
```bash
# Commit your changes
git add .
git commit -m "Complete feature X"
git push

# Delete scratch org (optional, will auto-delete in 1 day anyway)
sf org delete scratch --target-org today-scratch --no-prompt
```

### Feature Branch Workflow

Each feature branch gets its own scratch org:

```bash
# Checkout feature branch
git checkout -b feature/new-validation-rule

# Create scratch org for this feature
sf org create scratch \
  --definition-file config/project-scratch-def.json \
  --alias feature-validation \
  --duration-days 7

# Develop in isolation
sf project deploy start --target-org feature-validation
sf org open --target-org feature-validation

# When feature is complete, create PR
# CI/CD creates its own scratch org to validate
```

## Managing Multiple Scratch Orgs

```bash
# List all your orgs
sf org list

# Output:
# Orgs
#   ALIAS              USERNAME                      ORG ID          STATUS
#   devhub             admin@company.com             00D...          (D)
#   today-scratch      test-abc@example.com          00D...          Active
#   feature-123        test-def@example.com          00D...          Active
#   old-scratch        test-ghi@example.com          00D...          Active (expires in 2 days)

# Delete specific scratch org
sf org delete scratch --target-org old-scratch --no-prompt

# Delete all expired scratch orgs
sf org list --json | jq -r '.result.scratchOrgs[] | select(.expirationDate < now) | .alias' | xargs -I {} sf org delete scratch --target-org {} --no-prompt
```

## Advanced Scratch Org Patterns

### Pattern 1: Org Snapshots

Save the state of a scratch org and recreate it later:

```bash
# Create and configure scratch org
sf org create scratch --alias base-org --duration-days 7
sf project deploy start --target-org base-org
./scripts/seed-data.sh base-org

# Create snapshot
sf org create snapshot \
  --source-org base-org \
  --name my-snapshot \
  --description "Configured org with sample data"

# Later, create scratch org from snapshot
sf org create scratch \
  --snapshot my-snapshot \
  --alias quick-start
```

This creates a pre-configured org in seconds instead of minutes.

### Pattern 2: Org Shapes

For production-like orgs:

```bash
# Create shape from production
sf org create shape --target-org production

# Create scratch org matching production shape
sf org create scratch \
  --definition-file config/enterprise-scratch-def.json \
  --alias prod-like
```

### Pattern 3: Pooled Scratch Orgs

Pre-create scratch orgs for faster CI/CD:

```yaml
# Create scratch org pool
create_pool:
  stage: prep
  only:
    - schedules  # Run nightly
  script:
    - |
      for i in {1..10}; do
        sf org create scratch \
          --definition-file config/project-scratch-def.json \
          --alias "pool-$i" \
          --duration-days 1
        sf project deploy start --target-org "pool-$i"
      done

# Use from pool
run_tests:
  stage: test
  script:
    # Grab next available org from pool
    - POOL_ORG=$(sf org list --json | jq -r '.result.scratchOrgs[] | select(.alias | startswith("pool-")) | .alias' | head -1)
    - sf apex run test --target-org $POOL_ORG
```

## Scratch Orgs vs Sandboxes

| Feature | Scratch Orgs | Sandboxes |
|---------|-------------|-----------|
| **Creation time** | 2-6 minutes | Hours to days |
| **Cost** | Free (with Dev Hub) | Requires licenses |
| **Quantity** | Up to 200 active per day | Limited by license |
| **Lifespan** | 1-30 days | Permanent |
| **Data** | Empty or seeded | Can copy from production |
| **Configuration** | Code-driven | Manual or refresh |
| **Use case** | Development, CI/CD | UAT, staging, training |
| **Isolation** | Perfect isolation | Shared among team |

**When to use scratch orgs:**
- Feature development
- Automated testing
- Pull request validation
- Proof of concepts
- Training environments

**When to use sandboxes:**
- User acceptance testing
- Staging before production
- Integration testing with real data
- Performance testing with production data volume
- Long-term demo environments

## Troubleshooting Scratch Orgs

### Error: "Dev Hub is not enabled"

**Solution:**
```bash
# Verify Dev Hub org
sf org list

# Re-authenticate to Dev Hub
sf org login web --set-default-dev-hub
```

### Error: "Active scratch org limit reached"

**Solution:**
```bash
# List all active scratch orgs
sf org list

# Delete unused orgs
sf org delete scratch --target-org old-org --no-prompt

# Or delete all scratch orgs
sf org list --json | jq -r '.result.scratchOrgs[].alias' | xargs -I {} sf org delete scratch --target-org {} --no-prompt
```

### Error: "Creation failed with status: Error"

**Cause:** Invalid org definition.

**Solution:**
```bash
# Validate your scratch org definition
cat config/project-scratch-def.json | jq .

# Check for unsupported features
sf org list metadata-types
```

### Scratch org is slow or timing out

**Cause:** Complex deployments or org creation.

**Solution:**
```bash
# Increase wait time
sf org create scratch \
  --definition-file config/project-scratch-def.json \
  --wait 15  # Wait up to 15 minutes

# Or check status manually
sf org create scratch --definition-file config/project-scratch-def.json --async
# ... do other work ...
sf org resume scratch
```

## Complete Example: Feature Development

Let's walk through developing a complete feature using scratch orgs:

**1. Create feature branch and scratch org:**

```bash
# Create feature branch
git checkout -b feature/opportunity-automation

# Create scratch org for this feature
sf org create scratch \
  --definition-file config/project-scratch-def.json \
  --alias opp-automation \
  --set-default \
  --duration-days 7

# Deploy current codebase
sf project deploy start

# Load test data
./scripts/seed-data.sh opp-automation

# Open org
sf org open
```

**2. Develop the feature in the UI:**

- Create workflow rule
- Create validation rule
- Create Apex trigger
- Test in the scratch org

**3. Retrieve changes to local:**

```bash
# Retrieve all changes
sf project retrieve start --target-org opp-automation

# Or retrieve specific metadata
sf project retrieve start \
  --metadata ApexClass:OpportunityTrigger \
  --metadata WorkflowRule:Opportunity.CloseDate
```

**4. Write tests:**

```bash
# Create test class locally
# Then deploy to scratch org
sf project deploy start --source-dir force-app/main/default/classes/OpportunityTriggerTest.cls

# Run tests
sf apex run test --tests OpportunityTriggerTest --result-format human

# Check coverage
sf apex get test --test-run-id 707xxx --code-coverage
```

**5. Commit and push:**

```bash
git add force-app/
git commit -m "Add opportunity automation feature"
git push origin feature/opportunity-automation
```

**6. CI/CD validates:**

Pipeline creates a fresh scratch org, deploys your code, runs all tests:

```yaml
validate_pr:
  script:
    - sf org create scratch --alias ci-test --duration-days 1
    - sf project deploy start --target-org ci-test
    - sf apex run test --test-level RunLocalTests --target-org ci-test
```

**7. Merge to main:**

After approval, merge. The feature is now validated and ready for sandbox/production deployment.

**8. Cleanup:**

```bash
# Delete your feature scratch org
sf org delete scratch --target-org opp-automation --no-prompt

# Or let it expire automatically
```

## Hands-On Exercise: Master Scratch Orgs

**Objective**: Create a complete scratch org workflow from setup to CI/CD integration.

**Your Tasks**:

1. Enable Dev Hub in a Developer Edition org
2. Create a scratch org definition with at least 3 features enabled
3. Create a data seeding script that populates Accounts, Contacts, and Opportunities
4. Develop a simple feature (validation rule or trigger) in the scratch org
5. Retrieve the feature to your local repository
6. Write a CI/CD pipeline that:
   - Creates a scratch org
   - Deploys code
   - Seeds data
   - Runs tests
   - Deletes the org

**Deliverables**:

- [ ] Dev Hub enabled and authenticated
- [ ] `config/project-scratch-def.json` with custom configuration
- [ ] Data seeding script (`scripts/seed-data.sh`)
- [ ] Feature developed and retrieved to local
- [ ] CI/CD pipeline with scratch org integration
- [ ] Documentation of your workflow

**You'll know you succeeded when**:
- You can create a fully configured scratch org in under 5 minutes
- Your CI/CD pipeline runs completely isolated tests
- You can develop features without depending on shared sandboxes

## Scratch Org Checklist

Effective scratch org implementation includes:

- [ ] Dev Hub enabled and authenticated
- [ ] Scratch org definition file in version control
- [ ] Data seeding scripts for common test scenarios
- [ ] CI/CD integration for pull request validation
- [ ] Developer documentation on scratch org workflow
- [ ] Regular cleanup of expired scratch orgs
- [ ] Org snapshots for common configurations (optional)
- [ ] Team training on scratch org workflows

## What We Learned

Scratch orgs transform Salesforce development from sandbox-constrained to cloud-native:

1. **Ephemeral environments**: Create and destroy orgs in minutes
2. **Source-driven**: Org configuration as code
3. **Perfect isolation**: Each developer and each PR gets a clean org
4. **CI/CD integration**: Automated testing in fresh environments
5. **Cost-effective**: Unlimited orgs at no additional cost
6. **Developer productivity**: No more waiting for sandboxes

Scratch orgs are the foundation of modern Salesforce DevOps. They enable continuous integration, parallel development, and reliable automated testing.

## What's Next

You can now create ephemeral environments for development and testing. But what about packaging and distributing your applications?

Next: **Package Development with Second-Generation Packages (2GP)**.

You'll learn:
- Modular application architecture
- Creating unlocked and managed packages
- Versioning and dependency management
- Package development lifecycle
- Distributing packages to customers

See you there!
