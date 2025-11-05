---
sidebar_position: 3
title: Apex Triggers
description: Automate business logic with Apex triggers
---

# Apex Triggers: Database Automation

Apex triggers enable you to perform custom actions before or after events to records in Salesforce, such as insertions, updates, or deletions.

## 🎯 What You'll Learn

- Trigger syntax and structure
- Trigger context variables
- Before vs After triggers
- Trigger design patterns
- Bulkification and best practices
- Common use cases
- Testing triggers
- Avoiding recursion

## 📊 What Are Triggers?

**Triggers** are Apex code that executes automatically when records are:
- Inserted
- Updated
- Deleted
- Undeleted

### When to Use Triggers vs Other Tools

| Use Case | Tool | Reason |
|----------|------|--------|
| Simple field update | Flow/Process Builder | No code needed |
| Complex logic, multiple objects | Trigger | Full programming power |
| Need to query child records | Trigger | Can't in validation rules |
| Need to prevent save | Validation Rule/Trigger | Both work |
| Send email | Flow | Simpler |
| Call external API | Trigger/Future method | Need async |

## 🏗️ Trigger Syntax

### Basic Structure

```apex
trigger TriggerName on ObjectName (trigger_events) {
    // Trigger code
}
```

### Example: Property Trigger

```apex
trigger PropertyTrigger on Property__c (before insert, before update, after insert, after update) {
    // Handle before insert
    if(Trigger.isBefore && Trigger.isInsert) {
        // Code here
    }

    // Handle before update
    if(Trigger.isBefore && Trigger.isUpdate) {
        // Code here
    }

    // Handle after insert
    if(Trigger.isAfter && Trigger.isInsert) {
        // Code here
    }

    // Handle after update
    if(Trigger.isAfter && Trigger.isUpdate) {
        // Code here
    }
}
```

## 🎯 Trigger Events

### Available Events

```apex
trigger PropertyTrigger on Property__c (
    before insert,   // Before record is saved to database
    before update,   // Before record is updated in database
    before delete,   // Before record is deleted
    after insert,    // After record is saved to database
    after update,    // After record is updated in database
    after delete,    // After record is deleted
    after undelete   // After record is restored from recycle bin
) {
    // Trigger code
}
```

### Before vs After

**Before Triggers:**
- Use when you need to update or validate record values before saving
- Changes to the record don't require DML
- Record hasn't been saved yet (no Id for new records)
- Most efficient for field updates

**After Triggers:**
- Use when you need the record Id
- Use when you need to create/update related records
- Use when you need to send emails or callouts
- Record has been committed to database

## 📦 Trigger Context Variables

### Trigger.new and Trigger.newMap

```apex
trigger PropertyTrigger on Property__c (before insert, after insert) {
    // Trigger.new - List of new records
    for(Property__c prop : Trigger.new) {
        System.debug('New Property: ' + prop.Name);
    }

    // Trigger.newMap - Map of new records (only in update, after insert/update/delete)
    if(Trigger.isAfter) {
        for(Id propId : Trigger.newMap.keySet()) {
            Property__c prop = Trigger.newMap.get(propId);
            System.debug('Property Id: ' + propId);
        }
    }
}
```

### Trigger.old and Trigger.oldMap

```apex
trigger PropertyTrigger on Property__c (before update, after update) {
    // Trigger.old - List of old versions
    for(Property__c oldProp : Trigger.old) {
        System.debug('Old Status: ' + oldProp.Status__c);
    }

    // Trigger.oldMap - Map of old versions
    for(Id propId : Trigger.oldMap.keySet()) {
        Property__c oldProp = Trigger.oldMap.get(propId);
        Property__c newProp = Trigger.newMap.get(propId);

        if(oldProp.Status__c != newProp.Status__c) {
            System.debug('Status changed from ' + oldProp.Status__c + ' to ' + newProp.Status__c);
        }
    }
}
```

### All Context Variables

```apex
Trigger.new         // List<SObject> - new records
Trigger.old         // List<SObject> - old records
Trigger.newMap      // Map<Id, SObject> - new records
Trigger.oldMap      // Map<Id, SObject> - old records
Trigger.size        // Integer - number of records
Trigger.isInsert    // Boolean - true if insert
Trigger.isUpdate    // Boolean - true if update
Trigger.isDelete    // Boolean - true if delete
Trigger.isUndelete  // Boolean - true if undelete
Trigger.isBefore    // Boolean - true if before
Trigger.isAfter     // Boolean - true if after
Trigger.isExecuting // Boolean - true if in trigger context
```

## 💡 Common Trigger Patterns

### Pattern 1: Field Validation and Default Values

```apex
trigger PropertyTrigger on Property__c (before insert, before update) {
    for(Property__c prop : Trigger.new) {
        // Set default values
        if(prop.Status__c == null) {
            prop.Status__c = 'Available';
        }

        // Validate business rules
        if(prop.Listing_Price__c != null && prop.Listing_Price__c < 0) {
            prop.Listing_Price__c.addError('Price cannot be negative');
        }

        // Calculate fields
        if(prop.Square_Footage__c != null && prop.Listing_Price__c != null) {
            prop.Price_Per_Square_Foot__c = prop.Listing_Price__c / prop.Square_Footage__c;
        }
    }
}
```

### Pattern 2: Create Related Records

```apex
trigger PropertyTrigger on Property__c (after insert) {
    List<Task> tasksToCreate = new List<Task>();

    for(Property__c prop : Trigger.new) {
        Task t = new Task();
        t.Subject = 'Schedule photography for ' + prop.Name;
        t.WhatId = prop.Id;
        t.ActivityDate = Date.today().addDays(7);
        t.Priority = 'High';
        tasksToCreate.add(t);
    }

    if(!tasksToCreate.isEmpty()) {
        insert tasksToCreate;
    }
}
```

### Pattern 3: Update Related Records

```apex
trigger PropertyTrigger on Property__c (after update) {
    Set<Id> accountIds = new Set<Id>();

    // Collect Account Ids
    for(Property__c prop : Trigger.new) {
        if(prop.Account__c != null) {
            Property__c oldProp = Trigger.oldMap.get(prop.Id);

            // Status changed to Sold
            if(prop.Status__c == 'Sold' && oldProp.Status__c != 'Sold') {
                accountIds.add(prop.Account__c);
            }
        }
    }

    if(!accountIds.isEmpty()) {
        // Query accounts
        List<Account> accounts = [
            SELECT Id, Total_Properties_Sold__c
            FROM Account
            WHERE Id IN :accountIds
        ];

        // Update counter
        for(Account acc : accounts) {
            if(acc.Total_Properties_Sold__c == null) {
                acc.Total_Properties_Sold__c = 0;
            }
            acc.Total_Properties_Sold__c++;
        }

        update accounts;
    }
}
```

### Pattern 4: Prevent Deletion

```apex
trigger PropertyTrigger on Property__c (before delete) {
    for(Property__c prop : Trigger.old) {
        if(prop.Status__c == 'Sold') {
            prop.addError('Cannot delete sold properties');
        }
    }
}
```

### Pattern 5: Field History Tracking

```apex
trigger PropertyTrigger on Property__c (after update) {
    List<Property_History__c> historyRecords = new List<Property_History__c>();

    for(Property__c prop : Trigger.new) {
        Property__c oldProp = Trigger.oldMap.get(prop.Id);

        // Track status changes
        if(prop.Status__c != oldProp.Status__c) {
            Property_History__c history = new Property_History__c();
            history.Property__c = prop.Id;
            history.Field_Changed__c = 'Status';
            history.Old_Value__c = oldProp.Status__c;
            history.New_Value__c = prop.Status__c;
            history.Changed_By__c = UserInfo.getUserId();
            history.Changed_Date__c = DateTime.now();
            historyRecords.add(history);
        }

        // Track price changes
        if(prop.Listing_Price__c != oldProp.Listing_Price__c) {
            Property_History__c history = new Property_History__c();
            history.Property__c = prop.Id;
            history.Field_Changed__c = 'Listing Price';
            history.Old_Value__c = String.valueOf(oldProp.Listing_Price__c);
            history.New_Value__c = String.valueOf(prop.Listing_Price__c);
            history.Changed_By__c = UserInfo.getUserId();
            history.Changed_Date__c = DateTime.now();
            historyRecords.add(history);
        }
    }

    if(!historyRecords.isEmpty()) {
        insert historyRecords;
    }
}
```

## 🎯 Trigger Handler Pattern (Best Practice)

**Problem:** All logic in trigger gets messy fast.

**Solution:** Use a handler class.

### PropertyTrigger (Lightweight)

```apex
trigger PropertyTrigger on Property__c (before insert, before update, after insert, after update, after delete) {
    PropertyTriggerHandler handler = new PropertyTriggerHandler();

    if(Trigger.isBefore) {
        if(Trigger.isInsert) {
            handler.beforeInsert(Trigger.new);
        }
        else if(Trigger.isUpdate) {
            handler.beforeUpdate(Trigger.new, Trigger.oldMap);
        }
    }

    if(Trigger.isAfter) {
        if(Trigger.isInsert) {
            handler.afterInsert(Trigger.new);
        }
        else if(Trigger.isUpdate) {
            handler.afterUpdate(Trigger.new, Trigger.oldMap);
        }
        else if(Trigger.isDelete) {
            handler.afterDelete(Trigger.old);
        }
    }
}
```

### PropertyTriggerHandler (All Logic)

```apex
public class PropertyTriggerHandler {

    public void beforeInsert(List<Property__c> newProperties) {
        setDefaultValues(newProperties);
        validateProperties(newProperties);
    }

    public void beforeUpdate(List<Property__c> newProperties, Map<Id, Property__c> oldMap) {
        validateProperties(newProperties);
        calculateFields(newProperties);
    }

    public void afterInsert(List<Property__c> newProperties) {
        createDefaultTasks(newProperties);
    }

    public void afterUpdate(List<Property__c> newProperties, Map<Id, Property__c> oldMap) {
        updateAccountCounters(newProperties, oldMap);
        trackFieldChanges(newProperties, oldMap);
    }

    public void afterDelete(List<Property__c> oldProperties) {
        // Cleanup logic
    }

    // Private helper methods

    private void setDefaultValues(List<Property__c> properties) {
        for(Property__c prop : properties) {
            if(prop.Status__c == null) {
                prop.Status__c = 'Available';
            }
        }
    }

    private void validateProperties(List<Property__c> properties) {
        for(Property__c prop : properties) {
            if(prop.Listing_Price__c != null && prop.Listing_Price__c < 0) {
                prop.addError('Price must be positive');
            }
        }
    }

    private void calculateFields(List<Property__c> properties) {
        for(Property__c prop : properties) {
            if(prop.Square_Footage__c != null && prop.Listing_Price__c != null && prop.Square_Footage__c > 0) {
                prop.Price_Per_Square_Foot__c = prop.Listing_Price__c / prop.Square_Footage__c;
            }
        }
    }

    private void createDefaultTasks(List<Property__c> properties) {
        List<Task> tasks = new List<Task>();

        for(Property__c prop : properties) {
            Task t = new Task(
                Subject = 'Schedule photography',
                WhatId = prop.Id,
                ActivityDate = Date.today().addDays(7)
            );
            tasks.add(t);
        }

        if(!tasks.isEmpty()) {
            insert tasks;
        }
    }

    private void updateAccountCounters(List<Property__c> newProperties, Map<Id, Property__c> oldMap) {
        Set<Id> accountIds = new Set<Id>();

        for(Property__c prop : newProperties) {
            Property__c oldProp = oldMap.get(prop.Id);

            if(prop.Status__c == 'Sold' && oldProp.Status__c != 'Sold' && prop.Account__c != null) {
                accountIds.add(prop.Account__c);
            }
        }

        if(!accountIds.isEmpty()) {
            List<Account> accounts = [SELECT Id, Total_Properties_Sold__c FROM Account WHERE Id IN :accountIds];

            for(Account acc : accounts) {
                acc.Total_Properties_Sold__c = (acc.Total_Properties_Sold__c == null) ? 1 : acc.Total_Properties_Sold__c + 1;
            }

            update accounts;
        }
    }

    private void trackFieldChanges(List<Property__c> newProperties, Map<Id, Property__c> oldMap) {
        // Track history as shown in previous pattern
    }
}
```

## ⚡ Bulkification Best Practices

### ❌ Bad - SOQL in Loop

```apex
trigger PropertyTrigger on Property__c (after insert) {
    for(Property__c prop : Trigger.new) {
        // BAD: SOQL inside loop!
        Account acc = [SELECT Id, Name FROM Account WHERE Id = :prop.Account__c];
        // Process account
    }
}
```

### ✅ Good - SOQL Outside Loop

```apex
trigger PropertyTrigger on Property__c (after insert) {
    // Collect all Account Ids
    Set<Id> accountIds = new Set<Id>();
    for(Property__c prop : Trigger.new) {
        if(prop.Account__c != null) {
            accountIds.add(prop.Account__c);
        }
    }

    // Query once
    Map<Id, Account> accountMap = new Map<Id, Account>([
        SELECT Id, Name
        FROM Account
        WHERE Id IN :accountIds
    ]);

    // Use map
    for(Property__c prop : Trigger.new) {
        if(prop.Account__c != null) {
            Account acc = accountMap.get(prop.Account__c);
            // Process account
        }
    }
}
```

### ❌ Bad - DML in Loop

```apex
trigger PropertyTrigger on Property__c (after insert) {
    for(Property__c prop : Trigger.new) {
        Task t = new Task(Subject = 'Follow up', WhatId = prop.Id);
        insert t; // BAD: DML inside loop!
    }
}
```

### ✅ Good - Bulk DML

```apex
trigger PropertyTrigger on Property__c (after insert) {
    List<Task> tasks = new List<Task>();

    for(Property__c prop : Trigger.new) {
        Task t = new Task(Subject = 'Follow up', WhatId = prop.Id);
        tasks.add(t);
    }

    if(!tasks.isEmpty()) {
        insert tasks; // Single DML statement
    }
}
```

## 🔄 Avoiding Recursion

### Problem: Infinite Loop

```apex
// PropertyTrigger causes update
trigger PropertyTrigger on Property__c (after update) {
    List<Property__c> toUpdate = new List<Property__c>();

    for(Property__c prop : Trigger.new) {
        Property__c p = new Property__c(Id = prop.Id);
        p.Last_Modified_Date__c = DateTime.now();
        toUpdate.add(p);
    }

    update toUpdate; // This triggers the same trigger again! Infinite loop!
}
```

### Solution 1: Static Boolean

```apex
public class PropertyTriggerHandler {
    private static Boolean isExecuting = false;

    public void afterUpdate(List<Property__c> newProperties, Map<Id, Property__c> oldMap) {
        if(isExecuting) return; // Exit if already running

        isExecuting = true;

        // Your logic here that might cause recursion
        List<Property__c> toUpdate = new List<Property__c>();
        // ... update logic ...

        if(!toUpdate.isEmpty()) {
            update toUpdate;
        }

        isExecuting = false;
    }
}
```

### Solution 2: Track Processed Records

```apex
public class PropertyTriggerHandler {
    private static Set<Id> processedIds = new Set<Id>();

    public void afterUpdate(List<Property__c> newProperties, Map<Id, Property__c> oldMap) {
        List<Property__c> toUpdate = new List<Property__c>();

        for(Property__c prop : newProperties) {
            if(!processedIds.contains(prop.Id)) {
                processedIds.add(prop.Id);
                // Process property
            }
        }
    }
}
```

## 🧪 Testing Triggers

### Basic Trigger Test

```apex
@isTest
private class PropertyTriggerTest {

    @isTest
    static void testBeforeInsertDefaultValues() {
        // Setup
        Property__c prop = new Property__c(
            Name = 'Test Property',
            Listing_Price__c = 500000
            // Status__c intentionally blank
        );

        // Execute
        Test.startTest();
        insert prop;
        Test.stopTest();

        // Verify
        Property__c inserted = [SELECT Id, Status__c FROM Property__c WHERE Id = :prop.Id];
        System.assertEquals('Available', inserted.Status__c, 'Status should default to Available');
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
        List<Task> tasks = [SELECT Id, Subject FROM Task WHERE WhatId = :prop.Id];
        System.assertEquals(1, tasks.size(), 'One task should be created');
        System.assert(tasks[0].Subject.contains('photography'), 'Task should be for photography');
    }

    @isTest
    static void testBulkInsert() {
        // Setup - Test with 200 records
        List<Property__c> properties = new List<Property__c>();

        for(Integer i = 0; i < 200; i++) {
            properties.add(new Property__c(
                Name = 'Test Property ' + i,
                Listing_Price__c = 500000
            ));
        }

        // Execute
        Test.startTest();
        insert properties;
        Test.stopTest();

        // Verify
        System.assertEquals(200, [SELECT COUNT() FROM Property__c], '200 properties should be inserted');
        System.assertEquals(200, [SELECT COUNT() FROM Task], '200 tasks should be created');
    }
}
```

## 📚 Interview Questions

**Q: What's the difference between before and after triggers?**
A:
- **Before**: Updates to Trigger.new don't require DML, no record Id yet, used for validation/field updates
- **After**: Record has Id, can create related records, requires DML to update Trigger.new

**Q: How do you prevent recursion in triggers?**
A: Use static variables to track execution (static Boolean flag or Set of processed Ids). Check the flag at the start of your handler method and exit early if already running.

**Q: What are the governor limits for triggers?**
A:
- 100 SOQL queries
- 150 DML statements
- 10,000 records per DML
- Must be bulkified (handle 200 records)

**Q: When should you use a trigger vs. Process Builder?**
A:
- **Trigger**: Complex logic, need to query child records, multiple object updates, need full control
- **Process Builder**: Simple field updates, send emails, create single record

**Q: What is Trigger.new vs Trigger.newMap?**
A:
- **Trigger.new**: List of new records (available in all events)
- **Trigger.newMap**: `Map<Id, SObject>` of new records (only after insert/update, and delete events)

## 🚀 Next Steps

Excellent! You've mastered Apex triggers. Next, learn how to test your code:

**[→ Next: Apex Testing](/docs/salesforce/apex/testing)**

---

**You can now automate complex business logic with triggers!** Remember: Always bulkify and use handler patterns. 🎓
