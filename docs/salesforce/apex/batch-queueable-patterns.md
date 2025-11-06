---
sidebar_position: 11
title: Batch & Queueable Patterns
description: Master Batch Apex and Queueable patterns for processing large data volumes and async operations
---

# Batch Apex & Queueable: Process Data at Scale

Master advanced patterns for processing large datasets with Batch Apex and flexible async operations with Queueable Apex in production environments.

## 🎯 What You'll Master

- When to use Batch vs Queueable
- Batch Apex architecture and patterns
- Stateful batch processing
- Queueable chaining patterns
- Error handling in async jobs
- Monitoring and debugging async jobs
- Performance optimization
- Testing async operations
- Real-world enterprise patterns
- Production best practices

## 🤔 Batch vs Queueable: When to Use What

### Decision Framework

```
Choose Batch Apex When:
├── Processing thousands of records
├── Need to process in chunks (governor limits)
├── Scheduled processing required
├── Working with large datasets (50K+ records)
└── Need stateful processing across batches

Choose Queueable When:
├── Processing smaller datasets (< 10K records)
├── Need flexible chaining (up to 50 jobs)
├── Complex async workflows
├── Making callouts in async context
└── Need more flexibility than Future methods
```

### Comparison Table

| Feature | Batch Apex | Queueable Apex |
|---------|------------|----------------|
| Max records | 50M | Limited by heap (6MB) |
| Chunk size | 200 (default) | N/A |
| Chaining | ❌ No | ✅ Yes (50 jobs) |
| Callouts | ✅ Yes | ✅ Yes |
| State maintenance | ✅ Stateful | ✅ Yes |
| Flexibility | ⚠️ Structured | ✅ Very flexible |
| Testing | Need Test.startTest() | Need Test.startTest() |
| Use case | Large datasets | Complex workflows |

## 🔄 Batch Apex Patterns

### Basic Batch Structure

```apex
public class AccountUpdateBatch implements Database.Batchable<SObject> {

    // 1. Start Method - Define query
    public Database.QueryLocator start(Database.BatchableContext BC) {
        return Database.getQueryLocator([
            SELECT Id, Name, Industry, AnnualRevenue
            FROM Account
            WHERE AnnualRevenue = null
            LIMIT 50000
        ]);
    }

    // 2. Execute Method - Process each batch
    public void execute(Database.BatchableContext BC, List<Account> scope) {
        List<Account> accountsToUpdate = new List<Account>();

        for (Account acc : scope) {
            // Business logic
            acc.AnnualRevenue = calculateRevenue(acc);
            accountsToUpdate.add(acc);
        }

        // DML with error handling
        if (!accountsToUpdate.isEmpty()) {
            Database.SaveResult[] results = Database.update(
                accountsToUpdate,
                false  // Allow partial success
            );

            // Handle errors
            handleErrors(results, accountsToUpdate);
        }
    }

    // 3. Finish Method - Cleanup and notification
    public void finish(Database.BatchableContext BC) {
        // Get job info
        AsyncApexJob job = [
            SELECT Id, Status, NumberOfErrors, JobItemsProcessed,
                   TotalJobItems, CreatedBy.Email
            FROM AsyncApexJob
            WHERE Id = :BC.getJobId()
        ];

        // Send notification
        sendCompletionEmail(job);
    }

    private Decimal calculateRevenue(Account acc) {
        // Complex calculation logic
        return 1000000;
    }

    private void handleErrors(Database.SaveResult[] results, List<Account> accounts) {
        for (Integer i = 0; i < results.size(); i++) {
            if (!results[i].isSuccess()) {
                // Log error
                System.debug('Error updating account ' + accounts[i].Id + ': ' +
                           results[i].getErrors()[0].getMessage());
            }
        }
    }

    private void sendCompletionEmail(AsyncApexJob job) {
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new String[] { job.CreatedBy.Email });
        mail.setSubject('Batch Job Completed: ' + job.Status);
        mail.setPlainTextBody(
            'Job completed.\n' +
            'Total batches: ' + job.TotalJobItems + '\n' +
            'Processed: ' + job.JobItemsProcessed + '\n' +
            'Errors: ' + job.NumberOfErrors
        );
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
    }
}
```

**Execute Batch:**

```apex
// Default batch size (200)
Database.executeBatch(new AccountUpdateBatch());

// Custom batch size (reduces heap size per batch)
Database.executeBatch(new AccountUpdateBatch(), 100);

// Schedule batch to run at specific time
System.schedule(
    'Account Update Daily',
    '0 0 2 * * ?',  // Every day at 2 AM
    new SchedulableAccountUpdate()
);
```

### Stateful Batch Processing

Track information across batches using `Database.Stateful`.

```apex
public class PropertyCommissionBatch implements
    Database.Batchable<SObject>, Database.Stateful {

    // State maintained across batches
    private Integer totalProcessed = 0;
    private Decimal totalCommission = 0;
    private List<String> errors = new List<String>();

    public Database.QueryLocator start(Database.BatchableContext BC) {
        return Database.getQueryLocator([
            SELECT Id, Name, Sale_Price__c, Agent__c, Commission_Rate__c
            FROM Property__c
            WHERE Status__c = 'Sold'
            AND Commission_Paid__c = false
            LIMIT 10000
        ]);
    }

    public void execute(Database.BatchableContext BC, List<Property__c> scope) {
        List<Property__c> propertiesToUpdate = new List<Property__c>();
        List<Commission__c> commissionsToCreate = new List<Commission__c>();

        for (Property__c prop : scope) {
            try {
                // Calculate commission
                Decimal commission = prop.Sale_Price__c *
                                   (prop.Commission_Rate__c / 100);

                // Create commission record
                commissionsToCreate.add(new Commission__c(
                    Property__c = prop.Id,
                    Agent__c = prop.Agent__c,
                    Amount__c = commission,
                    Payment_Date__c = Date.today()
                ));

                // Mark property as commission paid
                prop.Commission_Paid__c = true;
                propertiesToUpdate.add(prop);

                // Update state
                totalProcessed++;
                totalCommission += commission;

            } catch (Exception e) {
                errors.add('Property ' + prop.Id + ': ' + e.getMessage());
            }
        }

        // Insert commissions
        if (!commissionsToCreate.isEmpty()) {
            Database.insert(commissionsToCreate, false);
        }

        // Update properties
        if (!propertiesToUpdate.isEmpty()) {
            Database.update(propertiesToUpdate, false);
        }
    }

    public void finish(Database.BatchableContext BC) {
        // Create summary report
        Batch_Summary__c summary = new Batch_Summary__c(
            Job_Id__c = BC.getJobId(),
            Total_Processed__c = totalProcessed,
            Total_Commission__c = totalCommission,
            Error_Count__c = errors.size(),
            Error_Details__c = String.join(errors, '\n')
        );
        insert summary;

        // Send email with totals
        sendSummaryEmail(totalProcessed, totalCommission, errors);
    }

    private void sendSummaryEmail(Integer processed, Decimal commission,
                                 List<String> errors) {
        // Email logic
    }
}
```

### Dynamic Batch with Query String

```apex
public class DynamicBatch implements Database.Batchable<SObject> {

    private String query;
    private String objectType;
    private Map<String, Object> updates;

    public DynamicBatch(String objectType, String whereClause,
                       Map<String, Object> fieldUpdates) {
        this.objectType = objectType;
        this.updates = fieldUpdates;
        this.query = 'SELECT Id FROM ' + objectType +
                    ' WHERE ' + whereClause;
    }

    public Database.QueryLocator start(Database.BatchableContext BC) {
        return Database.getQueryLocator(query);
    }

    public void execute(Database.BatchableContext BC, List<SObject> scope) {
        for (SObject record : scope) {
            // Apply dynamic updates
            for (String field : updates.keySet()) {
                record.put(field, updates.get(field));
            }
        }

        Database.update(scope, false);
    }

    public void finish(Database.BatchableContext BC) {
        System.debug('Batch completed');
    }
}

// Usage
Map<String, Object> updates = new Map<String, Object>{
    'Status__c' => 'Active',
    'Last_Updated__c' => System.now()
};

Database.executeBatch(
    new DynamicBatch('Property__c', 'CreatedDate = TODAY', updates),
    100
);
```

## ⚡ Queueable Apex Patterns

### Basic Queueable Class

```apex
public class PropertyEmailQueueable implements Queueable {

    private List<Id> propertyIds;

    public PropertyEmailQueueable(List<Id> propertyIds) {
        this.propertyIds = propertyIds;
    }

    public void execute(QueueableContext context) {
        // Query properties
        List<Property__c> properties = [
            SELECT Id, Name, Agent__r.Email, Status__c
            FROM Property__c
            WHERE Id IN :propertyIds
        ];

        // Send emails
        List<Messaging.SingleEmailMessage> emails =
            new List<Messaging.SingleEmailMessage>();

        for (Property__c prop : properties) {
            Messaging.SingleEmailMessage mail =
                new Messaging.SingleEmailMessage();
            mail.setToAddresses(new String[] { prop.Agent__r.Email });
            mail.setSubject('Property Status Update: ' + prop.Name);
            mail.setPlainTextBody('Status changed to: ' + prop.Status__c);
            emails.add(mail);
        }

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }
}

// Enqueue the job
System.enqueueJob(new PropertyEmailQueueable(propertyIds));
```

### Queueable with Callout

```apex
public class ExternalAPIQueueable implements Queueable, Database.AllowsCallouts {

    private List<Id> recordIds;

    public ExternalAPIQueueable(List<Id> recordIds) {
        this.recordIds = recordIds;
    }

    public void execute(QueueableContext context) {
        for (Id recordId : recordIds) {
            try {
                // Make HTTP callout
                HttpRequest req = new HttpRequest();
                req.setEndpoint('https://api.example.com/validate');
                req.setMethod('POST');
                req.setHeader('Content-Type', 'application/json');
                req.setBody(JSON.serialize(new Map<String, String>{
                    'recordId' => recordId
                }));

                Http http = new Http();
                HttpResponse res = http.send(req);

                if (res.getStatusCode() == 200) {
                    // Process response
                    processResponse(recordId, res.getBody());
                } else {
                    // Log error
                    logError(recordId, 'HTTP ' + res.getStatusCode());
                }

            } catch (Exception e) {
                logError(recordId, e.getMessage());
            }
        }
    }

    private void processResponse(Id recordId, String response) {
        // Process API response
    }

    private void logError(Id recordId, String error) {
        insert new Error_Log__c(
            Record_Id__c = recordId,
            Error_Message__c = error,
            Timestamp__c = System.now()
        );
    }
}
```

### Queueable Chaining Pattern

```apex
public class MultiStepProcessQueueable implements Queueable {

    private Integer step;
    private List<Id> recordIds;
    private Map<String, Object> context;

    public MultiStepProcessQueueable(Integer step, List<Id> recordIds) {
        this(step, recordIds, new Map<String, Object>());
    }

    public MultiStepProcessQueueable(Integer step, List<Id> recordIds,
                                    Map<String, Object> context) {
        this.step = step;
        this.recordIds = recordIds;
        this.context = context;
    }

    public void execute(QueueableContext ctx) {
        switch on step {
            when 1 {
                executeStep1();
                // Chain to step 2
                System.enqueueJob(new MultiStepProcessQueueable(2, recordIds, context));
            }
            when 2 {
                executeStep2();
                // Chain to step 3
                System.enqueueJob(new MultiStepProcessQueueable(3, recordIds, context));
            }
            when 3 {
                executeStep3();
                // Final step - no chaining
            }
        }
    }

    private void executeStep1() {
        // Step 1: Validate records
        List<Property__c> properties = [
            SELECT Id, Name, Status__c
            FROM Property__c
            WHERE Id IN :recordIds
        ];

        // Store validation results in context
        context.put('validatedCount', properties.size());
        System.debug('Step 1 completed: Validated ' + properties.size());
    }

    private void executeStep2() {
        // Step 2: Process records
        List<Property__c> properties = [
            SELECT Id, Name, Status__c
            FROM Property__c
            WHERE Id IN :recordIds
        ];

        for (Property__c prop : properties) {
            prop.Status__c = 'Processed';
        }
        update properties;

        context.put('processedCount', properties.size());
        System.debug('Step 2 completed: Processed ' + properties.size());
    }

    private void executeStep3() {
        // Step 3: Send notifications
        Integer validated = (Integer)context.get('validatedCount');
        Integer processed = (Integer)context.get('processedCount');

        sendCompletionNotification(validated, processed);
        System.debug('Step 3 completed: Sent notifications');
    }

    private void sendCompletionNotification(Integer validated, Integer processed) {
        // Send email notification
    }
}

// Start the chain
System.enqueueJob(new MultiStepProcessQueueable(1, propertyIds));
```

### Smart Chaining with Conditional Logic

```apex
public class SmartChainQueueable implements Queueable {

    private List<Id> recordIds;
    private Integer retryCount;
    private static final Integer MAX_RETRIES = 3;

    public SmartChainQueueable(List<Id> recordIds) {
        this(recordIds, 0);
    }

    public SmartChainQueueable(List<Id> recordIds, Integer retryCount) {
        this.recordIds = recordIds;
        this.retryCount = retryCount;
    }

    public void execute(QueueableContext context) {
        try {
            // Attempt processing
            Boolean success = processRecords();

            if (!success && retryCount < MAX_RETRIES) {
                // Retry with exponential backoff
                System.enqueueJob(new SmartChainQueueable(
                    recordIds,
                    retryCount + 1
                ));
            } else if (success) {
                // Continue to next job
                chainNextJob();
            } else {
                // Max retries reached - log failure
                logFailure();
            }

        } catch (Exception e) {
            if (retryCount < MAX_RETRIES) {
                // Retry on exception
                System.enqueueJob(new SmartChainQueueable(
                    recordIds,
                    retryCount + 1
                ));
            } else {
                logError(e);
            }
        }
    }

    private Boolean processRecords() {
        // Processing logic
        return true;
    }

    private void chainNextJob() {
        // Chain to next job if needed
    }

    private void logFailure() {
        System.debug('Failed after ' + MAX_RETRIES + ' retries');
    }

    private void logError(Exception e) {
        System.debug('Error: ' + e.getMessage());
    }
}
```

## 🚨 Error Handling Patterns

### Batch Error Handler

```apex
public class RobustBatch implements Database.Batchable<SObject>, Database.Stateful {

    private List<ErrorLog> errorLogs = new List<ErrorLog>();

    public Database.QueryLocator start(Database.BatchableContext BC) {
        return Database.getQueryLocator([
            SELECT Id, Name, Status__c FROM Property__c
        ]);
    }

    public void execute(Database.BatchableContext BC, List<Property__c> scope) {
        List<Property__c> toUpdate = new List<Property__c>();

        for (Property__c prop : scope) {
            try {
                // Process with potential errors
                prop.Status__c = processProperty(prop);
                toUpdate.add(prop);

            } catch (Exception e) {
                // Log error but continue processing
                errorLogs.add(new ErrorLog(
                    prop.Id,
                    prop.Name,
                    e.getMessage(),
                    e.getStackTraceString()
                ));
            }
        }

        // Update with partial success
        if (!toUpdate.isEmpty()) {
            Database.SaveResult[] results = Database.update(toUpdate, false);

            // Log DML errors
            for (Integer i = 0; i < results.size(); i++) {
                if (!results[i].isSuccess()) {
                    errorLogs.add(new ErrorLog(
                        toUpdate[i].Id,
                        toUpdate[i].Name,
                        results[i].getErrors()[0].getMessage(),
                        'DML Error'
                    ));
                }
            }
        }
    }

    public void finish(Database.BatchableContext BC) {
        // Persist error logs
        if (!errorLogs.isEmpty()) {
            List<Error_Log__c> logs = new List<Error_Log__c>();
            for (ErrorLog log : errorLogs) {
                logs.add(new Error_Log__c(
                    Record_Id__c = log.recordId,
                    Record_Name__c = log.recordName,
                    Error_Message__c = log.message,
                    Stack_Trace__c = log.stackTrace
                ));
            }
            insert logs;

            // Send error notification
            sendErrorNotification(errorLogs.size());
        }
    }

    private String processProperty(Property__c prop) {
        // Processing logic
        return 'Processed';
    }

    private void sendErrorNotification(Integer errorCount) {
        // Send email
    }

    private class ErrorLog {
        String recordId;
        String recordName;
        String message;
        String stackTrace;

        ErrorLog(String id, String name, String msg, String trace) {
            this.recordId = id;
            this.recordName = name;
            this.message = msg;
            this.stackTrace = trace;
        }
    }
}
```

## 📊 Monitoring & Debugging

### Query Batch Status

```apex
// Get all running batch jobs
List<AsyncApexJob> batchJobs = [
    SELECT Id, Status, JobItemsProcessed, TotalJobItems,
           NumberOfErrors, CreatedDate, CompletedDate,
           MethodName, ExtendedStatus
    FROM AsyncApexJob
    WHERE JobType = 'BatchApex'
    AND Status IN ('Processing', 'Queued', 'Preparing')
    ORDER BY CreatedDate DESC
];

for (AsyncApexJob job : batchJobs) {
    System.debug('Job: ' + job.MethodName);
    System.debug('Progress: ' + job.JobItemsProcessed + '/' + job.TotalJobItems);
    System.debug('Errors: ' + job.NumberOfErrors);
}
```

### Query Queueable Status

```apex
// Get queueable jobs
List<AsyncApexJob> queueableJobs = [
    SELECT Id, Status, JobType, MethodName, CreatedDate,
           CompletedDate, ExtendedStatus
    FROM AsyncApexJob
    WHERE JobType = 'Queueable'
    AND CreatedDate = TODAY
    ORDER BY CreatedDate DESC
];
```

### Abort Running Job

```apex
// Abort a specific job
System.abortJob(jobId);

// Abort all batch jobs for a specific class
List<AsyncApexJob> jobs = [
    SELECT Id
    FROM AsyncApexJob
    WHERE ApexClass.Name = 'AccountUpdateBatch'
    AND Status IN ('Queued', 'Processing', 'Preparing')
];

for (AsyncApexJob job : jobs) {
    System.abortJob(job.Id);
}
```

## 🧪 Testing Async Operations

### Testing Batch Apex

```apex
@isTest
private class AccountUpdateBatchTest {

    @testSetup
    static void setup() {
        // Create test data
        List<Account> accounts = new List<Account>();
        for (Integer i = 0; i < 200; i++) {
            accounts.add(new Account(
                Name = 'Test Account ' + i,
                AnnualRevenue = null
            ));
        }
        insert accounts;
    }

    @isTest
    static void testBatchExecution() {
        Test.startTest();

        // Execute batch
        Database.executeBatch(new AccountUpdateBatch(), 100);

        Test.stopTest();  // Forces batch to complete

        // Verify results
        List<Account> updated = [
            SELECT Id, AnnualRevenue
            FROM Account
            WHERE AnnualRevenue != null
        ];

        System.assertEquals(200, updated.size(), 'All accounts should be updated');
    }

    @isTest
    static void testBatchScheduling() {
        Test.startTest();

        // Schedule the batch
        String cronExp = '0 0 0 * * ?';
        String jobId = System.schedule(
            'Test Batch Job',
            cronExp,
            new SchedulableAccountUpdate()
        );

        // Verify scheduled
        CronTrigger ct = [
            SELECT Id, CronExpression, TimesTriggered, NextFireTime
            FROM CronTrigger
            WHERE Id = :jobId
        ];

        System.assertEquals(cronExp, ct.CronExpression);

        Test.stopTest();
    }
}
```

### Testing Queueable

```apex
@isTest
private class PropertyEmailQueueableTest {

    @testSetup
    static void setup() {
        Account agent = new Account(Name = 'Test Agent');
        insert agent;

        Property__c prop = new Property__c(
            Name = 'Test Property',
            Agent__c = agent.Id,
            Status__c = 'Available'
        );
        insert prop;
    }

    @isTest
    static void testQueueableExecution() {
        Property__c prop = [SELECT Id FROM Property__c LIMIT 1];

        Test.startTest();

        // Enqueue job
        System.enqueueJob(new PropertyEmailQueueable(
            new List<Id>{ prop.Id }
        ));

        Test.stopTest();  // Forces async execution

        // Verify email was sent (check limits)
        System.assertEquals(1, Limits.getEmailInvocations());
    }

    @isTest
    static void testQueueableChaining() {
        Property__c prop = [SELECT Id FROM Property__c LIMIT 1];

        Test.startTest();

        // Start chain
        System.enqueueJob(new MultiStepProcessQueueable(
            1,
            new List<Id>{ prop.Id }
        ));

        Test.stopTest();

        // Verify final state
        Property__c updated = [
            SELECT Status__c
            FROM Property__c
            WHERE Id = :prop.Id
        ];

        System.assertEquals('Processed', updated.Status__c);
    }
}
```

## 💡 Best Practices

### ✅ DO:

1. **Use Database Methods with Partial Success**
   ```apex
   Database.SaveResult[] results = Database.update(records, false);
   // Handle individual failures
   ```

2. **Implement Proper Error Logging**
   ```apex
   try {
       // Process
   } catch (Exception e) {
       insert new Error_Log__c(
           Message__c = e.getMessage(),
           Stack_Trace__c = e.getStackTraceString()
       );
   }
   ```

3. **Use Stateful for Cross-Batch Tracking**
   ```apex
   public class MyBatch implements Database.Batchable<SObject>, Database.Stateful {
       private Integer totalProcessed = 0;
       // Track across batches
   }
   ```

4. **Limit Queueable Chain Depth**
   ```apex
   private static final Integer MAX_CHAIN_DEPTH = 10;
   if (depth < MAX_CHAIN_DEPTH) {
       System.enqueueJob(new MyQueueable(depth + 1));
   }
   ```

5. **Monitor Job Status**
   ```apex
   public void finish(Database.BatchableContext BC) {
       AsyncApexJob job = [SELECT Status FROM AsyncApexJob WHERE Id = :BC.getJobId()];
       // Check status and notify
   }
   ```

### ❌ DON'T:

1. **Don't Use SOQL in Loops**
   ```apex
   // ❌ BAD
   for (Property__c prop : scope) {
       List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :prop.Agent__c];
   }

   // ✅ GOOD
   Set<Id> agentIds = new Set<Id>();
   for (Property__c prop : scope) {
       agentIds.add(prop.Agent__c);
   }
   Map<Id, List<Contact>> contactsByAgent = groupContactsByAgent(agentIds);
   ```

2. **Don't Chain Too Many Queueables**
   ```apex
   // ❌ BAD - Can hit 50 job limit
   for (Integer i = 0; i < 100; i++) {
       System.enqueueJob(new MyQueueable());
   }
   ```

3. **Don't Ignore Batch Size**
   ```apex
   // ❌ BAD - Default 200 might cause heap issues
   Database.executeBatch(new HeavyBatch());

   // ✅ GOOD - Reduce batch size
   Database.executeBatch(new HeavyBatch(), 50);
   ```

## 🚀 Next Steps

Master async processing:

**[→ Asynchronous Apex Overview](/docs/salesforce/apex/asynchronous)** - All async patterns

**[→ Platform Events](/docs/salesforce/apex/platform-events)** - Event-driven architecture

**[→ Testing Guide](/docs/salesforce/apex/testing)** - Test async operations

---

**You can now process data at enterprise scale!** Use these patterns to build robust async solutions. 🔄
