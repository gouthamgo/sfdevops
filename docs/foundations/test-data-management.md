# Test Data Management

## The Testing Nightmare

Your QA team is testing a new feature in the sandbox. They create 50 test accounts, 200 opportunities, and 500 contacts. Tests pass. Feature looks good.

You deploy to production. Within an hour: "The opportunity workflow isn't firing!"

The bug? The workflow only activates for accounts with a specific Industry value. Your test data had random industry values. 3% matched. In production, 60% match. The workflow runs constantly, hitting governor limits.

Your tests passed because your test data didn't reflect reality.

**This is the test data problem.**

## Why Test Data Matters

**Bad test data leads to:**
- False positives (tests pass but code is broken)
- False negatives (tests fail but code is correct)
- Can't reproduce bugs
- Slow test execution
- Flaky tests

**Good test data:**
- Reflects production patterns
- Is consistent across environments
- Is easy to recreate
- Doesn't contain sensitive information
- Enables comprehensive testing

Let's build a test data management strategy.

## Test Data Strategies

### Strategy 1: Generate Data in Tests (Unit Tests)

**Best for**: Unit tests, isolated feature testing

```java
@IsTest
public class AccountTriggerTest {

    @TestSetup
    static void setupTestData() {
        // Create test accounts
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 200; i++) {
            accounts.add(new Account(
                Name = 'Test Account ' + i,
                Industry = 'Technology',
                AnnualRevenue = 1000000 + (i * 10000),
                BillingCountry = 'United States'
            ));
        }
        insert accounts;
    }

    @IsTest
    static void testAccountTrigger() {
        // Test uses data from @TestSetup
        List<Account> accounts = [SELECT Id, Name FROM Account];
        System.assertEquals(200, accounts.size());

        // Run test logic
    }
}
```

**Pros**:
- Test data is explicit and controlled
- No external dependencies
- Fast to create

**Cons**:
- Doesn't reflect production complexity
- Manual data creation is tedious
- Duplicated across tests

### Strategy 2: Static Test Data Files

**Best for**: Integration tests, consistent datasets

**Create data files**:

`data/accounts.json`:
```json
{
  "records": [
    {
      "attributes": {"type": "Account", "referenceId": "AcctRef1"},
      "Name": "Acme Corporation",
      "Industry": "Technology",
      "AnnualRevenue": 5000000,
      "BillingCountry": "United States",
      "BillingState": "CA"
    },
    {
      "attributes": {"type": "Account", "referenceId": "AcctRef2"},
      "Name": "Global Industries",
      "Industry": "Manufacturing",
      "AnnualRevenue": 10000000,
      "BillingCountry": "United States",
      "BillingState": "NY"
    }
  ]
}
```

`data/contacts.json`:
```json
{
  "records": [
    {
      "attributes": {"type": "Contact", "referenceId": "ContactRef1"},
      "FirstName": "John",
      "LastName": "Doe",
      "Email": "john.doe@acme.com",
      "AccountId": "@AcctRef1"
    },
    {
      "attributes": {"type": "Contact", "referenceId": "ContactRef2"},
      "FirstName": "Jane",
      "LastName": "Smith",
      "Email": "jane.smith@global.com",
      "AccountId": "@AcctRef2"
    }
  ]
}
```

**Data plan** (`data/test-data-plan.json`):
```json
{
  "sobjects": [
    {
      "sobject": "Account",
      "files": ["accounts.json"]
    },
    {
      "sobject": "Contact",
      "files": ["contacts.json"]
    }
  ]
}
```

**Load data**:
```bash
sf data import tree --plan data/test-data-plan.json --target-org my-sandbox
```

**Pros**:
- Consistent data across environments
- Version controlled with code
- Easy to understand and modify

**Cons**:
- Manual maintenance
- Doesn't scale to large datasets
- References get complex

### Strategy 3: Anonymized Production Data

**Best for**: Realistic testing scenarios, performance testing

**Export from production**:
```bash
# Export accounts (with anonymization)
sf data export tree \
  --query "SELECT Id, Name, Industry, AnnualRevenue, BillingCountry FROM Account WHERE CreatedDate = LAST_N_DAYS:90 LIMIT 1000" \
  --target-org production \
  --output-dir data/export-prod

# Anonymize sensitive data
node scripts/anonymize-data.js data/export-prod/Account.json
```

**Anonymization script** (`scripts/anonymize-data.js`):
```javascript
const fs = require('fs');
const faker = require('@faker-js/faker');

// Read exported data
const data = JSON.parse(fs.readFileSync('data/export-prod/Account.json'));

// Anonymize
data.records = data.records.map(record => ({
  ...record,
  Name: faker.company.name(),
  BillingStreet: faker.address.streetAddress(),
  Phone: faker.phone.number(),
  // Keep industry, revenue (non-sensitive)
}));

// Write anonymized data
fs.writeFileSync('data/test-data/Account-anonymized.json', JSON.stringify(data, null, 2));
```

**Import to test environment**:
```bash
sf data import tree --plan data/test-data/plan.json --target-org sandbox
```

**Pros**:
- Realistic data distribution
- Real-world scenarios
- Performance testing with production volumes

**Cons**:
- Privacy/compliance concerns (even anonymized)
- Large datasets
- Complex to maintain

### Strategy 4: Synthetic Data Generation

**Best for**: Large volumes, automated testing, CI/CD

**Data factory pattern**:

`tests/TestDataFactory.cls`:
```java
@IsTest
public class TestDataFactory {

    public static List<Account> createAccounts(Integer count) {
        List<Account> accounts = new List<Account>();
        List<String> industries = new List<String>{'Technology', 'Healthcare', 'Manufacturing', 'Retail'};
        List<String> countries = new List<String>{'United States', 'Canada', 'United Kingdom', 'Australia'};

        for (Integer i = 0; i < count; i++) {
            accounts.add(new Account(
                Name = 'Test Account ' + String.valueOf(Math.random()).substring(2, 8),
                Industry = industries[Math.mod(i, industries.size())],
                AnnualRevenue = 100000 + (Math.random() * 10000000).intValue(),
                BillingCountry = countries[Math.mod(i, countries.size())],
                NumberOfEmployees = 10 + (Math.random() * 1000).intValue()
            ));
        }

        return accounts;
    }

    public static List<Contact> createContacts(List<Account> accounts, Integer contactsPerAccount) {
        List<Contact> contacts = new List<Contact>();
        List<String> firstNames = new List<String>{'John', 'Jane', 'Bob', 'Alice', 'Charlie'};
        List<String> lastNames = new List<String>{'Smith', 'Johnson', 'Williams', 'Brown', 'Davis'};

        for (Account acc : accounts) {
            for (Integer i = 0; i < contactsPerAccount; i++) {
                contacts.add(new Contact(
                    FirstName = firstNames[Math.mod(i, firstNames.size())],
                    LastName = lastNames[Math.mod(i, lastNames.size())],
                    Email = 'test.' + String.valueOf(Math.random()).substring(2, 8) + '@test.com',
                    AccountId = acc.Id,
                    Phone = '+1555' + String.valueOf(Math.random()).substring(2, 9)
                ));
            }
        }

        return contacts;
    }

    public static List<Opportunity> createOpportunities(List<Account> accounts) {
        List<Opportunity> opps = new List<Opportunity>();
        List<String> stages = new List<String>{'Prospecting', 'Qualification', 'Proposal', 'Negotiation'};

        for (Account acc : accounts) {
            opps.add(new Opportunity(
                Name = acc.Name + ' - Opportunity',
                AccountId = acc.Id,
                StageName = stages[Math.mod(opps.size(), stages.size())],
                CloseDate = Date.today().addDays(30 + Integer.valueOf(Math.random() * 60)),
                Amount = 10000 + (Math.random() * 100000).intValue()
            ));
        }

        return opps;
    }
}
```

**Usage in tests**:
```java
@IsTest
public class OpportunityTriggerTest {

    @TestSetup
    static void setup() {
        // Generate realistic test data
        List<Account> accounts = TestDataFactory.createAccounts(50);
        insert accounts;

        List<Contact> contacts = TestDataFactory.createContacts(accounts, 3);
        insert contacts;

        List<Opportunity> opps = TestDataFactory.createOpportunities(accounts);
        insert opps;
    }

    @IsTest
    static void testOpportunityTrigger() {
        // Tests use generated data
        List<Opportunity> opps = [SELECT Id, Amount FROM Opportunity];
        System.assertEquals(50, opps.size());

        // Test logic here
    }
}
```

**Pros**:
- Fast generation
- Controlled randomization
- Reusable across tests
- No manual maintenance

**Cons**:
- Doesn't reflect production patterns exactly
- Requires initial development
- May miss edge cases

## Test Data in CI/CD Pipelines

### Seeding Scratch Orgs

**Automated data seeding for scratch orgs**:

`scripts/seed-data.sh`:
```bash
#!/bin/bash
set -e

TARGET_ORG=${1:-scratch}

echo "Seeding test data to $TARGET_ORG..."

# Import from static files
echo "Importing accounts..."
sf data import tree --plan data/seed-data/accounts-plan.json --target-org $TARGET_ORG

echo "Importing contacts..."
sf data import tree --plan data/seed-data/contacts-plan.json --target-org $TARGET_ORG

echo "Importing opportunities..."
sf data import tree --plan data/seed-data/opportunities-plan.json --target-org $TARGET_ORG

# Run Apex data generation for volume
echo "Generating bulk test data..."
sf apex run --file scripts/apex/generate-test-data.apex --target-org $TARGET_ORG

echo "✅ Test data seeded successfully"
```

**Pipeline integration**:
```yaml
test_with_data:
  stage: test
  script:
    # Create scratch org
    - sf org create scratch --alias ci-test --duration-days 1

    # Deploy metadata
    - sf project deploy start --target-org ci-test

    # Seed test data
    - ./scripts/seed-data.sh ci-test

    # Run tests
    - sf apex run test --target-org ci-test --test-level RunLocalTests
```

### Data Templates

**Create reusable data templates**:

`data/templates/sales-scenario.json`:
```json
{
  "name": "Sales Scenario - Enterprise Deal",
  "description": "Large enterprise opportunity with multiple contacts and activities",
  "data": {
    "Account": {
      "Name": "Enterprise Corp",
      "Industry": "Technology",
      "AnnualRevenue": 50000000,
      "NumberOfEmployees": 5000
    },
    "Contacts": [
      {"FirstName": "John", "LastName": "Exec", "Title": "CEO"},
      {"FirstName": "Jane", "LastName": "Tech", "Title": "CTO"},
      {"FirstName": "Bob", "LastName": "Proc", "Title": "Procurement Lead"}
    ],
    "Opportunity": {
      "Name": "Enterprise Deal - 2024",
      "Amount": 500000,
      "StageName": "Negotiation",
      "CloseDate": "2024-12-31"
    }
  }
}
```

**Load template**:
```bash
#!/bin/bash
# scripts/load-template.sh

TEMPLATE=$1
TARGET_ORG=$2

echo "Loading template: $TEMPLATE"

# Parse template and create records
node scripts/load-template.js data/templates/$TEMPLATE.json $TARGET_ORG
```

## Data Masking and Anonymization

### Why Anonymize?

- **Compliance**: GDPR, CCPA, HIPAA
- **Security**: Prevent data leaks in non-production
- **Privacy**: Protect customer information

### Anonymization Approaches

**1. Field-level masking**:
```javascript
// scripts/mask-data.js
function maskEmail(email) {
  return email.replace(/(.{2}).*(@.*)/, '$1***$2');
  // john.doe@company.com → jo***@company.com
}

function maskPhone(phone) {
  return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2');
  // 555-123-4567 → 555-****567
}

function maskName(name) {
  return faker.name.firstName() + ' ' + faker.name.lastName();
}
```

**2. Preserve data patterns**:
```javascript
function maskPreservePattern(value, pattern) {
  // Keep industry, revenue ranges, etc.
  // But change identifying information

  if (pattern === 'revenue') {
    // Keep in same range bucket
    if (value < 100000) return Math.random() * 100000;
    if (value < 1000000) return 100000 + (Math.random() * 900000);
    // etc.
  }
}
```

**3. Referential integrity**:
```javascript
// Keep relationships intact
const accountMapping = new Map();

function anonymizeAccount(account) {
  const newId = generateFakeId();
  accountMapping.set(account.Id, newId);

  return {
    Id: newId,
    Name: faker.company.name(),
    // ... other masked fields
  };
}

function anonymizeContact(contact) {
  return {
    Id: generateFakeId(),
    FirstName: faker.name.firstName(),
    LastName: faker.name.lastName(),
    AccountId: accountMapping.get(contact.AccountId), // Preserved relationship
  };
}
```

### Automated Anonymization Pipeline

```yaml
export_and_anonymize:
  stage: data-prep
  only:
    - schedules  # Run monthly
  script:
    # Export from production
    - ./scripts/export-production-data.sh production

    # Anonymize
    - node scripts/anonymize-data.js data/export-prod data/anonymized

    # Upload to shared storage
    - aws s3 sync data/anonymized s3://company-test-data/monthly/$(date +%Y-%m)

    # Import to sandboxes
    - ./scripts/import-to-all-sandboxes.sh data/anonymized
```

## Managing Data Dependencies

### Parent-Child Relationships

**Correct import order**:
```yaml
import_data:
  script:
    # 1. Parent objects first
    - sf data import tree --plan data/accounts-plan.json

    # 2. Then child objects
    - sf data import tree --plan data/contacts-plan.json
    - sf data import tree --plan data/opportunities-plan.json

    # 3. Then junction objects
    - sf data import tree --plan data/opp-contact-roles-plan.json
```

### Complex Dependencies

**Multi-level relationships**:
```json
{
  "accounts": [
    {
      "attributes": {"referenceId": "ParentAcct1"},
      "Name": "Parent Corp"
    },
    {
      "attributes": {"referenceId": "ChildAcct1"},
      "Name": "Child Corp",
      "ParentId": "@ParentAcct1"
    }
  ]
}
```

### Lookup Relationships

**Using external IDs**:
```bash
# Export with external ID
sf data export tree \
  --query "SELECT Id, ExternalId__c, Name FROM Account" \
  --target-org prod

# Import using external ID (no need to map IDs)
sf data import tree \
  --plan data/plan.json \
  --target-org sandbox
```

## Test Data Cleanup

### After Tests

```java
@IsTest
public class TestWithCleanup {

    @IsTest
    static void testFeature() {
        // Create test data
        Account acc = new Account(Name = 'Test');
        insert acc;

        // Run test
        // ... test logic ...

        // Cleanup happens automatically after test
        // No manual cleanup needed in Apex tests
    }
}
```

### In Sandboxes

**Periodic cleanup**:
```bash
#!/bin/bash
# scripts/cleanup-test-data.sh

TARGET_ORG=$1

echo "Cleaning up test data in $TARGET_ORG..."

# Delete test accounts (marked with test prefix)
sf data delete bulk \
  --sobject Account \
  --where "Name LIKE 'Test%'" \
  --target-org $TARGET_ORG

# Delete old test data (older than 30 days)
sf data delete bulk \
  --sobject Opportunity \
  --where "CreatedDate < LAST_N_DAYS:30 AND Name LIKE '%Test%'" \
  --target-org $TARGET_ORG

echo "✅ Cleanup complete"
```

**Scheduled cleanup**:
```yaml
cleanup_sandbox_data:
  stage: maintenance
  only:
    - schedules  # Weekly
  script:
    - ./scripts/cleanup-test-data.sh dev-sandbox
    - ./scripts/cleanup-test-data.sh qa-sandbox
```

## Test Data Best Practices

### 1. Use Realistic Data Volumes

```java
// Bad: Test with 1 record
@IsTest
static void testTrigger() {
    Account acc = new Account(Name = 'Test');
    insert acc;
    // Only tests single-record scenario
}

// Good: Test with bulk volume
@IsTest
static void testTriggerBulk() {
    List<Account> accounts = TestDataFactory.createAccounts(200);
    insert accounts;
    // Tests governor limits, bulk processing
}
```

### 2. Use Data Factories

Centralize test data creation:
```java
// Reusable across all tests
List<Account> accounts = TestDataFactory.createAccounts(50);
```

### 3. Version Control Test Data

```
data/
├── test-scenarios/
│   ├── enterprise-deal.json
│   ├── small-business.json
│   └── nonprofit.json
├── seed-data/
│   ├── accounts.json
│   ├── contacts.json
│   └── opportunities.json
└── plans/
    ├── full-seed-plan.json
    └── minimal-seed-plan.json
```

### 4. Document Data Patterns

```markdown
# Test Data Documentation

## Account Data Patterns

### Industry Distribution
- Technology: 40%
- Healthcare: 25%
- Manufacturing: 20%
- Other: 15%

### Revenue Ranges
- <$1M: 30%
- $1M-$10M: 40%
- $10M-$100M: 20%
- >$100M: 10%

## Opportunity Data

### Stage Distribution
- Prospecting: 30%
- Qualification: 25%
- Proposal: 20%
- Negotiation: 15%
- Closed Won: 10%

### Amount Distribution
- Median: $50,000
- Mean: $85,000
- Range: $5,000 - $500,000
```

### 5. Separate Seed Data from Test Code

```
❌ Bad:
force-app/main/default/testData/

✅ Good:
data/
  ├── seed-data/
  ├── test-scenarios/
  └── anonymized/
```

## Hands-On Exercise: Build Test Data Strategy

**Objective**: Create a complete test data management system.

**Your Tasks**:

1. Create TestDataFactory class with methods to generate:
   - Accounts (with realistic distribution)
   - Contacts (multiple per account)
   - Opportunities (with various stages)

2. Create static test data files for 3 scenarios:
   - Enterprise deal
   - Small business
   - Non-profit organization

3. Write data seeding script that:
   - Imports static test data
   - Runs Apex data factory for volume
   - Verifies data loaded correctly

4. Create anonymization script that:
   - Masks PII fields
   - Preserves relationships
   - Maintains data patterns

5. Integrate data seeding into CI/CD pipeline

**Deliverables**:

- [ ] TestDataFactory.cls with at least 3 creation methods
- [ ] 3 test scenario JSON files
- [ ] Data seeding script (seed-data.sh)
- [ ] Anonymization script
- [ ] CI/CD pipeline with data seeding
- [ ] Documentation of test data patterns

## Test Data Checklist

Effective test data management includes:

- [ ] TestDataFactory for programmatic generation
- [ ] Static test data files for scenarios
- [ ] Data seeding scripts for automation
- [ ] Anonymization for production data
- [ ] Version-controlled test data
- [ ] Documented data patterns
- [ ] CI/CD integration
- [ ] Cleanup procedures
- [ ] Realistic data volumes
- [ ] Consistent across environments

## What We Learned

Test data is as important as test code:

1. **Multiple strategies**: Static files, factories, anonymized prod data
2. **Realistic patterns**: Reflect production distribution and volumes
3. **Automation**: Seed data in CI/CD pipelines
4. **Privacy**: Anonymize sensitive information
5. **Relationships**: Maintain referential integrity
6. **Cleanup**: Remove stale test data regularly

Good test data enables reliable testing and catches bugs before production.

## What's Next

You can now manage test data effectively. But how do you ensure your code is secure?

Next: **Security Scanning and Compliance Automation**.

You'll learn:
- Automated security scanning (SAST, DAST)
- OWASP Top 10 for Salesforce
- Compliance automation (SOC2, GDPR)
- Secrets detection
- Vulnerability management

See you there!
