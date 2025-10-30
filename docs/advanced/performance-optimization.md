# Performance Optimization for Large Deployments

**Learning Objective**: Optimize CI/CD pipelines for large-scale Salesforce orgs with thousands of components and complex dependency chains.

## Overview

As Salesforce orgs grow, deployments slow down. Tests take longer, dependencies multiply, and feedback cycles extend. This guide shows you how to optimize every stage of your CI/CD pipeline for maximum performance.

## Deployment Performance Metrics

### Key Metrics to Track

```yaml
- name: Measure Deployment Performance
  run: |
    START_TIME=$SECONDS

    sf project deploy start \
      --target-org target-org \
      --manifest manifest/package.xml \
      --wait 60

    DEPLOY_TIME=$((SECONDS - START_TIME))

    echo "deployment_duration_seconds=$DEPLOY_TIME" >> $GITHUB_OUTPUT
    echo "Deployment took ${DEPLOY_TIME} seconds" >> $GITHUB_STEP_SUMMARY
```

**Target Metrics**:
- Deployment time: < 15 minutes
- Test execution: < 10 minutes
- Total pipeline: < 30 minutes
- PR feedback: < 5 minutes

## Delta Deployments

### Deploy Only Changes

```yaml
- name: Generate Delta Package
  run: |
    npm install -g sfdx-git-delta

    # Generate delta between commits
    sfdx sgd:source:delta \
      --from "${{ github.event.before }}" \
      --to "${{ github.sha }}" \
      --output delta \
      --generate-delta \
      --source force-app

    # Show what changed
    echo "### Delta Package Contents" >> $GITHUB_STEP_SUMMARY
    cat delta/package/package.xml >> $GITHUB_STEP_SUMMARY

- name: Deploy Delta Only
  run: |
    # Deploy only changed components
    sf project deploy start \
      --target-org target-org \
      --manifest delta/package/package.xml \
      --test-level RunSpecifiedTests \
      --tests $(bash scripts/find_affected_tests.sh delta/package/package.xml) \
      --wait 30
```

**Performance Gain**: 60-80% faster for incremental changes

## Parallel Test Execution

### Test Splitting

```yaml
strategy:
  matrix:
    test-suite:
      - AccountTests
      - OpportunityTests
      - ContactTests
      - CustomTests

steps:
  - name: Run Test Suite
    run: |
      sf apex run test \
        --target-org target-org \
        --tests ${{ matrix.test-suite }} \
        --result-format json \
        --wait 20
```

### Concurrent Deployments

```yaml
jobs:
  deploy-metadata:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Metadata
        run: sf project deploy start --metadata ApexClass,ApexTrigger

  deploy-config:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Config
        run: sf project deploy start --metadata Layout,PermissionSet
```

## Caching Strategies

### Dependency Caching

```yaml
- name: Cache Node Modules
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

- name: Cache SF CLI
  uses: actions/cache@v3
  with:
    path: ~/.local/share/sf
    key: ${{ runner.os }}-sfcli-${{ hashFiles('**/sfdx-project.json') }}

- name: Cache Apex PMD
  uses: actions/cache@v3
  with:
    path: ~/.pmd
    key: ${{ runner.os }}-pmd-6.55.0
```

### Build Artifact Caching

```yaml
- name: Cache Build Artifacts
  uses: actions/cache@v3
  with:
    path: |
      lwc/**/*.js
      aura/**/*.js
    key: ${{ runner.os }}-build-${{ hashFiles('force-app/**/*.js') }}
```

**Performance Gain**: 30-50% faster setup time

## Test Optimization

### Selective Test Execution

```bash
#!/bin/bash
# find_affected_tests.sh - Run only tests for changed components

CHANGED_FILES=$(git diff --name-only origin/main...HEAD)

TEST_CLASSES=()

for file in $CHANGED_FILES; do
  if [[ $file == *.cls ]]; then
    CLASS_NAME=$(basename "$file" .cls)

    # Add direct test class
    if [ -f "force-app/main/default/classes/${CLASS_NAME}Test.cls" ]; then
      TEST_CLASSES+=("${CLASS_NAME}Test")
    fi

    # Find classes that reference this class
    grep -r "new $CLASS_NAME" force-app --include="*Test.cls" | \
      cut -d: -f1 | \
      xargs -I {} basename {} .cls | \
      while read test; do
        TEST_CLASSES+=("$test")
      done
  fi
done

# Output comma-separated list
IFS=','
echo "${TEST_CLASSES[*]}"
```

### Test Data Optimization

```apex
@isTest
public class OptimizedTest {

    // Use @TestSetup for shared data
    @TestSetup
    static void setupTestData() {
        // Created once, used by all test methods
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 200; i++) {
            accounts.add(new Account(Name = 'Test ' + i));
        }
        insert accounts;
    }

    @isTest
    static void testMethod1() {
        // Reuse test data
        List<Account> accounts = [SELECT Id FROM Account];
        // Test logic
    }
}
```

**Performance Gain**: 40-60% faster test execution

## Deployment Optimization

### Quick Deploy

```yaml
- name: Validation Deploy
  id: validate
  run: |
    sf project deploy validate \
      --target-org production \
      --manifest manifest/package.xml \
      --test-level RunLocalTests \
      --wait 60 \
      --json > validate-result.json

    DEPLOY_ID=$(jq -r '.result.id' validate-result.json)
    echo "deploy_id=$DEPLOY_ID" >> $GITHUB_OUTPUT

- name: Quick Deploy (if validated)
  run: |
    # Use validated deploy ID for instant deployment
    sf project deploy quick \
      --job-id ${{ steps.validate.outputs.deploy_id }} \
      --target-org production \
      --wait 10
```

**Performance Gain**: Near-instant deployment (no re-running tests)

### Deployment Pipelining

```yaml
jobs:
  deploy-phase-1:
    steps:
      - name: Deploy Foundation
        run: sf project deploy start --manifest phase1-package.xml

  deploy-phase-2:
    needs: deploy-phase-1
    steps:
      - name: Deploy Business Logic
        run: sf project deploy start --manifest phase2-package.xml

  deploy-phase-3:
    needs: deploy-phase-2
    steps:
      - name: Deploy UI
        run: sf project deploy start --manifest phase3-package.xml
```

## Code Analysis Optimization

### Incremental Scanning

```yaml
- name: Scan Changed Files Only
  run: |
    CHANGED_FILES=$(git diff --name-only origin/main...HEAD | grep "\.cls$" | tr '\n' ',')

    if [ -n "$CHANGED_FILES" ]; then
      sf scanner run \
        --target "$CHANGED_FILES" \
        --format json \
        --outfile scan-results.json
    else
      echo "No Apex files changed, skipping scan"
    fi
```

### Parallel Scanning

```yaml
- name: Run PMD
  run: pmd check --dir force-app/main/default/classes --format json &

- name: Run ESLint
  run: npm run lint -- --format json &

- name: Run Security Scan
  run: sf scanner run --target force-app --format json &

- name: Wait for All Scans
  run: wait
```

## Infrastructure Optimization

### Self-Hosted Runners with SSD

```yaml
# Use runners with fast SSD for better I/O
runs-on: [self-hosted, ssd, high-memory]
```

### Resource Allocation

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest-8-cores  # Use more CPU for parallel operations
    env:
      NODE_OPTIONS: --max-old-space-size=8192  # Increase memory for Node.js
```

## Build Optimization

### Minimize Checkout

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 1  # Shallow clone
    sparse-checkout: |
      force-app
      manifest
```

### Skip Unnecessary Steps

```yaml
- name: Deploy
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: # Only deploy on main branch pushes
```

## Monitoring and Profiling

### Track Pipeline Performance

```yaml
- name: Record Metrics
  if: always()
  run: |
    cat > metrics.json << EOF
    {
      "pipeline_duration": $SECONDS,
      "deployment_time": $DEPLOY_TIME,
      "test_time": $TEST_TIME,
      "branch": "${{ github.ref_name }}",
      "commit": "${{ github.sha }}"
    }
    EOF

    # Send to monitoring system
    curl -X POST https://metrics.company.com/api/pipelines \
      -H "Content-Type: application/json" \
      -d @metrics.json
```

### Performance Dashboard

```yaml
# Generate performance report
- name: Generate Performance Report
  run: |
    echo "### ⚡ Performance Metrics" >> $GITHUB_STEP_SUMMARY
    echo "" >> $GITHUB_STEP_SUMMARY
    echo "| Metric | Time | Target |" >> $GITHUB_STEP_SUMMARY
    echo "|--------|------|--------|" >> $GITHUB_STEP_SUMMARY
    echo "| Checkout | ${CHECKOUT_TIME}s | <30s |" >> $GITHUB_STEP_SUMMARY
    echo "| Build | ${BUILD_TIME}s | <60s |" >> $GITHUB_STEP_SUMMARY
    echo "| Tests | ${TEST_TIME}s | <600s |" >> $GITHUB_STEP_SUMMARY
    echo "| Deploy | ${DEPLOY_TIME}s | <900s |" >> $GITHUB_STEP_SUMMARY
    echo "| **Total** | **${SECONDS}s** | **<1800s** |" >> $GITHUB_STEP_SUMMARY
```

## Best Practices

### 1. Optimize Critical Path

Focus optimization efforts on:
1. Test execution (usually the bottleneck)
2. Deployment validation
3. Dependency resolution

### 2. Measure Before Optimizing

```yaml
# Baseline measurement
- name: Baseline Performance
  run: |
    time sf project deploy start ...
    time sf apex run test ...
```

### 3. Progressive Optimization

Start with:
- Delta deployments
- Test caching
- Parallel execution

Then add:
- Custom runners
- Advanced caching
- Build optimization

## Interview Talking Points

1. **"We use delta deployments to deploy only changed components"**
   - Shows performance awareness
   - Demonstrates efficiency focus

2. **"We run tests in parallel across multiple runners"**
   - Shows scalability thinking
   - Demonstrates advanced CI/CD knowledge

3. **"We use quick deploy to avoid re-running tests"**
   - Shows Salesforce-specific expertise
   - Demonstrates production optimization

4. **"We track pipeline performance metrics over time"**
   - Shows data-driven approach
   - Demonstrates continuous improvement mindset

5. **"We optimized our pipeline from 45 minutes to 12 minutes"**
   - Shows concrete impact
   - Demonstrates problem-solving ability

## Next Steps

- **Related**: [Custom Runners & Docker](./custom-runners-docker) - Infrastructure optimization
- **Related**: [Monitoring & Improvement](./monitoring-improvement) - Track performance trends
- **Related**: [Complex Org Strategies](./complex-org-strategies) - Packaging for faster deployments

---

**Key Takeaway**: Performance optimization is iterative. Measure, identify bottlenecks, optimize, and repeat. Focus on the critical path and use caching aggressively. A 10x improvement often comes from 10 small 25% improvements.
