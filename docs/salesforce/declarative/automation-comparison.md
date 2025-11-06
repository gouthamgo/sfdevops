---
sidebar_position: 4
title: Automation Comparison
description: Master when to use Flow, Process Builder, Workflow Rules, Apex Triggers - complete decision framework
---

# Automation Comparison: Choose the Right Tool

Master all Salesforce automation tools and know exactly when to use Flow, Process Builder, Workflow Rules, or Apex Triggers.

## 🎯 What You'll Master

- Flow Builder vs Process Builder vs Workflow
- When to use each automation tool
- Complete decision framework
- Migration strategies
- Performance considerations
- Real-world scenarios
- Best practices

## 🔧 Automation Tools Overview

```
Salesforce Automation Tools (Newest → Oldest):

Flow Builder (Current Standard)
├── Most powerful declarative tool
├── Replace Process Builder & Workflow
├── Visual programming
└── Handles complex logic

Process Builder (Legacy - Retiring)
├── Workflow with more features
├── No new features since 2021
└── Migrate to Flow

Workflow Rules (Legacy - Retiring)
├── Simple field updates & emails
├── No new features
└── Migrate to Flow

Apex Triggers (Code)
├── Most powerful
├── Complex business logic
└── When declarative isn't enough
```

## 📊 Quick Comparison Table

| Feature | Workflow | Process Builder | Flow | Apex Trigger |
|---------|----------|----------------|------|--------------|
| **Status** | Legacy | Legacy | Current | Code |
| **Complexity** | Simple | Medium | Complex | Very Complex |
| **Record Updates** | Same object | Any object | Any object | Any object |
| **Cross-Object** | ❌ No | ✅ Limited | ✅ Yes | ✅ Yes |
| **Loops** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Callouts** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Before Save** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Bulkified** | ✅ Yes | ⚠️ Sometimes | ⚠️ Sometimes | ✅ Manual |
| **Testing** | Manual | Manual | Manual | ✅ Apex Tests |
| **Version Control** | ❌ No | ❌ No | ❌ No | ✅ Yes |

## 🎯 Decision Framework

### Start Here

```
Question 1: Can it be done declaratively?
├── YES → Use Flow Builder
└── NO → Use Apex Trigger

Question 2: Is it VERY simple (field update + email)?
├── YES → Consider Workflow (but Flow is better)
└── NO → Use Flow Builder

Question 3: Do you need version control?
├── YES → Use Apex Trigger
└── NO → Use Flow Builder

Question 4: Is performance critical?
├── YES → Use Apex Trigger
└── NO → Use Flow Builder
```

### Detailed Decision Tree

```
What are you trying to do?

Simple Field Update on Same Record
├── Use: Workflow Rule or Flow
└── Example: Set Status = "Approved" when Manager approves

Field Update + Email
├── Use: Workflow Rule or Flow
└── Example: Update Status + Email agent

Update Related Records
├── Use: Process Builder or Flow
└── Example: Update Account when Contact changes

Complex Logic (Loops, Conditions)
├── Use: Flow Builder
└── Example: Calculate commission for all showings

API Callout
├── Use: Flow or Apex
└── Example: Send property to external listing service

Before Record Save
├── Use: Flow (Before-Save) or Apex Trigger
└── Example: Validate ZIP code format

Bulk Processing (1000s of records)
├── Use: Apex Trigger or Batch Apex
└── Example: Nightly commission calculation

Complex Business Logic
├── Use: Apex Trigger
└── Example: Multi-object validation with rollbacks
```

## 🔄 Flow Builder (Recommended)

### When to Use Flow

```
Use Flow When:
├── Record-triggered automation
├── Screen flows (user interaction)
├── Scheduled flows (nightly batches)
├── Platform events
├── Complex logic with loops
├── Cross-object updates
└── Callouts needed

Don't Use Flow When:
├── Need version control
├── Performance is critical (1000s of records)
├── Complex validation requiring rollback
└── Need test coverage tracking
```

### Flow Types

```
Record-Triggered Flow
├── Triggers: Create, Update, Delete
├── Timing: Before Save, After Save
└── Use: Automation on record changes

Screen Flow
├── UI for user input
└── Use: Guided processes, wizards

Scheduled Flow
├── Runs on schedule (daily, weekly)
└── Use: Batch processing

Auto-Launched Flow
├── No trigger, called programmatically
└── Use: Subflows, called from Apex

Platform Event Flow
├── Triggered by platform events
└── Use: Event-driven integration
```

### Record-Triggered Flow Example

**Scenario: Update Property Status**
```
When: Property__c is updated
Condition: Price__c is changed
Action: Send email to agent and manager

Flow Configuration:
1. Trigger: Property__c (After Save, Update)
2. Entry Criteria: Price__c is changed
3. Actions:
   - Get Agent email
   - Get Manager email
   - Send Email action
   - Create Task for follow-up
```

### Flow Best Practices

```
✅ DO:
- Use Before-Save flows for field updates on same record
- Use After-Save flows for related record updates
- Bulkify: Use "Get Records" with collection
- Use Decision elements for complex logic
- Test with bulk data (200+ records)

❌ DON'T:
- Don't query inside loops (use Get Records once)
- Don't create records inside loops without collection
- Don't use fast field updates for complex logic
- Don't forget error handling
```

## ⚙️ Process Builder (Legacy)

### When Process Builder is Still OK

```
Existing Processes (Not Broken):
├── Keep running if working
└── No need to migrate immediately

When to Migrate to Flow:
├── Need to make significant changes
├── Adding new automation
├── Performance issues
└── Salesforce recommends by 2023
```

### Process Builder Limitations

```
Cannot Do:
├── Loops through records
├── Delete records
├── Before-save updates
├── Call REST APIs directly
├── Complex error handling
└── Platform event publishing
```

### Migration: Process Builder → Flow

```
Process Builder              Flow Equivalent
─────────────────────────   ─────────────────────────
Criteria                 →  Decision Element
Immediate Actions        →  After-Save Actions
Scheduled Actions        →  Scheduled Paths
Field Update             →  Update Records
Create Record            →  Create Records
Submit for Approval      →  Submit for Approval Action
Invoke Process           →  Subflow
```

**Example Migration:**
```
Process Builder:
- Object: Property__c
- Criteria: Status = "Sold"
- Action: Update Account.Total_Sales__c

Flow:
1. Trigger: Property__c (After Save)
2. Decision: Status equals "Sold"
3. Get Records: Get Account
4. Assignment: Add Price to Total
5. Update Records: Update Account
```

## 📋 Workflow Rules (Legacy)

### When Workflow is Still OK

```
Very Simple Automation:
├── Field update on same object
├── Send single email
└── Create task

Migrate to Flow When:
├── Need additional logic
├── Adding related automations
└── Salesforce recommends by 2023
```

### Workflow Limitations

```
Can Only:
├── Update fields on same record
├── Update fields on parent record
├── Send email alerts
├── Create tasks
├── Send outbound messages
└── Time-based actions (limited)

Cannot:
├── Update child records
├── Update unrelated records
├── Complex logic
├── Loops
└── API calls
```

### Migration: Workflow → Flow

```
Workflow Rule                Flow Equivalent
──────────────────────────  ─────────────────────────
Evaluation Criteria      →  Entry Criteria
Rule Criteria            →  Decision Element
Field Update             →  Update Records (Before-Save)
Email Alert              →  Send Email
Task Creation            →  Create Records (Task)
Time-Based Action        →  Scheduled Paths
```

## 🎯 Apex Triggers

### When to Use Apex Triggers

```
Use Apex Triggers When:
├── Complex business logic
├── Need version control
├── Performance is critical
├── Multiple object validation
├── Need rollback capability
├── Integration with external systems
├── Test coverage required
└── Declarative tools can't handle it

Examples:
- Validate related records across 3+ objects
- Calculate complex commission structures
- Real-time integration with external API
- Bulk processing with governor limit optimization
```

### Trigger Best Practices

```
✅ DO:
- Use trigger handler framework
- Bulkify all operations
- One trigger per object
- Test with 200+ records
- Use with sharing

❌ DON'T:
- Don't use SOQL in loops
- Don't use DML in loops
- Don't hardcode IDs
- Don't create triggers for simple field updates
```

### Apex Trigger Example

```apex
// PropertyTrigger.trigger
trigger PropertyTrigger on Property__c (before insert, before update, after insert, after update) {
    PropertyTriggerHandler.execute();
}

// PropertyTriggerHandler.cls
public class PropertyTriggerHandler {

    public static void execute() {
        if (Trigger.isBefore) {
            if (Trigger.isInsert || Trigger.isUpdate) {
                validateProperties(Trigger.new);
                calculateCommissions(Trigger.new);
            }
        }

        if (Trigger.isAfter) {
            if (Trigger.isInsert || Trigger.isUpdate) {
                updateRelatedRecords(Trigger.new, Trigger.oldMap);
            }
        }
    }

    private static void validateProperties(List<Property__c> properties) {
        // Complex validation logic
        for (Property__c prop : properties) {
            if (prop.Price__c > 10000000 && String.isBlank(prop.Legal_Review__c)) {
                prop.addError('Properties over $10M require legal review');
            }
        }
    }

    private static void calculateCommissions(List<Property__c> properties) {
        // Complex calculation
    }

    private static void updateRelatedRecords(List<Property__c> properties, Map<Id, Property__c> oldMap) {
        // Bulkified related record updates
    }
}
```

## 🏆 Real-World Scenarios

### Scenario 1: Property Sold - Update Agent Stats

**Requirements:**
- When Property.Status = "Sold"
- Update Agent.Total_Sales__c
- Send email to agent
- Create follow-up task

**Solution: Flow Builder**
```
Why Flow:
✅ Cross-object update (Property → User)
✅ Multiple actions (update, email, task)
✅ Declarative (no code needed)

Flow Steps:
1. Trigger: Property__c (After Save)
2. Decision: Status equals "Sold"
3. Get Records: Get Agent (User)
4. Assignment: Total_Sales = Total_Sales + Price
5. Update Records: Update User
6. Send Email: Congratulations email
7. Create Records: Create follow-up Task
```

### Scenario 2: Validate Related Showings

**Requirements:**
- Before Property.Status = "Sold"
- Check if all Showings are completed
- Block save if not
- Complex validation logic

**Solution: Apex Trigger (Before)**
```apex
Why Apex:
✅ Before-save validation
✅ Can block save with error
✅ Complex query of related records
✅ Need rollback if validation fails

trigger PropertyTrigger on Property__c (before update) {
    for (Property__c prop : Trigger.new) {
        if (prop.Status__c == 'Sold' &&
            Trigger.oldMap.get(prop.Id).Status__c != 'Sold') {

            // Check showings
            Integer pendingShowings = [
                SELECT COUNT()
                FROM Showing__c
                WHERE Property__c = :prop.Id
                AND Status__c != 'Completed'
            ];

            if (pendingShowings > 0) {
                prop.addError(
                    'Cannot mark as Sold. ' +
                    pendingShowings + ' showings still pending.'
                );
            }
        }
    }
}
```

### Scenario 3: Send to External Listing Service

**Requirements:**
- When Property created or updated
- Send data to external API
- Handle API errors
- Retry on failure

**Solution: Flow + Apex**
```
Why Combined:
✅ Flow for trigger logic
✅ Apex for HTTP callout
✅ Flow calls Apex via Action

Flow:
1. Trigger: Property__c (After Save)
2. Decision: Should send to external service?
3. Action: Call Apex method

Apex:
@InvocableMethod(label='Send to Listing Service')
public static void sendToListingService(List<Id> propertyIds) {
    // HTTP callout logic
    // Error handling
    // Retry mechanism
}
```

## 📈 Performance Comparison

```
Tool                    Best For                    Worst For
─────────────────────  ──────────────────────────  ──────────────────────────
Workflow               < 100 records               Bulk operations
Process Builder        < 200 records               Complex logic, bulk
Flow Builder           < 500 records               > 1000 records at once
Apex Trigger           Any volume                  Simple field updates

Performance Tips:
├── Use Before-Save flows for same-record updates
├── Use Apex for bulk operations (1000+ records)
├── Avoid nested flows/processes
└── Test with realistic data volumes
```

## 💡 Best Practices Summary

### ✅ DO:

1. **Start with Flow Builder**
   - Most flexible declarative tool
   - Salesforce's strategic direction

2. **Use Before-Save Flows for Same-Record Updates**
   - Faster than After-Save
   - No additional DML

3. **Migrate Legacy Tools**
   - Process Builder → Flow
   - Workflow → Flow
   - Plan migration by 2023

4. **Test with Bulk Data**
   - Always test with 200+ records
   - Verify bulkification

5. **Document Your Automation**
   - Clear descriptions
   - Explain business logic

### ❌ DON'T:

1. **Don't Mix Too Many Tools**
   - Confusing to maintain
   - Performance issues
   - Hard to debug

2. **Don't Use Workflow for New Automation**
   - Legacy tool
   - Limited functionality

3. **Don't Forget Governor Limits**
   - SOQL queries
   - DML statements
   - CPU time

4. **Don't Over-Engineer**
   - Start simple
   - Add complexity only when needed

## 🚀 Next Steps

**[→ Flow Builder Guide](/docs/salesforce/declarative/flow-builder)** - Build flows

**[→ Apex Triggers](/docs/salesforce/apex/triggers)** - When code is needed

**[→ Validation Rules](/docs/salesforce/declarative/validation-rules)** - Data quality

---

**You now know which automation tool to use!** Choose wisely, automate efficiently. ⚙️
