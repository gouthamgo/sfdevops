---
sidebar_position: 5
title: Asynchronous Apex
description: Master async processing with Future, Batch, Queueable, and Scheduled Apex
---

# Asynchronous Apex: Handle Long-Running Operations

Asynchronous Apex allows you to run processes in the background, separate from the main transaction. This is essential for handling long-running operations, callouts, and batch processing.

## 🎯 What You'll Learn

- Why asynchronous processing is necessary
- Future methods for simple async operations
- Batch Apex for processing large data sets
- Queueable Apex for complex, chainable jobs
- Scheduled Apex for recurring jobs
- When to use each approach
- Testing asynchronous code
- Governor limits and best practices

## 📊 Why Asynchronous Apex?

### Synchronous Limitations

**Synchronous execution** has strict limits:
- **CPU time**: 10 seconds max
- **Heap size**: 6 MB
- **SOQL queries**: 100 per transaction
- **DML statements**: 150 per transaction
- **Callout time**: 10 seconds max per callout

### Asynchronous Benefits

**Asynchronous execution** gets higher limits:
- **CPU time**: 60 seconds
- **Heap size**: 12 MB
- **SOQL queries**: 200 per transaction
- **DML statements**: 150 per transaction
- **Better performance**: Runs in background without blocking users

### Use Cases

```
Use Async When:
├── Callouts (can't make callouts in triggers)
├── Processing large datasets (10,000+ records)
├── Long-running calculations
├── Scheduled recurring jobs
├── Chain multiple operations
└── Avoid hitting governor limits
```

## ⚡ Future Methods

**Future methods** run asynchronously and are the simplest form of async Apex.

### Basic Syntax

```apex
public class FutureExample {

    // Must be static and void
    @future
    public static void sendEmail(List<String> emails) {
        List<Messaging.SingleEmailMessage> messages = new List<Messaging.SingleEmailMessage>();

        for(String email : emails) {
            Messaging.SingleEmailMessage message = new Messaging.SingleEmailMessage();
            message.setToAddresses(new String[] { email });
            message.setSubject('Welcome!');
            message.setPlainTextBody('Thank you for signing up!');
            messages.add(message);
        }

        Messaging.sendEmail(messages);
    }
}

// Call from trigger or class
FutureExample.sendEmail(new List<String>{'user@example.com'});
```

### Future with Callouts

```apex
public class PropertyAPIService {

    // @future(callout=true) enables HTTP callouts
    @future(callout=true)
    public static void syncToExternalSystem(Set<Id> propertyIds) {
        List<Property__c> properties = [
            SELECT Id, Name, Listing_Price__c, Address__c
            FROM Property__c
            WHERE Id IN :propertyIds
        ];

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.example.com/properties');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(properties));

        Http http = new Http();
        HttpResponse res = http.send(req);

        if(res.getStatusCode() == 200) {
            System.debug('Sync successful: ' + res.getBody());
        } else {
            System.debug('Sync failed: ' + res.getStatusCode());
        }
    }
}

// Call from trigger
@future(callout=true)
PropertyAPIService.syncToExternalSystem(new Set<Id>{propertyId});
```

### Future Method Limitations

```
❌ Limitations:
├── Can't call another @future method
├── Parameters must be primitives or collections of primitives
├── No complex objects (can pass IDs only)
├── No return values
├── Can't track execution status
└── Limited monitoring capabilities
```

**Example: Passing IDs Instead of Objects**
```apex
// ❌ WRONG - Can't pass sObjects
@future
public static void processProperties(List<Property__c> properties) { ... }

// ✅ CORRECT - Pass IDs, query inside method
@future
public static void processProperties(Set<Id> propertyIds) {
    List<Property__c> properties = [SELECT Id, Name FROM Property__c WHERE Id IN :propertyIds];
    // Process properties
}
```

## 🔄 Batch Apex

**Batch Apex** processes large datasets by breaking them into smaller chunks (batches).

### Batch Class Structure

```apex
public class PropertyBatchUpdate implements Database.Batchable<SObject> {

    // 1. START: Query records to process
    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Name, Status__c, Last_Updated__c
            FROM Property__c
            WHERE Status__c = 'Pending Review'
        ]);
    }

    // 2. EXECUTE: Process each batch (default: 200 records)
    public void execute(Database.BatchableContext bc, List<Property__c> scope) {
        List<Property__c> propertiesToUpdate = new List<Property__c>();

        for(Property__c prop : scope) {
            // Business logic
            if(prop.Last_Updated__c < Date.today().addDays(-30)) {
                prop.Status__c = 'Archived';
                propertiesToUpdate.add(prop);
            }
        }

        if(!propertiesToUpdate.isEmpty()) {
            update propertiesToUpdate;
        }
    }

    // 3. FINISH: Post-processing (optional)
    public void finish(Database.BatchableContext bc) {
        // Send email notification
        AsyncApexJob job = [
            SELECT Id, Status, NumberOfErrors, JobItemsProcessed, TotalJobItems
            FROM AsyncApexJob
            WHERE Id = :bc.getJobId()
        ];

        System.debug('Batch job completed: ' + job.Status);
        System.debug('Processed: ' + job.JobItemsProcessed + ' batches');
        System.debug('Errors: ' + job.NumberOfErrors);
    }
}

// Execute batch
PropertyBatchUpdate batch = new PropertyBatchUpdate();
Database.executeBatch(batch, 200); // 200 = batch size
```

### Batch with Custom Iterator

```apex
public class CustomIteratorBatch implements Database.Batchable<Property__c> {

    // Use Iterable instead of QueryLocator for custom data sources
    public Iterable<Property__c> start(Database.BatchableContext bc) {
        List<Property__c> properties = new List<Property__c>();
        // Custom logic to populate list
        // Could come from external API, CSV file, etc.
        return properties;
    }

    public void execute(Database.BatchableContext bc, List<Property__c> scope) {
        // Process records
    }

    public void finish(Database.BatchableContext bc) {
        // Post-processing
    }
}
```

### Stateful Batch

```apex
// Database.Stateful maintains state across batches
public class PropertyCounterBatch implements Database.Batchable<SObject>, Database.Stateful {

    public Integer recordCount = 0;
    public Decimal totalValue = 0;

    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Listing_Price__c FROM Property__c
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Property__c> scope) {
        for(Property__c prop : scope) {
            recordCount++;
            totalValue += prop.Listing_Price__c;
        }
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('Total records: ' + recordCount);
        System.debug('Total value: ' + totalValue);
        System.debug('Average: ' + (totalValue / recordCount));
    }
}
```

### Batch Limits

```
Batch Apex Limits:
├── Max 5 batch jobs queued or active per org
├── Max 100 batch jobs in holding status
├── Default batch size: 200 records
├── Max batch size: 2,000 records
├── Recommended batch size: 200-1,000 for optimal performance
└── Timeout: 10 minutes per batch
```

## 🔗 Queueable Apex

**Queueable Apex** combines benefits of future methods and batch Apex, with added features.

### Basic Queueable

```apex
public class PropertyQueueable implements Queueable {

    private List<Id> propertyIds;

    public PropertyQueueable(List<Id> propertyIds) {
        this.propertyIds = propertyIds;
    }

    public void execute(QueueableContext context) {
        List<Property__c> properties = [
            SELECT Id, Name, Listing_Price__c
            FROM Property__c
            WHERE Id IN :propertyIds
        ];

        for(Property__c prop : properties) {
            // Complex business logic
            prop.Listing_Price__c = prop.Listing_Price__c * 1.05; // 5% increase
        }

        update properties;
    }
}

// Enqueue job
Id jobId = System.enqueueJob(new PropertyQueueable(propertyIds));
System.debug('Job ID: ' + jobId);
```

### Queueable with Callouts

```apex
public class PropertyAPIQueueable implements Queueable, Database.AllowsCallouts {

    private Set<Id> propertyIds;

    public PropertyAPIQueueable(Set<Id> propertyIds) {
        this.propertyIds = propertyIds;
    }

    public void execute(QueueableContext context) {
        List<Property__c> properties = [
            SELECT Id, Name, External_ID__c
            FROM Property__c
            WHERE Id IN :propertyIds
        ];

        for(Property__c prop : properties) {
            HttpRequest req = new HttpRequest();
            req.setEndpoint('https://api.example.com/property/' + prop.External_ID__c);
            req.setMethod('GET');

            Http http = new Http();
            HttpResponse res = http.send(req);

            if(res.getStatusCode() == 200) {
                // Process response
                Map<String, Object> data = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
                // Update property with external data
            }
        }
    }
}

// Enqueue
System.enqueueJob(new PropertyAPIQueueable(propertyIds));
```

### Chaining Queueable Jobs

```apex
public class FirstJob implements Queueable {

    public void execute(QueueableContext context) {
        // First job logic
        System.debug('First job executing');

        // Chain to second job
        System.enqueueJob(new SecondJob());
    }
}

public class SecondJob implements Queueable {

    public void execute(QueueableContext context) {
        // Second job logic
        System.debug('Second job executing');

        // Can chain to third job
        System.enqueueJob(new ThirdJob());
    }
}

// Start chain
System.enqueueJob(new FirstJob());
```

### Queueable Advantages

```
✅ Advantages over Future:
├── Can pass complex objects (not just primitives)
├── Can chain jobs (enqueue from execute method)
├── Returns job ID for monitoring
├── Better exception handling
└── Can use with Database.AllowsCallouts

✅ Advantages over Batch:
├── Simpler syntax
├── Faster execution (no batch overhead)
├── Better for smaller datasets
└── Easier to chain operations
```

## ⏰ Scheduled Apex

**Scheduled Apex** runs jobs at specified times or intervals.

### Schedulable Class

```apex
public class DailyPropertyReport implements Schedulable {

    public void execute(SchedulableContext sc) {
        // Query data
        List<Property__c> newProperties = [
            SELECT Id, Name, Listing_Price__c, CreatedDate
            FROM Property__c
            WHERE CreatedDate = TODAY
        ];

        // Generate report
        String report = 'Daily Property Report\n';
        report += 'Date: ' + Date.today() + '\n';
        report += 'New properties: ' + newProperties.size() + '\n\n';

        for(Property__c prop : newProperties) {
            report += prop.Name + ' - $' + prop.Listing_Price__c + '\n';
        }

        // Send email
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        email.setToAddresses(new String[]{'manager@example.com'});
        email.setSubject('Daily Property Report');
        email.setPlainTextBody(report);
        Messaging.sendEmail(new Messaging.SingleEmailMessage[]{email});
    }
}
```

### Schedule Using CRON

```apex
// CRON expression: second minute hour day_of_month month day_of_week year
// Schedule to run every day at 8 AM
String cronExp = '0 0 8 * * ?';
String jobName = 'Daily Property Report';

DailyPropertyReport job = new DailyPropertyReport();
System.schedule(jobName, cronExp, job);
```

### CRON Expression Examples

```
CRON Examples:
├── '0 0 8 * * ?' - Every day at 8 AM
├── '0 0 12 ? * MON-FRI' - Weekdays at noon
├── '0 0 0 1 * ?' - First day of month at midnight
├── '0 0 */4 * * ?' - Every 4 hours
└── '0 30 9 ? * MON' - Every Monday at 9:30 AM

Format: second minute hour day_of_month month day_of_week year
```

### Schedule from UI

You can also schedule from Setup:
1. Setup → Apex Classes
2. Click "Schedule Apex"
3. Select class, set schedule
4. Save

### Scheduled Job with Batch

```apex
public class ScheduledBatchJob implements Schedulable {

    public void execute(SchedulableContext sc) {
        // Execute batch job from scheduled job
        PropertyBatchUpdate batch = new PropertyBatchUpdate();
        Database.executeBatch(batch, 200);
    }
}

// Schedule to run daily
String cronExp = '0 0 2 * * ?'; // 2 AM daily
System.schedule('Nightly Property Batch', cronExp, new ScheduledBatchJob());
```

## 📊 Comparison Table

| Feature | Future | Batch | Queueable | Scheduled |
|---------|--------|-------|-----------|-----------|
| **Complexity** | Simple | Complex | Medium | Simple |
| **Parameters** | Primitives only | N/A | Any object | N/A |
| **Return Value** | No | No | Job ID | Job ID |
| **Chaining** | No | Limited | Yes | No |
| **Callouts** | Yes | Yes | Yes | Yes |
| **Large Data** | No | Yes | No | Via Batch |
| **Monitoring** | Limited | Good | Good | Good |
| **Best For** | Simple async | Bulk processing | Complex async | Recurring jobs |

## 🎯 When to Use What

### Use Future Methods When:
```
✅ Simple async operation
✅ Making callouts from triggers
✅ Avoiding mixed DML operations
✅ No need to track job status
✅ Parameters are primitives
```

### Use Batch Apex When:
```
✅ Processing 10,000+ records
✅ Long-running operations
✅ Risk of hitting governor limits
✅ Need to maintain state across batches
✅ Complex data transformations
```

### Use Queueable Apex When:
```
✅ Need to pass complex objects
✅ Want to chain jobs
✅ Need job monitoring
✅ Making sequential callouts
✅ Processing moderate datasets
```

### Use Scheduled Apex When:
```
✅ Recurring operations (daily, weekly)
✅ Batch jobs that run at specific times
✅ Automated reports
✅ Data cleanup jobs
✅ Integration sync jobs
```

## 🧪 Testing Asynchronous Apex

### Testing Future Methods

```apex
@isTest
private class FutureExampleTest {

    @isTest
    static void testSendEmail() {
        List<String> emails = new List<String>{'test@example.com'};

        Test.startTest(); // Forces async to complete
        FutureExample.sendEmail(emails);
        Test.stopTest(); // Waits for async to finish

        // Verify results
        // (Check email tracking or system logs)
    }
}
```

### Testing Batch Apex

```apex
@isTest
private class PropertyBatchUpdateTest {

    @TestSetup
    static void setup() {
        List<Property__c> properties = new List<Property__c>();
        for(Integer i = 0; i < 200; i++) {
            properties.add(new Property__c(
                Name = 'Property ' + i,
                Status__c = 'Pending Review',
                Last_Updated__c = Date.today().addDays(-35)
            ));
        }
        insert properties;
    }

    @isTest
    static void testBatchUpdate() {
        Test.startTest();
        PropertyBatchUpdate batch = new PropertyBatchUpdate();
        Database.executeBatch(batch);
        Test.stopTest(); // Batch completes synchronously in test

        // Verify
        List<Property__c> updated = [
            SELECT Status__c FROM Property__c
        ];

        for(Property__c prop : updated) {
            System.assertEquals('Archived', prop.Status__c);
        }
    }
}
```

### Testing Queueable Apex

```apex
@isTest
private class PropertyQueueableTest {

    @isTest
    static void testQueueable() {
        Property__c prop = new Property__c(
            Name = 'Test Property',
            Listing_Price__c = 100000
        );
        insert prop;

        Test.startTest();
        System.enqueueJob(new PropertyQueueable(new List<Id>{prop.Id}));
        Test.stopTest();

        // Verify
        Property__c updated = [SELECT Listing_Price__c FROM Property__c WHERE Id = :prop.Id];
        System.assertEquals(105000, updated.Listing_Price__c); // 5% increase
    }
}
```

### Testing Scheduled Apex

```apex
@isTest
private class DailyPropertyReportTest {

    @isTest
    static void testScheduledJob() {
        // Create test data
        Property__c prop = new Property__c(Name = 'Test Property');
        insert prop;

        Test.startTest();
        // Schedule job
        String cronExp = '0 0 8 * * ?';
        System.schedule('Test Job', cronExp, new DailyPropertyReport());
        Test.stopTest();

        // Verify job was scheduled
        List<CronTrigger> jobs = [SELECT Id, CronExpression FROM CronTrigger WHERE CronExpression = :cronExp];
        System.assertEquals(1, jobs.size());
    }
}
```

## 💡 Best Practices

### ✅ DO:

1. **Use Test.startTest() and Test.stopTest()**
   ```apex
   Test.startTest();
   // Async code here
   Test.stopTest(); // Forces completion
   ```

2. **Handle Exceptions Gracefully**
   ```apex
   public void execute(QueueableContext context) {
       try {
           // Your logic
       } catch(Exception e) {
           System.debug('Error: ' + e.getMessage());
           // Log to custom object
       }
   }
   ```

3. **Use Database Methods with allOrNone=false**
   ```apex
   Database.SaveResult[] results = Database.insert(properties, false);
   for(Database.SaveResult result : results) {
       if(!result.isSuccess()) {
           // Handle error
       }
   }
   ```

4. **Monitor Async Jobs**
   ```apex
   List<AsyncApexJob> jobs = [
       SELECT Id, Status, NumberOfErrors, CreatedDate
       FROM AsyncApexJob
       WHERE JobType = 'BatchApex'
       AND CreatedDate = TODAY
   ];
   ```

5. **Bulkify Async Code**
   ```apex
   // ✅ GOOD - Process in bulk
   @future
   public static void updateAccounts(Set<Id> accountIds) {
       List<Account> accounts = [SELECT Id FROM Account WHERE Id IN :accountIds];
       // Bulk update
   }
   ```

### ❌ DON'T:

1. **Don't Call Future from Future**
   ```apex
   // ❌ WRONG
   @future
   public static void method1() {
       method2(); // Can't call another @future method
   }
   ```

2. **Don't Use Queueable for Very Large Datasets**
   ```apex
   // ❌ WRONG - Use Batch instead
   System.enqueueJob(new ProcessMillionRecords());
   ```

3. **Don't Forget Limits**
   ```apex
   // ❌ WRONG - Can exceed limits
   for(Integer i = 0; i < 100000; i++) {
       System.enqueueJob(new MyJob()); // Max 50 per transaction
   }
   ```

4. **Don't Chain Too Many Jobs**
   ```apex
   // ❌ WRONG - Can hit limits
   // Max depth of 5 chained queueable jobs
   ```

## 📚 Interview Questions

**Q: What's the difference between @future and Queueable?**
A:
- **@future**: Simpler, only accepts primitives, no return value, can't chain
- **Queueable**: Can accept complex objects, returns Job ID, can chain jobs, better monitoring

**Q: When would you use Batch Apex vs. Queueable?**
A:
- **Batch**: For processing 10,000+ records, automatic chunking, handles very large datasets
- **Queueable**: For moderate datasets, simpler syntax, when you need chaining or complex parameters

**Q: How do you test asynchronous Apex?**
A: Use `Test.startTest()` and `Test.stopTest()`. All async processes complete synchronously between these methods in test context.

**Q: What is Database.Stateful in Batch Apex?**
A: Allows member variables to maintain state across batch executions. Without it, variables reset for each batch.

**Q: Can you call a @future method from a trigger?**
A: Yes, but only if the trigger is not already in an async context. Cannot call @future from @future.

**Q: What's the max number of queueable jobs you can chain?**
A: Maximum depth of 5 chained queueable jobs (one job enqueuing another).

**Q: How do you schedule a job to run every hour?**
A: Use CRON expression `'0 0 * * * ?'` with `System.schedule()`.

## 🚀 Next Steps

Great! You now understand asynchronous Apex processing. Next, learn about Integration:

**[→ Next: Integration & APIs](/docs/salesforce/apex/integration)**

Learn to:
- REST and SOAP APIs
- Callouts and webhooks
- Authentication patterns
- Error handling
- Integration patterns

---

**You can now handle long-running operations efficiently!** Remember to choose the right async approach for your use case. 🎓
