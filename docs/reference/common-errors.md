# Common Errors and Solutions Reference

## Quick Error Lookup

Use this guide when you encounter errors during deployments, testing, or pipeline execution. Errors are organized by category with quick solutions.

## Table of Contents

- [Authentication Errors](#authentication-errors)
- [Deployment Errors](#deployment-errors)
- [Test Execution Errors](#test-execution-errors)
- [Pipeline Errors](#pipeline-errors)
- [Apex Runtime Errors](#apex-runtime-errors)
- [Git and Version Control Errors](#git-and-version-control-errors)

---

## Authentication Errors

### Error: `invalid_grant`

**Full Message:**
```
ERROR: This org appears to have a problem with its OAuth configuration.
ERROR: invalid_grant: authentication failure
```

**Common Causes:**
1. User hasn't approved the Connected App
2. Certificate expired (JWT flow)
3. IP restrictions blocking CI/CD runner
4. Security token changed (username/password flow)

**Solutions:**

**If using JWT:**
```bash
# Check certificate expiration
openssl x509 -in server.crt -noout -enddate

# If expired, generate new certificate
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

# Update Connected App with new certificate
# Update CI/CD variable SF_JWT_KEY with contents of server.key
```

**If using username/password:**
```bash
# Verify credentials
sf org login user \
  --username $SF_USERNAME \
  --instance-url https://login.salesforce.com \
  --set-default

# If security token changed, update CI/CD variable
```

**If IP restricted:**
- Add CI/CD runner IP to Profile → Login IP Ranges
- Or relax IP restrictions on Connected App

---

### Error: `expired access/refresh token`

**Full Message:**
```
ERROR: The access token expired
```

**Solution:**

Re-authenticate in pipeline:

```yaml
before_script:
  # Don't cache authentication
  - sf org logout --all --no-prompt || true
  - echo "$SF_JWT_KEY" > /tmp/key.pem
  - sf org login jwt \
      --client-id "$SF_CONSUMER_KEY" \
      --jwt-key-file /tmp/key.pem \
      --username "$SF_USERNAME" \
      --alias targetOrg
```

---

## Deployment Errors

### Error: `Component failures`

**Full Message:**
```
ERROR: Deploy failed due to component failures:
  classes/MyClass.cls: This test class exceeds the maximum time limit
  objects/Account.object: Unknown custom field: InvalidField__c
```

**Diagnosis:**
Check which specific components failed and why.

**Common Causes & Solutions:**

**Unknown field/object:**
```
Error: Unknown custom field: CustomField__c
```

**Solution:** Field exists in source but not in target org
- Deploy field definition first
- Or remove reference from deployment

**Test timeout:**
```
Error: This test class exceeds the maximum time limit
```

**Solution:** Test takes > 10 minutes
- Optimize slow tests
- Split into multiple test classes
- Check for SOQL in loops or nested iterations

**Validation rule conflict:**
```
Error: Validation formula error: Field Account.Industry does not exist
```

**Solution:** Validation rule references field that doesn't exist yet
- Deploy field first
- Or use destructive changes to remove validation rule before deploying field change

---

### Error: `UNKNOWN_EXCEPTION`

**Full Message:**
```
ERROR: UNKNOWN_EXCEPTION: An unexpected error occurred. Please try again.
```

**This is Salesforce's unhelpful catch-all error.**

**Troubleshooting Steps:**

1. **Enable debug logging:**
```bash
sf project deploy start \
  --verbose \
  --dry-run \
  --target-org prod
```

2. **Check deployment status:**
```bash
sf project deploy report --job-id 0Af...
```

3. **Deploy components individually:**
```bash
# Deploy one file at a time to isolate the problem
sf project deploy start --source-dir force-app/main/default/classes/ProblemClass.cls
```

4. **Check Salesforce debug logs:**
```bash
sf apex get log --target-org prod --number 10
```

5. **Common actual causes:**
- Circular dependencies between components
- Apex class references non-existent method
- Flow references deleted field
- Workflow rule has syntax error

---

### Error: `In field: field integrity exception`

**Full Message:**
```
ERROR: In field: field integrity exception: unknown (InvalidField__c not valid for update)
```

**Cause:** Trying to update a field that doesn't exist or isn't accessible.

**Solutions:**

**If field should exist:**
```bash
# Verify field exists in target org
sf data query \
  --query "SELECT QualifiedApiName FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName = 'Account'" \
  --target-org prod | grep InvalidField__c
```

**If field doesn't exist:**
- Deploy field definition first
- Or remove field from the update operation

---

### Error: `Maximum trigger depth exceeded`

**Full Message:**
```
ERROR: maximum trigger depth exceeded: Account trigger entered recursively
```

**Cause:** Trigger calls itself repeatedly (infinite loop).

**Example Bad Code:**
```java
trigger AccountTrigger on Account (after update) {
    for (Account acc : Trigger.new) {
        acc.Status__c = 'Updated';
        update acc;  // This causes the trigger to fire again!
    }
}
```

**Solution:**
Use static variable to prevent recursion:

```java
public class TriggerControl {
    public static Boolean isFirstRun = true;
}

trigger AccountTrigger on Account (after update) {
    if (!TriggerControl.isFirstRun) return;
    TriggerControl.isFirstRun = false;

    // Trigger logic here
}
```

---

## Test Execution Errors

### Error: `System.NullPointerException`

**Full Message:**
```
ERROR: System.NullPointerException: Attempt to de-reference a null object
  Class.MyClass.myMethod: line 42
```

**Cause:** Accessing a property/method on a null object.

**Common Scenarios:**

**Accessing field on null record:**
```java
Account acc = [SELECT Id FROM Account WHERE Name = 'NonExistent'];
String industry = acc.Industry;  // NullPointerException if no record found
```

**Solution:**
```java
List<Account> accounts = [SELECT Id, Industry FROM Account WHERE Name = 'Test' LIMIT 1];
String industry = accounts.isEmpty() ? null : accounts[0].Industry;
```

**Accessing item in empty list:**
```java
List<String> items = new List<String>();
String first = items[0];  // NullPointerException
```

**Solution:**
```java
String first = items.isEmpty() ? null : items[0];
```

---

### Error: `UNABLE_TO_LOCK_ROW`

**Full Message:**
```
ERROR: UNABLE_TO_LOCK_ROW: unable to obtain exclusive access to this record
```

**Cause:** Two processes trying to update the same record simultaneously.

**Solutions:**

**In tests (most common):**
```java
@IsTest
static void testBulkUpdate() {
    List<Account> accounts = new List<Account>();
    for (Integer i = 0; i < 200; i++) {
        accounts.add(new Account(Name = 'Test ' + i));
    }

    Test.startTest();
    insert accounts;  // Bulk insert

    // Update in same transaction - might cause UNABLE_TO_LOCK_ROW
    for (Account acc : accounts) {
        acc.Industry = 'Tech';
    }
    update accounts;
    Test.stopTest();
}
```

**Solution:** Use `Test.startTest()` and `Test.stopTest()` properly:
```java
Test.startTest();
insert accounts;
Test.stopTest();  // Finishes async processes

// Now update in new transaction
accounts = [SELECT Id FROM Account WHERE Id IN :accounts];
for (Account acc : accounts) {
    acc.Industry = 'Tech';
}
update accounts;
```

**In production:**
- Indicates concurrent updates (two users editing same record)
- Implement retry logic with exponential backoff

---

### Error: `System.LimitException: Too many SOQL queries: 101`

**Full Message:**
```
ERROR: System.LimitException: Too many SOQL queries: 101
  Class.MyClass.myMethod: line 67
```

**Cause:** Exceeded governor limit of 100 SOQL queries per transaction.

**Common Cause:** SOQL in a loop

```java
// BAD
for (Account acc : accounts) {
    List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];
}
```

**Solution:** Bulkify queries

```java
// GOOD
Set<Id> accountIds = new Map<Id, Account>(accounts).keySet();
Map<Id, List<Contact>> contactsByAccount = new Map<Id, List<Contact>>();

for (Contact c : [SELECT Id, AccountId FROM Contact WHERE AccountId IN :accountIds]) {
    if (!contactsByAccount.containsKey(c.AccountId)) {
        contactsByAccount.put(c.AccountId, new List<Contact>());
    }
    contactsByAccount.get(c.AccountId).add(c);
}

for (Account acc : accounts) {
    List<Contact> contacts = contactsByAccount.get(acc.Id);
    // Process contacts
}
```

---

### Error: `System.DmlException: Insert failed`

**Full Message:**
```
ERROR: System.DmlException: Insert failed. First exception on row 0; first error: REQUIRED_FIELD_MISSING, Required fields are missing: [Name]
```

**Cause:** Required field not populated.

**Solution:**
Populate all required fields before DML:

```java
Account acc = new Account(
    Name = 'Test Account',  // Required field
    Industry = 'Technology'
);
insert acc;
```

**Tip:** Check validation rules - they can make fields "required" even if not marked required in schema.

---

## Pipeline Errors

### Error: `sf: command not found`

**Full Message:**
```
bash: sf: command not found
```

**Cause:** Salesforce CLI not installed in pipeline environment.

**Solution:**

```yaml
before_script:
  # Install Salesforce CLI
  - npm install -g @salesforce/cli

  # Verify installation
  - sf version
```

Or use Docker image with CLI pre-installed:

```yaml
image: salesforce/cli:latest-slim

deploy:
  script:
    - sf project deploy start --target-org prod
```

---

### Error: `No authenticated orgs found`

**Full Message:**
```
ERROR: No authenticated orgs found. Run "sf org login" to authenticate.
```

**Cause:** Org authentication missing or expired.

**Solution:**

```yaml
before_script:
  # Authenticate before deployment
  - echo "$SF_JWT_KEY" > /tmp/server.key
  - sf org login jwt \
      --client-id "$SF_CONSUMER_KEY" \
      --jwt-key-file /tmp/server.key \
      --username "$SF_USERNAME" \
      --alias prod \
      --set-default
```

---

### Error: `The client has timed out`

**Full Message:**
```
ERROR: The client has timed out
```

**Cause:** Operation took longer than timeout threshold.

**Solutions:**

**Increase timeout:**
```yaml
deploy:
  script:
    - sf project deploy start \
        --target-org prod \
        --wait 60  # Wait up to 60 minutes
```

**For tests:**
```yaml
test:
  script:
    - sf apex run test \
        --test-level RunLocalTests \
        --wait 90  # 90 minutes for large test suites
  timeout: 2h  # GitLab job timeout
```

---

### Error: `Repository not found`

**Full Message:**
```
ERROR: fatal: repository 'https://gitlab.com/company/project.git' not found
```

**Cause:** Git credentials missing or incorrect.

**Solution:**

```yaml
before_script:
  # Configure Git authentication
  - git config --global user.email "ci@company.com"
  - git config --global user.name "CI Pipeline"

  # Use deploy token for authentication
  - git remote set-url origin https://gitlab-ci-token:${CI_JOB_TOKEN}@gitlab.com/company/project.git
```

---

## Apex Runtime Errors

### Error: `List index out of bounds`

**Full Message:**
```
System.ListException: List index out of bounds: 0
```

**Cause:** Accessing list item that doesn't exist.

**Bad Code:**
```java
List<Account> accounts = [SELECT Id FROM Account WHERE Name = 'Test'];
Account acc = accounts[0];  // Fails if query returns no results
```

**Good Code:**
```java
List<Account> accounts = [SELECT Id FROM Account WHERE Name = 'Test' LIMIT 1];
if (!accounts.isEmpty()) {
    Account acc = accounts[0];
    // Process account
}
```

---

### Error: `Argument cannot be null`

**Full Message:**
```
System.IllegalArgumentException: Argument cannot be null
```

**Cause:** Passing null to a method that doesn't accept null.

**Example:**
```java
String.valueOf(null);  // Throws exception
```

**Solution:**
```java
String value = myVariable != null ? String.valueOf(myVariable) : '';
```

---

## Git and Version Control Errors

### Error: `Merge conflict`

**Full Message:**
```
CONFLICT (content): Merge conflict in force-app/main/default/classes/MyClass.cls
Automatic merge failed; fix conflicts and then commit the result.
```

**Solution:**

```bash
# 1. Identify conflicted files
git status

# 2. Open conflicted file, resolve conflicts
# Look for markers: <<<<<<<, =======, >>>>>>>

# 3. Mark as resolved
git add force-app/main/default/classes/MyClass.cls

# 4. Complete merge
git commit -m "Resolve merge conflict in MyClass"

# 5. Push
git push origin feature-branch
```

---

### Error: `Permission denied (publickey)`

**Full Message:**
```
git@gitlab.com: Permission denied (publickey).
fatal: Could not read from remote repository.
```

**Cause:** SSH key not configured or not added to GitLab.

**Solution:**

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@company.com"

# Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitLab: Settings → SSH Keys → Add new key
```

For CI/CD pipelines:
```yaml
before_script:
  # Use deploy key or HTTPS with token
  - git remote set-url origin https://gitlab-ci-token:${CI_JOB_TOKEN}@gitlab.com/company/project.git
```

---

## Error Decision Tree

When you encounter an error, follow this decision tree:

```
Error occurred
│
├─ Is it an authentication error?
│  ├─ Yes → Check Authentication Errors section
│  └─ No → Continue
│
├─ Is it a deployment error?
│  ├─ Yes → Check Deployment Errors section
│  └─ No → Continue
│
├─ Is it a test failure?
│  ├─ Yes → Check Test Execution Errors section
│  └─ No → Continue
│
├─ Is it a pipeline/CI error?
│  ├─ Yes → Check Pipeline Errors section
│  └─ No → Continue
│
└─ Is it an Apex runtime error?
   ├─ Yes → Check Apex Runtime Errors section
   └─ No → Check Salesforce debug logs for details
```

## Quick Troubleshooting Commands

**Check org authentication:**
```bash
sf org list
sf org display --target-org prod
```

**Get recent debug logs:**
```bash
sf apex get log --target-org prod --number 5
```

**Validate deployment without deploying:**
```bash
sf project deploy validate \
  --source-dir force-app \
  --target-org prod \
  --test-level RunLocalTests
```

**Check deployment status:**
```bash
sf project deploy report --job-id 0Af...
```

**Query deployment history:**
```bash
sf data query \
  --query "SELECT Id, Status, StartDate, CompletedDate FROM DeployRequest ORDER BY CreatedDate DESC LIMIT 10" \
  --target-org prod
```

**Check test results:**
```bash
sf apex get test --test-run-id 707... --target-org prod
```

## Prevention Strategies

Most errors can be prevented:

**Authentication Errors:**
- Use JWT instead of username/password
- Set up certificate expiration monitoring
- Test authentication in pipeline before deployment

**Deployment Errors:**
- Run `deploy validate` before actual deployment
- Use static code analysis (PMD, Code Analyzer)
- Maintain identical sandbox for pre-production testing

**Test Errors:**
- Follow bulkification patterns
- Use `Test.startTest()` and `Test.stopTest()` properly
- Test with realistic data volumes (200+ records)

**Pipeline Errors:**
- Pin dependencies to specific versions
- Use Docker images for consistent environments
- Test pipeline changes in feature branches first

**Apex Errors:**
- Always check for null before dereferencing
- Use collections instead of SOQL in loops
- Bulkify all DML operations

## Additional Resources

- [Salesforce Error Codes](https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_calls_concepts_core_data_objects.htm)
- [Apex Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)

## Contributing to This Guide

Encountered an error not listed here? Add it!

**Template for new errors:**

```markdown
### Error: `Error Title`

**Full Message:**
```
Exact error message here
```

**Cause:** Why this error occurs

**Solution:**
Step-by-step fix with code examples
```

---

**This guide is a living document. Update it as you encounter and solve new errors.**
