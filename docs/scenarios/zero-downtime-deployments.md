# Zero-Downtime Deployments

## The Million-Dollar Question

Your CEO walks into the engineering all-hands and asks: "Why do we need maintenance windows? Netflix doesn't shut down for deployments. Neither does Salesforce itself. Why can't we deploy whenever we want without anyone noticing?"

It's a fair question. And the answer isn't "because it's hard" or "because we've always done it this way."

The answer should be: "We can. Let me show you how."

Zero-downtime deployments mean deploying new code to production while users continue working, completely unaware that anything changed. No maintenance windows. No "please save your work" messages. No midnight deploys.

Let's build this capability.

## Understanding the Problem

Before we solve it, let's understand why deployments traditionally require downtime.

### Breaking Changes

You deploy a new version of an Apex class. The old version had a method `calculateDiscount(Decimal amount)`. The new version changed the signature to `calculateDiscount(Decimal amount, String customerType)`.

For a few seconds during deployment, you have:
- Old code calling the new method with one parameter → Error
- New code calling what it thinks is the new method → Error

Result: Your discount calculation breaks for every transaction during deployment. Revenue impact: immediate.

### Data Migration

You renamed a field from `Customer_Segment__c` to `Customer_Type__c`. During deployment:
- Old code writes to `Customer_Segment__c`
- New code reads from `Customer_Type__c`
- Result: Data inconsistency and errors

### Partial Deployment State

Salesforce deployments aren't atomic at the user-facing level. While metadata deploys as a transaction, there's a window where:
- Some users hit cached old pages
- Some users hit new pages
- Some components are updated, others aren't
- Results: Confusing errors and inconsistent behavior

These problems are real. But they're all solvable.

## Core Principles

Zero-downtime deployment strategies all follow these principles:

**1. Backward Compatibility**

New code must work with old data and old code must work with new data. There's always a transition period.

**2. Incremental Changes**

Deploy in small, safe steps. Not "replace everything at once."

**3. Feature Flags**

Deploy code in an "off" state. Turn it on when you're ready.

**4. Parallel Running**

Run old and new systems simultaneously until you're confident.

**5. Fast Rollback**

If something goes wrong, rolling back should be instant.

## Strategy 1: Backward-Compatible Deployments

The simplest approach: make every change backward compatible.

### Example: Renaming a Field

**Wrong approach:**
```
Deploy 1: Rename field from Customer_Segment__c to Customer_Type__c
Result: Everything breaks immediately
```

**Right approach (3-step deployment):**

**Step 1: Add the new field (keeping the old one)**

```xml
<!-- Customer_Type__c.field-meta.xml -->
<CustomField>
    <fullName>Customer_Type__c</fullName>
    <label>Customer Type</label>
    <type>Text</type>
    <length>50</length>
</CustomField>
```

Deploy this. Old code still uses `Customer_Segment__c`. No impact.

**Step 2: Update code to write to both fields**

```java
// Update your code
public void updateCustomer(Account customer, String type) {
    customer.Customer_Type__c = type;      // New field
    customer.Customer_Segment__c = type;   // Old field (for backward compat)
    update customer;
}

// Update any code that reads the field
public String getCustomerType(Account customer) {
    // Prefer new field, fall back to old field
    if (String.isNotBlank(customer.Customer_Type__c)) {
        return customer.Customer_Type__c;
    }
    return customer.Customer_Segment__c;
}
```

Deploy this. Now we're writing to both fields and reading from the new one (with fallback).

**Step 3: Data migration**

```apex
// Run this in a batch or using Data Loader
List<Account> accounts = [
    SELECT Id, Customer_Segment__c, Customer_Type__c
    FROM Account
    WHERE Customer_Segment__c != null
    AND Customer_Type__c = null
];

for (Account acc : accounts) {
    acc.Customer_Type__c = acc.Customer_Segment__c;
}
update accounts;
```

**Step 4: Remove old field references**

Update code to only use `Customer_Type__c`:

```java
public void updateCustomer(Account customer, String type) {
    customer.Customer_Type__c = type;  // Only new field now
    update customer;
}
```

Deploy this.

**Step 5: Delete old field**

```xml
<!-- destructiveChanges.xml -->
<CustomField>Customer_Segment__c</CustomField>
```

Total: 5 deployments. Zero downtime. Each step is safe and reversible.

### Example: Changing Method Signatures

**Wrong approach:**
```java
// Before
public Decimal calculateDiscount(Decimal amount) { }

// After (breaking change)
public Decimal calculateDiscount(Decimal amount, String customerType) { }
```

**Right approach: Method overloading**

```java
// Keep the old signature
public Decimal calculateDiscount(Decimal amount) {
    // Delegate to new method with default value
    return calculateDiscount(amount, 'STANDARD');
}

// Add new signature
public Decimal calculateDiscount(Decimal amount, String customerType) {
    // New implementation
    if (customerType == 'PREMIUM') {
        return amount * 0.15;
    }
    return amount * 0.10;
}
```

Deploy this. Old code calling the one-parameter version? Works. New code calling two-parameter version? Works.

Later, when all code is updated, mark the old method as deprecated:

```java
/**
 * @deprecated Use calculateDiscount(Decimal, String) instead
 */
public Decimal calculateDiscount(Decimal amount) {
    return calculateDiscount(amount, 'STANDARD');
}
```

Eventually remove it in a future deployment.

## Strategy 2: Feature Flags

Deploy code but keep it disabled until you're ready to activate it.

### Custom Metadata-Based Flags

Create a custom metadata type for feature flags:

```xml
<!-- Feature_Flag__mdt -->
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Feature Flag</label>
    <pluralLabel>Feature Flags</pluralLabel>

    <fields>
        <fullName>Enabled__c</fullName>
        <type>Checkbox</type>
        <defaultValue>false</defaultValue>
    </fields>

    <fields>
        <fullName>Rollout_Percentage__c</fullName>
        <type>Number</type>
        <precision>5</precision>
        <scale>2</scale>
        <defaultValue>0</defaultValue>
    </fields>
</CustomObject>
```

Create feature flag records:

```
New_Discount_Logic | Enabled: false | Rollout: 0%
Enhanced_Search    | Enabled: false | Rollout: 0%
```

### Using Feature Flags in Code

```java
public class DiscountCalculator {

    private static Boolean isFeatureEnabled(String featureName) {
        Feature_Flag__mdt flag = Feature_Flag__mdt.getInstance(featureName);
        if (flag == null) {
            return false;  // Feature not found = disabled
        }
        return flag.Enabled__c;
    }

    public static Decimal calculateDiscount(Decimal amount, String customerType) {
        if (isFeatureEnabled('New_Discount_Logic')) {
            return calculateDiscountNew(amount, customerType);
        } else {
            return calculateDiscountOld(amount, customerType);
        }
    }

    private static Decimal calculateDiscountNew(Decimal amount, String customerType) {
        // New logic here
        return amount * 0.20;
    }

    private static Decimal calculateDiscountOld(Decimal amount, String customerType) {
        // Old, proven logic
        return amount * 0.10;
    }
}
```

### Deployment Process with Feature Flags

**Step 1: Deploy code with feature disabled**

```yaml
deploy:
  script:
    # Deploy new code
    - sf project deploy start --target-org prod

    # Verify feature flag is OFF
    - sf data query --query
      "SELECT Enabled__c FROM Feature_Flag__mdt
       WHERE DeveloperName = 'New_Discount_Logic'"
      --target-org prod
```

At this point:
- New code is deployed
- Feature flag is OFF
- All users get old behavior
- Zero risk

**Step 2: Enable for internal testing**

Update the feature flag record to enable for specific users:

```java
// Add to feature flag logic
private static Boolean isFeatureEnabled(String featureName) {
    Feature_Flag__mdt flag = Feature_Flag__mdt.getInstance(featureName);
    if (flag == null) return false;

    if (!flag.Enabled__c) return false;

    // Gradual rollout based on percentage
    if (flag.Rollout_Percentage__c < 100) {
        return isUserInRolloutPercentage(flag.Rollout_Percentage__c);
    }

    return true;
}

private static Boolean isUserInRolloutPercentage(Decimal percentage) {
    // Consistent hash based on user ID
    String userId = UserInfo.getUserId();
    Integer hashValue = Math.abs(userId.hashCode());
    Integer bucket = Math.mod(hashValue, 100);
    return bucket < percentage;
}
```

Now you can:
- Set Rollout_Percentage__c = 10 (10% of users get new feature)
- Set Rollout_Percentage__c = 50 (50% of users)
- Set Rollout_Percentage__c = 100 (everyone)

**Step 3: Monitor and gradually increase**

```yaml
# Deployment pipeline
enable_feature_10_percent:
  stage: rollout
  script:
    - sf data update record --sobject Feature_Flag__mdt
      --where "DeveloperName='New_Discount_Logic'"
      --values "Rollout_Percentage__c=10"
      --target-org prod
  when: manual  # Requires manual approval

monitor_metrics:
  stage: verify
  script:
    # Check error rates
    - ./scripts/check-error-rates.sh
    # Check performance
    - ./scripts/check-performance-metrics.sh
  needs: [enable_feature_10_percent]

enable_feature_50_percent:
  stage: rollout
  script:
    - sf data update record --sobject Feature_Flag__mdt
      --where "DeveloperName='New_Discount_Logic'"
      --values "Rollout_Percentage__c=50"
      --target-org prod
  when: manual
  needs: [monitor_metrics]
```

**Step 4: Full rollout or instant rollback**

If metrics look good:
```yaml
enable_feature_100_percent:
  script:
    - sf data update record --sobject Feature_Flag__mdt
      --where "DeveloperName='New_Discount_Logic'"
      --values "Enabled__c=true, Rollout_Percentage__c=100"
```

If there's a problem:
```yaml
disable_feature:
  script:
    - sf data update record --sobject Feature_Flag__mdt
      --where "DeveloperName='New_Discount_Logic'"
      --values "Enabled__c=false, Rollout_Percentage__c=0"
```

This disables the feature instantly. No code deployment required. No waiting for CI/CD. Instant rollback.

## Strategy 3: Blue-Green Deployments

Run two identical environments. Switch traffic between them instantly.

### The Concept

- **Blue environment**: Currently serving production traffic
- **Green environment**: Receives new deployment

Deploy to green. Test it. When ready, switch all traffic to green. Blue becomes the new standby.

### Salesforce Implementation

Salesforce doesn't have traditional load balancers, but we can simulate this with orgs:

**Setup:**

1. **Production Org (Blue)**: Currently active
2. **Staging Org (Green)**: Receives new deployment
3. **DNS/Custom Domain**: Points to active org

**Deployment Process:**

```yaml
deploy_to_green:
  stage: deploy
  script:
    # Deploy to staging (green)
    - sf project deploy start --target-org staging

    # Run full test suite
    - sf project deploy validate
        --target-org staging
        --test-level RunLocalTests

    # Run smoke tests
    - ./scripts/smoke-tests.sh staging

verify_green:
  stage: verify
  needs: [deploy_to_green]
  script:
    # Manual verification step
    - echo "Staging URL: https://company--staging.sandbox.salesforce.com"
    - echo "Verify the deployment manually"
    - echo "Approve to proceed with cutover"
  when: manual

cutover_to_green:
  stage: cutover
  needs: [verify_green]
  script:
    # Update custom domain to point to staging
    - sf community publish --community-name "CustomerPortal"
      --target-org staging

    # Update integrations to point to new org
    - ./scripts/update-integrations.sh staging

    # Notify team
    - ./scripts/notify-deployment.sh "Cutover complete"
  when: manual

rollback_to_blue:
  stage: rollback
  when: manual
  script:
    # Switch back to production org
    - ./scripts/update-integrations.sh production
    - ./scripts/notify-deployment.sh "Rolled back to previous version"
```

**Limitations in Salesforce:**

True blue-green is challenging in Salesforce because:
- You can't instantly swap orgs behind a URL
- Data diverges between orgs
- Licenses and costs for parallel orgs

Better approach: Use this for pre-production verification, then deploy to production using feature flags.

## Strategy 4: Canary Deployments

Similar to feature flags but more sophisticated: gradually route traffic to new code while monitoring.

### Implementation with Permission Sets

**Step 1: Create canary permission set**

```xml
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Canary Users</label>
    <description>Users testing new features</description>
</PermissionSet>
```

**Step 2: Check permission in code**

```java
public class FeatureAccess {

    public static Boolean isCanaryUser() {
        List<PermissionSetAssignment> assignments = [
            SELECT Id
            FROM PermissionSetAssignment
            WHERE PermissionSet.Name = 'Canary_Users'
            AND AssigneeId = :UserInfo.getUserId()
            LIMIT 1
        ];
        return !assignments.isEmpty();
    }
}

public class OrderProcessor {
    public void processOrder(Order order) {
        if (FeatureAccess.isCanaryUser()) {
            processOrderNewLogic(order);
        } else {
            processOrderOldLogic(order);
        }
    }
}
```

**Step 3: Gradual rollout**

```yaml
canary_phase_1:
  script:
    # Assign to internal team (5 users)
    - sf data create record --sobject PermissionSetAssignment
      --values "PermissionSetId=0PS..., AssigneeId=005..."
  when: manual

canary_phase_2:
  script:
    # Assign to friendly customers (50 users)
    - ./scripts/assign-canary-users.sh friendly-customers.csv
  needs: [canary_phase_1, monitor_canary]

canary_phase_3:
  script:
    # Assign to 10% of users
    - ./scripts/assign-canary-percentage.sh 10
  needs: [canary_phase_2, monitor_canary]

full_rollout:
  script:
    # Remove permission check, enable for everyone
    - ./scripts/remove-canary-checks.sh
    - sf project deploy start --target-org prod
```

## Strategy 5: Database Migrations

Data changes are the trickiest part of zero-downtime deployments.

### Pattern: Expand-Migrate-Contract

**Example: Splitting a field**

You have `Name__c` and want to split it into `First_Name__c` and `Last_Name__c`.

**Phase 1: Expand (add new fields)**

```xml
<CustomField>
    <fullName>First_Name__c</fullName>
    <type>Text</type>
</CustomField>

<CustomField>
    <fullName>Last_Name__c</fullName>
    <type>Text</type>
</CustomField>
```

Deploy. Old code still uses `Name__c`. No impact.

**Phase 2: Migrate (copy data)**

```java
// Batch job to migrate data
global class MigrateNameFieldBatch implements Database.Batchable<SObject> {

    global Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator(
            'SELECT Id, Name__c, First_Name__c, Last_Name__c FROM Contact WHERE First_Name__c = null'
        );
    }

    global void execute(Database.BatchableContext bc, List<Contact> records) {
        for (Contact c : records) {
            if (String.isNotBlank(c.Name__c)) {
                List<String> parts = c.Name__c.split(' ', 2);
                c.First_Name__c = parts.size() > 0 ? parts[0] : '';
                c.Last_Name__c = parts.size() > 1 ? parts[1] : '';
            }
        }
        update records;
    }

    global void finish(Database.BatchableContext bc) {
        System.debug('Migration complete');
    }
}
```

Run the batch job. Old code still works. New fields now have data.

**Phase 3: Update code to write to new fields**

```java
// Update trigger or code
trigger ContactTrigger on Contact (before insert, before update) {
    for (Contact c : Trigger.new) {
        // Write to old field (for backward compatibility)
        if (String.isNotBlank(c.First_Name__c) && String.isNotBlank(c.Last_Name__c)) {
            c.Name__c = c.First_Name__c + ' ' + c.Last_Name__c;
        }
        // New fields are already populated by users/code
    }
}
```

Deploy this. Now new records populate all three fields.

**Phase 4: Update code to read from new fields**

```java
// Update all code that reads Name__c to use First_Name__c and Last_Name__c instead
public String getContactName(Contact c) {
    return c.First_Name__c + ' ' + c.Last_Name__c;
}
```

**Phase 5: Contract (remove old field)**

Once all code is updated and you're confident:

```xml
<!-- destructiveChanges.xml -->
<types>
    <members>Contact.Name__c</members>
    <name>CustomField</name>
</types>
```

Deploy destructive changes. Old field removed.

Total: 5 deployments. Zero downtime. Each step is safe.

## Monitoring During Deployments

Zero-downtime deployments require active monitoring:

### Health Check Endpoints

Create an Apex REST endpoint for health checks:

```java
@RestResource(urlMapping='/health')
global class HealthCheckService {

    @HttpGet
    global static HealthStatus checkHealth() {
        HealthStatus status = new HealthStatus();
        status.timestamp = DateTime.now();
        status.version = getDeployedVersion();
        status.checks = new List<HealthCheck>();

        // Check database connectivity
        try {
            Integer recordCount = [SELECT COUNT() FROM Account LIMIT 1];
            status.checks.add(new HealthCheck('database', 'ok', recordCount + ' records accessible'));
        } catch (Exception e) {
            status.checks.add(new HealthCheck('database', 'error', e.getMessage()));
            status.overall = 'degraded';
        }

        // Check integrations
        // Check feature flags
        // etc.

        return status;
    }

    global class HealthStatus {
        public DateTime timestamp;
        public String version;
        public String overall = 'ok';
        public List<HealthCheck> checks;
    }

    global class HealthCheck {
        public String name;
        public String status;
        public String message;

        public HealthCheck(String name, String status, String message) {
            this.name = name;
            this.status = status;
            this.message = message;
        }
    }
}
```

### Continuous Health Monitoring

```yaml
deploy_to_production:
  stage: deploy
  script:
    - sf project deploy start --target-org prod

monitor_health:
  stage: verify
  needs: [deploy_to_production]
  script:
    - |
      for i in {1..10}; do
        echo "Health check $i/10..."
        curl -H "Authorization: Bearer $SF_ACCESS_TOKEN" \
          https://yourinstance.salesforce.com/services/apexrest/health

        # Check response status
        if [ $? -ne 0 ]; then
          echo "Health check failed!"
          exit 1
        fi

        sleep 30  # Wait 30 seconds between checks
      done
    - echo "All health checks passed"

auto_rollback:
  stage: rollback
  when: on_failure
  needs: [monitor_health]
  script:
    - echo "Health checks failed, rolling back..."
    - sf project deploy quick --use-most-recent --target-org prod
```

## Hands-On Exercise: Implement Zero-Downtime Field Rename

**Scenario**: You need to rename the field `Customer_Segment__c` to `Customer_Tier__c` in production without any downtime.

**Your Tasks**:

1. Plan the deployment phases using expand-migrate-contract pattern
2. Write the code changes needed for each phase
3. Create a data migration script
4. Write a pipeline that implements the phased deployment
5. Include rollback strategy for each phase

**Deliverables**:

- [ ] Deployment plan document (which phases, in what order)
- [ ] Code for backward-compatible reads/writes
- [ ] Batch class for data migration
- [ ] Pipeline YAML with manual gates between phases
- [ ] Rollback procedures for each phase

**You'll know you succeeded when**:
- Your plan has at least 4 distinct phases
- Each phase can be deployed independently
- Each phase has a clear rollback strategy
- No phase breaks existing functionality
- The final phase cleanly removes the old field

**Going Further**:
- Add monitoring between phases
- Implement automated rollback if errors detected
- Create dashboard showing migration progress
- Add feature flag to control which field is used

## Deployment Checklist

Before implementing zero-downtime deployments:

- [ ] All changes are backward compatible
- [ ] Feature flags implemented for risky changes
- [ ] Deployment broken into small, incremental steps
- [ ] Each step can be rolled back independently
- [ ] Health monitoring in place
- [ ] Smoke tests run after each phase
- [ ] Team has tested the rollback procedure
- [ ] Communication plan for stakeholders
- [ ] Documentation updated with new process

## What We Learned

Zero-downtime deployments aren't magic. They're disciplined engineering:

1. **Backward compatibility**: New code works with old data, old code works with new data
2. **Feature flags**: Deploy code in "off" state, enable when ready
3. **Incremental changes**: Multiple small deployments instead of one big bang
4. **Expand-migrate-contract**: Safe pattern for database changes
5. **Monitoring**: Active health checks during and after deployment
6. **Fast rollback**: Instant recovery if something goes wrong

The payoff? Deploy multiple times per day. No maintenance windows. No user impact. This is how modern DevOps teams operate.

## What's Next

You can now deploy without downtime. But how do you know the deployment actually worked? How do you verify that everything is functioning correctly in production?

Next up: **Post-Deployment Validation**.

You'll learn:
- Automated smoke tests
- Production verification strategies
- Monitoring and alerting
- Synthetic transactions
- User acceptance testing in production

See you there!
