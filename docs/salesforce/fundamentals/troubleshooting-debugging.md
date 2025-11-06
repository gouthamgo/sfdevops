---
sidebar_position: 4
title: Troubleshooting & Debugging
description: Master Salesforce debugging - debug logs, Developer Console, Apex debugging, LWC debugging, and troubleshooting techniques
---

# Troubleshooting & Debugging: Find and Fix Issues

Master the art of debugging Salesforce applications. Learn debug logs, Developer Console, Apex debugging, LWC debugging, and systematic troubleshooting.

## 🎯 What You'll Master

- Debug logs and log levels
- Developer Console
- Debugging Apex code
- Debugging Lightning Web Components
- Chrome DevTools and Lightning Inspector
- Common errors and solutions
- Governor limit debugging
- Performance profiling
- System monitoring
- Best practices

## 🔍 Debug Logs Overview

```
Salesforce Debug Logs:

Log Types:
├── User-based logging (specific users)
├── Apex class/trigger logging
└── System logging

Log Categories:
├── Apex Code (your code execution)
├── Database (SOQL, DML)
├── Workflow (automation)
├── Validation (validation rules)
├── Callout (HTTP requests)
└── System (platform events)

Log Levels (Verbosity):
NONE < ERROR < WARN < INFO < DEBUG < FINE < FINER < FINEST
```

## 🛠️ Setup Debug Logs

### Enable Debug Logs for User

```
Setup → Debug Logs → New

Traced Entity Type: User
Traced Entity Name: Your Name
Start Date: Today
Expiration Date: Tomorrow (24 hours max)
```

### Set Log Levels

```
Setup → Debug Logs → New → Debug Level

Category           Level
─────────────────────────────
Database           INFO
Workflow           INFO
Validation         INFO
Callout            INFO
Apex Code          DEBUG
Apex Profiling     INFO
Visualforce        INFO
System             DEBUG
```

**Common Debug Level Presets:**

```
Development (Detailed):
- Apex Code: FINEST
- Database: FINEST
- System: DEBUG

Production (Minimal):
- Apex Code: INFO
- Database: INFO
- System: ERROR

Performance Profiling:
- Apex Code: FINE
- Apex Profiling: FINEST
- Database: FINE
```

### View Debug Logs

```
Setup → Debug Logs

Actions:
├── View - Open in browser
├── Download - Save as .log file
└── Delete - Remove old logs

Log Limits:
- Max log size: 20 MB
- Max logs stored: 1000
- Max retention: 24 hours (user logs), 7 days (system logs)
```

## 💻 Developer Console

Powerful IDE for debugging and development.

### Open Developer Console

```
Setup → Developer Console
Or: Gear Icon → Developer Console
Or: Your Name → Developer Console
```

### Key Features

```
Tabs:
├── Logs - View debug logs
├── Tests - Run Apex tests
├── Query Editor - Execute SOQL
├── Checkpoints - Set breakpoints
└── Progress - Monitor async jobs

Tools:
├── Execute Anonymous - Run Apex snippets
├── Log Inspector - Analyze execution
└── Query Plan - Optimize SOQL
```

### Execute Anonymous

Run Apex code without saving.

```
Debug → Open Execute Anonymous Window

// Example 1: Quick data query
List<Property__c> props = [SELECT Id, Name FROM Property__c LIMIT 10];
System.debug('Properties: ' + props);

// Example 2: Test method
PropertyController.getProperties('Available');

// Example 3: Debug variable
Account acc = [SELECT Id, Name FROM Account LIMIT 1];
System.debug('Account: ' + JSON.serializePretty(acc));

Check "Open Log" → Execute
```

### Log Inspector

Analyze debug log execution.

```
Logs Tab → Double-click log → Log Inspector opens

Panels:
├── Stack Tree - Call hierarchy
├── Execution Stack - Method calls
├── Execution Log - Line-by-line execution
├── Source - Apex code
├── Variables - Variable values
└── Heap - Memory usage

Timeline:
- Visual execution timeline
- Identify slow operations
- See governor limit consumption
```

### Checkpoints

Debug without System.debug statements.

```
Setup Checkpoint:

1. Open Apex class in Developer Console
2. Double-click line number to set checkpoint (red dot)
3. Execute code that hits checkpoint
4. View Checkpoints tab for results

Checkpoint Results:
├── Namespace: Current context
├── Symbols: Available variables
├── Heap: Objects in memory
└── Execution: Line reached
```

**Example Checkpoint Debugging:**
```apex
public class PropertyController {
    public static void processProperty(Id propertyId) {
        Property__c prop = getProperty(propertyId);  // Checkpoint here
        // View prop variable values without System.debug

        updateProperty(prop);  // Checkpoint here
        // See updated values
    }
}
```

## 🐛 Debugging Apex

### System.debug

Most common debugging technique.

```apex
// Basic debug
System.debug('Method started');

// Debug with variable
String status = 'Available';
System.debug('Status: ' + status);

// Debug with log level
System.debug(LoggingLevel.ERROR, 'Critical error occurred');

// Debug object
Property__c prop = [SELECT Id, Name, Price__c FROM Property__c LIMIT 1];
System.debug('Property: ' + prop);

// Debug JSON (pretty print)
System.debug('Property JSON: ' + JSON.serializePretty(prop));

// Debug collection size
List<Property__c> props = [SELECT Id FROM Property__c];
System.debug('Found ' + props.size() + ' properties');

// Debug in loop (be careful with limits!)
for (Property__c p : props) {
    System.debug('Processing: ' + p.Id);
}
```

### Debug Governor Limits

```apex
// Check limits at any point
System.debug('SOQL Queries: ' + Limits.getQueries() + '/' + Limits.getLimitQueries());
System.debug('DML Statements: ' + Limits.getDMLStatements() + '/' + Limits.getLimitDMLStatements());
System.debug('CPU Time: ' + Limits.getCpuTime() + '/' + Limits.getLimitCpuTime());
System.debug('Heap Size: ' + Limits.getHeapSize() + '/' + Limits.getLimitHeapSize());

// Debug at critical sections
public void processLargeDataSet(List<Property__c> properties) {
    System.debug('Starting processing');
    debugLimits('START');

    // Do work
    List<Showing__c> showings = getShowings(properties);
    debugLimits('AFTER QUERY');

    // More work
    updateShowings(showings);
    debugLimits('AFTER UPDATE');
}

private void debugLimits(String checkpoint) {
    System.debug('=== ' + checkpoint + ' ===');
    System.debug('SOQL: ' + Limits.getQueries() + '/' + Limits.getLimitQueries());
    System.debug('DML: ' + Limits.getDMLStatements() + '/' + Limits.getLimitDMLStatements());
    System.debug('CPU: ' + Limits.getCpuTime() + 'ms / ' + Limits.getLimitCpuTime() + 'ms');
}
```

### Try-Catch Debugging

```apex
try {
    Property__c prop = [SELECT Id FROM Property__c WHERE Id = :propertyId];
    prop.Status__c = 'Sold';
    update prop;
} catch (QueryException e) {
    System.debug(LoggingLevel.ERROR, 'Query failed: ' + e.getMessage());
    System.debug('Stack Trace: ' + e.getStackTraceString());
} catch (DmlException e) {
    System.debug(LoggingLevel.ERROR, 'DML failed: ' + e.getMessage());
    System.debug('Fields: ' + e.getDmlFieldNames(0));
    System.debug('Type: ' + e.getDmlType(0));
} catch (Exception e) {
    System.debug(LoggingLevel.ERROR, 'Unexpected error: ' + e.getMessage());
    System.debug('Type: ' + e.getTypeName());
    System.debug('Stack: ' + e.getStackTraceString());
    System.debug('Line: ' + e.getLineNumber());
}
```

### Custom Debug Class

```apex
public class DebugHelper {

    private static Boolean ENABLED = true;

    public static void log(String message) {
        if (ENABLED) {
            System.debug('[DEBUG] ' + message);
        }
    }

    public static void log(String context, Object obj) {
        if (ENABLED) {
            System.debug('[' + context + '] ' + JSON.serializePretty(obj));
        }
    }

    public static void error(String message, Exception e) {
        System.debug(LoggingLevel.ERROR, '[ERROR] ' + message);
        System.debug(LoggingLevel.ERROR, 'Message: ' + e.getMessage());
        System.debug(LoggingLevel.ERROR, 'Stack: ' + e.getStackTraceString());
    }

    public static void limits() {
        System.debug('=== GOVERNOR LIMITS ===');
        System.debug('SOQL: ' + Limits.getQueries() + '/' + Limits.getLimitQueries());
        System.debug('DML: ' + Limits.getDMLStatements() + '/' + Limits.getLimitDMLStatements());
        System.debug('CPU: ' + Limits.getCpuTime() + '/' + Limits.getLimitCpuTime());
        System.debug('Heap: ' + Limits.getHeapSize() + '/' + Limits.getLimitHeapSize());
        System.debug('======================');
    }
}

// Usage
DebugHelper.log('Starting property processing');
DebugHelper.log('Property Data', propertyList);
DebugHelper.limits();
```

## ⚡ Debugging Lightning Web Components

### Chrome DevTools

Essential for LWC debugging.

```
Open DevTools: Right-click → Inspect OR F12

Key Tabs:
├── Elements - Inspect component DOM
├── Console - View logs and errors
├── Sources - Debug JavaScript
├── Network - Monitor API calls
└── Performance - Profile rendering
```

### Console Logging

```javascript
// Basic logging
console.log('Component initialized');

// Log with variable
console.log('Property data:', this.property);

// Log object (expandable)
console.log('Record:', JSON.stringify(this.record, null, 2));

// Multiple arguments
console.log('Processing property:', propertyId, 'status:', status);

// Warning
console.warn('Deprecated method used');

// Error
console.error('Failed to load data:', error);

// Table view (arrays)
console.table(this.properties);

// Group related logs
console.group('Property Processing');
console.log('Step 1: Fetch');
console.log('Step 2: Transform');
console.log('Step 3: Display');
console.groupEnd();
```

### Debugging JavaScript

```javascript
// 1. Set breakpoint in Chrome DevTools
// Sources tab → Find your component .js file → Click line number

// 2. Use debugger statement
handleClick() {
    debugger; // Execution pauses here
    const data = this.processData();
    this.updateUI(data);
}

// 3. Conditional breakpoint
handleClick() {
    if (this.property.Price__c > 1000000) {
        debugger; // Only pause for expensive properties
    }
}

// 4. Log and continue
handleData(data) {
    console.log('Data received:', data);
    // Set breakpoint here to inspect 'data' object
    return this.transformData(data);
}
```

### Lightning Inspector

Chrome extension for LWC debugging.

```
Install:
Chrome Web Store → "Salesforce Lightning Inspector"

Features:
├── Component Tree - View component hierarchy
├── Event Log - Track Lightning events
├── Performance - Profile component rendering
└── Storage - View cached data

Usage:
1. Install extension
2. Open Chrome DevTools
3. Navigate to "Lightning" tab
4. View component details, events, performance
```

### Wire Service Debugging

```javascript
import { wire } from 'lwc';
import getProperties from '@salesforce/apex/PropertyController.getProperties';

export default class PropertyList extends LightningElement {

    @wire(getProperties, { status: '$status' })
    wiredProperties({ error, data }) {
        if (data) {
            console.log('Wire received data:', data);
            this.properties = data;
            this.error = undefined;
        } else if (error) {
            console.error('Wire error:', error);
            this.error = error;
            this.properties = undefined;
        }
    }

    // Debug reactive property changes
    @track status = 'Available';

    handleStatusChange(event) {
        console.log('Status changing from', this.status, 'to', event.target.value);
        this.status = event.target.value;
        // Wire will automatically re-fire
    }
}
```

### Error Handling in LWC

```javascript
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

handleSave() {
    saveProperty({ property: this.property })
        .then(result => {
            console.log('Save successful:', result);
            this.showToast('Success', 'Property saved', 'success');
        })
        .catch(error => {
            console.error('Save failed:', error);

            // Extract error message
            let message = 'Unknown error';
            if (error.body) {
                if (Array.isArray(error.body)) {
                    message = error.body.map(e => e.message).join(', ');
                } else if (typeof error.body.message === 'string') {
                    message = error.body.message;
                }
            }

            console.log('Extracted error message:', message);
            this.showToast('Error', message, 'error');
        });
}

showToast(title, message, variant) {
    const event = new ShowToastEvent({ title, message, variant });
    this.dispatchEvent(event);
}
```

## 🚨 Common Errors & Solutions

### Apex Errors

**Error: SOQL Query Limit Exceeded**
```
Error: Too many SOQL queries: 101

Problem: SOQL inside loop

❌ BAD:
for (Property__c prop : properties) {
    Account acc = [SELECT Id FROM Account WHERE Id = :prop.Account__c];
}

✅ GOOD:
Set<Id> accountIds = new Set<Id>();
for (Property__c prop : properties) {
    accountIds.add(prop.Account__c);
}
Map<Id, Account> accounts = new Map<Id, Account>(
    [SELECT Id FROM Account WHERE Id IN :accountIds]
);
```

**Error: CPU Time Limit Exceeded**
```
Error: Apex CPU time limit exceeded

Problem: Inefficient loops or calculations

Debug:
System.debug('CPU before loop: ' + Limits.getCpuTime());
for (Integer i = 0; i < 10000; i++) {
    // Expensive operation
}
System.debug('CPU after loop: ' + Limits.getCpuTime());

Solution:
- Reduce loop iterations
- Optimize calculations
- Use @future or Queueable for async processing
```

**Error: DML Row Limit Exceeded**
```
Error: Too many DML rows: 10001

Problem: Updating too many records at once

Solution:
- Use Database.executeBatch for large datasets
- Chunk processing in smaller batches
```

**Error: Null Pointer Exception**
```
Error: Attempt to de-reference a null object

Debug:
System.debug('Property: ' + property);
System.debug('Account: ' + property.Account__r);
System.debug('Name: ' + property.Account__r.Name); // NPE here

Solution:
if (property != null && property.Account__r != null) {
    String name = property.Account__r.Name;
}
```

### LWC Errors

**Error: Cannot read property 'X' of undefined**
```javascript
Problem: Accessing property before data loaded

❌ BAD:
get propertyName() {
    return this.property.Name; // undefined if property not loaded
}

✅ GOOD:
get propertyName() {
    return this.property ? this.property.Name : 'Loading...';
}
```

**Error: Wire adapter error**
```javascript
Problem: Wire parameters not reactive

❌ BAD:
@wire(getProperties, { status: this.selectedStatus })

✅ GOOD:
@track selectedStatus = 'Available';
@wire(getProperties, { status: '$selectedStatus' })
// Note the '$' prefix for reactive parameter
```

**Error: Event not firing**
```javascript
Problem: Event listener not set up correctly

Debug:
// In child component
handleClick() {
    console.log('Dispatching event');
    const event = new CustomEvent('selected', {
        detail: { id: this.recordId }
    });
    this.dispatchEvent(event);
}

// In parent component template
<c-child-component onselected={handleSelected}></c-child-component>

// In parent component JS
handleSelected(event) {
    console.log('Event received:', event.detail);
}
```

## 📊 Performance Debugging

### Apex Performance Profiling

```
Developer Console → Debug → Change Log Levels

Set:
- Apex Profiling: FINEST

Run code → View Log → Log Inspector → Performance Tree

View:
├── Execution time by method
├── SOQL execution time
├── DML execution time
└── Total execution time

Identify:
- Slow methods
- Expensive queries
- Repeated operations
```

### SOQL Query Plan

```
Developer Console → Query Editor

Enter Query:
SELECT Id, Name FROM Property__c WHERE Price__c > 500000

Click: Query Plan

View:
├── Query Cost (0-1: Good, >1: Needs optimization)
├── Index Usage (Yes/No)
└── Optimization suggestions

Optimization:
- Add custom index on Price__c
- Use selective filters
- Limit returned fields
```

### LWC Performance

```javascript
// Use Chrome DevTools Performance tab

1. Start recording
2. Interact with component
3. Stop recording
4. Analyze:
   - Rendering time
   - JavaScript execution
   - Network requests
   - Memory usage

Optimization:
- Reduce re-renders with @track
- Use wire service caching
- Lazy load components
- Minimize DOM manipulations
```

## 🔧 Systematic Troubleshooting

### Step-by-Step Debugging Process

```
1. Reproduce the Issue
   - Document exact steps
   - Note error message
   - Identify pattern (always/sometimes)

2. Gather Information
   - Enable debug logs
   - Check system logs
   - Review recent changes
   - Check governor limits

3. Isolate the Problem
   - Test in isolation
   - Remove complexity
   - Check dependencies

4. Form Hypothesis
   - What could cause this?
   - What changed recently?
   - Is it data-related?

5. Test Hypothesis
   - Add debug statements
   - Use breakpoints
   - Check with different data

6. Fix and Verify
   - Implement fix
   - Test thoroughly
   - Monitor in production
```

### Real-World Debugging Example

**Problem: Batch job failing intermittently**

```apex
// Step 1: Add comprehensive logging
global class PropertyUpdateBatch implements Database.Batchable<sObject> {

    global Database.QueryLocator start(Database.BatchableContext bc) {
        System.debug('=== BATCH START ===');
        DebugHelper.limits();

        return Database.getQueryLocator([
            SELECT Id, Name, Status__c, Price__c
            FROM Property__c
            WHERE Status__c = 'Available'
        ]);
    }

    global void execute(Database.BatchableContext bc, List<Property__c> scope) {
        System.debug('=== BATCH EXECUTE ===');
        System.debug('Scope size: ' + scope.size());
        DebugHelper.limits();

        try {
            for (Property__c prop : scope) {
                System.debug('Processing property: ' + prop.Id);
                // Process property
            }

            update scope;
            System.debug('Update successful');
            DebugHelper.limits();

        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Batch execute failed');
            System.debug(LoggingLevel.ERROR, 'Error: ' + e.getMessage());
            System.debug(LoggingLevel.ERROR, 'Stack: ' + e.getStackTraceString());

            // Log problematic records
            for (Property__c prop : scope) {
                System.debug('Problem record: ' + JSON.serializePretty(prop));
            }
        }
    }

    global void finish(Database.BatchableContext bc) {
        System.debug('=== BATCH FINISH ===');

        AsyncApexJob job = [
            SELECT Id, Status, NumberOfErrors, JobItemsProcessed, TotalJobItems
            FROM AsyncApexJob
            WHERE Id = :bc.getJobId()
        ];

        System.debug('Job Status: ' + job.Status);
        System.debug('Processed: ' + job.JobItemsProcessed + '/' + job.TotalJobItems);
        System.debug('Errors: ' + job.NumberOfErrors);
    }
}
```

## 💡 Best Practices

### ✅ DO:

1. **Use Descriptive Debug Messages**
   ```apex
   ✅ GOOD:
   System.debug('PropertyTrigger: Processing 150 properties for status update');

   ❌ BAD:
   System.debug('here');
   ```

2. **Log at Critical Points**
   ```apex
   public void processData() {
       System.debug('START processData');

       List<Property__c> props = queryProperties();
       System.debug('Queried ' + props.size() + ' properties');

       List<Property__c> updated = transformData(props);
       System.debug('Transformed ' + updated.size() + ' properties');

       Database.update(updated);
       System.debug('END processData - Success');
   }
   ```

3. **Remove Debug Code in Production**
   ```apex
   // Use custom setting to control debug output
   if (DebugSettings__c.getInstance().Enable_Debug__c) {
       System.debug('Detailed debug info');
   }
   ```

4. **Use Appropriate Log Levels**
   ```apex
   System.debug(LoggingLevel.ERROR, 'Critical error');
   System.debug(LoggingLevel.WARN, 'Warning message');
   System.debug(LoggingLevel.INFO, 'Informational');
   System.debug(LoggingLevel.DEBUG, 'Debug details');
   ```

### ❌ DON'T:

1. **Don't Debug in Loops Without Limits**
   ```apex
   ❌ BAD:
   for (Property__c prop : properties) {
       System.debug('Property: ' + prop); // Could be 1000s of lines
   }

   ✅ GOOD:
   System.debug('Processing ' + properties.size() + ' properties');
   if (properties.size() <= 10) {
       for (Property__c prop : properties) {
           System.debug('Property: ' + prop);
       }
   }
   ```

2. **Don't Leave Debug Logs On in Production**
   ```
   ❌ Debug logs can fill up storage
   ❌ Performance impact
   ✅ Remove debug logs after troubleshooting
   ```

3. **Don't Ignore Governor Limits**
   ```apex
   ✅ Always check limits when debugging performance
   System.debug('Limits: ' + Limits.getQueries() + '/' + Limits.getLimitQueries());
   ```

## 📚 Quick Reference

```bash
# Common Debug Commands

# View recent logs
Setup → Debug Logs

# Set log level
Setup → Debug Logs → New → Debug Level

# Execute Apex
Developer Console → Debug → Open Execute Anonymous

# Query data
Developer Console → Query Editor

# View governor limits
System.debug(Limits.getQueries() + '/' + Limits.getLimitQueries());

# Check CPU time
System.debug(Limits.getCpuTime() + 'ms');

# Pretty print JSON
System.debug(JSON.serializePretty(record));
```

## 🚀 Next Steps

**[→ Platform Overview](/docs/salesforce/fundamentals/platform-overview)** - Salesforce basics

**[→ Apex Testing](/docs/salesforce/apex/testing)** - Write tests to prevent bugs

**[→ LWC Testing](/docs/salesforce/lwc/testing)** - Test Lightning components

---

**You now master Salesforce troubleshooting and debugging!** Find and fix issues like a pro. 🐛
