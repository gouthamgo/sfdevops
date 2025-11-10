# DevOps Metrics and KPIs

## The Question Every Executive Asks

Your VP of Engineering calls you into their office: "We've invested heavily in DevOps. We have pipelines, we have automation, we have a dedicated team. But how do I know it's working? Show me the ROI."

You could talk about how developers are happier, or how deployments feel smoother. But executives want numbers. Measurable improvements. Trends over time.

This is where DevOps metrics come in. They transform "we're doing DevOps" into "we deploy 10x faster with 50% fewer failures."

Let's build a metrics framework that proves your DevOps program is working.

## The DORA Metrics Framework

The DevOps Research and Assessment (DORA) team studied thousands of organizations and identified four key metrics that separate high performers from everyone else:

**1. Deployment Frequency**
How often do you deploy to production?

**2. Lead Time for Changes**
How long from code commit to production deployment?

**3. Mean Time to Recovery (MTTR)**
How long to restore service after an incident?

**4. Change Failure Rate**
What percentage of deployments cause issues?

These four metrics predict:
- Organizational performance
- Team productivity
- Customer satisfaction
- Profitability

Let's instrument our pipelines to capture these metrics.

## Metric 1: Deployment Frequency

### What It Measures

How often you can deliver value to users. High performers deploy multiple times per day. Low performers deploy monthly or quarterly.

### How to Measure

**Option 1: GitLab CI/CD Variables**

Every deployment should record itself:

```yaml
deploy_production:
  stage: deploy
  script:
    - sf project deploy start --target-org prod

    # Record deployment event
    - |
      DEPLOYMENT_DATA=$(cat <<EOF
      {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "pipeline_id": "$CI_PIPELINE_ID",
        "commit_sha": "$CI_COMMIT_SHA",
        "branch": "$CI_COMMIT_BRANCH",
        "triggered_by": "$GITLAB_USER_EMAIL",
        "environment": "production"
      }
      EOF
      )

    # Send to metrics system
    - curl -X POST https://metrics.company.com/api/deployments \
        -H "Content-Type: application/json" \
        -d "$DEPLOYMENT_DATA"

  environment:
    name: production
```

**Option 2: Custom Salesforce Object**

Create a custom object to track deployments:

```xml
<!-- Deployment_Event__c -->
<CustomObject>
    <label>Deployment Event</label>
    <fields>
        <fullName>Deployment_Timestamp__c</fullName>
        <type>DateTime</type>
    </fields>
    <fields>
        <fullName>Pipeline_ID__c</fullName>
        <type>Text</type>
    </fields>
    <fields>
        <fullName>Commit_SHA__c</fullName>
        <type>Text</type>
    </fields>
    <fields>
        <fullName>Deployed_By__c</fullName>
        <type>Text</type>
    </fields>
    <fields>
        <fullName>Success__c</fullName>
        <type>Checkbox</type>
    </fields>
</CustomObject>
```

Record deployment in pipeline:

```yaml
after_script:
  - |
    # Determine success/failure
    if [ $CI_JOB_STATUS == "success" ]; then
      SUCCESS=true
    else
      SUCCESS=false
    fi

    # Create deployment record
    sf data create record \
      --sobject Deployment_Event__c \
      --values "Deployment_Timestamp__c=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
                Pipeline_ID__c=$CI_PIPELINE_ID \
                Commit_SHA__c=$CI_COMMIT_SHA \
                Deployed_By__c=$GITLAB_USER_EMAIL \
                Success__c=$SUCCESS" \
      --target-org prod
```

**Option 3: Parse CI/CD Logs**

```python
# scripts/calculate-deployment-frequency.py
import requests
import json
from datetime import datetime, timedelta

GITLAB_TOKEN = os.getenv('GITLAB_TOKEN')
PROJECT_ID = '12345'

# Get pipelines from last 30 days
end_date = datetime.now()
start_date = end_date - timedelta(days=30)

response = requests.get(
    f'https://gitlab.com/api/v4/projects/{PROJECT_ID}/pipelines',
    headers={'PRIVATE-TOKEN': GITLAB_TOKEN},
    params={
        'updated_after': start_date.isoformat(),
        'ref': 'main',
        'status': 'success'
    }
)

pipelines = response.json()
production_deployments = [
    p for p in pipelines
    if 'deploy_production' in [job['name'] for job in p['jobs']]
]

frequency = len(production_deployments) / 30  # Deployments per day

print(f"Deployment Frequency: {frequency:.2f} deployments/day")
print(f"Total deployments (30 days): {len(production_deployments)}")
```

### Benchmarking

- **Elite performers**: Multiple deployments per day
- **High performers**: Between once per day and once per week
- **Medium performers**: Between once per week and once per month
- **Low performers**: Less than once per month

## Metric 2: Lead Time for Changes

### What It Measures

Time from when code is committed to when it's running in production. Shorter lead times mean faster feedback and faster value delivery.

### How to Measure

Track timestamps from commit to deployment:

```yaml
variables:
  COMMIT_TIMESTAMP: ""

before_script:
  # Capture commit timestamp
  - export COMMIT_TIMESTAMP=$(git show -s --format=%ct $CI_COMMIT_SHA)

deploy_production:
  script:
    - sf project deploy start --target-org prod

    # Calculate lead time
    - |
      DEPLOY_TIMESTAMP=$(date +%s)
      LEAD_TIME=$((DEPLOY_TIMESTAMP - COMMIT_TIMESTAMP))
      LEAD_TIME_MINUTES=$((LEAD_TIME / 60))

      echo "Lead Time: ${LEAD_TIME_MINUTES} minutes"

      # Record metric
      curl -X POST https://metrics.company.com/api/lead-time \
        -H "Content-Type: application/json" \
        -d "{
          \"commit_sha\": \"$CI_COMMIT_SHA\",
          \"commit_time\": $COMMIT_TIMESTAMP,
          \"deploy_time\": $DEPLOY_TIMESTAMP,
          \"lead_time_seconds\": $LEAD_TIME
        }"
```

### More Detailed Lead Time Breakdown

Track each stage:

```yaml
variables:
  METRICS: ""

build:
  script:
    - STAGE_START=$(date +%s)
    - npm run build
    - STAGE_END=$(date +%s)
    - |
      export METRICS=$(cat <<EOF
      {"build_duration": $((STAGE_END - STAGE_START))}
      EOF
      )
  artifacts:
    reports:
      dotenv: metrics.env

test:
  script:
    - STAGE_START=$(date +%s)
    - sf apex run test --test-level RunLocalTests
    - STAGE_END=$(date +%s)
    - |
      METRICS=$(echo $METRICS | jq ". + {\"test_duration\": $((STAGE_END - STAGE_START))}")
      echo "METRICS=$METRICS" >> metrics.env

deploy:
  script:
    - STAGE_START=$(date +%s)
    - sf project deploy start --target-org prod
    - STAGE_END=$(date +%s)
    - |
      METRICS=$(echo $METRICS | jq ". + {\"deploy_duration\": $((STAGE_END - STAGE_START))}")

      # Calculate total lead time
      TOTAL_LEAD_TIME=$(echo $METRICS | jq '.build_duration + .test_duration + .deploy_duration')

      echo "Total Lead Time: ${TOTAL_LEAD_TIME}s"
      echo "Breakdown: $(echo $METRICS | jq .)"
```

### Benchmarking

- **Elite performers**: Less than one hour
- **High performers**: Between one day and one week
- **Medium performers**: Between one week and one month
- **Low performers**: More than one month

## Metric 3: Mean Time to Recovery (MTTR)

### What It Measures

When deployments fail or cause incidents, how quickly can you restore service? This measures your rollback speed and incident response.

### How to Measure

Track incident timeline:

```yaml
# When incident detected
record_incident:
  stage: incident
  when: manual
  script:
    - |
      INCIDENT_DATA=$(cat <<EOF
      {
        "incident_id": "INC-${CI_PIPELINE_ID}",
        "start_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "severity": "high",
        "affected_service": "production"
      }
      EOF
      )

    - curl -X POST https://metrics.company.com/api/incidents \
        -d "$INCIDENT_DATA"

# When service restored
record_recovery:
  stage: recovery
  when: manual
  script:
    - |
      RECOVERY_DATA=$(cat <<EOF
      {
        "incident_id": "INC-${CI_PIPELINE_ID}",
        "recovery_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "recovery_method": "rollback"
      }
      EOF
      )

    - curl -X PATCH https://metrics.company.com/api/incidents/INC-${CI_PIPELINE_ID} \
        -d "$RECOVERY_DATA"
```

### Automated MTTR Tracking

```python
# scripts/calculate-mttr.py
from datetime import datetime
import statistics

incidents = [
    {"start": "2024-01-15T10:00:00Z", "end": "2024-01-15T10:15:00Z"},  # 15 min
    {"start": "2024-01-20T14:30:00Z", "end": "2024-01-20T15:45:00Z"},  # 75 min
    {"start": "2024-01-25T09:00:00Z", "end": "2024-01-25T09:30:00Z"},  # 30 min
]

recovery_times = []
for incident in incidents:
    start = datetime.fromisoformat(incident['start'].replace('Z', '+00:00'))
    end = datetime.fromisoformat(incident['end'].replace('Z', '+00:00'))
    recovery_minutes = (end - start).total_seconds() / 60
    recovery_times.append(recovery_minutes)

mttr = statistics.mean(recovery_times)
print(f"MTTR: {mttr:.1f} minutes")
print(f"Incidents: {len(incidents)}")
```

### Benchmarking

- **Elite performers**: Less than one hour
- **High performers**: Less than one day
- **Medium performers**: Between one day and one week
- **Low performers**: More than one week

## Metric 4: Change Failure Rate

### What It Measures

What percentage of deployments require remediation (rollback, hotfix, patch)? Lower is better.

### How to Measure

```yaml
deploy_production:
  stage: deploy
  script:
    - DEPLOY_ID=$(sf project deploy start --target-org prod --json | jq -r '.result.id')
    - echo "DEPLOY_ID=$DEPLOY_ID" > deploy.env

    # Record deployment
    - |
      curl -X POST https://metrics.company.com/api/deployments \
        -d "{
          \"deploy_id\": \"$DEPLOY_ID\",
          \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
          \"status\": \"success\"
        }"

  artifacts:
    reports:
      dotenv: deploy.env

# If rollback needed
rollback:
  stage: rollback
  when: manual
  needs: [deploy_production]
  script:
    - sf project deploy quick --use-most-recent --target-org prod

    # Mark deployment as failed
    - |
      curl -X PATCH https://metrics.company.com/api/deployments/$DEPLOY_ID \
        -d "{
          \"status\": \"failed\",
          \"rollback_time\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
        }"
```

### Calculate Failure Rate

```python
# scripts/calculate-change-failure-rate.py
import requests

response = requests.get('https://metrics.company.com/api/deployments?period=30days')
deployments = response.json()

total = len(deployments)
failed = len([d for d in deployments if d['status'] == 'failed'])

failure_rate = (failed / total) * 100 if total > 0 else 0

print(f"Change Failure Rate: {failure_rate:.1f}%")
print(f"Total deployments: {total}")
print(f"Failed deployments: {failed}")
```

### Benchmarking

- **Elite performers**: 0-15%
- **High performers**: 16-30%
- **Medium performers**: 31-45%
- **Low performers**: 46-60%+

## Building a Metrics Dashboard

Collecting metrics is step one. Visualizing them is step two.

### Option 1: Salesforce Dashboard

Create reports and dashboards using the Deployment_Event__c object:

**Report 1: Deployment Frequency**

```
Report Type: Deployment Events
Group By: Deployment_Timestamp__c (by Week)
Show: Count of Records
Chart Type: Line Chart
```

**Report 2: Deployment Success Rate**

```
Report Type: Deployment Events
Group By: Success__c
Summary: Count
Chart Type: Donut Chart
```

**Report 3: Lead Time Trend**

```
Report Type: Deployment Events
Group By: Deployment_Timestamp__c (by Week)
Show: Average of Lead_Time_Minutes__c
Chart Type: Line Chart
```

### Option 2: Custom Metrics API + Grafana

**Metrics Collection Service** (Node.js example):

```javascript
// metrics-service.js
const express = require('express');
const { Pool } = require('pg');

const app = express();
const db = new Pool({connectionString: process.env.DATABASE_URL});

app.use(express.json());

// Record deployment
app.post('/api/deployments', async (req, res) => {
  const {timestamp, pipeline_id, commit_sha, success, lead_time} = req.body;

  await db.query(
    'INSERT INTO deployments (timestamp, pipeline_id, commit_sha, success, lead_time) VALUES ($1, $2, $3, $4, $5)',
    [timestamp, pipeline_id, commit_sha, success, lead_time]
  );

  res.json({status: 'recorded'});
});

// Get deployment frequency
app.get('/api/metrics/deployment-frequency', async (req, res) => {
  const {period = 30} = req.query;

  const result = await db.query(`
    SELECT
      DATE_TRUNC('day', timestamp) as day,
      COUNT(*) as deployments
    FROM deployments
    WHERE timestamp > NOW() - INTERVAL '${period} days'
    GROUP BY day
    ORDER BY day
  `);

  res.json(result.rows);
});

// Get DORA metrics summary
app.get('/api/metrics/dora', async (req, res) => {
  const {period = 30} = req.query;

  const deploymentFreq = await db.query(`
    SELECT COUNT(*)::float / $1 as per_day
    FROM deployments
    WHERE timestamp > NOW() - INTERVAL '${period} days'
  `, [period]);

  const leadTime = await db.query(`
    SELECT AVG(lead_time) as avg_seconds
    FROM deployments
    WHERE timestamp > NOW() - INTERVAL '${period} days'
    AND lead_time IS NOT NULL
  `);

  const failureRate = await db.query(`
    SELECT
      (COUNT(*) FILTER (WHERE success = false)::float / COUNT(*)) * 100 as percentage
    FROM deployments
    WHERE timestamp > NOW() - INTERVAL '${period} days'
  `);

  res.json({
    deployment_frequency: deploymentFreq.rows[0].per_day,
    lead_time_avg_minutes: leadTime.rows[0].avg_seconds / 60,
    change_failure_rate: failureRate.rows[0].percentage
  });
});

app.listen(3000);
```

**Grafana Dashboard JSON** (excerpt):

```json
{
  "dashboard": {
    "title": "DevOps Metrics - DORA",
    "panels": [
      {
        "title": "Deployment Frequency",
        "type": "graph",
        "targets": [{
          "expr": "rate(deployments_total[1d])"
        }]
      },
      {
        "title": "Lead Time for Changes",
        "type": "graph",
        "targets": [{
          "expr": "histogram_quantile(0.95, lead_time_seconds_bucket)"
        }]
      },
      {
        "title": "Change Failure Rate",
        "type": "stat",
        "targets": [{
          "expr": "(deployments_failed / deployments_total) * 100"
        }]
      }
    ]
  }
}
```

## Beyond DORA: Additional DevOps Metrics

### Code Coverage Trend

```yaml
test:
  script:
    - sf apex run test --test-level RunLocalTests --code-coverage --json > coverage.json

    # Extract coverage percentage
    - COVERAGE=$(cat coverage.json | jq '.result.summary.testRunCoverage')

    # Record metric
    - |
      curl -X POST https://metrics.company.com/api/code-coverage \
        -d "{
          \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
          \"coverage_percent\": $COVERAGE,
          \"commit_sha\": \"$CI_COMMIT_SHA\"
        }"
```

### Pipeline Duration Trend

```yaml
after_script:
  - |
    PIPELINE_DURATION=$(($(date +%s) - $CI_PIPELINE_CREATED_AT))

    curl -X POST https://metrics.company.com/api/pipeline-duration \
      -d "{
        \"pipeline_id\": \"$CI_PIPELINE_ID\",
        \"duration_seconds\": $PIPELINE_DURATION
      }"
```

### Test Execution Time

```yaml
test:
  script:
    - TEST_START=$(date +%s)
    - sf apex run test --test-level RunLocalTests
    - TEST_END=$(date +%s)
    - TEST_DURATION=$((TEST_END - TEST_START))

    - echo "Test execution: ${TEST_DURATION}s"
```

## Setting Goals and Driving Improvement

Metrics are useless without goals and action plans.

### Establish Baselines

```bash
# Current state (example)
Deployment Frequency: 2 per week
Lead Time: 3 days
MTTR: 4 hours
Change Failure Rate: 25%
```

### Set Improvement Targets

```bash
# 3-month goals
Deployment Frequency: 1 per day (5x improvement)
Lead Time: 4 hours (18x improvement)
MTTR: 30 minutes (8x improvement)
Change Failure Rate: 10% (2.5x improvement)
```

### Create Action Plans

**To improve Deployment Frequency:**
- Automate manual approval steps
- Implement feature flags for gradual rollouts
- Reduce batch size (smaller, more frequent deployments)

**To improve Lead Time:**
- Optimize test suite (parallelize, remove slow tests)
- Improve build caching
- Automate deployment approval for low-risk changes

**To improve MTTR:**
- Implement automated rollback on failure
- Create runbooks for common issues
- Improve monitoring and alerting

**To reduce Change Failure Rate:**
- Increase test coverage
- Implement pre-deployment validation
- Add smoke tests and post-deployment checks

### Review Metrics Weekly

```
Weekly DevOps Metrics Review Agenda:
1. Review current week's metrics vs. last week
2. Identify any anomalies or trends
3. Celebrate wins (improvements)
4. Identify root causes of regressions
5. Assign action items for improvement
6. Update team on progress toward goals
```

## Hands-On Exercise: Implement Metrics Collection

**Objective**: Instrument your pipeline to collect all four DORA metrics.

**Your Tasks**:

1. Add deployment frequency tracking to your pipeline
2. Calculate and record lead time for each deployment
3. Implement incident tracking for MTTR calculation
4. Track deployment success/failure for change failure rate
5. Create a simple dashboard or report to visualize metrics
6. Calculate your current baseline for all four metrics
7. Set improvement goals for the next 3 months

**Deliverables**:

- [ ] Pipeline code that records all metrics
- [ ] Metrics storage (Salesforce custom object or external DB)
- [ ] Script to calculate current baselines
- [ ] Dashboard or report showing trends
- [ ] Document with current baselines and 3-month goals

**You'll know you succeeded when**:
- You can answer "how many times did we deploy last week?" in 30 seconds
- You know your average lead time
- You have data to prove whether your DevOps is improving

## Metrics Checklist

Effective DevOps metrics programs have:

- [ ] All four DORA metrics instrumented
- [ ] Automated collection (no manual tracking)
- [ ] Visible dashboard updated in real-time
- [ ] Baseline metrics established
- [ ] Improvement goals set
- [ ] Regular review cadence (weekly or biweekly)
- [ ] Action plans tied to metrics
- [ ] Team awareness and buy-in
- [ ] Executive visibility and support

## What We Learned

DevOps metrics transform your program from "we think it's better" to "here's the proof":

1. **DORA metrics**: Deployment frequency, lead time, MTTR, change failure rate
2. **Instrumentation**: Capture metrics automatically in pipelines
3. **Visualization**: Dashboards make trends obvious
4. **Benchmarking**: Compare against industry standards
5. **Goal setting**: Drive continuous improvement with targets
6. **Action plans**: Connect metrics to specific improvements

Remember: metrics are a means to an end. The goal isn't to have beautiful dashboards. It's to continuously improve your ability to deliver value to users quickly and reliably.

## What's Next

You can now measure your DevOps performance. But what happens when disaster strikes? When your production org is corrupted, deleted, or compromised?

Next: **Disaster Recovery Planning**.

You'll learn:
- Backup strategies for Salesforce metadata and data
- Recovery time objectives (RTO) and recovery point objectives (RPO)
- Testing your disaster recovery procedures
- Automating backup and restore
- Building resilience into your DevOps process

See you there!
