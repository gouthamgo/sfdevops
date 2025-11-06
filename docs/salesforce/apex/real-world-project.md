---
sidebar_position: 15
title: Real-World Project
description: Build a complete feature from scratch - LWC, Apex, Triggers, Async Jobs all working together
---

# Real-World Project: Build Property Approval System

Build a complete, production-ready property approval system connecting LWC, Apex, triggers, async jobs, and external integrations. See how everything works together!

## 🎯 What We're Building

A complete property approval workflow with:
- LWC interface for property submission
- Apex service layer for business logic
- Triggers for automation
- Async jobs for external API calls
- Email notifications
- Real-time status updates
- Admin dashboard to monitor jobs

## 📋 Requirements

**User Story:**
> "When an agent submits a property for approval, the system should validate it, check with external credit bureau, send for manager approval, and notify all parties - all happening automatically in the background."

**Technical Requirements:**
1. Agent fills property form (LWC)
2. System validates property data (Apex)
3. System checks property value with external API (Future/Queueable)
4. System creates approval request (Trigger)
5. Manager gets email notification (Email)
6. System updates status in real-time (Platform Events)
7. Admin can monitor all jobs (Dashboard)

## 🏗️ Step 1: Data Model

```apex
// Property__c object
Name: Property__c
Fields:
- Name (Auto Number: PROP-{0000})
- Address__c (Text Area)
- Price__c (Currency)
- Square_Feet__c (Number)
- Status__c (Picklist: Draft, Pending Validation, Pending Approval, Approved, Rejected)
- Agent__c (Lookup: User)
- Manager__c (Lookup: User)
- External_Validation_Status__c (Picklist: Not Started, In Progress, Completed, Failed)
- External_Value_Estimate__c (Currency)
- Validation_Errors__c (Long Text Area)
- Submitted_Date__c (DateTime)
- Approved_Date__c (DateTime)

// Property_Document__c object (for supporting docs)
Name: Property_Document__c
Fields:
- Property__c (Master-Detail: Property__c)
- Document_Type__c (Picklist: Photo, Title, Inspection Report)
- File_Id__c (Text: ContentVersion Id)
- Uploaded_Date__c (DateTime)

// Approval_Request__c object
Name: Approval_Request__c
Fields:
- Property__c (Lookup: Property__c)
- Approver__c (Lookup: User)
- Status__c (Picklist: Pending, Approved, Rejected)
- Comments__c (Long Text Area)
- Requested_Date__c (DateTime)
- Response_Date__c (DateTime)
```

## 🎨 Step 2: LWC Property Submission Form

### Component JavaScript

```javascript
// propertySubmissionForm.js
import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import saveProperty from '@salesforce/apex/PropertySubmissionController.saveProperty';
import submitForApproval from '@salesforce/apex/PropertySubmissionController.submitForApproval';
import USER_ID from '@salesforce/user/Id';

export default class PropertySubmissionForm extends LightningElement {
    @track property = {
        Name: '',
        Address__c: '',
        Price__c: null,
        Square_Feet__c: null,
        Agent__c: USER_ID
    };

    @track savedPropertyId;
    @track isLoading = false;
    @track validationErrors = [];

    handleInputChange(event) {
        const field = event.target.dataset.field;
        this.property[field] = event.target.value;

        // Clear validation for this field
        this.validationErrors = this.validationErrors.filter(
            err => err.field !== field
        );
    }

    handleSaveDraft() {
        this.isLoading = true;

        saveProperty({ property: this.property })
            .then(result => {
                this.savedPropertyId = result;
                this.showToast('Success', 'Property saved as draft', 'success');
                this.property.Id = result;
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    handleSubmit() {
        // Validate form
        if (!this.validateForm()) {
            this.showToast('Error', 'Please fix validation errors', 'error');
            return;
        }

        this.isLoading = true;

        // Save first if not saved
        if (!this.property.Id) {
            this.handleSaveDraft();
        }

        // Then submit for approval
        submitForApproval({ propertyId: this.property.Id })
            .then(result => {
                this.showToast('Success',
                    'Property submitted for approval! External validation started.',
                    'success'
                );

                // Navigate to record page
                this.navigateToProperty(result.propertyId);
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    validateForm() {
        this.validationErrors = [];

        if (!this.property.Address__c) {
            this.validationErrors.push({
                field: 'Address__c',
                message: 'Address is required'
            });
        }

        if (!this.property.Price__c || this.property.Price__c <= 0) {
            this.validationErrors.push({
                field: 'Price__c',
                message: 'Price must be greater than 0'
            });
        }

        if (!this.property.Square_Feet__c || this.property.Square_Feet__c <= 0) {
            this.validationErrors.push({
                field: 'Square_Feet__c',
                message: 'Square Feet must be greater than 0'
            });
        }

        return this.validationErrors.length === 0;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        }));
    }

    navigateToProperty(propertyId) {
        // Navigate using NavigationMixin
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: propertyId,
                actionName: 'view'
            }
        });
    }

    get hasErrors() {
        return this.validationErrors.length > 0;
    }
}
```

### Component HTML

```html
<!-- propertySubmissionForm.html -->
<template>
    <lightning-card title="Submit Property for Approval" icon-name="standard:product">
        <div class="slds-p-around_medium">
            <template if:true={isLoading}>
                <lightning-spinner alternative-text="Loading"></lightning-spinner>
            </template>

            <!-- Address -->
            <lightning-textarea
                label="Property Address"
                value={property.Address__c}
                data-field="Address__c"
                onchange={handleInputChange}
                required>
            </lightning-textarea>

            <!-- Price -->
            <lightning-input
                type="number"
                label="Price"
                value={property.Price__c}
                data-field="Price__c"
                onchange={handleInputChange}
                formatter="currency"
                required>
            </lightning-input>

            <!-- Square Feet -->
            <lightning-input
                type="number"
                label="Square Feet"
                value={property.Square_Feet__c}
                data-field="Square_Feet__c"
                onchange={handleInputChange}
                required>
            </lightning-input>

            <!-- Validation Errors -->
            <template if:true={hasErrors}>
                <div class="slds-box slds-theme_error slds-m-top_small">
                    <ul>
                        <template for:each={validationErrors} for:item="error">
                            <li key={error.field}>{error.message}</li>
                        </template>
                    </ul>
                </div>
            </template>

            <!-- Actions -->
            <div class="slds-m-top_medium">
                <lightning-button
                    label="Save as Draft"
                    onclick={handleSaveDraft}
                    disabled={isLoading}
                    class="slds-m-right_small">
                </lightning-button>

                <lightning-button
                    variant="brand"
                    label="Submit for Approval"
                    onclick={handleSubmit}
                    disabled={isLoading}>
                </lightning-button>
            </div>
        </div>
    </lightning-card>
</template>
```

## ⚙️ Step 3: Apex Controller

```apex
// PropertySubmissionController.cls
public with sharing class PropertySubmissionController {

    public class SubmissionResult {
        @AuraEnabled public String propertyId;
        @AuraEnabled public String jobId;
        @AuraEnabled public String message;
    }

    @AuraEnabled
    public static String saveProperty(Property__c property) {
        try {
            // Validate
            validateProperty(property);

            // Save
            if (property.Id == null) {
                property.Status__c = 'Draft';
                property.Submitted_Date__c = System.now();
                insert property;
            } else {
                update property;
            }

            return property.Id;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static SubmissionResult submitForApproval(String propertyId) {
        try {
            // Get property
            Property__c property = [
                SELECT Id, Address__c, Price__c, Square_Feet__c,
                       Status__c, Agent__c
                FROM Property__c
                WHERE Id = :propertyId
            ];

            // Validate
            validateProperty(property);

            // Update status
            property.Status__c = 'Pending Validation';
            property.External_Validation_Status__c = 'In Progress';
            property.Submitted_Date__c = System.now();
            update property;

            // Trigger external validation (async)
            Id jobId = System.enqueueJob(
                new PropertyValidationQueueable(
                    new Set<Id>{ propertyId }
                )
            );

            // Log job
            insert new Job_Log__c(
                Job_Id__c = jobId,
                Property__c = propertyId,
                Job_Type__c = 'Validation',
                Status__c = 'Running',
                Started_At__c = System.now()
            );

            SubmissionResult result = new SubmissionResult();
            result.propertyId = propertyId;
            result.jobId = jobId;
            result.message = 'Property submitted successfully';

            return result;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    private static void validateProperty(Property__c property) {
        List<String> errors = new List<String>();

        if (String.isBlank(property.Address__c)) {
            errors.add('Address is required');
        }

        if (property.Price__c == null || property.Price__c <= 0) {
            errors.add('Price must be greater than 0');
        }

        if (property.Square_Feet__c == null || property.Square_Feet__c <= 0) {
            errors.add('Square Feet must be greater than 0');
        }

        if (!errors.isEmpty()) {
            throw new ValidationException(String.join(errors, ', '));
        }
    }

    public class ValidationException extends Exception {}
}
```

## 🔄 Step 4: Queueable for External Validation

```apex
// PropertyValidationQueueable.cls
public class PropertyValidationQueueable implements Queueable, Database.AllowsCallouts {

    private Set<Id> propertyIds;

    public PropertyValidationQueueable(Set<Id> propertyIds) {
        this.propertyIds = propertyIds;
    }

    public void execute(QueueableContext context) {
        List<Property__c> properties = [
            SELECT Id, Address__c, Price__c, Square_Feet__c
            FROM Property__c
            WHERE Id IN :propertyIds
        ];

        List<Property__c> toUpdate = new List<Property__c>();

        for (Property__c prop : properties) {
            try {
                // Call external API
                Decimal externalValue = callExternalAPI(prop);

                prop.External_Value_Estimate__c = externalValue;
                prop.External_Validation_Status__c = 'Completed';

                // Check if value is reasonable
                Decimal variance = Math.abs(prop.Price__c - externalValue) / prop.Price__c;

                if (variance > 0.20) {  // More than 20% difference
                    prop.Validation_Errors__c = 'Price variance too high: ' +
                        'Listed: $' + prop.Price__c +
                        ', Estimated: $' + externalValue;
                    prop.Status__c = 'Pending Review';
                } else {
                    prop.Status__c = 'Pending Approval';
                    // Chain to approval creation
                    createApprovalRequest(prop.Id);
                }

                toUpdate.add(prop);

            } catch (Exception e) {
                prop.External_Validation_Status__c = 'Failed';
                prop.Validation_Errors__c = e.getMessage();
                prop.Status__c = 'Validation Failed';
                toUpdate.add(prop);

                // Log error
                logError(prop.Id, e);
            }
        }

        if (!toUpdate.isEmpty()) {
            update toUpdate;

            // Send notifications
            sendValidationNotifications(toUpdate);
        }

        // Update job log
        updateJobLog(context.getJobId(), 'Completed');
    }

    private Decimal callExternalAPI(Property__c property) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Property_Valuation_API/estimate');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setTimeout(30000);

        Map<String, Object> payload = new Map<String, Object>{
            'address' => property.Address__c,
            'squareFeet' => property.Square_Feet__c,
            'listedPrice' => property.Price__c
        };
        req.setBody(JSON.serialize(payload));

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            Map<String, Object> response =
                (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
            return (Decimal)response.get('estimatedValue');
        } else {
            throw new CalloutException('API Error: ' + res.getBody());
        }
    }

    private void createApprovalRequest(Id propertyId) {
        // Get manager
        Property__c prop = [
            SELECT Agent__r.ManagerId
            FROM Property__c
            WHERE Id = :propertyId
        ];

        if (prop.Agent__r.ManagerId != null) {
            insert new Approval_Request__c(
                Property__c = propertyId,
                Approver__c = prop.Agent__r.ManagerId,
                Status__c = 'Pending',
                Requested_Date__c = System.now()
            );
        }
    }

    private void sendValidationNotifications(List<Property__c> properties) {
        List<Messaging.SingleEmailMessage> emails =
            new List<Messaging.SingleEmailMessage>();

        for (Property__c prop : properties) {
            User agent = [SELECT Email FROM User WHERE Id = :prop.Agent__c];

            Messaging.SingleEmailMessage mail =
                new Messaging.SingleEmailMessage();
            mail.setToAddresses(new String[] { agent.Email });
            mail.setSubject('Property Validation Complete: ' + prop.Id);

            String body = 'Property validation completed.\n\n' +
                         'Status: ' + prop.Status__c + '\n';

            if (prop.External_Value_Estimate__c != null) {
                body += 'Estimated Value: $' +
                       prop.External_Value_Estimate__c + '\n';
            }

            if (String.isNotBlank(prop.Validation_Errors__c)) {
                body += '\nErrors: ' + prop.Validation_Errors__c;
            }

            mail.setPlainTextBody(body);
            emails.add(mail);
        }

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }

    private void logError(Id propertyId, Exception e) {
        insert new Error_Log__c(
            Property__c = propertyId,
            Error_Message__c = e.getMessage(),
            Stack_Trace__c = e.getStackTraceString(),
            Timestamp__c = System.now()
        );
    }

    private void updateJobLog(Id jobId, String status) {
        List<Job_Log__c> logs = [
            SELECT Id, Status__c
            FROM Job_Log__c
            WHERE Job_Id__c = :jobId
        ];

        if (!logs.isEmpty()) {
            logs[0].Status__c = status;
            logs[0].Completed_At__c = System.now();
            update logs;
        }
    }
}
```

## ⚡ Step 5: Trigger for Auto-Creation

```apex
// PropertyTrigger.trigger
trigger PropertyTrigger on Property__c (after insert, after update) {
    if (Trigger.isAfter) {
        if (Trigger.isInsert) {
            PropertyTriggerHandler.handleAfterInsert(Trigger.new);
        } else if (Trigger.isUpdate) {
            PropertyTriggerHandler.handleAfterUpdate(
                Trigger.new,
                Trigger.oldMap
            );
        }
    }
}
```

```apex
// PropertyTriggerHandler.cls
public class PropertyTriggerHandler {

    public static void handleAfterInsert(List<Property__c> newProperties) {
        // Create related records
        createPropertyHistory(newProperties);
    }

    public static void handleAfterUpdate(List<Property__c> newProperties,
                                        Map<Id, Property__c> oldMap) {

        List<Property__c> approvedProperties = new List<Property__c>();
        List<Property__c> rejectedProperties = new List<Property__c>();

        for (Property__c prop : newProperties) {
            Property__c oldProp = oldMap.get(prop.Id);

            // Check status change
            if (prop.Status__c != oldProp.Status__c) {
                // Log history
                createPropertyHistory(new List<Property__c>{ prop });

                // Handle approved
                if (prop.Status__c == 'Approved' &&
                    oldProp.Status__c != 'Approved') {
                    approvedProperties.add(prop);
                }

                // Handle rejected
                if (prop.Status__c == 'Rejected' &&
                    oldProp.Status__c != 'Rejected') {
                    rejectedProperties.add(prop);
                }
            }
        }

        // Send notifications
        if (!approvedProperties.isEmpty()) {
            sendApprovalNotifications(approvedProperties);
        }

        if (!rejectedProperties.isEmpty()) {
            sendRejectionNotifications(rejectedProperties);
        }
    }

    private static void createPropertyHistory(List<Property__c> properties) {
        List<Property_History__c> history = new List<Property_History__c>();

        for (Property__c prop : properties) {
            history.add(new Property_History__c(
                Property__c = prop.Id,
                Status__c = prop.Status__c,
                Changed_Date__c = System.now(),
                Changed_By__c = UserInfo.getUserId()
            ));
        }

        insert history;
    }

    private static void sendApprovalNotifications(List<Property__c> properties) {
        // Use future for email
        Set<Id> propertyIds = new Set<Id>();
        for (Property__c prop : properties) {
            propertyIds.add(prop.Id);
        }

        NotificationService.sendApprovalEmails(propertyIds);
    }

    private static void sendRejectionNotifications(List<Property__c> properties) {
        Set<Id> propertyIds = new Set<Id>();
        for (Property__c prop : properties) {
            propertyIds.add(prop.Id);
        }

        NotificationService.sendRejectionEmails(propertyIds);
    }
}
```

## 📧 Step 6: Future for Email Notifications

```apex
// NotificationService.cls
public class NotificationService {

    @future
    public static void sendApprovalEmails(Set<Id> propertyIds) {
        List<Property__c> properties = [
            SELECT Id, Name, Agent__c, Agent__r.Email, Price__c
            FROM Property__c
            WHERE Id IN :propertyIds
        ];

        List<Messaging.SingleEmailMessage> emails =
            new List<Messaging.SingleEmailMessage>();

        for (Property__c prop : properties) {
            Messaging.SingleEmailMessage mail =
                new Messaging.SingleEmailMessage();
            mail.setToAddresses(new String[] { prop.Agent__r.Email });
            mail.setSubject('Property Approved: ' + prop.Name);
            mail.setPlainTextBody(
                'Congratulations! Your property has been approved.\n\n' +
                'Property: ' + prop.Name + '\n' +
                'Price: $' + prop.Price__c + '\n\n' +
                'You can now proceed with listing.'
            );
            emails.add(mail);
        }

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }

    @future
    public static void sendRejectionEmails(Set<Id> propertyIds) {
        List<Property__c> properties = [
            SELECT Id, Name, Agent__c, Agent__r.Email,
                   Validation_Errors__c
            FROM Property__c
            WHERE Id IN :propertyIds
        ];

        List<Messaging.SingleEmailMessage> emails =
            new List<Messaging.SingleEmailMessage>();

        for (Property__c prop : properties) {
            Messaging.SingleEmailMessage mail =
                new Messaging.SingleEmailMessage();
            mail.setToAddresses(new String[] { prop.Agent__r.Email });
            mail.setSubject('Property Rejected: ' + prop.Name);
            mail.setPlainTextBody(
                'Your property submission has been rejected.\n\n' +
                'Property: ' + prop.Name + '\n' +
                'Reason: ' + prop.Validation_Errors__c + '\n\n' +
                'Please review and resubmit.'
            );
            emails.add(mail);
        }

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }
}
```

## 📊 Step 7: Admin Dashboard

We already created this in the Async Jobs Mastery guide! You can reuse the JobDashboard LWC component to monitor all property validation jobs.

## 🔄 Complete Flow Visualization

```
User Action (LWC):
    ↓
1. User fills form and clicks "Submit"
    ↓
2. PropertySubmissionController.submitForApproval()
    ↓
3. Property status → "Pending Validation"
    ↓
4. Enqueue PropertyValidationQueueable
    ↓
5. [ASYNC] Queueable executes:
    - Calls external API
    - Updates property with estimate
    - Creates approval request
    - Sends email via Future
    ↓
6. PropertyTrigger fires on update:
    - Creates history record
    - Checks status change
    ↓
7. If approved → sendApprovalEmails (Future)
    ↓
8. Admin monitors via Dashboard (LWC)
```

## 🧪 Testing the Complete System

```apex
@isTest
private class PropertySubmissionTest {

    @testSetup
    static void setup() {
        // Create test user
        Profile p = [SELECT Id FROM Profile WHERE Name='Standard User'];
        User testUser = new User(
            Alias = 'test',
            Email = 'test@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Testing',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            UserName = 'test@example.com.test'
        );
        insert testUser;
    }

    @isTest
    static void testPropertySubmission() {
        User testUser = [SELECT Id FROM User WHERE Email = 'test@example.com'];

        Property__c prop = new Property__c(
            Address__c = '123 Main St',
            Price__c = 500000,
            Square_Feet__c = 2000,
            Agent__c = testUser.Id
        );

        Test.startTest();

        // Save property
        String propId = PropertySubmissionController.saveProperty(prop);
        System.assertNotEquals(null, propId);

        // Submit for approval
        Test.setMock(HttpCalloutMock.class, new MockPropertyAPI());
        PropertySubmissionController.SubmissionResult result =
            PropertySubmissionController.submitForApproval(propId);

        Test.stopTest();

        // Verify
        Property__c updated = [
            SELECT Status__c, External_Validation_Status__c
            FROM Property__c
            WHERE Id = :propId
        ];

        System.assertEquals('Pending Validation', updated.Status__c);
    }
}
```

## 💡 Key Takeaways

**How Everything Connects:**

1. **LWC → Apex Controller**: User interaction triggers Apex methods
2. **Apex Controller → Queueable**: Controller enqueues async job
3. **Queueable → External API**: Async job makes callout
4. **Queueable → DML**: Job updates records
5. **DML → Trigger**: Record update fires trigger
6. **Trigger → Future**: Trigger calls future for emails
7. **Admin → Dashboard**: Dashboard monitors all jobs

**When to Use Each:**
- **LWC**: User interface, real-time updates
- **Apex Controller**: User-initiated actions, validation
- **Trigger**: Automatic actions on DML
- **Queueable**: Callouts, chaining, tracking needed
- **Future**: Simple async, email, no tracking needed
- **Batch**: Large data volumes

## 🚀 Next Steps

**[→ Async Jobs Mastery](/docs/salesforce/apex/async-jobs-mastery)** - Control async jobs

**[→ Full-Stack Integration](/docs/salesforce/apex/full-stack-integration)** - More integration patterns

**[→ Platform Events](/docs/salesforce/apex/platform-events)** - Real-time updates

---

**You've built a complete, production-ready feature!** This is how professional Salesforce development works. 🎯
