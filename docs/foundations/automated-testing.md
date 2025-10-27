# Why Automated Testing Matters

**Learning Objective**: Understand the critical role of testing in Salesforce DevOps and how to write effective tests.

---

## The $2 Million Bug

A developer makes a "small change" to an Apex trigger. Looks fine. No obvious errors.

The change gets deployed to production Friday afternoon.

Monday morning, customer service discovers they can't create new cases. At all. The save button just spins.

Investigation reveals: The trigger has a null pointer exception when the Case Priority field is blank. Cases created through the web form always have blank priority initially.

**Impact**:
- 5,000 customers can't get support
- Customer service team (200 people) sitting idle
- Emergency fix takes 4 hours to develop and deploy
- Estimated business impact: $2 million in lost productivity and reputation damage

**The question**: Could this have been prevented?

**The answer**: Yes. A 5-line test would have caught it.

```apex
@isTest
static void testCaseTriggerWithNullPriority() {
    Case c = new Case(Subject = 'Test', Priority = null);
    Test.startTest();
    insert c; // This would have failed in testing
    Test.stopTest();
    System.assertNotEquals(null, c.Id);
}
```

This test runs in 0.3 seconds. Would have caught the bug before it reached production.

**This is why testing matters.**

---

## What Automated Testing Actually Means

**Simple definition**: Code that tests your code automatically.

Instead of manually clicking through your app to see if it works, you write tests that:
1. Run automatically every time you deploy
2. Verify that business logic works correctly
3. Catch bugs before users see them
4. Give you confidence to make changes

**Example workflow**:

Without tests:
- Developer: "I think this works... let me click around and check"
- Deploys to production
- Hopes nothing breaks
- Users discover bugs

With tests:
- Developer writes code + writes tests
- Commits to Git
- Pipeline runs all 500 tests automatically
- Tests catch the bug
- Developer fixes before deployment
- Production stays stable

---

## Why Salesforce Requires 75% Test Coverage

Salesforce has a hard rule: You cannot deploy to production unless 75% of your Apex code is covered by tests.

**Why this rule exists**:

Salesforce is multi-tenant. Your code runs on shared infrastructure with thousands of other customers. A bad deployment could affect everyone.

Test coverage ensures:
- You've actually tested your code
- Business logic is verified
- Governor limits are checked
- Edge cases are handled

**What 75% coverage means**:

If you have 100 lines of Apex code, at least 75 lines must be executed by your tests.

**Example**:

```apex
public class AccountHandler {
    public static void updateRating(Account acc) {  // Line 1
        if (acc.AnnualRevenue > 1000000) {          // Line 2 - covered
            acc.Rating = 'Hot';                      // Line 3 - covered
        } else if (acc.AnnualRevenue > 100000) {    // Line 4 - covered
            acc.Rating = 'Warm';                     // Line 5 - NOT covered
        } else {                                     // Line 6 - covered
            acc.Rating = 'Cold';                     // Line 7 - covered
        }                                            // Line 8
    }
}
```

If your test only checks the revenue > 1M case and revenue < 100K case, Line 5 never executes. Coverage = 6/7 = 86%. Passes.

But you haven't actually tested the middle case! The logic might be broken there.

**Best practice**: Aim for 80-85% coverage AND test all logical branches.

---

## Good Tests vs Bad Tests

Not all tests are equal. Let's compare:

### Bad Test (Just for Coverage)

```apex
@isTest
static void testAccountTrigger() {
    Account a = new Account(Name = 'Test');
    insert a;
    // No assertions. Just executes code for coverage.
}
```

**Problems**:
- Doesn't verify anything
- Won't catch bugs
- Gives false confidence
- "Testing theater" - looks like testing but isn't

### Good Test

```apex
@isTest
static void testAccountTriggerSetsRatingForLargeAccount() {
    // Arrange: Set up test data
    Account a = new Account(
        Name = 'Big Corp',
        AnnualRevenue = 5000000
    );

    // Act: Perform the action
    Test.startTest();
    insert a;
    Test.stopTest();

    // Assert: Verify the result
    Account result = [SELECT Rating FROM Account WHERE Id = :a.Id];
    System.assertEquals('Hot', result.Rating,
        'Account with revenue > 1M should be rated Hot');
}
```

**Why it's good**:
- Tests ONE specific scenario
- Has clear setup (Arrange)
- Performs specific action (Act)
- Verifies expected outcome (Assert)
- Will fail if logic breaks
- Has descriptive name and assertion message

---

## Types of Tests in Salesforce

### Unit Tests (Most Common)

**What**: Test individual methods in isolation

**Example**: Testing a single method that calculates discount

**When to use**: For all business logic, utility methods, helper classes

```apex
@isTest
static void testCalculateDiscount_TenPercent() {
    Decimal price = 100;
    Decimal discount = DiscountCalculator.calculate(price, 'STANDARD');
    System.assertEquals(90, discount);
}
```

### Integration Tests

**What**: Test how multiple components work together

**Example**: Trigger calls a class that calls an API

**When to use**: For complex workflows involving multiple classes

```apex
@isTest
static void testOrderProcessingEndToEnd() {
    // Create account, contact, opportunity, quote
    // Process order
    // Verify: Account updated, Order created, Email sent
}
```

### Bulk Tests

**What**: Test with large data volumes (200+ records)

**Example**: Trigger handles 200 records in one transaction

**When to use**: Always test triggers with bulk data (Salesforce processes in batches)

```apex
@isTest
static void testAccountTriggerHandles200Records() {
    List<Account> accounts = new List<Account>();
    for (Integer i = 0; i < 200; i++) {
        accounts.add(new Account(Name = 'Test ' + i));
    }

    Test.startTest();
    insert accounts;
    Test.stopTest();

    // Verify all 200 were processed correctly
    List<Account> results = [SELECT Rating FROM Account];
    System.assertEquals(200, results.size());
}
```

### Negative Tests

**What**: Test that errors are handled properly

**Example**: What happens when user provides invalid input?

**When to use**: For validation rules, error handling, edge cases

```apex
@isTest
static void testCreateAccount_InvalidName_ThrowsException() {
    Account a = new Account(Name = ''); // Invalid

    try {
        insert a;
        System.assert(false, 'Should have thrown exception');
    } catch (DmlException e) {
        System.assert(e.getMessage().contains('Name is required'));
    }
}
```

---

## Writing Your First Apex Test

Let's write a complete test step-by-step.

**Scenario**: We have a class that updates Case priority based on Account tier.

**The Code** (CasePriorityHandler.cls):

```apex
public class CasePriorityHandler {
    public static void updatePriority(List<Case> cases) {
        Set<Id> accountIds = new Set<Id>();
        for (Case c : cases) {
            if (c.AccountId != null) {
                accountIds.add(c.AccountId);
            }
        }

        Map<Id, Account> accounts = new Map<Id, Account>(
            [SELECT Id, Tier__c FROM Account WHERE Id IN :accountIds]
        );

        for (Case c : cases) {
            if (c.AccountId != null && accounts.containsKey(c.AccountId)) {
                Account acc = accounts.get(c.AccountId);
                if (acc.Tier__c == 'Platinum') {
                    c.Priority = 'High';
                } else if (acc.Tier__c == 'Gold') {
                    c.Priority = 'Medium';
                } else {
                    c.Priority = 'Low';
                }
            }
        }
    }
}
```

**The Test** (CasePriorityHandlerTest.cls):

```apex
@isTest
private class CasePriorityHandlerTest {

    @TestSetup
    static void setupTestData() {
        // Runs once, creates data for all test methods
        List<Account> accounts = new List<Account>{
            new Account(Name = 'Platinum Account', Tier__c = 'Platinum'),
            new Account(Name = 'Gold Account', Tier__c = 'Gold'),
            new Account(Name = 'Bronze Account', Tier__c = 'Bronze')
        };
        insert accounts;
    }

    @isTest
    static void testPlatinumAccountCaseGetsHighPriority() {
        // Arrange
        Account platinumAcc = [SELECT Id FROM Account WHERE Tier__c = 'Platinum' LIMIT 1];
        Case c = new Case(
            AccountId = platinumAcc.Id,
            Subject = 'Test Case',
            Priority = 'Low' // Starting value
        );
        insert c;

        // Act
        List<Case> cases = new List<Case>{c};
        Test.startTest();
        CasePriorityHandler.updatePriority(cases);
        Test.stopTest();
        update cases;

        // Assert
        Case result = [SELECT Priority FROM Case WHERE Id = :c.Id];
        System.assertEquals('High', result.Priority,
            'Platinum account cases should have High priority');
    }

    @isTest
    static void testGoldAccountCaseGetsMediumPriority() {
        // Test the gold tier scenario
        Account goldAcc = [SELECT Id FROM Account WHERE Tier__c = 'Gold' LIMIT 1];
        Case c = new Case(AccountId = goldAcc.Id, Subject = 'Test');
        insert c;

        List<Case> cases = new List<Case>{c};
        Test.startTest();
        CasePriorityHandler.updatePriority(cases);
        Test.stopTest();
        update cases;

        Case result = [SELECT Priority FROM Case WHERE Id = :c.Id];
        System.assertEquals('Medium', result.Priority);
    }

    @isTest
    static void testBulkCaseHandling() {
        // Test with 200 cases (bulk scenario)
        Account platinumAcc = [SELECT Id FROM Account WHERE Tier__c = 'Platinum' LIMIT 1];
        List<Case> cases = new List<Case>();

        for (Integer i = 0; i < 200; i++) {
            cases.add(new Case(
                AccountId = platinumAcc.Id,
                Subject = 'Bulk Test ' + i
            ));
        }
        insert cases;

        Test.startTest();
        CasePriorityHandler.updatePriority(cases);
        Test.stopTest();
        update cases;

        List<Case> results = [SELECT Priority FROM Case WHERE Id IN :cases];
        for (Case c : results) {
            System.assertEquals('High', c.Priority, 'All cases should be High priority');
        }
    }
}
```

**Key patterns**:
- `@TestSetup`: Creates data once for all tests
- `@isTest`: Marks methods as tests
- `Test.startTest() / Test.stopTest()`: Resets governor limits
- Descriptive method names
- Clear Arrange-Act-Assert structure
- Assertions with custom messages

---

## Common Testing Patterns

### Pattern 1: Test Setup

Use `@TestSetup` for data that multiple tests need:

```apex
@TestSetup
static void setupData() {
    // Creates shared test data
    insert new Account(Name = 'Test Account');
}
```

### Pattern 2: Governor Limit Reset

Use `Test.startTest()` and `Test.stopTest()`:

```apex
Test.startTest(); // Resets governor limits
// Your code here gets fresh limits
Test.stopTest();  // Limits reset again
```

### Pattern 3: Test Data Factory

Create a utility class for test data:

```apex
@isTest
public class TestDataFactory {
    public static Account createAccount(String name) {
        return new Account(Name = name, Industry = 'Technology');
    }

    public static List<Account> createAccounts(Integer count) {
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < count; i++) {
            accounts.add(createAccount('Test Account ' + i));
        }
        return accounts;
    }
}

// Usage in tests:
Account testAcc = TestDataFactory.createAccount('My Test');
insert testAcc;
```

### Pattern 4: Mock External Callouts

For code that makes HTTP callouts:

```apex
@isTest
global class MockHttpResponse implements HttpCalloutMock {
    global HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(200);
        res.setBody('{"status": "success"}');
        return res;
    }
}

@isTest
static void testExternalAPI() {
    Test.setMock(HttpCalloutMock.class, new MockHttpResponse());

    Test.startTest();
    String result = MyAPIClass.callExternalService();
    Test.stopTest();

    System.assertEquals('success', result);
}
```

---

## Running Tests

### In VS Code:
```
Right-click test class → Run Apex Tests
```

### Via SFDX CLI:
```bash
# Run all tests
sfdx force:apex:test:run

# Run specific test class
sfdx force:apex:test:run -n CasePriorityHandlerTest

# Run with code coverage
sfdx force:apex:test:run --codecoverage
```

### In Salesforce UI:
```
Setup → Apex Test Execution → Select Tests → Run
```

### In Pipeline:
```bash
# Deploy with running tests
sfdx force:source:deploy -p force-app/ --testlevel RunLocalTests
```

---

## Quick Check: Test Your Understanding

**Question 1**: Why do we need tests if Salesforce has a UI to manually check functionality?

<details>
<summary>Click to see answer</summary>

**Answer**: Manual testing doesn't scale and catches bugs too late.

**Problems with manual testing**:
- Takes hours to test everything
- Humans miss edge cases
- Can't test every scenario before every deployment
- Bugs found after deployment = users affected

**Benefits of automated tests**:
- Run in minutes, not hours
- Test every scenario every time
- Catch bugs before deployment
- Give confidence to make changes
- Document how code should work

</details>

**Question 2**: What's wrong with this test?

```apex
@isTest
static void testMyClass() {
    MyClass.doSomething();
}
```

<details>
<summary>Click to see answer</summary>

**Problems**:
1. No assertions - doesn't verify anything
2. No test data setup
3. Vague name - what does it test?
4. Won't catch bugs

**Better version**:
```apex
@isTest
static void testDoSomething_UpdatesAccountRating() {
    Account a = new Account(Name = 'Test', AnnualRevenue = 5000000);
    insert a;

    Test.startTest();
    MyClass.doSomething(a.Id);
    Test.stopTest();

    Account result = [SELECT Rating FROM Account WHERE Id = :a.Id];
    System.assertEquals('Hot', result.Rating,
        'High revenue accounts should be rated Hot');
}
```

</details>

---

## Key Takeaways

✅ **Tests are the safety net** - They catch bugs before users see them

✅ **75% coverage is minimum** - Aim for 80-85% with meaningful tests

✅ **Good tests have assertions** - Verify expected outcomes, not just code coverage

✅ **Test all scenarios** - Positive cases, negative cases, bulk data, edge cases

✅ **Tests document behavior** - They show how code should work

✅ **Automated tests enable DevOps** - Without tests, automation is too risky

---

## Up Next: Setting Up Your Development Environment

You now understand all the concepts:
- What DevOps is (Page 1)
- Salesforce environments (Page 2)
- Version control with Git (Page 3)
- Salesforce metadata (Page 4)
- CI/CD pipelines (Page 5)
- Automated testing (this page)

**Final step before building**: Set up your development environment with all the tools you need.

Next page covers:
- Installing Salesforce CLI, VS Code, Git
- Configuring everything properly
- Creating your first SFDX project
- Connecting to Salesforce orgs
- Your complete DevOps toolbox

Let's get your environment ready: **[Development Environment Setup →](/docs/foundations/dev-environment-setup)**

---

**Pro tip**: Write tests as you code, not after. It's easier to test small pieces as you build them than to test a large completed feature.
