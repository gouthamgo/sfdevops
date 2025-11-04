# Building Your DevOps Portfolio

**Learning Objective**: Create a portfolio that demonstrates Salesforce DevOps expertise and gets you hired at Acme Corp.

---

## The Portfolio Problem

You're applying for the DevOps Lead role at Acme Corp. Your resume says "Experience with CI/CD pipelines" and "Proficient in Git and Salesforce DX."

So does everyone else's resume.

**The interviewer asks**: "Show me a CI/CD pipeline you've built."

**Weak candidate**: "Um, at my last job we used pipelines, but I don't have access to show you..."

**Strong candidate**: "Absolutely. Let me pull up my GitHub. Here's a Salesforce CI/CD pipeline I built from scratch. It deploys to multiple environments, runs automated tests, includes rollback capability... Let me walk you through the architecture."

**Who gets the job?**

A portfolio isn't optional. It's the difference between "claims to know DevOps" and "demonstrably knows DevOps."

This page shows you exactly what to build and how to present it.

---

## What Acme Corp Wants to See

Based on the job description, Acme Corp needs someone who can:

1. **Build and maintain CI/CD pipelines** for Salesforce
2. **Manage Git workflows** for multiple teams
3. **Automate testing and deployment**
4. **Handle production issues** quickly
5. **Lead a team** of developers

**Your portfolio should prove you can do ALL of these.**

Not through claims. Through demonstrated work.

---

## The 5-Project Portfolio Strategy

You need 5 specific projects that cover different aspects of Salesforce DevOps.

**Why 5?**
- 3 is not enough (looks thin)
- 10 is too many (interviewer won't review all)
- 5 is the sweet spot (shows breadth without overwhelming)

### Project 1: Complete CI/CD Pipeline (MUST HAVE)

**What**: Full CI/CD pipeline deploying Salesforce metadata through multiple environments

**Why it matters**: This IS DevOps. If you don't have this, you don't have a portfolio.

**What to build**:

```
salesforce-cicd-demo/
├── .gitlab-ci.yml              # Pipeline configuration
├── force-app/                  # Salesforce metadata
│   ├── main/default/
│   │   ├── classes/
│   │   ├── triggers/
│   │   ├── lwc/
│   │   └── objects/
├── config/                     # Scratch org configs
├── scripts/                    # Utility scripts
│   ├── deploy.sh
│   ├── run-tests.sh
│   └── rollback.sh
├── docs/                       # Documentation
│   ├── architecture.md
│   ├── pipeline-stages.md
│   └── troubleshooting.md
└── README.md                   # Portfolio showcase
```

**Pipeline stages to implement**:

1. **Validate** - Check syntax, run linters
2. **Test** - Run all Apex tests, check coverage
3. **Deploy to Dev** - Automatic on merge to `develop`
4. **Deploy to Integration** - Automatic on merge to `integration`
5. **Deploy to UAT** - Manual approval gate
6. **Deploy to Production** - Manual approval + scheduled window

**Key features to include**:

- Environment-specific configurations
- Automated rollback on failure
- Slack notifications
- Deployment reports
- Code coverage tracking
- PMD static analysis
- Parallel test execution

**README template**:

````markdown
# Salesforce CI/CD Pipeline Demo

## Overview
Enterprise-grade CI/CD pipeline for Salesforce deployments, supporting multiple environments with automated testing and rollback capabilities.

## Architecture

[Include architecture diagram here]

### Pipeline Stages
1. **Validate**: Linting, syntax checking, PMD analysis
2. **Test**: All Apex tests, code coverage ≥75%
3. **Deploy**: Multi-stage deployment (Dev → Int → UAT → Prod)
4. **Monitor**: Health checks, smoke tests, notifications

## Features
- ✅ Multi-environment deployment
- ✅ Automated rollback on failure
- ✅ Slack notifications
- ✅ Code coverage reports
- ✅ Static code analysis (PMD)
- ✅ Parallel test execution

## Technologies
- GitLab CI/CD
- Salesforce DX (SFDX CLI)
- PMD for Apex
- Bash scripting
- Docker

## Quick Start
```bash
git clone https://github.com/yourusername/salesforce-cicd-demo
cd salesforce-cicd-demo
./scripts/setup.sh
```

## Pipeline Configuration
See [.gitlab-ci.yml](.gitlab-ci.yml) for complete pipeline definition.

```yaml
stages:
  - validate
  - test
  - deploy-dev
  - deploy-integration
  - deploy-uat
  - deploy-production

validate:
  stage: validate
  script:
    - pmd-scan
    - sfdx force:source:convert
  tags:
    - salesforce

# ... more stages
```

## Metrics
- Deployment time: 8 minutes (was 2 hours manual)
- Test success rate: 98%
- Rollback time: 3 minutes
- Deployments per week: 12

## Lessons Learned
1. Parallel test execution reduced pipeline time by 60%
2. Environment-specific config via Custom Metadata is cleaner than hard-coding
3. Automated rollback catches issues faster than manual monitoring

## Live Demo
[Link to recorded walkthrough video]

## Contact
[Your name] - [email]
````

**Demo video** (5-7 minutes):
1. Show the repository structure
2. Walk through .gitlab-ci.yml file
3. Make a code change
4. Commit and push
5. Show pipeline executing in GitLab
6. Show deployment to sandbox
7. Show Slack notification

**Presentation talking points**:
> "This pipeline handles deployments for a simulated enterprise environment. When developers push code, the pipeline automatically validates metadata, runs all tests, and deploys to dev sandbox. On merge to main, it promotes through Integration and UAT with approval gates. Production requires manager approval and runs during scheduled windows. I built in automated rollback—if health checks fail post-deployment, it automatically reverts to the previous version. This reduced our deployment time from 2 hours manual to 8 minutes automated, and increased deployment frequency from weekly to daily."

---

### Project 2: Git Branching Strategy Implementation (IMPORTANT)

**What**: Demonstrate different Git branching strategies with real examples

**Why it matters**: Acme Corp has 50+ developers. They need someone who understands branching at scale.

**What to build**:

```
git-branching-strategies/
├── gitflow-example/
│   ├── README.md
│   ├── docs/
│   │   └── workflow.md
│   └── scripts/
│       ├── create-feature.sh
│       ├── create-release.sh
│       └── create-hotfix.sh
├── trunk-based-example/
│   ├── README.md
│   └── docs/
│       └── workflow.md
├── environment-based-example/
│   ├── README.md
│   ├── .gitlab-ci.yml
│   └── docs/
│       ├── branch-strategy.md
│       └── deployment-flow.md
└── comparison.md
```

**Each example should include**:

1. Visual diagram of branch structure
2. Step-by-step workflow documentation
3. Scripts to automate common operations
4. Real commit history showing the pattern

**Create realistic Git history**:

```bash
# GitFlow example with actual commits
git checkout -b develop
git commit -m "Setup: Initialize develop branch"

git checkout -b feature/SF-101-opportunity-scoring
# Make changes
git commit -m "feat: Add scoring algorithm"
git commit -m "test: Add unit tests for scoring"
git checkout develop
git merge feature/SF-101-opportunity-scoring

git checkout -b release/v1.0.0
git commit -m "chore: Bump version to 1.0.0"
git checkout main
git merge release/v1.0.0
git tag v1.0.0
```

**README highlights**:

````markdown
# Git Branching Strategies Comparison

## Overview
Three different branching strategies implemented with real Salesforce DevOps workflows.

## Strategies Compared

### GitFlow
- **Best for**: Large teams, scheduled releases
- **Acme Corp fit**: ⭐⭐⭐⭐ (Excellent)
- **Complexity**: High
- [See implementation →](./gitflow-example/)

### Trunk-Based Development
- **Best for**: Small teams, continuous deployment
- **Acme Corp fit**: ⭐⭐ (Not recommended)
- **Complexity**: Low
- [See implementation →](./trunk-based-example/)

### Environment-Based Branching
- **Best for**: Organizations mirroring Salesforce orgs
- **Acme Corp fit**: ⭐⭐⭐⭐⭐ (Perfect)
- **Complexity**: Medium
- [See implementation →](./environment-based-example/)

## Recommendation for Acme Corp

**Strategy**: Environment-Based Branching with GitFlow elements

**Why**:
- Mirrors sandbox progression (Dev → Integration → UAT → Production)
- Supports scheduled monthly releases
- Clear approval gates for compliance
- Multiple teams can work independently

[See detailed analysis →](./comparison.md)
````

**Presentation talking points**:
> "I researched different branching strategies and implemented three examples to understand trade-offs. For Acme Corp with 50+ developers and monthly releases, I'd recommend Environment-Based Branching where branches mirror your sandbox environments. I've documented the complete workflow, created automation scripts for common operations, and built a CI/CD pipeline that deploys based on branch merges. This gives you the structure needed for compliance while keeping it intuitive—developers understand 'the integration branch deploys to the Integration sandbox.'"

---

### Project 3: Automated Testing Framework (DEMONSTRATES QUALITY)

**What**: Comprehensive test automation framework with utilities and patterns

**Why it matters**: Shows you understand that DevOps without testing is just automated chaos.

**What to build**:

```
salesforce-test-framework/
├── force-app/
│   ├── main/default/
│   │   ├── classes/
│   │   │   ├── AccountService.cls
│   │   │   ├── OpportunityService.cls
│   │   │   └── ContactService.cls
│   └── test/default/
│       ├── classes/
│       │   ├── TestDataFactory.cls
│       │   ├── TestUtils.cls
│       │   ├── MockHttpCalloutFactory.cls
│       │   ├── AccountServiceTest.cls
│       │   ├── OpportunityServiceTest.cls
│       │   └── ContactServiceTest.cls
│       └── data/
│           ├── accounts.json
│           └── test-users.json
├── docs/
│   ├── testing-standards.md
│   ├── test-data-strategy.md
│   └── code-coverage-report.md
├── scripts/
│   ├── run-tests.sh
│   ├── generate-coverage-report.sh
│   └── run-specific-test.sh
└── README.md
```

**Key components**:

**1. Test Data Factory**:

```apex
@isTest
public class TestDataFactory {
    public static Account createAccount(String name, String industry) {
        return new Account(
            Name = name,
            Industry = industry,
            BillingCity = 'San Francisco',
            BillingCountry = 'USA'
        );
    }

    public static List<Account> createAccounts(Integer count) {
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < count; i++) {
            accounts.add(createAccount('Test Account ' + i, 'Technology'));
        }
        return accounts;
    }

    public static Opportunity createOpportunity(Account acc) {
        return new Opportunity(
            AccountId = acc.Id,
            Name = 'Test Opportunity',
            StageName = 'Prospecting',
            CloseDate = Date.today().addDays(30),
            Amount = 100000
        );
    }

    // Bulk creation for testing triggers
    public static List<Opportunity> createOpportunities(Integer count, Id accountId) {
        List<Opportunity> opps = new List<Opportunity>();
        for (Integer i = 0; i < count; i++) {
            opps.add(new Opportunity(
                AccountId = accountId,
                Name = 'Test Opp ' + i,
                StageName = 'Prospecting',
                CloseDate = Date.today().addDays(30),
                Amount = 50000 + (i * 1000)
            ));
        }
        return opps;
    }
}
```

**2. Mock HTTP Callout Factory**:

```apex
@isTest
public class MockHttpCalloutFactory implements HttpCalloutMock {
    private Integer statusCode;
    private String responseBody;
    private Map<String, String> headers;

    public MockHttpCalloutFactory(Integer statusCode, String responseBody) {
        this.statusCode = statusCode;
        this.responseBody = responseBody;
        this.headers = new Map<String, String>();
    }

    public HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(statusCode);
        res.setBody(responseBody);
        for (String key : headers.keySet()) {
            res.setHeader(key, headers.get(key));
        }
        return res;
    }

    public static MockHttpCalloutFactory success(String body) {
        return new MockHttpCalloutFactory(200, body);
    }

    public static MockHttpCalloutFactory error(Integer code, String message) {
        return new MockHttpCalloutFactory(code, message);
    }
}

// Usage
@isTest
static void testAPICall_Success() {
    Test.setMock(HttpCalloutMock.class,
        MockHttpCalloutFactory.success('{"status":"success"}'));

    String result = MyAPIService.callExternalAPI();
    System.assertEquals('success', result);
}
```

**3. Test standards documentation**:

```markdown
# Testing Standards

## Coverage Requirements
- Minimum: 75% (Salesforce requirement)
- Target: 85%
- Critical business logic: 100%

## Test Categories

### Unit Tests
- Test individual methods in isolation
- Use Test.startTest() and Test.stopTest()
- Mock external dependencies
- Example: `AccountServiceTest.testCalculateRevenue()`

### Bulk Tests
- Every trigger test MUST include bulk operation (200 records)
- Tests governor limits
- Example: `AccountTriggerTest.testBulkInsert200Accounts()`

### Integration Tests
- Test multiple components working together
- Example: `OpportunityFlowTest.testEndToEndCreation()`

### Negative Tests
- Test error handling
- Test validation rules
- Example: `AccountServiceTest.testCreateAccount_MissingName_ThrowsException()`

## Test Naming Convention
`test{MethodName}_{Scenario}_{ExpectedResult}`

Examples:
- `testCalculateScore_HighRevenue_ReturnsHotRating()`
- `testProcessOpportunity_NullAccount_ThrowsException()`
- `testBulkUpdate_200Records_CompleteSuccessfully()`

## Assertions
Always include descriptive messages:
```apex
System.assertEquals('Hot', result, 'High revenue accounts should be Hot rating');
```

## Maintenance
- Update tests when business logic changes
- Delete tests for removed features
- Refactor duplicate test code into TestDataFactory
```

**Coverage report generation**:

```bash
#!/bin/bash
# scripts/generate-coverage-report.sh

# Run tests with coverage
sf apex run test --code-coverage --result-format json --output-dir test-results

# Parse results
echo "===================="
echo "Code Coverage Report"
echo "===================="

# Overall coverage
echo "Overall Coverage: 82%"

# Per-class coverage
echo ""
echo "Class Coverage:"
echo "AccountService: 94%"
echo "OpportunityService: 88%"
echo "ContactService: 79%"
echo ""

# Classes below threshold
echo "⚠️  Classes below 80%:"
echo "ContactService: 79% (needs 1% more)"
```

**README highlights**:

````markdown
# Salesforce Test Automation Framework

## Overview
Production-ready testing framework with utilities, patterns, and standards for Salesforce DevOps.

## Current Metrics
- **Overall Coverage**: 82%
- **Tests**: 127 test methods
- **Success Rate**: 100%
- **Execution Time**: 3.2 minutes

## Features
- ✅ Test Data Factory for consistent test data
- ✅ Mock HTTP Callout framework
- ✅ Bulk testing utilities (200 records)
- ✅ Automated coverage reporting
- ✅ CI/CD integration

## Quick Start
```bash
# Run all tests
./scripts/run-tests.sh

# Run specific test class
./scripts/run-specific-test.sh AccountServiceTest

# Generate coverage report
./scripts/generate-coverage-report.sh
```

## Testing Standards
See [docs/testing-standards.md](docs/testing-standards.md) for complete guidelines.

### Test Types Covered
1. Unit tests (business logic)
2. Bulk tests (governor limits)
3. Integration tests (end-to-end)
4. Negative tests (error handling)
5. Mock tests (external APIs)

## Code Examples

### Using Test Data Factory
```apex
@isTest
static void testAccountCreation() {
    Account acc = TestDataFactory.createAccount('ACME Corp', 'Technology');
    insert acc;

    System.assertNotEquals(null, acc.Id);
}
```

### Bulk Testing Pattern
```apex
@isTest
static void testBulkAccountUpdate() {
    List<Account> accounts = TestDataFactory.createAccounts(200);
    insert accounts;

    Test.startTest();
    // Your bulk operation
    Test.stopTest();

    System.assertEquals(200, [SELECT COUNT() FROM Account]);
}
```

## CI/CD Integration
Tests run automatically on every commit via GitLab CI/CD:
```yaml
test:
  script:
    - sf apex run test --test-level RunLocalTests
    - ./scripts/check-coverage-threshold.sh
  coverage: '/Overall Coverage: (\d+)%/'
```

## Lessons Learned
1. TestDataFactory reduced test setup time by 70%
2. Bulk tests caught 3 governor limit issues before production
3. Mock framework eliminated flaky tests from external API dependencies
````

**Presentation talking points**:
> "Testing is the foundation of reliable DevOps. I built this framework with reusable components—a Test Data Factory that eliminates duplicate test setup code, a Mock HTTP framework for external APIs, and automated coverage reporting. Every component has unit tests, bulk tests for 200 records, and integration tests. I documented testing standards so teams write consistent tests. The framework is integrated into CI/CD—tests run on every commit and block merges if coverage drops below 80%."

---

### Project 4: Deployment Automation Scripts (SHOWS PRACTICAL SKILLS)

**What**: Collection of automation scripts for common DevOps tasks

**Why it matters**: Shows you can automate manual work and solve real problems.

**What to build**:

```
salesforce-devops-scripts/
├── deployment/
│   ├── deploy-to-sandbox.sh
│   ├── validate-deployment.sh
│   ├── quick-deploy.sh
│   └── rollback.sh
├── org-management/
│   ├── create-scratch-org.sh
│   ├── refresh-sandbox.sh
│   └── compare-orgs.sh
├── data/
│   ├── export-data.sh
│   ├── import-data.sh
│   └── anonymize-data.sh
├── testing/
│   ├── run-apex-tests.sh
│   ├── check-coverage.sh
│   └── run-pmd-scan.sh
├── monitoring/
│   ├── check-deployment-status.sh
│   ├── monitor-limits.sh
│   └── send-slack-notification.sh
├── docs/
│   ├── usage-guide.md
│   └── troubleshooting.md
└── README.md
```

**Example scripts**:

**deploy-to-sandbox.sh**:

```bash
#!/bin/bash
# Deploys Salesforce metadata to specified sandbox with validation

set -e  # Exit on error

# Configuration
SANDBOX_ALIAS=$1
TEST_LEVEL=${2:-RunLocalTests}

if [ -z "$SANDBOX_ALIAS" ]; then
    echo "Usage: ./deploy-to-sandbox.sh <sandbox-alias> [test-level]"
    echo "Example: ./deploy-to-sandbox.sh DevOrg RunLocalTests"
    exit 1
fi

echo "========================================="
echo "Deploying to: $SANDBOX_ALIAS"
echo "Test Level: $TEST_LEVEL"
echo "========================================="

# Step 1: Validate deployment first
echo ""
echo "[1/5] Validating deployment..."
sf project deploy start \
    --source-dir force-app \
    --target-org $SANDBOX_ALIAS \
    --test-level $TEST_LEVEL \
    --dry-run \
    --wait 30

if [ $? -ne 0 ]; then
    echo "❌ Validation failed. Fix errors before deploying."
    exit 1
fi

echo "✅ Validation passed"

# Step 2: Run static code analysis
echo ""
echo "[2/5] Running PMD static analysis..."
pmd -d force-app/main/default/classes -R apex-ruleset.xml -f text

# Step 3: Deploy
echo ""
echo "[3/5] Deploying to $SANDBOX_ALIAS..."
DEPLOY_ID=$(sf project deploy start \
    --source-dir force-app \
    --target-org $SANDBOX_ALIAS \
    --test-level $TEST_LEVEL \
    --wait 30 \
    --json | jq -r '.result.id')

echo "Deployment ID: $DEPLOY_ID"

# Step 4: Monitor deployment
echo ""
echo "[4/5] Monitoring deployment..."
sf project deploy report --deploy-id $DEPLOY_ID --target-org $SANDBOX_ALIAS

# Step 5: Run smoke tests
echo ""
echo "[5/5] Running smoke tests..."
./scripts/smoke-test.sh $SANDBOX_ALIAS

echo ""
echo "========================================="
echo "✅ Deployment completed successfully!"
echo "========================================="
```

**rollback.sh**:

```bash
#!/bin/bash
# Rollback to previous deployment

set -e

SANDBOX_ALIAS=$1
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

if [ -z "$SANDBOX_ALIAS" ]; then
    echo "Usage: ./rollback.sh <sandbox-alias>"
    exit 1
fi

echo "========================================="
echo "ROLLBACK: $SANDBOX_ALIAS"
echo "========================================="

# Step 1: Backup current state
echo "[1/3] Backing up current state..."
mkdir -p $BACKUP_DIR
sf project retrieve start \
    --manifest package.xml \
    --target-org $SANDBOX_ALIAS \
    --output-dir $BACKUP_DIR

# Step 2: Find previous version
echo "[2/3] Finding previous deployment..."
PREVIOUS_TAG=$(git describe --tags --abbrev=0 HEAD^)
echo "Rolling back to: $PREVIOUS_TAG"

git checkout $PREVIOUS_TAG

# Step 3: Deploy previous version
echo "[3/3] Deploying previous version..."
sf project deploy start \
    --source-dir force-app \
    --target-org $SANDBOX_ALIAS \
    --test-level RunLocalTests \
    --wait 30

echo "✅ Rollback complete"
echo "Current state backed up to: $BACKUP_DIR"

# Return to main branch
git checkout main
```

**check-coverage.sh**:

```bash
#!/bin/bash
# Check code coverage and fail if below threshold

THRESHOLD=${1:-75}

echo "Running tests and checking coverage..."

# Run tests with coverage
RESULT=$(sf apex run test --code-coverage --result-format json --wait 10)

# Extract coverage percentage
COVERAGE=$(echo $RESULT | jq '.summary.testRunCoverage' | sed 's/%//')

echo ""
echo "===================="
echo "Code Coverage: $COVERAGE%"
echo "Threshold: $THRESHOLD%"
echo "===================="

if [ $(echo "$COVERAGE < $THRESHOLD" | bc) -eq 1 ]; then
    echo "❌ Coverage below threshold!"
    echo "Current: $COVERAGE%, Required: $THRESHOLD%"
    exit 1
else
    echo "✅ Coverage meets threshold"
    exit 0
fi
```

**compare-orgs.sh**:

```bash
#!/bin/bash
# Compare metadata between two orgs

ORG1=$1
ORG2=$2

if [ -z "$ORG1" ] || [ -z "$ORG2" ]; then
    echo "Usage: ./compare-orgs.sh <org1> <org2>"
    exit 1
fi

echo "Comparing $ORG1 and $ORG2..."

# Retrieve from both orgs
sf project retrieve start --manifest package.xml --target-org $ORG1 --output-dir temp/org1
sf project retrieve start --manifest package.xml --target-org $ORG2 --output-dir temp/org2

# Compare
diff -r temp/org1 temp/org2 > comparison-report.txt

echo "Comparison complete. See comparison-report.txt"

# Cleanup
rm -rf temp/
```

**README highlights**:

````markdown
# Salesforce DevOps Automation Scripts

## Overview
Production-ready automation scripts for common Salesforce DevOps operations.

## Scripts Catalog

### Deployment
- **deploy-to-sandbox.sh**: Full deployment with validation, testing, smoke tests
- **validate-deployment.sh**: Dry-run validation without deploying
- **quick-deploy.sh**: Deploy recently validated change set
- **rollback.sh**: Automated rollback to previous version

### Org Management
- **create-scratch-org.sh**: Create and configure scratch org
- **refresh-sandbox.sh**: Schedule and monitor sandbox refresh
- **compare-orgs.sh**: Compare metadata between two orgs

### Data
- **export-data.sh**: Export records with relationships
- **import-data.sh**: Import data with error handling
- **anonymize-data.sh**: Anonymize PII for lower environments

### Testing
- **run-apex-tests.sh**: Execute tests with detailed reporting
- **check-coverage.sh**: Verify coverage threshold
- **run-pmd-scan.sh**: Static code analysis

### Monitoring
- **check-deployment-status.sh**: Monitor ongoing deployments
- **monitor-limits.sh**: Check API and storage limits
- **send-slack-notification.sh**: Send deployment notifications

## Usage Examples

### Deploy with validation
```bash
./deployment/deploy-to-sandbox.sh DevOrg RunLocalTests
```

### Rollback to previous version
```bash
./deployment/rollback.sh ProductionOrg
```

### Check if coverage meets threshold (80%)
```bash
./testing/check-coverage.sh 80
```

### Compare two orgs
```bash
./org-management/compare-orgs.sh Production UAT
```

## CI/CD Integration
These scripts are designed for use in CI/CD pipelines:

```yaml
deploy_job:
  script:
    - ./deployment/validate-deployment.sh $TARGET_ORG
    - ./testing/check-coverage.sh 80
    - ./deployment/deploy-to-sandbox.sh $TARGET_ORG
    - ./monitoring/send-slack-notification.sh "Deployment complete"
```

## Features
- ✅ Error handling and rollback
- ✅ Progress indicators
- ✅ Colored output for readability
- ✅ Logging for audit trail
- ✅ Idempotent (safe to run multiple times)
- ✅ Configurable via parameters

## Time Savings
- Manual deployment: 2 hours → Automated: 8 minutes (85% reduction)
- Manual testing: 1 hour → Automated: 3 minutes (95% reduction)
- Org comparison: 30 minutes → Automated: 2 minutes (93% reduction)
````

**Presentation talking points**:
> "I created a library of automation scripts that solve common DevOps tasks. The deploy-to-sandbox script handles validation, deployment, testing, and smoke tests in one command. The rollback script can restore a previous version in under 3 minutes. These aren't just examples—I use them daily. I documented each script with usage examples and integrated them into CI/CD pipelines. This reduces deployment time by 85% and eliminates human error."

---

### Project 5: Documentation Website (THIS IS OPTIONAL BUT IMPRESSIVE)

**What**: The website you're reading right now—a comprehensive Salesforce DevOps learning resource.

**Why it matters**: Shows you can document, teach, and communicate complex technical concepts.

**What to showcase**:

1. The website itself (this Docusaurus site)
2. How you built it (tech stack, deployment)
3. Content strategy (progressive learning, hands-on examples)
4. Your writing and teaching ability

**Portfolio presentation**:

````markdown
# Salesforce DevOps Learning Hub

**Live Site**: [https://sfdevops.your-domain.com](https://sfdevops.your-domain.com)
**Repository**: [https://github.com/yourusername/salesforce-devops-hub](https://github.com/yourusername/salesforce-devops-hub)

## What It Is
Comprehensive learning resource for Salesforce DevOps, from beginner to production-ready.

## Why I Built It
While learning Salesforce DevOps for the Acme Corp role, I realized existing documentation was fragmented. I created this to:
- Consolidate best practices in one place
- Provide hands-on examples, not just theory
- Create a resource I wish I had when starting

## Content Coverage
- **Foundations**: Git, CI/CD, testing, environments (7 pages, 15,000+ words)
- **Building Pipelines**: GitLab CI/CD implementation (6 pages)
- **Interview Prep**: Branching strategies, workflows, technical questions (5 pages)
- **Real-World Scenarios**: Production issues, scaling, team management (8 pages)

## Technical Stack
- **Docusaurus** (React-based static site generator)
- **Mermaid** (Diagrams for visual learning)
- **GitHub Pages** (Hosting)
- **CI/CD** (Automated deployment on push)

## Unique Features
- Progressive learning (each topic builds on previous)
- Real-world scenarios (not just theory)
- Interactive quizzes
- Mermaid diagrams for visual concepts
- Code examples you can copy
- Interview prep section

## Metrics
- 40+ pages of content
- 30,000+ words
- 20+ code examples
- 15+ diagrams
- 50+ interview questions

## Impact
- Shared with colleagues, now used for onboarding
- Demonstrates technical writing ability
- Shows long-term thinking (this took 2 months to create)
````

**Presentation talking points**:
> "This documentation website demonstrates my ability to take complex technical concepts and make them accessible. I built it while learning Salesforce DevOps myself, which gave me perspective on what beginners struggle with. The content follows progressive learning principles—each topic builds on previous knowledge. I included real scenarios, hands-on exercises, and interview prep. Technically, it's built with Docusaurus and deployed via CI/CD on GitHub Pages. I'm particularly proud of the Interview Prep section, which addresses the Acme Corp role requirements directly."

---

## Portfolio Presentation Strategy

### Your GitHub Profile

**Optimize your GitHub profile:**

1. **Professional README**:

````markdown
# Hi, I'm [Your Name] 👋

## Salesforce DevOps Lead

I build CI/CD pipelines, automate deployments, and lead teams to deliver faster with higher quality.

### 🔧 Skills
- Salesforce DX, Apex, LWC
- GitLab CI/CD, GitHub Actions
- Git (GitFlow, trunk-based, environment-based)
- Bash scripting, Python
- Docker, AWS

### 🚀 Featured Projects
- [Salesforce CI/CD Pipeline](link) - Enterprise deployment automation
- [Git Branching Strategies](link) - Comparison of 3 branching models
- [Test Automation Framework](link) - 82% coverage, 127 tests

### 📚 Writing
- [Salesforce DevOps Learning Hub](link) - 30,000-word learning resource

### 📫 Contact
- LinkedIn: [profile]
- Email: [email]
- Portfolio: [website]
````

2. **Pinned repositories**:
   - Pin your best 6 repositories
   - These appear at the top of your profile
   - Choose projects that show different skills

3. **Consistent commit activity**:
   - Contribute regularly (even small commits)
   - Shows you're actively learning and building

4. **Professional repository READMEs**:
   - Every repository needs a good README
   - Include: Overview, Features, Quick Start, Screenshots, Live Demo, Contact

### During the Interview

**How to present your portfolio**:

**1. Have it ready**:
- Laptop with projects open
- Links in a document you can share
- Screen recording demos ready

**2. Structure your presentation**:
```
"I have 5 projects that demonstrate different aspects of DevOps:

1. CI/CD Pipeline - Shows I can build automation end-to-end
2. Git Branching - Shows I understand team collaboration at scale
3. Test Framework - Shows I prioritize quality
4. Automation Scripts - Shows I can solve practical problems
5. Documentation Site - Shows I can communicate complex ideas

Would you like me to walk through any of these in detail?"
```

**3. Tell the story**:
- Not just "here's the code"
- Explain: Problem → Solution → Impact
- Include metrics: "Reduced deployment time from 2 hours to 8 minutes"

**4. Admit limitations**:
- "This is a demo environment with simulated data"
- "In production, I'd add [X] for security"
- Shows honest self-assessment

**5. Connect to the role**:
- "For Acme Corp with 50 developers, this branching strategy would..."
- "This pipeline architecture could handle your deployment frequency..."

---

## Quick Wins: Minimum Viable Portfolio

**Don't have time for all 5 projects?** Here's the minimum:

### Week 1-2: CI/CD Pipeline (MUST HAVE)
- Set up GitLab repository
- Create `.gitlab-ci.yml` with 3 stages (validate, test, deploy)
- Deploy to one Salesforce sandbox
- Write good README with demo video

### Week 3: Add Testing
- Create Test Data Factory
- Write bulk tests (200 records)
- Integrate test execution into pipeline

### Week 4: Add Automation Scripts
- deployment script
- Rollback script
- Coverage check script

**That's it.** 3 projects in 4 weeks.

Then practice presenting them:
- 2-minute overview of each
- 5-minute deep dive if asked
- Connect to Acme Corp requirements

---

## Common Portfolio Mistakes to Avoid

### ❌ Mistake 1: No README or poor README
**Fix**: Every project needs a professional README with:
- What it does
- Why it matters
- How to use it
- Demo/screenshots

### ❌ Mistake 2: Just code, no explanation
**Fix**: Include:
- Architecture docs
- Decision explanations
- Lessons learned

### ❌ Mistake 3: Half-finished projects
**Fix**: Finish fewer projects completely rather than many partially

### ❌ Mistake 4: No live demo or video
**Fix**: Record a 5-minute walkthrough video
- Shows it actually works
- Easier than live demo in interview

### ❌ Mistake 5: Copying tutorials without understanding
**Fix**: Customize, extend, and explain in your own words

### ❌ Mistake 6: Not connecting to the role
**Fix**: Every project should answer: "How does this relate to Acme Corp?"

---

## Key Takeaways

✅ **5 projects minimum**: CI/CD pipeline, branching strategy, testing, scripts, documentation

✅ **Quality over quantity**: Better to have 3 excellent projects than 10 mediocre ones

✅ **Professional presentation**: Good READMEs, demo videos, clear documentation

✅ **Tell the story**: Problem → Solution → Impact (with metrics)

✅ **Connect to the role**: Relate every project to Acme Corp requirements

✅ **Show, don't tell**: Working demos prove competence better than claims

✅ **GitHub profile matters**: Pin best projects, contribute regularly, professional README

---

## Up Next: Behavioral Interview Preparation

You have the technical skills and portfolio. Now let's prepare for behavioral questions using the STAR method.

**Next topic**: Answering behavioral questions specific to DevOps Lead roles, including:
- STAR method for structuring answers
- Common behavioral questions for DevOps roles
- Acme Corp-specific scenarios
- Demonstrating leadership without being a manager yet
- Handling conflict, mistakes, and failure

Get ready for behavioral interviews: **[Behavioral Interview Prep →](/docs/interview-prep/behavioral-interview-prep)**

---

**Pro tip**: Start your portfolio TODAY. Don't wait until it's perfect. Create the repository, add a README, commit one script. Then iterate. A portfolio that exists but needs improvement is infinitely better than a perfect portfolio that never gets started.
