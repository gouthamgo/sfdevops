---
sidebar_position: 7
title: Practical Development Guide
description: Connect the dots - Build real applications from scratch with decision-making frameworks
---

# Practical Apex Development: Connecting the Dots

Learn to think like a Salesforce developer. This guide shows you HOW to apply concepts, WHEN to use different approaches, and WHY certain patterns work better than others.

## 🎯 What You'll Master

- How to approach real business requirements
- Decision-making frameworks (when to use what)
- Complete end-to-end implementations
- Common patterns and anti-patterns
- Building muscle memory through practice
- Thinking in Salesforce architecture

## 🧠 The Developer's Thought Process

### Scenario: Property Management System

**Business Requirement:**
> "When a property is marked as 'Sold', automatically create an invoice, update the agent's commission, send email notifications, and sync to our external accounting system."

### Step 1: Break Down the Requirement

```
Requirement Analysis:
├── Trigger Event: Property status changes to "Sold"
├── Actions:
│   ├── Create Invoice (DML)
│   ├── Update Agent Commission (DML on related record)
│   ├── Send Email (Messaging)
│   └── Sync to External System (HTTP Callout)
└── Considerations:
    ├── Must handle bulk operations (200 properties at once)
    ├── Callouts can't be in triggers
    ├── Need error handling
    └── Must be testable
```

### Step 2: Architecture Decisions

**Q: Where does the logic go?**

```
Decision Framework:
├── Trigger?
│   ✅ YES - Need to respond to data changes
│   └── But: Keep trigger thin, delegate to handler
│
├── Apex Class?
│   ✅ YES - Business logic goes here
│   └── Handler pattern for organization
│
├── Flow?
│   ❌ NO - Too complex, need callout capability
│
└── Future/Queueable?
    ✅ YES - For external system callout
    └── Use Queueable (better monitoring, can pass objects)
```

**Q: How to structure the code?**

```
Architecture:
PropertyTrigger.trigger (Thin)
    ↓
PropertyTriggerHandler.cls (Orchestration)
    ↓
├── PropertyService.cls (Business Logic)
│   ├── createInvoice()
│   ├── updateAgentCommission()
│   └── sendNotifications()
└── AccountingQueueable.cls (Async Callout)
    └── syncToAccounting()
```

### Step 3: Implementation

#### 3.1 Trigger (Keep it THIN!)

```apex
// PropertyTrigger.trigger
trigger PropertyTrigger on Property__c (after update) {
    PropertyTriggerHandler handler = new PropertyTriggerHandler();

    if(Trigger.isAfter && Trigger.isUpdate) {
        handler.handleAfterUpdate(Trigger.new, Trigger.oldMap);
    }
}
```

**Why this approach?**
- ✅ Easy to maintain (all logic in handler)
- ✅ Easy to test (can test handler directly)
- ✅ Easy to add more events later
- ✅ Single trigger per object (best practice)

#### 3.2 Trigger Handler (Orchestration)

```apex
// PropertyTriggerHandler.cls
public class PropertyTriggerHandler {

    public void handleAfterUpdate(List<Property__c> newProperties, Map<Id, Property__c> oldMap) {
        // Filter only properties that became "Sold"
        List<Property__c> soldProperties = new List<Property__c>();

        for(Property__c prop : newProperties) {
            Property__c oldProp = oldMap.get(prop.Id);

            // Check if status CHANGED to Sold
            if(prop.Status__c == 'Sold' && oldProp.Status__c != 'Sold') {
                soldProperties.add(prop);
            }
        }

        // Only proceed if we have sold properties
        if(!soldProperties.isEmpty()) {
            PropertyService.processSoldProperties(soldProperties);
        }
    }
}
```

**Key Learning Points:**
1. **Filter First**: Only process relevant records
2. **Check Old vs New**: Status CHANGED, not just equals 'Sold'
3. **Null Check**: Always check isEmpty() before processing
4. **Delegate**: Handler calls service, doesn't do business logic

#### 3.3 Service Class (Business Logic)

```apex
// PropertyService.cls
public class PropertyService {

    public static void processSoldProperties(List<Property__c> properties) {
        // Step 1: Create invoices
        List<Invoice__c> invoices = createInvoices(properties);
        insert invoices;

        // Step 2: Update agent commissions (related records)
        updateAgentCommissions(properties);

        // Step 3: Send email notifications
        sendNotifications(properties);

        // Step 4: Queue external sync (must be async)
        if(!System.isFuture() && !System.isBatch()) {
            System.enqueueJob(new AccountingQueueable(properties));
        }
    }

    private static List<Invoice__c> createInvoices(List<Property__c> properties) {
        List<Invoice__c> invoices = new List<Invoice__c>();

        for(Property__c prop : properties) {
            Invoice__c invoice = new Invoice__c(
                Property__c = prop.Id,
                Amount__c = prop.Sale_Price__c,
                Invoice_Date__c = Date.today(),
                Status__c = 'Draft'
            );
            invoices.add(invoice);
        }

        return invoices;
    }

    private static void updateAgentCommissions(List<Property__c> properties) {
        // Get agent IDs
        Set<Id> agentIds = new Set<Id>();
        for(Property__c prop : properties) {
            if(prop.Agent__c != null) {
                agentIds.add(prop.Agent__c);
            }
        }

        // Query agents (bulkified!)
        Map<Id, Contact> agents = new Map<Id, Contact>([
            SELECT Id, Total_Commission__c
            FROM Contact
            WHERE Id IN :agentIds
        ]);

        // Calculate new commissions
        for(Property__c prop : properties) {
            if(agents.containsKey(prop.Agent__c)) {
                Contact agent = agents.get(prop.Agent__c);
                Decimal commission = prop.Sale_Price__c * 0.03; // 3% commission
                agent.Total_Commission__c = (agent.Total_Commission__c ?? 0) + commission;
            }
        }

        // Update agents (single DML for all)
        if(!agents.isEmpty()) {
            update agents.values();
        }
    }

    private static void sendNotifications(List<Property__c> properties) {
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

        for(Property__c prop : properties) {
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(new String[]{ prop.Agent_Email__c });
            email.setSubject('Property Sold: ' + prop.Name);
            email.setPlainTextBody('Congratulations! ' + prop.Name + ' has been sold.');
            emails.add(email);
        }

        if(!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }
}
```

**Key Learning Points:**

1. **Bulkification Everywhere**:
   ```apex
   // ❌ WRONG - Query in loop
   for(Property__c prop : properties) {
       Contact agent = [SELECT Id FROM Contact WHERE Id = :prop.Agent__c];
   }

   // ✅ RIGHT - Single query for all
   Set<Id> agentIds = new Set<Id>();
   for(Property__c prop : properties) {
       agentIds.add(prop.Agent__c);
   }
   Map<Id, Contact> agents = new Map<Id, Contact>([SELECT Id FROM Contact WHERE Id IN :agentIds]);
   ```

2. **Null Safety**:
   ```apex
   agent.Total_Commission__c = (agent.Total_Commission__c ?? 0) + commission;
   // The ?? operator returns 0 if Total_Commission__c is null
   ```

3. **Check for Async Context**:
   ```apex
   if(!System.isFuture() && !System.isBatch()) {
       System.enqueueJob(new AccountingQueueable(properties));
   }
   ```

#### 3.4 Queueable for External Callout

```apex
// AccountingQueueable.cls
public class AccountingQueueable implements Queueable, Database.AllowsCallouts {

    private List<Property__c> properties;

    public AccountingQueueable(List<Property__c> properties) {
        this.properties = properties;
    }

    public void execute(QueueableContext context) {
        for(Property__c prop : properties) {
            try {
                syncProperty(prop);
            } catch(Exception e) {
                // Log error, don't break entire batch
                System.debug('Failed to sync property: ' + prop.Id + ', Error: ' + e.getMessage());
                logError(prop.Id, e.getMessage());
            }
        }
    }

    private void syncProperty(Property__c prop) {
        // Prepare data
        Map<String, Object> payload = new Map<String, Object>{
            'propertyId' => prop.Id,
            'name' => prop.Name,
            'salePrice' => prop.Sale_Price__c,
            'saleDate' => String.valueOf(Date.today())
        };

        // Make callout
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Accounting_System/api/properties');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(payload));
        req.setTimeout(30000);

        Http http = new Http();
        HttpResponse res = http.send(req);

        if(res.getStatusCode() != 200 && res.getStatusCode() != 201) {
            throw new CalloutException('API Error: ' + res.getStatusCode() + ' - ' + res.getBody());
        }
    }

    private void logError(Id propertyId, String errorMessage) {
        Integration_Error__c error = new Integration_Error__c(
            Property__c = propertyId,
            Error_Message__c = errorMessage,
            Timestamp__c = DateTime.now()
        );
        insert error;
    }
}
```

**Why Queueable (not Future)?**
- ✅ Can pass complex objects (`List&lt;Property__c&gt;`)
- ✅ Returns Job ID for monitoring
- ✅ Better error handling
- ✅ Can chain if needed

## 🎓 Decision-Making Frameworks

### Framework 1: Where Should My Logic Go?

```
START: I need to add logic
    ↓
Q: Does it respond to data changes?
├── YES → Trigger (then delegate to Handler)
└── NO → Continue
    ↓
Q: Is it a user action (button, quick action)?
├── YES → Apex Controller / Aura Enabled method
└── NO → Continue
    ↓
Q: Is it scheduled/recurring?
├── YES → Scheduled Apex or Flow
└── NO → Continue
    ↓
Q: Is it declarative (simple field updates)?
├── YES → Use Flow or Process Builder
└── NO → Apex Class
```

### Framework 2: Synchronous vs Asynchronous?

```
START: I need to run code
    ↓
Q: Does it involve external callouts?
├── YES → MUST BE ASYNC (Future/Queueable)
└── NO → Continue
    ↓
Q: Is it triggered by a user action?
├── YES → Can be Synchronous (if fast)
└── NO → Continue
    ↓
Q: Does it process 10,000+ records?
├── YES → Batch Apex
└── NO → Continue
    ↓
Q: Does it run on schedule?
├── YES → Scheduled Apex
└── NO → Synchronous is fine
```

### Framework 3: Trigger vs Flow?

```
Use TRIGGER when:
├── Need to query child records
├── Need to update multiple unrelated objects
├── Complex business logic (loops, maps, etc.)
├── Need callouts (via async)
└── Need to prevent recursion

Use FLOW when:
├── Simple field updates
├── Create single child record
├── Send email/post to Chatter
├── Call simple Apex action
└── Admin-maintainable logic
```

## 💪 Building Muscle Memory: Patterns

### Pattern 1: The Bulkification Pattern

**Problem**: Process multiple records efficiently

**Solution**: Always think in collections

```apex
// LEARN THIS PATTERN - Use it EVERYWHERE!

public class BulkificationPattern {

    public static void processRecords(List<Property__c> properties) {
        // Step 1: Collect IDs
        Set<Id> accountIds = new Set<Id>();
        Map<Id, List<Property__c>> propertiesByAccount = new Map<Id, List<Property__c>>();

        for(Property__c prop : properties) {
            accountIds.add(prop.Account__c);

            // Group properties by account
            if(!propertiesByAccount.containsKey(prop.Account__c)) {
                propertiesByAccount.put(prop.Account__c, new List<Property__c>());
            }
            propertiesByAccount.get(prop.Account__c).add(prop);
        }

        // Step 2: Query ONCE for all related records
        Map<Id, Account> accounts = new Map<Id, Account>([
            SELECT Id, Name, Total_Properties__c
            FROM Account
            WHERE Id IN :accountIds
        ]);

        // Step 3: Process in memory
        for(Id accountId : propertiesByAccount.keySet()) {
            Account acc = accounts.get(accountId);
            List<Property__c> props = propertiesByAccount.get(accountId);

            // Update account based on properties
            acc.Total_Properties__c = props.size();
        }

        // Step 4: Single DML for all
        update accounts.values();
    }
}
```

**Muscle Memory Checklist**:
- [ ] Collect IDs in Set first
- [ ] Query ONCE with IN clause
- [ ] Use Map for O(1) lookup
- [ ] Single DML at the end

### Pattern 2: The Query Pattern

**Problem**: Get data efficiently

**Solution**: Use Maps for lookups

```apex
// LEARN THIS PATTERN - The "Map from SOQL" trick

public class QueryPattern {

    public static void updateProperties(List<Property__c> properties) {
        // Pattern: Query directly into Map
        Map<Id, Account> accountMap = new Map<Id, Account>([
            SELECT Id, Name, Industry
            FROM Account
            WHERE Id IN :accountIds
        ]);

        // Now lookup is O(1) time instead of O(n)
        for(Property__c prop : properties) {
            Account acc = accountMap.get(prop.Account__c);
            if(acc != null) {
                // Do something with account
            }
        }
    }
}
```

**Why this works?**
- Map constructor accepts `List&lt;SObject&gt;`
- Map key is automatically the record Id
- Super fast lookups

### Pattern 3: The Null-Safe Pattern

**Problem**: Avoid NullPointerException

**Solution**: Check everything!

```apex
// LEARN THIS PATTERN - Always check nulls

public class NullSafePattern {

    public static void safeProcessing(Property__c prop) {
        // Pattern 1: Null coalescing operator (??)
        Decimal price = prop.Listing_Price__c ?? 0;

        // Pattern 2: Check before access
        if(prop.Account__c != null) {
            Account acc = [SELECT Id, Name FROM Account WHERE Id = :prop.Account__c];
            if(acc != null && acc.Name != null) {
                // Safe to use acc.Name
            }
        }

        // Pattern 3: Safe navigation (use in expressions)
        String accountName = prop.Account__r?.Name;

        // Pattern 4: Check collections
        List<Property__c> properties = getProperties();
        if(properties != null && !properties.isEmpty()) {
            // Safe to process
        }
    }
}
```

### Pattern 4: The Error Handling Pattern

**Problem**: Handle errors gracefully

**Solution**: Try-catch with logging

```apex
// LEARN THIS PATTERN - Proper error handling

public class ErrorHandlingPattern {

    public static void processWithErrorHandling(List<Property__c> properties) {
        List<Property__c> successfullyProcessed = new List<Property__c>();
        List<String> errors = new List<String>();

        for(Property__c prop : properties) {
            try {
                // Process property
                processProperty(prop);
                successfullyProcessed.add(prop);

            } catch(DmlException e) {
                errors.add('DML Error on ' + prop.Name + ': ' + e.getMessage());
            } catch(Exception e) {
                errors.add('Error on ' + prop.Name + ': ' + e.getMessage());
            }
        }

        // Log all errors
        if(!errors.isEmpty()) {
            logErrors(errors);
        }

        System.debug(successfullyProcessed.size() + ' properties processed successfully');
    }

    // Alternative: Use Database methods with allOrNone=false
    public static void processSafeDML(List<Property__c> properties) {
        Database.SaveResult[] results = Database.update(properties, false);

        for(Integer i = 0; i < results.size(); i++) {
            if(!results[i].isSuccess()) {
                System.debug('Failed: ' + properties[i].Name);
                for(Database.Error error : results[i].getErrors()) {
                    System.debug('Error: ' + error.getMessage());
                }
            }
        }
    }
}
```

## 🔄 Complete Example: Building from Scratch

### Business Requirement:

> "Build a system where real estate agents can request property inspections. When requested:
> 1. Create an Inspection record
> 2. Check if inspector is available
> 3. If available, assign and send email
> 4. If not, add to queue
> 5. Log everything for reporting"

### Step-by-Step Implementation:

#### Step 1: Data Model

```
Objects Needed:
├── Property__c (already exists)
├── Inspector__c
│   ├── Name
│   ├── Availability_Status__c (Available/Busy)
│   └── Max_Daily_Inspections__c
├── Inspection__c
│   ├── Property__c (Lookup)
│   ├── Inspector__c (Lookup)
│   ├── Requested_Date__c
│   ├── Status__c (Requested/Assigned/Completed)
│   └── Priority__c (High/Medium/Low)
└── Inspection_Log__c (for audit trail)
```

#### Step 2: User Interface (LWC Component)

```html
<!-- requestInspection.html -->
<template>
    <lightning-card title="Request Inspection">
        <div class="slds-p-around_medium">
            <lightning-input
                label="Inspection Date"
                type="date"
                value={inspectionDate}
                onchange={handleDateChange}>
            </lightning-input>

            <lightning-combobox
                label="Priority"
                value={priority}
                options={priorityOptions}
                onchange={handlePriorityChange}>
            </lightning-combobox>

            <lightning-button
                label="Request Inspection"
                variant="brand"
                onclick={handleRequest}>
            </lightning-button>
        </div>
    </lightning-card>
</template>
```

```javascript
// requestInspection.js
import { LightningElement, api, track } from 'lwc';
import requestInspection from '@salesforce/apex/InspectionController.requestInspection';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class RequestInspection extends LightningElement {
    @api recordId; // Property ID
    @track inspectionDate;
    @track priority = 'Medium';

    priorityOptions = [
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' }
    ];

    handleDateChange(event) {
        this.inspectionDate = event.target.value;
    }

    handlePriorityChange(event) {
        this.priority = event.detail.value;
    }

    handleRequest() {
        requestInspection({
            propertyId: this.recordId,
            requestedDate: this.inspectionDate,
            priority: this.priority
        })
        .then(result => {
            this.showToast('Success', result, 'success');
        })
        .catch(error => {
            this.showToast('Error', error.body.message, 'error');
        });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
```

#### Step 3: Apex Controller

```apex
// InspectionController.cls
public with sharing class InspectionController {

    @AuraEnabled
    public static String requestInspection(Id propertyId, Date requestedDate, String priority) {
        try {
            // Validate inputs
            if(propertyId == null || requestedDate == null) {
                throw new AuraHandledException('Property and date are required');
            }

            if(requestedDate < Date.today()) {
                throw new AuraHandledException('Cannot request inspection in the past');
            }

            // Create inspection request
            Inspection__c inspection = new Inspection__c(
                Property__c = propertyId,
                Requested_Date__c = requestedDate,
                Priority__c = priority,
                Status__c = 'Requested'
            );
            insert inspection;

            // Try to assign inspector (async because of potential callout)
            System.enqueueJob(new InspectionAssignmentQueueable(inspection.Id));

            return 'Inspection requested successfully!';

        } catch(Exception e) {
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
    }
}
```

#### Step 4: Business Logic

```apex
// InspectionService.cls
public class InspectionService {

    public static void assignInspector(Id inspectionId) {
        // Get inspection details
        Inspection__c inspection = [
            SELECT Id, Property__c, Requested_Date__c, Priority__c
            FROM Inspection__c
            WHERE Id = :inspectionId
        ];

        // Find available inspector
        Inspector__c inspector = findAvailableInspector(inspection.Requested_Date__c);

        if(inspector != null) {
            // Assign inspector
            inspection.Inspector__c = inspector.Id;
            inspection.Status__c = 'Assigned';
            update inspection;

            // Send notification
            sendInspectorNotification(inspection, inspector);

            // Log success
            logInspection(inspection.Id, 'Assigned', 'Inspector assigned: ' + inspector.Name);

        } else {
            // Add to queue
            inspection.Status__c = 'Queued';
            update inspection;

            // Log queued
            logInspection(inspection.Id, 'Queued', 'No inspectors available');
        }
    }

    private static Inspector__c findAvailableInspector(Date requestedDate) {
        // Query available inspectors
        List<Inspector__c> inspectors = [
            SELECT Id, Name, Email__c, Max_Daily_Inspections__c,
                (SELECT Id FROM Inspections__r WHERE Requested_Date__c = :requestedDate)
            FROM Inspector__c
            WHERE Availability_Status__c = 'Available'
            ORDER BY Max_Daily_Inspections__c DESC
        ];

        // Find inspector with capacity
        for(Inspector__c inspector : inspectors) {
            if(inspector.Inspections__r.size() < inspector.Max_Daily_Inspections__c) {
                return inspector;
            }
        }

        return null; // No one available
    }

    private static void sendInspectorNotification(Inspection__c inspection, Inspector__c inspector) {
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        email.setToAddresses(new String[]{ inspector.Email__c });
        email.setSubject('New Inspection Assignment');
        email.setPlainTextBody('You have been assigned a new inspection on ' + inspection.Requested_Date__c);

        Messaging.sendEmail(new Messaging.SingleEmailMessage[]{ email });
    }

    private static void logInspection(Id inspectionId, String status, String notes) {
        Inspection_Log__c log = new Inspection_Log__c(
            Inspection__c = inspectionId,
            Status__c = status,
            Notes__c = notes,
            Timestamp__c = DateTime.now()
        );
        insert log;
    }
}
```

#### Step 5: Async Processing

```apex
// InspectionAssignmentQueueable.cls
public class InspectionAssignmentQueueable implements Queueable {

    private Id inspectionId;

    public InspectionAssignmentQueueable(Id inspectionId) {
        this.inspectionId = inspectionId;
    }

    public void execute(QueueableContext context) {
        try {
            InspectionService.assignInspector(inspectionId);
        } catch(Exception e) {
            // Log error
            System.debug('Failed to assign inspector: ' + e.getMessage());
        }
    }
}
```

### Key Takeaways from This Example:

1. **Separation of Concerns**:
   - LWC handles UI
   - Controller validates and creates
   - Service handles business logic
   - Queueable handles async

2. **Error Handling at Every Layer**:
   - LWC catches and shows toast
   - Controller validates inputs
   - Service handles logic errors

3. **Bulkification Ready**:
   - Service methods accept IDs
   - Can easily modify to handle multiple

4. **Testable Design**:
   - Each class has single responsibility
   - Can mock callouts
   - Can test each piece independently

## 🎯 Practice Exercises

### Exercise 1: Contact Deduplication
**Requirement**: When a contact is created, check if another contact exists with same email. If yes, prevent creation and show error.

<details>
<summary>Solution Approach</summary>

1. Trigger: Before Insert on Contact
2. Query existing contacts with same email
3. If found, add error to trigger record
4. Bulkify with `Set&lt;String&gt;` for emails

```apex
trigger ContactTrigger on Contact (before insert) {
    Set<String> emails = new Set<String>();
    for(Contact con : Trigger.new) {
        if(con.Email != null) {
            emails.add(con.Email.toLowerCase());
        }
    }

    Map<String, Contact> existingContacts = new Map<String, Contact>();
    for(Contact existing : [SELECT Email FROM Contact WHERE Email IN :emails]) {
        existingContacts.put(existing.Email.toLowerCase(), existing);
    }

    for(Contact con : Trigger.new) {
        if(con.Email != null && existingContacts.containsKey(con.Email.toLowerCase())) {
            con.addError('A contact with this email already exists.');
        }
    }
}
```
</details>

### Exercise 2: Opportunity Auto-Close
**Requirement**: Close opportunities automatically if no activity for 30 days.

<details>
<summary>Solution Approach</summary>

1. Scheduled Apex running daily
2. Query opportunities with no activity in 30 days
3. Update status to 'Closed Lost'
4. Send notification to owner

Think through: What date fields to check? How to batch process?
</details>

### Exercise 3: Real-Time Dashboard
**Requirement**: Show real-time count of properties by status with refresh capability.

<details>
<summary>Solution Approach</summary>

1. LWC component with @wire
2. Apex method with @AuraEnabled(cacheable=true)
3. Aggregate query grouping by status
4. Use refreshApex() for manual refresh
</details>

## 🚀 Next Steps

Now you understand HOW to think through problems! Practice with these resources:

**[→ LWC Practical Guide](/docs/salesforce/lwc/practical-guide)** - Learn to build real UI components

**[→ Start Building Projects](/docs/hands-on/labs-exercises)** - Apply everything you learned

---

**Remember**: The best way to build muscle memory is to BUILD! Start small, make mistakes, learn, repeat. 💪
