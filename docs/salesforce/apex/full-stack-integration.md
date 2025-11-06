---
sidebar_position: 16
title: Full-Stack Integration
description: Master all integration patterns from LWC to Apex to Database - wire vs imperative, error handling, data flow
---

# Full-Stack Integration: LWC to Apex to Database

Master all patterns for connecting LWC components to Apex controllers to the database, with complete error handling and real-time updates.

## 🎯 What You'll Master

- Wire vs Imperative Apex calls
- When to use each pattern
- Error handling at every layer
- Real-time data updates
- Caching strategies
- Optimistic UI updates
- Loading states
- Retry mechanisms
- Complete data flow patterns

## 🔌 Integration Patterns Overview

```
LWC Component
    ↓
┌─────────────────────┐
│ Wire Adapter        │ ← Auto refresh, reactive
│ @wire(getRecords)   │
└─────────────────────┘
    ↓
┌─────────────────────┐
│ Imperative Call     │ ← Manual control
│ getRecords()        │
└─────────────────────┘
    ↓
Apex Controller (@AuraEnabled)
    ↓
Service Layer (Business Logic)
    ↓
Database (SOQL/DML)
```

## 📡 Pattern 1: Wire Adapter (Reactive)

### When to Use Wire

```
Use @wire When:
├── Display data immediately on load
├── Need automatic refresh
├── Read-only data
├── Simple queries
└── Want caching automatically

Don't Use @wire When:
├── Need to trigger on user action
├── Complex parameters
├── Need to transform data first
└── Dependent on other async calls
```

### Basic Wire Implementation

```javascript
// propertyList.js
import { LightningElement, wire } from 'lwc';
import getProperties from '@salesforce/apex/PropertyController.getProperties';

export default class PropertyList extends LightningElement {
    // Wire automatically calls on component load
    @wire(getProperties)
    properties;

    get hasProperties() {
        return this.properties.data && this.properties.data.length > 0;
    }

    get isLoading() {
        return !this.properties.data && !this.properties.error;
    }
}
```

```apex
// PropertyController.cls
public with sharing class PropertyController {

    @AuraEnabled(cacheable=true)
    public static List<Property__c> getProperties() {
        return [
            SELECT Id, Name, Address__c, Price__c, Status__c
            FROM Property__c
            WHERE Status__c = 'Active'
            ORDER BY CreatedDate DESC
            LIMIT 50
        ];
    }
}
```

```html
<!-- propertyList.html -->
<template>
    <lightning-card title="Properties" icon-name="standard:product">
        <!-- Loading State -->
        <template if:true={isLoading}>
            <lightning-spinner alternative-text="Loading"></lightning-spinner>
        </template>

        <!-- Error State -->
        <template if:true={properties.error}>
            <div class="slds-text-color_error">
                Error loading properties: {properties.error.body.message}
            </div>
        </template>

        <!-- Data State -->
        <template if:true={properties.data}>
            <template for:each={properties.data} for:item="property">
                <div key={property.Id} class="slds-p-around_small">
                    <p>{property.Name} - ${property.Price__c}</p>
                </div>
            </template>
        </template>

        <!-- Empty State -->
        <template if:false={hasProperties}>
            <p class="slds-p-around_medium">No properties found</p>
        </template>
    </lightning-card>
</template>
```

### Wire with Parameters

```javascript
// propertySearch.js
import { LightningElement, wire, track } from 'lwc';
import searchProperties from '@salesforce/apex/PropertyController.searchProperties';

export default class PropertySearch extends LightningElement {
    @track searchKey = '';
    @track minPrice = 0;
    @track maxPrice = 1000000;

    // Wire with reactive parameters
    @wire(searchProperties, {
        searchKey: '$searchKey',
        minPrice: '$minPrice',
        maxPrice: '$maxPrice'
    })
    properties;

    handleSearchKeyChange(event) {
        // Wire automatically re-fires when searchKey changes
        this.searchKey = event.target.value;
    }

    handleMinPriceChange(event) {
        this.minPrice = event.target.value;
    }

    handleMaxPriceChange(event) {
        this.maxPrice = event.target.value;
    }
}
```

```apex
public with sharing class PropertyController {

    @AuraEnabled(cacheable=true)
    public static List<Property__c> searchProperties(
        String searchKey,
        Decimal minPrice,
        Decimal maxPrice
    ) {
        String key = '%' + searchKey + '%';

        return [
            SELECT Id, Name, Address__c, Price__c
            FROM Property__c
            WHERE Name LIKE :key
            AND Price__c >= :minPrice
            AND Price__c <= :maxPrice
            ORDER BY Price__c ASC
            LIMIT 50
        ];
    }
}
```

### Manual Wire Refresh

```javascript
import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getProperties from '@salesforce/apex/PropertyController.getProperties';

export default class PropertyListWithRefresh extends LightningElement {
    wiredPropertiesResult;

    @wire(getProperties)
    wiredProperties(result) {
        this.wiredPropertiesResult = result;
    }

    handleRefresh() {
        // Manually refresh wire data
        return refreshApex(this.wiredPropertiesResult);
    }

    async handleCreate() {
        // Create property
        await createProperty({ ... });

        // Refresh the list
        await this.handleRefresh();
    }
}
```

## 🎯 Pattern 2: Imperative Calls (Manual Control)

### When to Use Imperative

```
Use Imperative When:
├── Triggered by user action (button click)
├── Need to process result before displaying
├── Sequential async operations
├── DML operations (create/update/delete)
├── Need precise error handling
└── Want to show loading states manually
```

### Basic Imperative Call

```javascript
// propertyCreator.js
import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createProperty from '@salesforce/apex/PropertyController.createProperty';

export default class PropertyCreator extends LightningElement {
    @track name = '';
    @track price = 0;
    @track isLoading = false;

    handleNameChange(event) {
        this.name = event.target.value;
    }

    handlePriceChange(event) {
        this.price = event.target.value;
    }

    async handleSave() {
        this.isLoading = true;

        try {
            // Imperative call with await
            const result = await createProperty({
                name: this.name,
                price: this.price
            });

            // Success handling
            this.showToast('Success', 'Property created!', 'success');
            this.resetForm();

            // Navigate to record
            this.navigateToRecord(result);

        } catch (error) {
            // Error handling
            this.showToast('Error', this.getErrorMessage(error), 'error');

        } finally {
            this.isLoading = false;
        }
    }

    resetForm() {
        this.name = '';
        this.price = 0;
    }

    getErrorMessage(error) {
        if (error.body && error.body.message) {
            return error.body.message;
        } else if (error.body && error.body.fieldErrors) {
            // Handle field-level errors
            const fieldErrors = error.body.fieldErrors;
            return Object.keys(fieldErrors)
                .map(field => fieldErrors[field][0].message)
                .join(', ');
        }
        return 'Unknown error occurred';
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        }));
    }
}
```

```apex
public with sharing class PropertyController {

    @AuraEnabled
    public static String createProperty(String name, Decimal price) {
        try {
            // Validation
            if (String.isBlank(name)) {
                throw new AuraHandledException('Name is required');
            }

            if (price <= 0) {
                throw new AuraHandledException('Price must be greater than 0');
            }

            // Create
            Property__c property = new Property__c(
                Name = name,
                Price__c = price,
                Status__c = 'Draft'
            );
            insert property;

            return property.Id;

        } catch (DmlException e) {
            throw new AuraHandledException(e.getDmlMessage(0));
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
```

### Sequential Imperative Calls

```javascript
// propertyImporter.js
export default class PropertyImporter extends LightningElement {
    async handleImport() {
        this.isLoading = true;

        try {
            // Step 1: Validate file
            const validationResult = await validateFile({ fileId: this.fileId });

            if (!validationResult.isValid) {
                throw new Error(validationResult.errors);
            }

            // Step 2: Parse file
            this.updateProgress(25, 'Parsing file...');
            const parsedData = await parseFile({ fileId: this.fileId });

            // Step 3: Validate data
            this.updateProgress(50, 'Validating data...');
            const dataValidation = await validateData({ data: parsedData });

            // Step 4: Import data
            this.updateProgress(75, 'Importing properties...');
            const importResult = await importProperties({ data: parsedData });

            // Step 5: Generate report
            this.updateProgress(100, 'Generating report...');
            const report = await generateReport({ result: importResult });

            this.showToast('Success', `Imported ${importResult.count} properties`, 'success');
            this.displayReport(report);

        } catch (error) {
            this.showToast('Error', error.message, 'error');
        } finally {
            this.isLoading = false;
        }
    }

    updateProgress(percentage, message) {
        this.progress = percentage;
        this.progressMessage = message;
    }
}
```

## 🔄 Pattern 3: Optimistic UI Updates

Update UI immediately, then sync with server.

```javascript
// propertyManager.js
import { LightningElement, track } from 'lwc';
import updatePropertyStatus from '@salesforce/apex/PropertyController.updatePropertyStatus';

export default class PropertyManager extends LightningElement {
    @track properties = [];

    async handleStatusChange(event) {
        const propertyId = event.target.dataset.id;
        const newStatus = event.target.value;

        // Step 1: Optimistic update (instant UI change)
        const oldProperties = [...this.properties];
        this.properties = this.properties.map(prop =>
            prop.Id === propertyId ? { ...prop, Status__c: newStatus } : prop
        );

        try {
            // Step 2: Server update
            await updatePropertyStatus({
                propertyId: propertyId,
                newStatus: newStatus
            });

            // Success - UI already updated!
            this.showToast('Success', 'Status updated', 'success');

        } catch (error) {
            // Rollback on error
            this.properties = oldProperties;
            this.showToast('Error', 'Failed to update status', 'error');
        }
    }
}
```

## 🔁 Pattern 4: Retry Mechanism

```javascript
// propertyService.js
export default class PropertyService extends LightningElement {

    async callApexWithRetry(apexMethod, params, maxRetries = 3) {
        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await apexMethod(params);
                return result;

            } catch (error) {
                lastError = error;

                // Don't retry on validation errors
                if (error.body && error.body.message &&
                    error.body.message.includes('FIELD_CUSTOM_VALIDATION_EXCEPTION')) {
                    throw error;
                }

                // Exponential backoff
                if (attempt < maxRetries - 1) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await this.sleep(delay);
                }
            }
        }

        throw lastError;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async handleSave() {
        try {
            const result = await this.callApexWithRetry(
                createProperty,
                { name: this.name, price: this.price }
            );

            this.showToast('Success', 'Property created', 'success');

        } catch (error) {
            this.showToast('Error', error.body.message, 'error');
        }
    }
}
```

## 📦 Pattern 5: Data Caching

```javascript
// propertyCache.js
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

export default class PropertyWithCache extends LightningElement {

    async getPropertiesWithCache() {
        const cacheKey = 'properties_active';
        const cachedData = cache.get(cacheKey);

        // Check cache
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
            return cachedData.data;
        }

        // Fetch from server
        try {
            const data = await getProperties();

            // Update cache
            cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;

        } catch (error) {
            // Return stale data if available
            if (cachedData) {
                return cachedData.data;
            }
            throw error;
        }
    }

    clearCache() {
        cache.clear();
    }
}
```

## ⚡ Pattern 6: Batch Operations

```javascript
// propertyBulkUpdater.js
export default class PropertyBulkUpdater extends LightningElement {
    @track selectedProperties = [];

    async handleBulkUpdate() {
        const BATCH_SIZE = 200;
        const batches = this.chunkArray(this.selectedProperties, BATCH_SIZE);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < batches.length; i++) {
            this.updateProgress((i / batches.length) * 100);

            try {
                const result = await updateProperties({
                    propertyIds: batches[i],
                    status: this.newStatus
                });

                successCount += result.successCount;
                errorCount += result.errorCount;

            } catch (error) {
                errorCount += batches[i].length;
            }
        }

        this.showToast(
            'Completed',
            `Success: ${successCount}, Errors: ${errorCount}`,
            errorCount > 0 ? 'warning' : 'success'
        );
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}
```

```apex
public with sharing class PropertyController {

    public class BulkUpdateResult {
        @AuraEnabled public Integer successCount;
        @AuraEnabled public Integer errorCount;
        @AuraEnabled public List<String> errors;
    }

    @AuraEnabled
    public static BulkUpdateResult updateProperties(
        List<String> propertyIds,
        String status
    ) {
        BulkUpdateResult result = new BulkUpdateResult();
        result.successCount = 0;
        result.errorCount = 0;
        result.errors = new List<String>();

        List<Property__c> properties = [
            SELECT Id, Status__c
            FROM Property__c
            WHERE Id IN :propertyIds
        ];

        for (Property__c prop : properties) {
            prop.Status__c = status;
        }

        // Update with partial success
        Database.SaveResult[] results = Database.update(properties, false);

        for (Integer i = 0; i < results.size(); i++) {
            if (results[i].isSuccess()) {
                result.successCount++;
            } else {
                result.errorCount++;
                result.errors.add(
                    properties[i].Id + ': ' +
                    results[i].getErrors()[0].getMessage()
                );
            }
        }

        return result;
    }
}
```

## 🚨 Complete Error Handling

### LWC Error Handler

```javascript
// errorHandler.js
export function handleError(error, component) {
    let message = 'Unknown error';
    let title = 'Error';

    if (error.body) {
        if (error.body.message) {
            message = error.body.message;
        } else if (error.body.pageErrors && error.body.pageErrors.length > 0) {
            message = error.body.pageErrors[0].message;
        } else if (error.body.fieldErrors) {
            const fieldErrors = error.body.fieldErrors;
            message = Object.keys(fieldErrors)
                .map(field => `${field}: ${fieldErrors[field][0].message}`)
                .join('\n');
        }

        // Extract specific error types
        if (message.includes('FIELD_CUSTOM_VALIDATION_EXCEPTION')) {
            title = 'Validation Error';
        } else if (message.includes('INSUFFICIENT_ACCESS')) {
            title = 'Access Denied';
        } else if (message.includes('UNABLE_TO_LOCK_ROW')) {
            title = 'Record Locked';
        }
    }

    component.dispatchEvent(new ShowToastEvent({
        title: title,
        message: message,
        variant: 'error',
        mode: 'sticky'
    }));

    // Log to server
    logError({
        error: message,
        component: component.constructor.name,
        userId: component.userId
    });
}
```

### Apex Error Handler

```apex
public class ErrorHandler {

    public static void handleException(Exception e) {
        // Log error
        insert new Error_Log__c(
            Error_Message__c = e.getMessage(),
            Stack_Trace__c = e.getStackTraceString(),
            Error_Type__c = e.getTypeName(),
            Timestamp__c = System.now(),
            User__c = UserInfo.getUserId()
        );

        // Re-throw as AuraHandledException for LWC
        throw new AuraHandledException(getUserFriendlyMessage(e));
    }

    private static String getUserFriendlyMessage(Exception e) {
        String message = e.getMessage();

        if (e instanceof DmlException) {
            DmlException dmlEx = (DmlException)e;
            return dmlEx.getDmlMessage(0);
        } else if (message.contains('UNABLE_TO_LOCK_ROW')) {
            return 'This record is currently being edited by another user. Please try again.';
        } else if (message.contains('INSUFFICIENT_ACCESS')) {
            return 'You do not have permission to perform this action.';
        }

        return message;
    }
}
```

## 💡 Best Practices

### ✅ DO:

1. **Use Wire for Read-Only Data**
   ```javascript
   @wire(getRecords) records;
   ```

2. **Use Imperative for DML**
   ```javascript
   async handleSave() {
       await createRecord({ ... });
   }
   ```

3. **Always Handle Errors**
   ```javascript
   try {
       await method();
   } catch (error) {
       handleError(error, this);
   }
   ```

4. **Show Loading States**
   ```javascript
   this.isLoading = true;
   try {
       await method();
   } finally {
       this.isLoading = false;
   }
   ```

5. **Cache When Appropriate**
   ```apex
   @AuraEnabled(cacheable=true)
   public static List<SObject> getData() { }
   ```

### ❌ DON'T:

1. **Don't Use Wire for DML**
   ```javascript
   // ❌ BAD
   @wire(createRecord) result;

   // ✅ GOOD
   async handleCreate() {
       await createRecord({ ... });
   }
   ```

2. **Don't Ignore Errors**
   ```javascript
   // ❌ BAD
   await method();

   // ✅ GOOD
   try {
       await method();
   } catch (error) {
       handleError(error);
   }
   ```

3. **Don't Block UI Unnecessarily**
   ```javascript
   // ❌ BAD - Sequential when can be parallel
   await method1();
   await method2();

   // ✅ GOOD - Parallel
   await Promise.all([method1(), method2()]);
   ```

## 🚀 Next Steps

**[→ Real-World Project](/docs/salesforce/apex/real-world-project)** - Complete feature

**[→ LWC Practical Guide](/docs/salesforce/lwc/practical-guide)** - LWC patterns

**[→ Async Jobs Mastery](/docs/salesforce/apex/async-jobs-mastery)** - Control async jobs

---

**You now master full-stack Salesforce development!** Build complete features from UI to database. 🎯
