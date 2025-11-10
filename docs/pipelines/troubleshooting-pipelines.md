# Pipeline Troubleshooting Guide

## When Everything Is on Fire

It's Friday at 4:45 PM. Your deployment pipeline just failed for the 7th time. The release is scheduled for 5 PM. Your manager is asking for updates. The team is waiting. And the error message makes absolutely no sense:

```
Error: UNKNOWN_EXCEPTION: An unexpected error occurred. Please try again.
```

That's it. That's the whole error.

Welcome to pipeline troubleshooting. It's frustrating, it's urgent, and it's a critical skill that separates junior from senior DevOps engineers.

Let's build a systematic approach so you never panic again.

## The Troubleshooting Mindset

Before diving into specific problems, let's talk about approach.

**Bad troubleshooting** looks like this:
1. Pipeline fails
2. Make random changes
3. Re-run pipeline
4. Still fails
5. Make more random changes
6. Ask for help without gathering context
7. Eventually give up or escalate

**Good troubleshooting** looks like this:
1. Pipeline fails
2. Capture the full error context
3. Form a hypothesis about the cause
4. Test the hypothesis with targeted changes
5. Document the solution
6. Prevent it from happening again

The difference? **Systematic investigation** instead of panic-driven guessing.

## The Five-Step Framework

When a pipeline fails, follow this framework every time:

### Step 1: Read the Full Error
Scroll through the entire log. Don't just read the last line. The real error often appears earlier.

### Step 2: Identify the Stage
Which pipeline stage failed? Authentication? Testing? Deployment? The stage tells you where to focus.

### Step 3: Reproduce Locally
Can you run the same command on your machine? If it works locally but fails in CI/CD, it's an environment issue.

### Step 4: Isolate Variables
What changed? New code? Updated dependencies? Different Salesforce CLI version? Find what's different.

### Step 5: Test and Verify
Make one change at a time. Verify each fix. Document what worked.

Let's apply this framework to real scenarios.

## Common Failure Patterns

### 1. Authentication Failures

**Symptom:**
```
ERROR: This org appears to have a problem with its OAuth configuration.
ERROR: We encountered a JSON web token error: invalid_grant
```

**Step 1: Read the Full Error**

Look for additional context above the error:
```
20:34:12 INFO: Attempting JWT authentication...
20:34:13 INFO: Client ID: 3MVG9...xYZ (first/last 5 chars shown)
20:34:13 INFO: Username: deployer@company.com
20:34:14 ERROR: invalid_grant - user hasn't approved this consumer
```

Ah! The user hasn't approved the Connected App.

**Step 2: Identify the Stage**

This is failing in the `before_script` section during authentication. Deployment hasn't even started yet.

**Step 3: Reproduce Locally**

```bash
# Try the same authentication locally
sf org login jwt \
  --client-id "$SF_CONSUMER_KEY" \
  --jwt-key-file server.key \
  --username deployer@company.com \
  --alias testauth
```

If this fails with the same error, it's not a CI/CD-specific issue. If it succeeds, check environment differences.

**Step 4: Isolate Variables**

Ask yourself:
- Did the Connected App configuration change?
- Is this a new username?
- Did the certificate expire?
- Is the org's IP restriction blocking the CI/CD runner?

**Step 5: Test and Verify**

For the "user hasn't approved" error:
1. Log in as the integration user
2. Navigate to Setup → Connected Apps OAuth Usage
3. Find your Connected App
4. Click "Approve" if needed
5. Re-run pipeline

**Other Authentication Fixes:**

**Expired Certificate:**
```bash
# Check certificate expiration
openssl x509 -in server.crt -noout -enddate

# If expired, generate new one
openssl genrsa -out new-server.key 2048
openssl req -new -key new-server.key -out new-server.csr
openssl x509 -req -days 365 -in new-server.csr \
  -signkey new-server.key -out new-server.crt

# Update Connected App with new certificate
# Update CI/CD variable SF_JWT_KEY with new-server.key contents
```

**Wrong Client ID:**
```yaml
# In pipeline, add debug output (temporarily)
- echo "Using Client ID starting with: ${SF_CONSUMER_KEY:0:10}"
- echo "Using username: $SF_USERNAME"

# Verify these match your Connected App and user
```

**IP Restrictions:**
```
ERROR: invalid_grant - IP restricted or invalid login hours
```

Fix:
1. Setup → Profiles → Find integration user's profile
2. Login IP Ranges → Add CI/CD runner IP range
3. OR use relaxed IP restrictions for the Connected App

### 2. Dependency/Package Not Found

**Symptom:**
```
ERROR: Package installation failed
ERROR: Cannot find package: FinancialServicesCloud@2.3.1
ERROR: Invalid dependency
```

**Diagnosis:**

Check your `sfdx-project.json`:
```json
{
  "packageDirectories": [
    {
      "path": "force-app",
      "default": true,
      "dependencies": [
        {
          "package": "FinancialServicesCloud",
          "versionNumber": "2.3.1"
        }
      ]
    }
  ]
}
```

The problem: Version `2.3.1` doesn't exist or isn't available in the target org.

**Solutions:**

```bash
# Check available versions
sf package version list --packages FinancialServicesCloud

# Or check in target org
sf package installed list --target-org prodOrg

# Update to available version
# Edit sfdx-project.json with correct version
```

**Better Approach - Version ID Instead of Number:**

```json
{
  "dependencies": [
    {
      "package": "FinancialServicesCloud@1.2.3-4"
      // Instead of versionNumber, use exact version ID (more reliable)
    }
  ]
}
```

### 3. Test Failures

**Symptom:**
```
ERROR: Deployment failed due to test failures
=== Test Failures
AccountTriggerTest.testBulkInsert
  Expected: 200, Actual: 0
  Stack trace: Class.AccountTriggerTest.testBulkInsert: line 45
```

**Why This Happens in CI/CD:**

Tests pass locally but fail in pipelines because:
- **Different org data**: Local sandbox has test data, fresh org doesn't
- **Timing issues**: Tests race against asynchronous processes
- **Missing setup**: Local org has manual configuration that CI org lacks

**Fix Pattern 1: Self-Contained Tests**

```java
// Bad - assumes data exists
@IsTest
static void testAccountUpdate() {
    Account acc = [SELECT Id FROM Account LIMIT 1];
    acc.Name = 'Updated';
    update acc;
    // Assertion...
}

// Good - creates own data
@IsTest
static void testAccountUpdate() {
    // Setup: Create test data
    Account acc = new Account(
        Name = 'Test Account',
        Industry = 'Technology'
    );
    insert acc;

    // Execute: Update the account
    Test.startTest();
    acc.Name = 'Updated';
    update acc;
    Test.stopTest();

    // Verify: Check results
    Account updated = [SELECT Name FROM Account WHERE Id = :acc.Id];
    System.assertEquals('Updated', updated.Name);
}
```

**Fix Pattern 2: Wait for Async**

```java
// Bad - doesn't wait for future methods
@IsTest
static void testAsyncProcess() {
    Account acc = new Account(Name = 'Test');
    insert acc;  // Triggers async process

    // Immediately check results - FAILS, async not done yet
    Account result = [SELECT Status__c FROM Account WHERE Id = :acc.Id];
    System.assertEquals('Processed', result.Status__c);
}

// Good - uses Test.startTest/stopTest
@IsTest
static void testAsyncProcess() {
    Account acc = new Account(Name = 'Test');

    Test.startTest();
    insert acc;  // Triggers async process
    Test.stopTest();  // Waits for async to complete

    // Now check results
    Account result = [SELECT Status__c FROM Account WHERE Id = :acc.Id];
    System.assertEquals('Processed', result.Status__c);
}
```

**Pipeline Configuration for Tests:**

```yaml
run_tests:
  script:
    # Deploy with test execution
    - sf project deploy start
        --target-org targetOrg
        --test-level RunLocalTests
        --verbose
        --wait 30  # Wait up to 30 minutes

    # If you need debug logs on failure
    - |
      if [ $? -ne 0 ]; then
        echo "Tests failed, fetching debug logs..."
        sf apex get log --target-org targetOrg --number 5
      fi
  artifacts:
    when: on_failure
    paths:
      - logs/
    expire_in: 1 week
```

### 4. Timeout Errors

**Symptom:**
```
ERROR: The client has timed out.
ERROR: Request timeout after 10 minutes
```

**Common Causes:**

**Large deployments:**
```yaml
# Bad - default timeout too short
- sf project deploy start --target-org prod

# Good - increase timeout
- sf project deploy start --target-org prod --wait 60  # 60 minutes
```

**Long-running tests:**
```yaml
# If tests take > 30 minutes
- sf project deploy start
    --test-level RunLocalTests
    --wait 90  # Allow 90 minutes for tests
```

**Org under load:**
```
ERROR: Request timed out connecting to Salesforce
```

This means Salesforce servers are slow. Solutions:
1. Retry with exponential backoff
2. Deploy during off-peak hours
3. Split deployment into smaller chunks

**Pipeline Timeout Configuration:**

```yaml
deploy:
  timeout: 2h  # GitLab job timeout
  script:
    - sf project deploy start --wait 60  # SF CLI timeout
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure
```

### 5. Metadata Conflicts

**Symptom:**
```
ERROR: Cannot update CustomObject:Account
ERROR: Field Account.CustomField__c is referenced by:
  - Workflow: UpdateAccountWorkflow
  - Validation Rule: CheckAccount
  - Process Builder: AccountProcess
```

**Understanding Dependencies:**

Salesforce metadata is interconnected. You can't delete a field that's used in workflows, even if your changes don't touch that field.

**Solution 1: Dependency Analysis**

```bash
# Before deployment, check dependencies
sf project deploy validate \
  --target-org prod \
  --verbose \
  --dry-run

# This shows what would happen without actually deploying
```

**Solution 2: Staged Deployment**

Break changes into phases:

```yaml
# Phase 1: Disable dependencies
deploy_phase_1:
  script:
    - sf project deploy start
        --source-dir force-app/workflows
        --target-org prod

# Phase 2: Update metadata
deploy_phase_2:
  script:
    - sf project deploy start
        --source-dir force-app/objects
        --target-org prod
  needs: [deploy_phase_1]

# Phase 3: Re-enable dependencies
deploy_phase_3:
  script:
    - sf project deploy start
        --source-dir force-app/workflows-enabled
        --target-org prod
  needs: [deploy_phase_2]
```

**Solution 3: Destructive Changes**

Some changes require explicit destructive changes file:

```xml
<!-- destructiveChangesPre.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <types>
        <members>Account.OldField__c</members>
        <name>CustomField</name>
    </types>
    <version>59.0</version>
</Package>
```

Deploy with:
```bash
sf project deploy start \
  --pre-destructive-changes destructiveChangesPre.xml \
  --target-org prod
```

### 6. Permission Issues

**Symptom:**
```
ERROR: You do not have sufficient permissions to deploy to this org
ERROR: Entity is not API accessible
```

**Diagnosis:**

Check the integration user's profile:

```bash
# Query user permissions
sf data query \
  --query "SELECT Id, ProfileId, Profile.Name FROM User WHERE Username = 'deployer@company.com'" \
  --target-org prod

# Check profile permissions
# Setup → Profiles → [Profile Name] → Object Settings
```

**Common Missing Permissions:**

- **Modify All Data**: Required for most deployments
- **API Enabled**: Must be checked
- **Apex REST Services**: If deploying REST resources
- **Author Apex**: If deploying classes/triggers
- **Customize Application**: For metadata deployment

**Pipeline Fix:**

If you can't change permissions, use a different user:

```yaml
# Create dedicated deployment user with System Administrator profile
# Or create custom profile with necessary permissions
# Update SF_USERNAME in CI/CD variables
```

### 7. Runner Resource Issues

**Symptom:**
```
ERROR: Cannot allocate memory
ERROR: Docker: no space left on device
ERROR: Runner timeout
```

**Solution 1: Clean Up Docker**

```yaml
before_script:
  # Clean up old containers and images
  - docker system prune -af --volumes || true

  # Or, configure GitLab Runner with automatic cleanup
  # /etc/gitlab-runner/config.toml:
  # [runners.docker]
  #   pull_policy = "if-not-present"
  #   volumes = ["/cache"]
```

**Solution 2: Increase Resources**

```yaml
deploy:
  # Use a runner with more resources
  tags:
    - large-runner  # Tag for beefy runner
  variables:
    DOCKER_DRIVER: overlay2
    DOCKER_TLS_CERTDIR: "/certs"
```

**Solution 3: Cache Dependencies**

```yaml
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .sfdx/
    - .sf/

install_dependencies:
  script:
    - npm ci --cache .npm --prefer-offline
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - .npm/
      - node_modules/
```

## Debugging Techniques

### Enable Verbose Logging

```yaml
variables:
  SF_LOG_LEVEL: debug  # Show all CLI debug output

script:
  - sf project deploy start --verbose --json  # JSON output for parsing
```

### Capture Debug Logs

```yaml
deploy:
  script:
    - sf project deploy start --target-org prod
  after_script:
    # Always run, even on failure
    - mkdir -p logs/
    - sf apex get log --target-org prod --number 10 --output-dir logs/ || true
  artifacts:
    when: on_failure
    paths:
      - logs/
    expire_in: 7 days
```

### Test Locally with Docker

Reproduce the exact CI/CD environment:

```bash
# Pull the same Docker image used in CI/CD
docker pull salesforce/cli:latest-slim

# Run commands in container
docker run -it --rm \
  -v $(pwd):/workspace \
  -w /workspace \
  salesforce/cli:latest-slim \
  bash

# Inside container, run your pipeline commands
sf project deploy start --manifest package.xml
```

### Add Checkpoint Logging

```yaml
script:
  - echo "=== Starting deployment at $(date)"
  - echo "=== Target org: $SF_USERNAME"

  - sf project deploy start --target-org prod
  - echo "=== Deployment completed at $(date)"

  - echo "=== Running verification"
  - sf data query --query "SELECT COUNT() FROM Account" --target-org prod
  - echo "=== Verification completed"
```

This creates clear markers in logs to identify exactly where failures occur.

## Creating a Troubleshooting Runbook

Document common issues for your team. Here's a template:

```markdown
# Deployment Pipeline Troubleshooting

## Quick Checks
- [ ] Check #devops-alerts Slack channel for known issues
- [ ] Verify Salesforce status: https://status.salesforce.com
- [ ] Check GitLab runner status: Settings → CI/CD → Runners

## Error: "invalid_grant"
**Cause**: Connected App not approved or certificate expired
**Fix**:
1. Check certificate: `openssl x509 -in server.crt -noout -enddate`
2. If expired, regenerate and update CI/CD variable
3. Ensure user has approved Connected App

**Owner**: DevOps Team
**Last Updated**: 2024-01-15

## Error: "Component failures"
**Cause**: Metadata dependency issues
**Fix**:
1. Run validation first: `sf project deploy validate`
2. Check for inactive metadata references
3. Consider staged deployment approach

**Owner**: DevOps Team
**Last Updated**: 2024-01-10
```

## Hands-On Exercise: Debug a Failed Pipeline

**Scenario**: You've been given access to a failed pipeline. Your job is to fix it.

**The Error Log** (abbreviated):

```
Running before_script...
Authenticating to Salesforce...
ERROR: invalid_grant - IP restricted or invalid login hours

Running script...
sf project deploy start --target-org prod
ERROR: No authenticated org found for alias 'prod'
ERROR: Job failed
```

**Your Tasks**:

1. Identify the root cause (hint: it's not the second error)
2. Determine what information you need to fix it
3. Propose at least two possible solutions
4. Write a pipeline change to prevent this in the future
5. Document this in the team runbook

**You'll know you succeeded when**:
- You correctly identified that authentication is the root cause
- You explained why the second error is a symptom, not the cause
- Your solution addresses IP restrictions
- Your prevention strategy includes monitoring

**Going Further**:
- Set up Slack notifications for authentication failures
- Create a dashboard showing authentication success rate
- Implement automatic retry logic with exponential backoff

## Prevention Strategies

Fix issues once, prevent them forever:

**1. Pre-Deployment Validation**

```yaml
validate:
  stage: test
  script:
    - sf project deploy validate
        --target-org prod
        --test-level RunLocalTests
        --verbose
  only:
    - merge_requests
```

Catch issues before they reach main branch.

**2. Smoke Tests**

```yaml
deploy:
  script:
    - sf project deploy start --target-org prod

smoke_test:
  stage: verify
  script:
    # Verify deployment succeeded
    - sf data query --query "SELECT COUNT() FROM Account" --target-org prod
    - sf apex run --file smoke-tests/verify.apex --target-org prod
  needs: [deploy]
```

**3. Automated Rollback**

```yaml
deploy:
  script:
    - sf project deploy start --target-org prod
  after_script:
    - |
      if [ $CI_JOB_STATUS == 'failed' ]; then
        echo "Deployment failed, initiating rollback..."
        sf project deploy quick --use-most-recent --target-org prod
      fi
```

**4. Monitoring and Alerts**

```yaml
deploy:
  after_script:
    - |
      if [ $CI_JOB_STATUS == 'failed' ]; then
        curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
          -H 'Content-Type: application/json' \
          -d "{
            \"text\": \"🚨 Production deployment failed\",
            \"blocks\": [{
              \"type\": \"section\",
              \"text\": {
                \"type\": \"mrkdwn\",
                \"text\": \"*Pipeline*: $CI_PIPELINE_URL\n*Branch*: $CI_COMMIT_BRANCH\n*Error*: See logs\"
              }
            }]
          }"
      fi
```

## Troubleshooting Checklist

When a pipeline fails, work through this checklist:

**Initial Assessment**
- [ ] Read the complete error message (not just last line)
- [ ] Identify which stage failed
- [ ] Check Salesforce status page
- [ ] Verify no recent infrastructure changes

**Authentication Issues**
- [ ] Verify credentials are current in CI/CD variables
- [ ] Check certificate expiration (if using JWT)
- [ ] Confirm IP restrictions allow CI/CD runner
- [ ] Ensure Connected App is approved

**Deployment Issues**
- [ ] Review what code changed since last successful deployment
- [ ] Check for metadata dependencies
- [ ] Verify package versions exist
- [ ] Confirm target org has required features enabled

**Test Failures**
- [ ] Can you reproduce the test failure locally?
- [ ] Does the test create its own data or rely on existing data?
- [ ] Are there timing issues with async operations?
- [ ] Check test code coverage requirements are met

**Environment Issues**
- [ ] Is the runner healthy and has sufficient resources?
- [ ] Are the correct versions of tools installed?
- [ ] Is the Docker image up to date?
- [ ] Check for network connectivity issues

**Documentation**
- [ ] Document the root cause
- [ ] Update runbook with solution
- [ ] Share findings with team
- [ ] Create prevention strategy

## What We Learned

Pipeline troubleshooting is a skill built through systematic investigation:

1. **The Five-Step Framework**: Read, identify, reproduce, isolate, verify
2. **Common patterns**: Authentication, dependencies, tests, timeouts, permissions
3. **Debugging techniques**: Verbose logging, debug logs, local reproduction
4. **Prevention**: Validation, smoke tests, rollback, monitoring
5. **Documentation**: Runbooks prevent solving the same issue twice

The difference between junior and senior DevOps engineers isn't that seniors don't encounter failures. It's that they debug systematically and prevent repeat issues.

## What's Next

Now that you can troubleshoot pipelines, let's focus on **Zero-Downtime Deployments**.

You'll learn how to:
- Deploy to production without impacting users
- Use blue-green deployment strategies
- Implement feature flags for gradual rollouts
- Handle database migrations during deployments
- Coordinate deployments across multiple systems

See you there!
