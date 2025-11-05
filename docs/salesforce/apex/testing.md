---
sidebar_position: 4
title: Apex Testing
description: Write comprehensive test classes for production-ready code
---

# Apex Testing: Quality Assurance

Testing is mandatory in Salesforce. You must have 75% code coverage to deploy to production. But more importantly, tests ensure your code works correctly and continues to work as changes are made.

## 🎯 What You'll Learn

- Why testing is critical
- Test class structure
- Test data creation
- Assertions and verification
- Testing triggers and classes
- Code coverage
- Test-driven development (TDD)
- Common testing patterns
- Best practices

## 📊 Why Test?

### Salesforce Requirements

- **75% code coverage** required for production deployment
- All triggers must have some coverage
- Tests must pass before deployment
- Run all tests before major releases

### Real Benefits Beyond Requirements

```
✅ Catch bugs before users do
✅ Refactor code with confidence
✅ Document how code should work
✅ Prevent regression (old bugs coming back)
✅ Enable continuous integration
✅ Make code reviewable
```

## 🏗️ Test Class Structure

### Basic Test Class

```apex
@isTest
private class PropertyControllerTest {

    @isTest
    static void testGetProperties() {
        // Setup - Create test data
        Property__c prop = new Property__c(
            Name = 'Test Property',
            Listing_Price__c = 500000
        );
        insert prop;

        // Execute - Call the method being tested
        Test.startTest();
        List<Property__c> results = PropertyController.getProperties();
        Test.stopTest();

        // Verify - Assert expected results
        System.assertEquals(1, results.size(), 'Should return 1 property');
        System.assertEquals('Test Property', results[0].Name, 'Name should match');
    }
}
```

### Key Annotations

```apex
@isTest
- Mark class or method as test
- Test classes don't count toward code coverage
- Test data doesn't commit to database

@TestSetup
- Create data once, used by all test methods
- Faster than creating data in each method

@isTest(SeeAllData=true)
- NOT RECOMMENDED - accesses real org data
- Makes tests unreliable
- Avoid unless absolutely necessary
```

## 🔨 Creating Test Data

### Manual Data Creation

```apex
@isTest
static void testPropertyCalculations() {
    // Create Account
    Account acc = new Account(Name = 'Test Account');
    insert acc;

    // Create Property
    Property__c prop = new Property__c(
        Name = 'Test Property',
        Account__c = acc.Id,
        Listing_Price__c = 500000,
        Square_Footage__c = 2000,
        Status__c = 'Available'
    );
    insert prop;

    // Create Contact (Agent)
    Contact agent = new Contact(
        FirstName = 'Test',
        LastName = 'Agent',
        Email = 'test@example.com',
        AccountId = acc.Id
    );
    insert agent;

    // Test code here
}
```

### @TestSetup Method (Recommended)

```apex
@isTest
private class PropertyTriggerTest {

    @TestSetup
    static void setupData() {
        // Create once, available to all test methods

        Account acc = new Account(Name = 'Test Account');
        insert acc;

        List<Property__c> properties = new List<Property__c>();
        for(Integer i = 0; i < 10; i++) {
            properties.add(new Property__c(
                Name = 'Property ' + i,
                Account__c = acc.Id,
                Listing_Price__c = 500000 + (i * 10000),
                Status__c = 'Available'
            ));
        }
        insert properties;
    }

    @isTest
    static void testPropertyUpdate() {
        // Data from @TestSetup is available
        List<Property__c> properties = [SELECT Id, Status__c FROM Property__c];
        System.assertEquals(10, properties.size(), 'Should have 10 properties');

        // Test code
    }

    @isTest
    static void testPropertyDelete() {
        // Same data available here too
        List<Property__c> properties = [SELECT Id FROM Property__c];
        System.assertEquals(10, properties.size(), 'Should have 10 properties');

        // Test code
    }
}
```

### Test Data Factory Pattern

```apex
@isTest
public class TestDataFactory {

    public static Account createAccount(String name) {
        Account acc = new Account(Name = name, Industry = 'Technology');
        insert acc;
        return acc;
    }

    public static List<Property__c> createProperties(Integer count, Id accountId) {
        List<Property__c> properties = new List<Property__c>();

        for(Integer i = 0; i < count; i++) {
            properties.add(new Property__c(
                Name = 'Test Property ' + i,
                Account__c = accountId,
                Listing_Price__c = 500000,
                Status__c = 'Available',
                Square_Footage__c = 2000,
                Bedrooms__c = 3,
                Bathrooms__c = 2
            ));
        }

        insert properties;
        return properties;
    }

    public static Contact createAgent(Id accountId) {
        Contact agent = new Contact(
            FirstName = 'Test',
            LastName = 'Agent',
            AccountId = accountId,
            Email = 'agent@example.com'
        );
        insert agent;
        return agent;
    }
}
```

**Usage:**
```apex
@isTest
static void testWithFactory() {
    Account acc = TestDataFactory.createAccount('Test Account');
    List<Property__c> props = TestDataFactory.createProperties(5, acc.Id);
    Contact agent = TestDataFactory.createAgent(acc.Id);

    // Test code
}
```

## ✅ Assertions

### System.assert Methods

```apex
// Basic assertion
System.assert(condition, 'Error message if false');
System.assert(count > 0, 'Count should be greater than 0');

// Equality assertion
System.assertEquals(expected, actual, 'Error message');
System.assertEquals(5, properties.size(), 'Should have 5 properties');
System.assertEquals('Sold', prop.Status__c, 'Status should be Sold');

// Not equals assertion
System.assertNotEquals(unexpected, actual, 'Error message');
System.assertNotEquals(null, prop.Id, 'Id should not be null');
```

### Common Assertions

```apex
// Verify record was inserted
System.assertNotEquals(null, prop.Id, 'Property should have an Id');

// Verify field was updated
System.assertEquals('Sold', updatedProp.Status__c, 'Status should be updated');

// Verify collection size
System.assertEquals(10, properties.size(), 'Should return 10 properties');

// Verify collection is not empty
System.assert(!properties.isEmpty(), 'Properties list should not be empty');

// Verify exception was thrown
try {
    PropertyController.deleteProperty(null);
    System.assert(false, 'Should have thrown exception');
} catch(Exception e) {
    System.assert(e.getMessage().contains('Id cannot be null'), 'Should have correct error message');
}
```

## 🧪 Testing Different Components

### Testing Apex Classes

```apex
public class PropertyController {
    public static List<Property__c> getAvailableProperties() {
        return [
            SELECT Id, Name, Listing_Price__c
            FROM Property__c
            WHERE Status__c = 'Available'
            ORDER BY Listing_Price__c DESC
        ];
    }

    public static void updatePropertyStatus(Id propertyId, String newStatus) {
        Property__c prop = new Property__c(
            Id = propertyId,
            Status__c = newStatus
        );
        update prop;
    }
}
```

**Test Class:**
```apex
@isTest
private class PropertyControllerTest {

    @TestSetup
    static void setup() {
        TestDataFactory.createProperties(10, null);
    }

    @isTest
    static void testGetAvailableProperties() {
        // Setup - mark 5 as sold
        List<Property__c> props = [SELECT Id FROM Property__c LIMIT 5];
        for(Property__c p : props) {
            p.Status__c = 'Sold';
        }
        update props;

        // Execute
        Test.startTest();
        List<Property__c> available = PropertyController.getAvailableProperties();
        Test.stopTest();

        // Verify
        System.assertEquals(5, available.size(), 'Should return 5 available properties');
    }

    @isTest
    static void testUpdatePropertyStatus() {
        Property__c prop = [SELECT Id, Status__c FROM Property__c LIMIT 1];
        System.assertEquals('Available', prop.Status__c, 'Initial status');

        // Execute
        Test.startTest();
        PropertyController.updatePropertyStatus(prop.Id, 'Sold');
        Test.stopTest();

        // Verify
        Property__c updated = [SELECT Status__c FROM Property__c WHERE Id = :prop.Id];
        System.assertEquals('Sold', updated.Status__c, 'Status should be updated');
    }
}
```

### Testing Triggers

```apex
@isTest
private class PropertyTriggerTest {

    @isTest
    static void testBeforeInsertSetDefaults() {
        // Execute
        Test.startTest();
        Property__c prop = new Property__c(
            Name = 'Test Property',
            Listing_Price__c = 500000
            // Status__c not set - should default to 'Available'
        );
        insert prop;
        Test.stopTest();

        // Verify
        Property__c inserted = [SELECT Status__c FROM Property__c WHERE Id = :prop.Id];
        System.assertEquals('Available', inserted.Status__c, 'Should default to Available');
    }

    @isTest
    static void testAfterInsertTaskCreation() {
        // Setup
        Property__c prop = new Property__c(
            Name = 'Test Property',
            Listing_Price__c = 500000
        );

        // Execute
        Test.startTest();
        insert prop;
        Test.stopTest();

        // Verify
        List<Task> tasks = [SELECT Subject FROM Task WHERE WhatId = :prop.Id];
        System.assertEquals(1, tasks.size(), 'Should create 1 task');
        System.assert(tasks[0].Subject.contains('photography'), 'Task subject should mention photography');
    }

    @isTest
    static void testBulkInsert() {
        // Setup - 200 records
        List<Property__c> properties = new List<Property__c>();
        for(Integer i = 0; i < 200; i++) {
            properties.add(new Property__c(
                Name = 'Property ' + i,
                Listing_Price__c = 500000
            ));
        }

        // Execute
        Test.startTest();
        insert properties;
        Test.stopTest();

        // Verify - no governor limit exceptions
        System.assertEquals(200, [SELECT COUNT() FROM Property__c], '200 properties inserted');
        System.assertEquals(200, [SELECT COUNT() FROM Task], '200 tasks created');
    }
}
```

### Testing Batch Apex

```apex
@isTest
static void testBatchClass() {
    // Setup
    TestDataFactory.createProperties(250, null); // More than batch size

    // Execute
    Test.startTest();
    PropertyCleanupBatch batch = new PropertyCleanupBatch();
    Database.executeBatch(batch, 200);
    Test.stopTest();

    // Verify - Test.stopTest() waits for batch to complete
    // Check results
}
```

### Testing Future Methods

```apex
@future
public static void sendEmailAsync(Id propertyId) {
    // Send email logic
}
```

**Test:**
```apex
@isTest
static void testFutureMethod() {
    Property__c prop = TestDataFactory.createProperties(1, null)[0];

    // Execute
    Test.startTest();
    PropertyEmailer.sendEmailAsync(prop.Id);
    Test.stopTest(); // Future method completes here

    // Verify
    // Check email was sent (if using mock or test email)
}
```

### Testing with Exceptions

```apex
@isTest
static void testExceptionHandling() {
    Property__c prop = new Property__c(
        Name = 'Test',
        Listing_Price__c = -1000 // Invalid price
    );

    // Execute & Verify
    Test.startTest();
    try {
        insert prop;
        System.assert(false, 'Should have thrown exception');
    } catch(DmlException e) {
        System.assert(e.getMessage().contains('Price must be positive'), 'Should have correct error message');
    }
    Test.stopTest();
}
```

## 📊 Code Coverage

### Viewing Coverage

```
1. Developer Console → Test → Run Tests
2. Select test class → Run
3. View "Code Coverage" tab
4. Click class name to see line-by-line coverage
```

### Coverage Reports

```apex
// Lines with coverage shown in blue
public class PropertyController {
    public static List<Property__c> getProperties() {
        return [SELECT Id FROM Property__c]; // ✅ Covered
    }

    public static void deleteProperty(Id propId) {
        delete [SELECT Id FROM Property__c WHERE Id = :propId]; // ❌ Not covered
    }
}
```

**Coverage: 50%** (1 of 2 methods covered)

### Improving Coverage

```apex
@isTest
private class PropertyControllerTest {

    @isTest
    static void testGetProperties() {
        TestDataFactory.createProperties(1, null);

        Test.startTest();
        List<Property__c> props = PropertyController.getProperties();
        Test.stopTest();

        System.assertEquals(1, props.size());
    }

    @isTest
    static void testDeleteProperty() {
        // NOW TESTING THE SECOND METHOD
        Property__c prop = TestDataFactory.createProperties(1, null)[0];

        Test.startTest();
        PropertyController.deleteProperty(prop.Id);
        Test.stopTest();

        System.assertEquals(0, [SELECT COUNT() FROM Property__c]);
    }
}
```

**Coverage: 100%** ✅

## 🎯 Test-Driven Development (TDD)

### The TDD Cycle

```
1. Write failing test (RED)
   ↓
2. Write minimum code to pass (GREEN)
   ↓
3. Refactor code (REFACTOR)
   ↓
Repeat
```

### TDD Example

**Step 1: Write Failing Test**
```apex
@isTest
static void testCalculateCommission() {
    Property__c prop = new Property__c(
        Name = 'Test',
        Sold_Price__c = 500000
    );

    Test.startTest();
    Decimal commission = PropertyCalculator.calculateCommission(prop);
    Test.stopTest();

    System.assertEquals(30000, commission, '6% of 500000 is 30000');
}
```

**Step 2: Write Minimum Code**
```apex
public class PropertyCalculator {
    public static Decimal calculateCommission(Property__c prop) {
        return prop.Sold_Price__c * 0.06;
    }
}
```

**Step 3: Test Passes - Refactor if Needed**
```apex
public class PropertyCalculator {
    private static final Decimal COMMISSION_RATE = 0.06;

    public static Decimal calculateCommission(Property__c prop) {
        if(prop.Sold_Price__c == null) {
            return 0;
        }
        return prop.Sold_Price__c * COMMISSION_RATE;
    }
}
```

## 💡 Testing Best Practices

### ✅ DO:

1. **Test One Thing Per Method**
   ```apex
   @isTest
   static void testInsert() { /* test insert only */ }

   @isTest
   static void testUpdate() { /* test update only */ }

   @isTest
   static void testDelete() { /* test delete only */ }
   ```

2. **Use Descriptive Names**
   ```apex
   ✅ testInsertSetsDefaultStatus()
   ✅ testUpdateInvalidPriceThrowsException()
   ❌ test1()
   ❌ testMethod()
   ```

3. **Test Bulk Operations**
   ```apex
   @isTest
   static void testBulkInsert() {
       List<Property__c> props = new List<Property__c>();
       for(Integer i = 0; i < 200; i++) {
           props.add(new Property__c(Name = 'Prop ' + i));
       }
       insert props;
   }
   ```

4. **Use Test.startTest() and Test.stopTest()**
   ```apex
   Test.startTest();
   // Code being tested - gets fresh governor limits
   Test.stopTest();
   // Async code completes here
   ```

5. **Test Both Positive and Negative Cases**
   ```apex
   @isTest
   static void testValidData() { /* happy path */ }

   @isTest
   static void testInvalidData() { /* error handling */ }
   ```

6. **Use Assertions**
   ```apex
   System.assertEquals(expected, actual, 'Message');
   System.assertNotEquals(unexpected, actual, 'Message');
   System.assert(condition, 'Message');
   ```

### ❌ DON'T:

1. **Don't Use SeeAllData=true**
   ```apex
   ❌ @isTest(SeeAllData=true)
   // Makes tests unreliable
   ```

2. **Don't Test Salesforce Functionality**
   ```apex
   ❌ Testing that insert actually inserts
   ✅ Test YOUR business logic
   ```

3. **Don't Ignore Test Failures**
   ```
   Fix tests immediately
   Treat test failures like production bugs
   ```

4. **Don't Write Tests Just for Coverage**
   ```apex
   ❌ Test with no assertions
   ✅ Test that verifies behavior
   ```

5. **Don't Hardcode IDs**
   ```apex
   ❌ Id accId = '0011234567890ABC';
   ✅ Account acc = TestDataFactory.createAccount();
   ```

## 📚 Interview Questions

**Q: What is the minimum code coverage required for production?**
A: 75% overall code coverage, and every trigger must have some coverage. Individual classes don't need 75%, but overall org does.

**Q: What happens in Test.startTest() and Test.stopTest()?**
A:
- **startTest()**: Resets governor limits, starts async execution context
- **stopTest()**: Forces async operations to complete (future, batch, queueable), marks end of test

**Q: Should you use SeeAllData=true?**
A: No, avoid it. It makes tests unpredictable because they depend on real org data which can change. Always create your own test data.

**Q: How do you test bulk operations?**
A: Create 200+ records in a list and perform operations on them. This ensures your code handles bulk properly and doesn't hit governor limits.

**Q: What's the purpose of @TestSetup?**
A: Creates test data once that's available to all test methods in the class. More efficient than creating data in each method. Data is rolled back after each test method.

**Q: Can test data see production data?**
A: No, by default test data is isolated. Tests don't see production data unless you use SeeAllData=true (not recommended).

## 🚀 Next Steps

Congratulations! You've mastered Apex testing. You're now ready for production development!

**Review the complete Salesforce track:**
- ✅ Platform Fundamentals
- ✅ Data Modeling
- ✅ Declarative Development
- ✅ Apex Programming
- ✅ Triggers
- ✅ Testing
- ✅ Lightning Web Components
- ✅ Metadata & Deployment

**Ready for DevOps?**

**[→ Start DevOps Track](/docs/intro)**

Learn CI/CD, automated testing in pipelines, and production deployment strategies!

---

**You're now a production-ready Salesforce developer!** Time to automate deployments with DevOps. 🚀
