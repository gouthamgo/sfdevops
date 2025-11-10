# Post-Deployment Validation

## The Deploy and Pray Anti-Pattern

Here's how not to deploy to production:

```yaml
deploy:
  script:
    - sf project deploy start --target-org prod
    - echo "✓ Deployment complete!"
```

Then you walk away. Open Slack. Maybe grab coffee.

Five minutes later: "Why is the checkout page broken?" "Why are customers getting error emails?" "Did we just deploy something?"

**The problem**: Deployment succeeding doesn't mean your application is working.

Salesforce might accept your metadata. The deployment might show green. But users might be experiencing:
- Broken flows
- Failed integrations
- Missing data
- Permission errors
- Performance degradation

We need to verify that deployments actually work from the user's perspective. Let's build comprehensive post-deployment validation.

## What Are We Validating?

Post-deployment validation answers these questions:

**Functional Validation**
- Do critical user flows still work?
- Can users complete key transactions?
- Are integrations sending/receiving data?

**Data Validation**
- Is data still accessible?
- Are calculations producing correct results?
- Did migration scripts complete?

**Performance Validation**
- Are pages loading within acceptable time?
- Are batch jobs completing on schedule?
- Are API calls responding quickly?

**Integration Validation**
- Are external systems reachable?
- Are webhooks firing correctly?
- Is data syncing between systems?

Let's build validation for each category.

## Smoke Tests: The First Line of Defense

Smoke tests are quick, shallow tests that verify basic functionality. They answer: "Is the system fundamentally broken?"

### Creating a Smoke Test Suite

**1. Apex Smoke Tests**

Create `tests/smoke/SmokeTests.cls`:

```java
@IsTest
public class SmokeTests {

    /**
     * Verify we can query critical objects
     */
    @IsTest
    static void testDatabaseConnectivity() {
        Test.startTest();

        // Query each critical object
        Integer accountCount = [SELECT COUNT() FROM Account];
        Integer opportunityCount = [SELECT COUNT() FROM Opportunity];
        Integer contactCount = [SELECT COUNT() FROM Contact];

        Test.stopTest();

        // We don't care about exact counts, just that queries work
        System.assert(accountCount >= 0, 'Cannot query Accounts');
        System.assert(opportunityCount >= 0, 'Cannot query Opportunities');
        System.assert(contactCount >= 0, 'Cannot query Contacts');
    }

    /**
     * Verify critical API endpoints are accessible
     */
    @IsTest
    static void testAPIEndpoints() {
        Test.startTest();
        Test.setMock(HttpCalloutMock.class, new SmokeTestMock());

        // Test critical integrations
        HttpResponse res = IntegrationService.callPaymentGateway();
        System.assertEquals(200, res.getStatusCode(), 'Payment gateway unreachable');

        res = IntegrationService.callInventorySystem();
        System.assertEquals(200, res.getStatusCode(), 'Inventory system unreachable');

        Test.stopTest();
    }

    /**
     * Verify critical Flows are active
     */
    @IsTest
    static void testCriticalFlows() {
        List<Flow> flows = [
            SELECT Status, VersionNumber
            FROM Flow
            WHERE ApiName IN ('Order_Processing_Flow', 'Lead_Assignment_Flow')
            AND Status = 'Active'
        ];

        System.assertEquals(2, flows.size(), 'Critical flows are not active');
    }

    /**
     * Verify validation rules can be evaluated
     */
    @IsTest
    static void testValidationRules() {
        Test.startTest();

        Account acc = new Account(Name = 'Test');
        insert acc;

        // Try to violate a validation rule
        acc.Industry = null;  // Assuming Industry is required
        try {
            update acc;
            System.assert(false, 'Validation rule did not fire');
        } catch (DmlException e) {
            System.assert(e.getMessage().contains('Required'), 'Unexpected validation error');
        }

        Test.stopTest();
    }
}

@IsTest
class SmokeTestMock implements HttpCalloutMock {
    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(200);
        res.setBody('{"status": "ok"}');
        return res;
    }
}
```

**2. Run Smoke Tests in Pipeline**

```yaml
deploy_to_production:
  stage: deploy
  script:
    - sf project deploy start --target-org prod --wait 30

smoke_tests:
  stage: validate
  needs: [deploy_to_production]
  script:
    # Run smoke test suite
    - sf apex run test
        --class-names SmokeTests
        --target-org prod
        --result-format human
        --code-coverage
        --wait 10

    # Check results
    - |
      if [ $? -ne 0 ]; then
        echo "❌ Smoke tests failed!"
        echo "Initiating rollback..."
        exit 1
      fi

    - echo "✅ Smoke tests passed"
```

**3. Custom Smoke Test Script**

Sometimes you need to test things Apex can't reach. Create `scripts/smoke-tests.sh`:

```bash
#!/bin/bash
set -e

TARGET_ORG=${1:-prod}
echo "Running smoke tests against $TARGET_ORG..."

# Test 1: Health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(sf data query \
  --query "SELECT COUNT() FROM Account LIMIT 1" \
  --target-org $TARGET_ORG \
  --json | jq -r '.result.records[0].expr0')

if [ "$HEALTH_RESPONSE" -lt 0 ]; then
  echo "❌ Health check failed"
  exit 1
fi
echo "✅ Health check passed"

# Test 2: Can create and delete a test record
echo "Testing data operations..."
RECORD_ID=$(sf data create record \
  --sobject Account \
  --values "Name='Smoke Test ${RANDOM}'" \
  --target-org $TARGET_ORG \
  --json | jq -r '.result.id')

if [ -z "$RECORD_ID" ]; then
  echo "❌ Record creation failed"
  exit 1
fi

sf data delete record \
  --sobject Account \
  --record-id $RECORD_ID \
  --target-org $TARGET_ORG

echo "✅ Data operations passed"

# Test 3: Verify critical users can login (JWT auth test)
echo "Testing authentication..."
sf org display --target-org $TARGET_ORG > /dev/null
echo "✅ Authentication passed"

# Test 4: Check recent errors in logs
echo "Checking for recent errors..."
ERROR_COUNT=$(sf apex get log \
  --target-org $TARGET_ORG \
  --number 5 \
  --json | jq '[.result[] | select(.Operation | contains("ERROR"))] | length')

if [ "$ERROR_COUNT" -gt 10 ]; then
  echo "⚠️  Warning: $ERROR_COUNT recent errors detected"
else
  echo "✅ Error count acceptable ($ERROR_COUNT)"
fi

echo ""
echo "✅ All smoke tests passed!"
```

Add to pipeline:

```yaml
smoke_tests:
  script:
    - chmod +x scripts/smoke-tests.sh
    - ./scripts/smoke-tests.sh prod
```

## Synthetic Transactions

Simulate real user journeys through the system.

### Example: E-Commerce Order Flow

**1. Create Test Data**

```java
@IsTest
public class SyntheticTransactionTest {

    /**
     * Synthetic transaction: Complete order flow
     * Simulates: View product → Add to cart → Checkout → Payment → Confirmation
     */
    @IsTest
    static void testCompleteOrderFlow() {
        // Setup: Create test customer
        Account customer = new Account(
            Name = 'Test Customer',
            Email__c = 'synthetic@test.com'
        );
        insert customer;

        // Setup: Create test product
        Product2 product = new Product2(
            Name = 'Test Product',
            IsActive = true
        );
        insert product;

        Test.startTest();

        // Step 1: Customer views product (simulate page load)
        Long startTime = System.currentTimeMillis();
        Product2 viewedProduct = [
            SELECT Id, Name, Description
            FROM Product2
            WHERE Id = :product.Id
        ];
        Long viewTime = System.currentTimeMillis() - startTime;
        System.assert(viewTime < 1000, 'Product view took too long: ' + viewTime + 'ms');

        // Step 2: Add to cart
        Order__c order = new Order__c(
            Customer__c = customer.Id,
            Status__c = 'Draft'
        );
        insert order;

        OrderItem__c item = new OrderItem__c(
            Order__c = order.Id,
            Product__c = product.Id,
            Quantity__c = 1
        );
        insert item;

        // Step 3: Calculate total (simulate checkout)
        startTime = System.currentTimeMillis();
        OrderCalculator.calculateTotal(order.Id);
        Long calcTime = System.currentTimeMillis() - startTime;
        System.assert(calcTime < 2000, 'Order calculation took too long: ' + calcTime + 'ms');

        // Step 4: Process payment (mock)
        PaymentService.processPayment(order.Id, 'tok_visa');

        // Step 5: Confirm order
        order.Status__c = 'Confirmed';
        update order;

        Test.stopTest();

        // Verify: Order is confirmed
        Order__c confirmedOrder = [
            SELECT Status__c, Total_Amount__c
            FROM Order__c
            WHERE Id = :order.Id
        ];
        System.assertEquals('Confirmed', confirmedOrder.Status__c);
        System.assert(confirmedOrder.Total_Amount__c > 0, 'Order total not calculated');

        // Verify: Inventory updated
        Product2 updatedProduct = [
            SELECT Inventory_Count__c
            FROM Product2
            WHERE Id = :product.Id
        ];
        System.assert(updatedProduct.Inventory_Count__c < 100, 'Inventory not decremented');
    }
}
```

**2. Run Synthetic Tests**

```yaml
synthetic_tests:
  stage: validate
  script:
    - echo "Running synthetic transaction tests..."
    - sf apex run test
        --class-names SyntheticTransactionTest
        --target-org prod
        --result-format json
        --output-dir test-results/

    # Parse results for performance metrics
    - |
      cat test-results/test-result.json | jq '.result.tests[] | {
        name: .FullName,
        outcome: .Outcome,
        time: .RunTime
      }'
```

### Continuous Synthetic Monitoring

Don't just run synthetics after deployments. Run them continuously:

```yaml
# .gitlab-ci.yml
continuous_synthetic_tests:
  stage: monitor
  trigger:
    include: .gitlab/synthetic-tests.yml
  rules:
    - if: '$CI_PIPELINE_SOURCE == "schedule"'  # Run on schedule

# .gitlab/synthetic-tests.yml
synthetic_hourly:
  script:
    - ./scripts/run-synthetic-tests.sh prod
    - ./scripts/report-metrics.sh
  only:
    - schedules
```

## Integration Validation

Verify external systems are working.

### Testing External APIs

```java
@IsTest
public class IntegrationValidationTest {

    @IsTest
    static void testPaymentGatewayIntegration() {
        Test.setMock(HttpCalloutMock.class, new PaymentGatewayMock());

        Test.startTest();

        // Call payment gateway
        HttpResponse res = PaymentService.createToken('4242424242424242');

        Test.stopTest();

        // Verify response
        System.assertEquals(200, res.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        System.assert(body.containsKey('token'));
    }

    @IsTest
    static void testInventorySystemIntegration() {
        Test.setMock(HttpCalloutMock.class, new InventorySystemMock());

        Test.startTest();

        // Query inventory
        Integer stock = InventoryService.checkStock('PROD-123');

        Test.stopTest();

        System.assert(stock >= 0, 'Invalid stock level');
    }
}
```

### Pipeline Integration Tests

```yaml
integration_tests:
  stage: validate
  script:
    # Test actual external services (not mocks)
    - |
      echo "Testing payment gateway..."
      RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $PAYMENT_API_KEY" \
        https://api.stripe.com/v1/tokens)

      if [ "$RESPONSE" != "401" ] && [ "$RESPONSE" != "200" ]; then
        echo "❌ Payment gateway unreachable"
        exit 1
      fi

    - |
      echo "Testing inventory API..."
      RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "API-Key: $INVENTORY_API_KEY" \
        https://api.inventory.company.com/health)

      if [ "$RESPONSE" != "200" ]; then
        echo "❌ Inventory API unreachable"
        exit 1
      fi

    - echo "✅ All integrations responsive"
```

## Performance Validation

Ensure deployment didn't degrade performance.

### Response Time Checks

```bash
#!/bin/bash
# scripts/performance-validation.sh

TARGET_ORG=$1
THRESHOLD_MS=2000  # Max acceptable response time

echo "Running performance validation..."

# Test 1: Query performance
START=$(date +%s%N)
sf data query \
  --query "SELECT Id, Name FROM Account LIMIT 100" \
  --target-org $TARGET_ORG > /dev/null
END=$(date +%s%N)

DURATION=$(( (END - START) / 1000000 ))  # Convert to milliseconds

echo "Query performance: ${DURATION}ms"

if [ $DURATION -gt $THRESHOLD_MS ]; then
  echo "❌ Query performance degraded (threshold: ${THRESHOLD_MS}ms)"
  exit 1
fi

# Test 2: Apex execution performance
START=$(date +%s%N)
sf apex run \
  --file tests/performance-test.apex \
  --target-org $TARGET_ORG > /dev/null
END=$(date +%s%N)

DURATION=$(( (END - START) / 1000000 ))

echo "Apex execution: ${DURATION}ms"

if [ $DURATION -gt $THRESHOLD_MS ]; then
  echo "❌ Apex performance degraded"
  exit 1
fi

echo "✅ Performance within acceptable limits"
```

### Comparing Before/After Metrics

```yaml
performance_baseline:
  stage: pre-deploy
  script:
    - ./scripts/capture-performance-baseline.sh prod > baseline.json
  artifacts:
    paths:
      - baseline.json

deploy:
  stage: deploy
  script:
    - sf project deploy start --target-org prod

performance_validation:
  stage: validate
  needs: [deploy, performance_baseline]
  script:
    - ./scripts/capture-performance-baseline.sh prod > current.json
    - ./scripts/compare-performance.sh baseline.json current.json
```

**`scripts/compare-performance.sh`:**

```bash
#!/bin/bash

BASELINE=$1
CURRENT=$2
THRESHOLD_PERCENT=20  # Alert if >20% slower

BASELINE_TIME=$(jq '.average_response_time' $BASELINE)
CURRENT_TIME=$(jq '.average_response_time' $CURRENT)

INCREASE=$(echo "scale=2; (($CURRENT_TIME - $BASELINE_TIME) / $BASELINE_TIME) * 100" | bc)

echo "Baseline: ${BASELINE_TIME}ms"
echo "Current:  ${CURRENT_TIME}ms"
echo "Change:   ${INCREASE}%"

if (( $(echo "$INCREASE > $THRESHOLD_PERCENT" | bc -l) )); then
  echo "❌ Performance degraded by ${INCREASE}%"
  exit 1
fi

echo "✅ Performance acceptable"
```

## Data Validation

Verify data integrity after deployment.

### Row Count Validation

```sql
-- Before deployment: Capture counts
SELECT 'Accounts' AS Object_Type, COUNT(*) AS Record_Count FROM Account
UNION ALL
SELECT 'Opportunities', COUNT(*) FROM Opportunity
UNION ALL
SELECT 'Contacts', COUNT(*) FROM Contact;
```

```yaml
data_validation:
  stage: validate
  script:
    # Compare record counts before/after
    - |
      BEFORE_ACCOUNTS=$(cat data-baseline.json | jq '.accounts')
      AFTER_ACCOUNTS=$(sf data query \
        --query "SELECT COUNT() FROM Account" \
        --target-org prod \
        --json | jq '.result.records[0].expr0')

      DIFF=$((AFTER_ACCOUNTS - BEFORE_ACCOUNTS))

      echo "Account records: Before=$BEFORE_ACCOUNTS, After=$AFTER_ACCOUNTS, Diff=$DIFF"

      # Alert if significant change (> 5%)
      THRESHOLD=$(echo "$BEFORE_ACCOUNTS * 0.05" | bc | cut -d. -f1)
      if [ ${DIFF#-} -gt $THRESHOLD ]; then
        echo "⚠️  Warning: Significant change in Account records"
      fi
```

### Data Quality Checks

```java
@IsTest
public class DataQualityValidation {

    @IsTest
    static void validateRequiredFieldsPopulated() {
        // Check critical fields are not null
        List<Account> accountsWithMissingData = [
            SELECT Id, Name
            FROM Account
            WHERE BillingCountry = null
            OR Industry = null
            LIMIT 10
        ];

        System.assert(
            accountsWithMissingData.isEmpty(),
            'Found accounts with missing required data: ' + accountsWithMissingData.size()
        );
    }

    @IsTest
    static void validateDataConsistency() {
        // Check referential integrity
        List<Opportunity> orphanedOpps = [
            SELECT Id, Name
            FROM Opportunity
            WHERE AccountId = null
            LIMIT 10
        ];

        System.assert(
            orphanedOpps.isEmpty(),
            'Found opportunities without accounts'
        );
    }
}
```

## Automated Rollback on Failure

If validation fails, automatically roll back:

```yaml
deploy:
  stage: deploy
  script:
    # Capture deployment ID
    - |
      DEPLOY_OUTPUT=$(sf project deploy start --target-org prod --json)
      DEPLOY_ID=$(echo $DEPLOY_OUTPUT | jq -r '.result.id')
      echo "DEPLOY_ID=$DEPLOY_ID" > deploy.env
  artifacts:
    reports:
      dotenv: deploy.env

validation:
  stage: validate
  needs: [deploy]
  script:
    - ./scripts/smoke-tests.sh prod
    - ./scripts/integration-tests.sh prod
    - ./scripts/performance-validation.sh prod
    - ./scripts/data-validation.sh prod

auto_rollback:
  stage: rollback
  when: on_failure
  needs: [validation]
  script:
    - echo "Validation failed. Rolling back deployment $DEPLOY_ID..."
    - sf project deploy cancel --job-id $DEPLOY_ID --target-org prod || true
    - sf project deploy quick --use-most-recent --target-org prod

    # Notify team
    - |
      curl -X POST $SLACK_WEBHOOK_URL \
        -H 'Content-Type: application/json' \
        -d '{
          "text": "🚨 Production deployment rolled back due to validation failures",
          "attachments": [{
            "color": "danger",
            "fields": [{
              "title": "Pipeline",
              "value": "'"$CI_PIPELINE_URL"'"
            }]
          }]
        }'
```

## Monitoring and Alerting

Set up continuous monitoring post-deployment:

### CloudWatch-Style Monitoring

```yaml
post_deploy_monitoring:
  stage: monitor
  script:
    - echo "Monitoring system for 10 minutes post-deployment..."
    - |
      for i in {1..20}; do  # 20 checks over 10 minutes
        echo "Check $i/20..."

        # Run health checks
        ./scripts/smoke-tests.sh prod || {
          echo "❌ Health check failed!"
          # Trigger alert
          ./scripts/alert-team.sh "Post-deployment health check failure"
          exit 1
        }

        sleep 30  # Wait 30 seconds
      done

    - echo "✅ 10-minute monitoring complete. System stable."
```

### Error Rate Monitoring

```bash
#!/bin/bash
# scripts/monitor-error-rate.sh

TARGET_ORG=$1
DURATION_MINUTES=10
THRESHOLD_ERRORS=50

echo "Monitoring error rate for $DURATION_MINUTES minutes..."

START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sleep $(($DURATION_MINUTES * 60))
END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Query debug logs for errors
ERROR_COUNT=$(sf apex get log \
  --target-org $TARGET_ORG \
  --json | jq '[.result[] | select(.Operation | contains("ERROR"))] | length')

echo "Errors in last $DURATION_MINUTES minutes: $ERROR_COUNT"

if [ $ERROR_COUNT -gt $THRESHOLD_ERRORS ]; then
  echo "❌ Error rate exceeded threshold ($THRESHOLD_ERRORS)"
  exit 1
fi

echo "✅ Error rate acceptable"
```

## Comprehensive Validation Pipeline

Putting it all together:

```yaml
stages:
  - pre-deploy
  - deploy
  - validate-smoke
  - validate-integration
  - validate-performance
  - validate-data
  - monitor
  - rollback

# Capture baseline metrics
capture_baseline:
  stage: pre-deploy
  script:
    - ./scripts/capture-baseline.sh prod
  artifacts:
    paths:
      - baseline/

# Deploy
deploy_production:
  stage: deploy
  script:
    - sf project deploy start --target-org prod
  environment:
    name: production
    url: https://company.my.salesforce.com

# Level 1: Smoke tests (fast, critical)
smoke_tests:
  stage: validate-smoke
  needs: [deploy_production]
  script:
    - ./scripts/smoke-tests.sh prod
  timeout: 5m

# Level 2: Integration tests
integration_tests:
  stage: validate-integration
  needs: [smoke_tests]
  script:
    - ./scripts/integration-tests.sh prod
  timeout: 10m

# Level 3: Performance validation
performance_tests:
  stage: validate-performance
  needs: [smoke_tests]
  script:
    - ./scripts/performance-validation.sh prod
    - ./scripts/compare-performance.sh baseline/ current/
  timeout: 10m

# Level 4: Data validation
data_validation:
  stage: validate-data
  needs: [smoke_tests]
  script:
    - ./scripts/data-validation.sh prod
  timeout: 5m

# Level 5: Extended monitoring
extended_monitoring:
  stage: monitor
  needs: [integration_tests, performance_tests, data_validation]
  script:
    - ./scripts/monitor-error-rate.sh prod 10
  timeout: 15m

# Automatic rollback if any validation fails
rollback_on_failure:
  stage: rollback
  when: on_failure
  script:
    - echo "❌ Validation failed. Initiating rollback..."
    - sf project deploy quick --use-most-recent --target-org prod
    - ./scripts/alert-team.sh "Production deployment rolled back"
```

## Hands-On Exercise: Build a Validation Suite

**Objective**: Create a comprehensive post-deployment validation suite for a sample application.

**Your Tasks**:

1. Create smoke tests covering:
   - Database connectivity
   - Critical flows are active
   - API endpoints respond

2. Create a synthetic transaction test for your most critical user journey

3. Write integration tests for at least two external services

4. Implement performance validation with baseline comparison

5. Create automated rollback on validation failure

**Deliverables**:

- [ ] Apex smoke test class with at least 5 test methods
- [ ] Synthetic transaction test for end-to-end user flow
- [ ] Shell script for integration validation
- [ ] Performance validation with threshold checks
- [ ] Pipeline YAML with all validation stages
- [ ] Automated rollback configuration

**You'll know you succeeded when**:
- Smoke tests run in under 5 minutes
- Validation catches at least one deliberately introduced bug
- Performance degradation is detected and measured
- Rollback triggers automatically on failure
- All validation results are captured in pipeline logs

## Validation Checklist

Before considering a deployment complete:

- [ ] Smoke tests passed (database, APIs, flows)
- [ ] Synthetic transaction tests passed (critical user journeys)
- [ ] Integration tests passed (external services responding)
- [ ] Performance within acceptable thresholds
- [ ] Data integrity validated (row counts, referential integrity)
- [ ] Error rate within normal range
- [ ] Monitoring active for post-deployment period
- [ ] Rollback procedure tested and ready
- [ ] Team notified of deployment status

## What We Learned

Post-deployment validation transforms deployments from "hope it works" to "verify it works":

1. **Smoke tests**: Fast, shallow checks for critical functionality
2. **Synthetic transactions**: Simulate real user journeys end-to-end
3. **Integration validation**: Verify external systems are reachable
4. **Performance validation**: Ensure no degradation
5. **Data validation**: Confirm data integrity maintained
6. **Continuous monitoring**: Watch for issues in the hours after deployment
7. **Automated rollback**: Quick recovery when validation fails

With comprehensive validation, you deploy with confidence. You know within minutes if something is wrong, not hours later when users report issues.

## What's Next

You can now deploy safely and validate thoroughly. But how do you measure success? How do you know if your DevOps process is improving?

Next: **DevOps Metrics and KPIs**.

You'll learn:
- DORA metrics (deployment frequency, lead time, MTTR, change failure rate)
- How to instrument your pipeline for metrics collection
- Creating dashboards to visualize DevOps performance
- Using metrics to drive continuous improvement

See you there!
