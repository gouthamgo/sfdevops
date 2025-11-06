---
sidebar_position: 14
title: Async Jobs Mastery
description: Master controlling, monitoring, and managing all async operations - Future, Batch, Queueable, Scheduled jobs
---

# Async Jobs Mastery: Complete Control Over Async Operations

Learn to trigger, monitor, stop, and fully control all asynchronous operations in Salesforce with real-world examples.

## 🎯 What You'll Master

- How Future methods really work
- Triggering and stopping async jobs
- Monitoring job progress in real-time
- Building job control dashboards
- Retry and recovery patterns
- Chaining jobs with full control
- Preventing duplicate jobs
- Error handling and logging
- Performance monitoring
- Production troubleshooting

## 🚀 Future Methods: Deep Dive

### How Future Methods Work

```
User Action → Trigger/Controller
    ↓
@future method queued
    ↓ (Async - runs later)
Salesforce executes in background
    ↓
No way to track or stop
```

### Basic Future Method

```apex
public class EmailService {

    // Future method - runs asynchronously
    @future
    public static void sendWelcomeEmail(Set<Id> contactIds) {
        List<Contact> contacts = [
            SELECT Id, Email, FirstName
            FROM Contact
            WHERE Id IN :contactIds
            AND Email != null
        ];

        List<Messaging.SingleEmailMessage> emails =
            new List<Messaging.SingleEmailMessage>();

        for (Contact con : contacts) {
            Messaging.SingleEmailMessage mail =
                new Messaging.SingleEmailMessage();
            mail.setToAddresses(new String[] { con.Email });
            mail.setSubject('Welcome ' + con.FirstName);
            mail.setPlainTextBody('Welcome to our platform!');
            emails.add(mail);
        }

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }
}

// Trigger it from anywhere
Set<Id> contactIds = new Set<Id>{ con1.Id, con2.Id };
EmailService.sendWelcomeEmail(contactIds);
// Returns immediately, email sent later
```

### Future with Callouts

```apex
public class ExternalAPIService {

    @future(callout=true)
    public static void sendToExternalSystem(Set<Id> propertyIds) {
        List<Property__c> properties = [
            SELECT Id, Name, Address__c, Price__c
            FROM Property__c
            WHERE Id IN :propertyIds
        ];

        for (Property__c prop : properties) {
            try {
                HttpRequest req = new HttpRequest();
                req.setEndpoint('https://api.example.com/properties');
                req.setMethod('POST');
                req.setHeader('Content-Type', 'application/json');
                req.setTimeout(30000);

                Map<String, Object> payload = new Map<String, Object>{
                    'propertyId' => prop.Id,
                    'name' => prop.Name,
                    'address' => prop.Address__c,
                    'price' => prop.Price__c
                };
                req.setBody(JSON.serialize(payload));

                Http http = new Http();
                HttpResponse res = http.send(req);

                if (res.getStatusCode() == 200) {
                    System.debug('Success: ' + prop.Id);
                } else {
                    logError(prop.Id, res.getBody());
                }

            } catch (Exception e) {
                logError(prop.Id, e.getMessage());
            }
        }
    }

    private static void logError(Id propertyId, String error) {
        insert new Integration_Error__c(
            Property__c = propertyId,
            Error_Message__c = error,
            Timestamp__c = System.now()
        );
    }
}

// Trigger from trigger
trigger PropertyTrigger on Property__c (after insert, after update) {
    if (Trigger.isInsert ||
        (Trigger.isUpdate && someCondition)) {

        Set<Id> propertyIds = new Set<Id>();
        for (Property__c prop : Trigger.new) {
            propertyIds.add(prop.Id);
        }

        // Fire and forget - no way to monitor
        ExternalAPIService.sendToExternalSystem(propertyIds);
    }
}
```

### Future Method Limitations

```
❌ Cannot track progress
❌ Cannot stop once started
❌ Cannot chain futures
❌ No return values
❌ Limited to 250 per transaction
❌ Cannot query AsyncApexJob
✅ Simple and fast to implement
```

## 🔄 Batch Jobs: Full Control

### Triggering Batch Jobs

```apex
public class PropertyBatch implements Database.Batchable<SObject> {

    public Database.QueryLocator start(Database.BatchableContext BC) {
        return Database.getQueryLocator([
            SELECT Id, Name, Status__c, Last_Updated__c
            FROM Property__c
            WHERE Status__c = 'Pending Review'
        ]);
    }

    public void execute(Database.BatchableContext BC, List<Property__c> scope) {
        for (Property__c prop : scope) {
            prop.Status__c = 'Reviewed';
            prop.Last_Updated__c = System.now();
        }

        update scope;
    }

    public void finish(Database.BatchableContext BC) {
        // Get job details
        AsyncApexJob job = [
            SELECT Id, Status, NumberOfErrors,
                   JobItemsProcessed, TotalJobItems
            FROM AsyncApexJob
            WHERE Id = :BC.getJobId()
        ];

        System.debug('Job Status: ' + job.Status);
        System.debug('Processed: ' + job.JobItemsProcessed);
        System.debug('Errors: ' + job.NumberOfErrors);
    }
}

// Method 1: Execute immediately
Id jobId = Database.executeBatch(new PropertyBatch(), 200);
System.debug('Started job: ' + jobId);

// Method 2: Schedule for later
System.schedule(
    'Property Batch - Nightly',
    '0 0 2 * * ?',  // 2 AM daily
    new SchedulablePropertyBatch()
);
```

### Monitoring Batch Jobs

```apex
public class BatchJobMonitor {

    // Get status of specific job
    public static AsyncApexJob getJobStatus(Id jobId) {
        return [
            SELECT Id, Status, JobType, MethodName,
                   JobItemsProcessed, TotalJobItems,
                   NumberOfErrors, CreatedDate,
                   CompletedDate, ExtendedStatus
            FROM AsyncApexJob
            WHERE Id = :jobId
        ];
    }

    // Get all running batch jobs
    public static List<AsyncApexJob> getRunningBatchJobs() {
        return [
            SELECT Id, Status, JobType, MethodName,
                   JobItemsProcessed, TotalJobItems,
                   NumberOfErrors, CreatedDate,
                   ApexClass.Name
            FROM AsyncApexJob
            WHERE JobType = 'BatchApex'
            AND Status IN ('Processing', 'Queued', 'Preparing')
            ORDER BY CreatedDate DESC
        ];
    }

    // Get job progress percentage
    public static Decimal getJobProgress(Id jobId) {
        AsyncApexJob job = getJobStatus(jobId);

        if (job.TotalJobItems == 0) {
            return 0;
        }

        return (job.JobItemsProcessed / job.TotalJobItems) * 100;
    }

    // Check if job completed successfully
    public static Boolean isJobSuccessful(Id jobId) {
        AsyncApexJob job = getJobStatus(jobId);
        return job.Status == 'Completed' && job.NumberOfErrors == 0;
    }

    // Get estimated completion time
    public static DateTime getEstimatedCompletion(Id jobId) {
        AsyncApexJob job = getJobStatus(jobId);

        if (job.JobItemsProcessed == 0) {
            return null;
        }

        // Calculate average time per batch
        Long elapsedMs = System.now().getTime() -
                        job.CreatedDate.getTime();
        Decimal avgTimePerBatch = elapsedMs / job.JobItemsProcessed;

        Integer remainingBatches = Integer.valueOf(
            job.TotalJobItems - job.JobItemsProcessed
        );

        Long estimatedMs = (Long)(avgTimePerBatch * remainingBatches);

        return System.now().addMilliseconds(Integer.valueOf(estimatedMs));
    }
}

// Usage
Id jobId = Database.executeBatch(new PropertyBatch());

// Check progress
Decimal progress = BatchJobMonitor.getJobProgress(jobId);
System.debug('Progress: ' + progress + '%');

// Get estimated completion
DateTime eta = BatchJobMonitor.getEstimatedCompletion(jobId);
System.debug('ETA: ' + eta);
```

### Stopping Batch Jobs

```apex
public class BatchJobController {

    // Stop specific job
    public static void stopJob(Id jobId) {
        try {
            System.abortJob(jobId);
            System.debug('Job aborted: ' + jobId);
        } catch (Exception e) {
            System.debug('Error aborting job: ' + e.getMessage());
        }
    }

    // Stop all jobs of a specific class
    public static void stopAllBatchJobs(String apexClassName) {
        List<AsyncApexJob> jobs = [
            SELECT Id
            FROM AsyncApexJob
            WHERE ApexClass.Name = :apexClassName
            AND Status IN ('Queued', 'Processing', 'Preparing')
        ];

        for (AsyncApexJob job : jobs) {
            System.abortJob(job.Id);
        }

        System.debug('Aborted ' + jobs.size() + ' jobs');
    }

    // Stop all running batch jobs (emergency)
    public static void stopAllBatchJobs() {
        List<AsyncApexJob> jobs = [
            SELECT Id, ApexClass.Name
            FROM AsyncApexJob
            WHERE JobType = 'BatchApex'
            AND Status IN ('Queued', 'Processing', 'Preparing')
        ];

        for (AsyncApexJob job : jobs) {
            System.abortJob(job.Id);
            System.debug('Aborted: ' + job.ApexClass.Name);
        }
    }

    // Check if job can be stopped
    public static Boolean canStopJob(Id jobId) {
        AsyncApexJob job = [
            SELECT Status
            FROM AsyncApexJob
            WHERE Id = :jobId
        ];

        return job.Status IN ('Queued', 'Processing', 'Preparing');
    }
}

// Usage
Id jobId = Database.executeBatch(new PropertyBatch());

// Later... stop the job
if (BatchJobController.canStopJob(jobId)) {
    BatchJobController.stopJob(jobId);
}

// Stop all jobs of this type
BatchJobController.stopAllBatchJobs('PropertyBatch');
```

## ⚡ Queueable Jobs: Tracking & Control

### Triggering Queueable with Tracking

```apex
public class PropertyProcessQueueable implements Queueable {

    private List<Id> propertyIds;
    private String jobName;

    public PropertyProcessQueueable(List<Id> propertyIds, String jobName) {
        this.propertyIds = propertyIds;
        this.jobName = jobName;
    }

    public void execute(QueueableContext context) {
        // Log job start
        Job_Log__c log = new Job_Log__c(
            Job_Id__c = context.getJobId(),
            Job_Name__c = this.jobName,
            Status__c = 'Running',
            Started_At__c = System.now(),
            Record_Count__c = this.propertyIds.size()
        );
        insert log;

        try {
            // Process properties
            processProperties(this.propertyIds);

            // Update log on success
            log.Status__c = 'Completed';
            log.Completed_At__c = System.now();
            update log;

        } catch (Exception e) {
            // Update log on error
            log.Status__c = 'Failed';
            log.Error_Message__c = e.getMessage();
            log.Completed_At__c = System.now();
            update log;
        }
    }

    private void processProperties(List<Id> propertyIds) {
        List<Property__c> properties = [
            SELECT Id, Name, Status__c
            FROM Property__c
            WHERE Id IN :propertyIds
        ];

        for (Property__c prop : properties) {
            prop.Status__c = 'Processed';
        }

        update properties;
    }
}

// Trigger and track
Id jobId = System.enqueueJob(
    new PropertyProcessQueueable(propertyIds, 'Property Processing')
);

// Save job ID for later tracking
Job_Tracker__c tracker = new Job_Tracker__c(
    Job_Id__c = jobId,
    Job_Type__c = 'Queueable',
    Job_Name__c = 'Property Processing',
    Status__c = 'Queued',
    Started_By__c = UserInfo.getUserId()
);
insert tracker;
```

### Monitoring Queueable Jobs

```apex
public class QueueableJobMonitor {

    // Get queueable job status
    public static AsyncApexJob getQueueableStatus(Id jobId) {
        return [
            SELECT Id, Status, JobType, MethodName,
                   CreatedDate, CompletedDate,
                   ExtendedStatus, ApexClass.Name
            FROM AsyncApexJob
            WHERE Id = :jobId
            AND JobType = 'Queueable'
        ];
    }

    // Get all running queueable jobs
    public static List<AsyncApexJob> getRunningQueueables() {
        return [
            SELECT Id, Status, MethodName, CreatedDate,
                   ApexClass.Name
            FROM AsyncApexJob
            WHERE JobType = 'Queueable'
            AND Status IN ('Queued', 'Processing', 'Preparing')
            ORDER BY CreatedDate DESC
        ];
    }

    // Check if job is still running
    public static Boolean isJobRunning(Id jobId) {
        AsyncApexJob job = getQueueableStatus(jobId);
        return job.Status IN ('Queued', 'Processing', 'Preparing');
    }

    // Get job duration
    public static Long getJobDuration(Id jobId) {
        AsyncApexJob job = getQueueableStatus(jobId);

        DateTime endTime = job.CompletedDate != null ?
                          job.CompletedDate : System.now();

        return endTime.getTime() - job.CreatedDate.getTime();
    }
}

// Usage
Id jobId = System.enqueueJob(new PropertyProcessQueueable(ids, 'Test'));

// Check status
AsyncApexJob job = QueueableJobMonitor.getQueueableStatus(jobId);
System.debug('Status: ' + job.Status);

// Check if still running
Boolean running = QueueableJobMonitor.isJobRunning(jobId);
System.debug('Running: ' + running);
```

### Stopping Queueable Jobs

```apex
public class QueueableJobController {

    // Stop specific queueable
    public static void stopQueueable(Id jobId) {
        if (isQueueableRunning(jobId)) {
            System.abortJob(jobId);
            System.debug('Queueable aborted: ' + jobId);
        }
    }

    // Stop all queueables of specific class
    public static void stopAllQueueables(String apexClassName) {
        List<AsyncApexJob> jobs = [
            SELECT Id
            FROM AsyncApexJob
            WHERE ApexClass.Name = :apexClassName
            AND JobType = 'Queueable'
            AND Status IN ('Queued', 'Processing')
        ];

        for (AsyncApexJob job : jobs) {
            System.abortJob(job.Id);
        }
    }

    private static Boolean isQueueableRunning(Id jobId) {
        AsyncApexJob job = [
            SELECT Status
            FROM AsyncApexJob
            WHERE Id = :jobId
        ];

        return job.Status IN ('Queued', 'Processing', 'Preparing');
    }
}
```

## 📊 Building Job Control Dashboard

### Apex Controller for Dashboard

```apex
public with sharing class JobDashboardController {

    public class JobInfo {
        @AuraEnabled public String jobId;
        @AuraEnabled public String jobName;
        @AuraEnabled public String jobType;
        @AuraEnabled public String status;
        @AuraEnabled public Integer processed;
        @AuraEnabled public Integer total;
        @AuraEnabled public Integer errors;
        @AuraEnabled public Decimal progress;
        @AuraEnabled public String createdDate;
        @AuraEnabled public String duration;
        @AuraEnabled public Boolean canStop;
    }

    @AuraEnabled
    public static List<JobInfo> getAllRunningJobs() {
        List<JobInfo> jobs = new List<JobInfo>();

        List<AsyncApexJob> apexJobs = [
            SELECT Id, Status, JobType, MethodName,
                   JobItemsProcessed, TotalJobItems,
                   NumberOfErrors, CreatedDate,
                   ApexClass.Name
            FROM AsyncApexJob
            WHERE Status IN ('Processing', 'Queued', 'Preparing')
            OR (Status = 'Completed' AND CreatedDate = TODAY)
            ORDER BY CreatedDate DESC
            LIMIT 100
        ];

        for (AsyncApexJob job : apexJobs) {
            JobInfo info = new JobInfo();
            info.jobId = job.Id;
            info.jobName = job.ApexClass.Name;
            info.jobType = job.JobType;
            info.status = job.Status;
            info.processed = job.JobItemsProcessed;
            info.total = job.TotalJobItems;
            info.errors = job.NumberOfErrors;

            if (job.TotalJobItems > 0) {
                info.progress = (job.JobItemsProcessed / job.TotalJobItems) * 100;
            }

            info.createdDate = job.CreatedDate.format();
            info.duration = calculateDuration(job.CreatedDate);
            info.canStop = job.Status IN ('Queued', 'Processing', 'Preparing');

            jobs.add(info);
        }

        return jobs;
    }

    @AuraEnabled
    public static void stopJob(String jobId) {
        try {
            System.abortJob(jobId);
        } catch (Exception e) {
            throw new AuraHandledException('Error stopping job: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static JobInfo getJobStatus(String jobId) {
        AsyncApexJob job = [
            SELECT Id, Status, JobType, MethodName,
                   JobItemsProcessed, TotalJobItems,
                   NumberOfErrors, CreatedDate,
                   CompletedDate, ApexClass.Name
            FROM AsyncApexJob
            WHERE Id = :jobId
        ];

        JobInfo info = new JobInfo();
        info.jobId = job.Id;
        info.jobName = job.ApexClass.Name;
        info.jobType = job.JobType;
        info.status = job.Status;
        info.processed = job.JobItemsProcessed;
        info.total = job.TotalJobItems;
        info.errors = job.NumberOfErrors;

        if (job.TotalJobItems > 0) {
            info.progress = (job.JobItemsProcessed / job.TotalJobItems) * 100;
        }

        info.createdDate = job.CreatedDate.format();
        info.canStop = job.Status IN ('Queued', 'Processing', 'Preparing');

        return info;
    }

    private static String calculateDuration(DateTime startTime) {
        Long durationMs = System.now().getTime() - startTime.getTime();
        Long seconds = durationMs / 1000;
        Long minutes = seconds / 60;
        Long hours = minutes / 60;

        if (hours > 0) {
            return hours + 'h ' + Math.mod(minutes, 60) + 'm';
        } else if (minutes > 0) {
            return minutes + 'm ' + Math.mod(seconds, 60) + 's';
        } else {
            return seconds + 's';
        }
    }
}
```

### LWC Dashboard Component

```javascript
// jobDashboard.js
import { LightningElement, track, wire } from 'lwc';
import getAllRunningJobs from '@salesforce/apex/JobDashboardController.getAllRunningJobs';
import stopJob from '@salesforce/apex/JobDashboardController.stopJob';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class JobDashboard extends LightningElement {
    @track jobs = [];
    wiredJobsResult;
    refreshInterval;

    @wire(getAllRunningJobs)
    wiredJobs(result) {
        this.wiredJobsResult = result;
        if (result.data) {
            this.jobs = result.data;
        } else if (result.error) {
            this.showToast('Error', 'Failed to load jobs', 'error');
        }
    }

    connectedCallback() {
        // Auto-refresh every 5 seconds
        this.refreshInterval = setInterval(() => {
            this.handleRefresh();
        }, 5000);
    }

    disconnectedCallback() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    handleRefresh() {
        return refreshApex(this.wiredJobsResult);
    }

    handleStopJob(event) {
        const jobId = event.target.dataset.id;

        stopJob({ jobId: jobId })
            .then(() => {
                this.showToast('Success', 'Job stopped successfully', 'success');
                return this.handleRefresh();
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        }));
    }

    get hasJobs() {
        return this.jobs && this.jobs.length > 0;
    }
}
```

```html
<!-- jobDashboard.html -->
<template>
    <lightning-card title="Async Jobs Dashboard" icon-name="standard:queue">
        <div class="slds-p-around_medium">
            <lightning-button
                label="Refresh"
                onclick={handleRefresh}
                class="slds-m-bottom_small">
            </lightning-button>

            <template if:true={hasJobs}>
                <table class="slds-table slds-table_bordered slds-table_cell-buffer">
                    <thead>
                        <tr class="slds-text-title_caps">
                            <th scope="col">Job Name</th>
                            <th scope="col">Type</th>
                            <th scope="col">Status</th>
                            <th scope="col">Progress</th>
                            <th scope="col">Errors</th>
                            <th scope="col">Duration</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template for:each={jobs} for:item="job">
                            <tr key={job.jobId}>
                                <td>{job.jobName}</td>
                                <td>{job.jobType}</td>
                                <td>
                                    <lightning-badge label={job.status}></lightning-badge>
                                </td>
                                <td>
                                    <template if:true={job.progress}>
                                        <lightning-progress-bar
                                            value={job.progress}>
                                        </lightning-progress-bar>
                                        <span>{job.processed} / {job.total}</span>
                                    </template>
                                </td>
                                <td>{job.errors}</td>
                                <td>{job.duration}</td>
                                <td>
                                    <template if:true={job.canStop}>
                                        <lightning-button
                                            label="Stop"
                                            variant="destructive"
                                            data-id={job.jobId}
                                            onclick={handleStopJob}>
                                        </lightning-button>
                                    </template>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </template>

            <template if:false={hasJobs}>
                <p class="slds-text-color_weak">No running jobs</p>
            </template>
        </div>
    </lightning-card>
</template>
```

## 🔁 Preventing Duplicate Jobs

```apex
public class JobDuplicationPreventer {

    // Check if batch job already running
    public static Boolean isBatchJobRunning(String apexClassName) {
        Integer count = [
            SELECT COUNT()
            FROM AsyncApexJob
            WHERE ApexClass.Name = :apexClassName
            AND JobType = 'BatchApex'
            AND Status IN ('Queued', 'Processing', 'Preparing')
        ];

        return count > 0;
    }

    // Safe batch execution - prevents duplicates
    public static Id executeBatchSafely(String batchClassName,
                                       Database.Batchable<SObject> batchInstance) {
        if (isBatchJobRunning(batchClassName)) {
            System.debug('Job already running: ' + batchClassName);
            return null;
        }

        return Database.executeBatch(batchInstance);
    }

    // Check if queueable already running
    public static Boolean isQueueableRunning(String apexClassName) {
        Integer count = [
            SELECT COUNT()
            FROM AsyncApexJob
            WHERE ApexClass.Name = :apexClassName
            AND JobType = 'Queueable'
            AND Status IN ('Queued', 'Processing')
        ];

        return count > 0;
    }
}

// Usage
if (!JobDuplicationPreventer.isBatchJobRunning('PropertyBatch')) {
    Database.executeBatch(new PropertyBatch());
} else {
    System.debug('Batch already running, skipping...');
}
```

## 💡 Best Practices

### ✅ DO:

1. **Always Track Job IDs**
   ```apex
   Id jobId = Database.executeBatch(new MyBatch());
   // Store jobId for monitoring
   insert new Job_Tracker__c(Job_Id__c = jobId, ...);
   ```

2. **Check Before Starting**
   ```apex
   if (!JobDuplicationPreventer.isBatchJobRunning('MyBatch')) {
       Database.executeBatch(new MyBatch());
   }
   ```

3. **Log Everything**
   ```apex
   public void execute(QueueableContext ctx) {
       logJobStart(ctx.getJobId());
       try {
           // work
           logJobSuccess(ctx.getJobId());
       } catch (Exception e) {
           logJobError(ctx.getJobId(), e);
       }
   }
   ```

4. **Monitor Progress**
   ```apex
   // In finish method
   AsyncApexJob job = [SELECT ... WHERE Id = :BC.getJobId()];
   sendSummaryEmail(job);
   ```

5. **Handle Errors Gracefully**
   ```apex
   Database.SaveResult[] results = Database.update(records, false);
   for (Integer i = 0; i < results.size(); i++) {
       if (!results[i].isSuccess()) {
           logError(records[i], results[i].getErrors());
       }
   }
   ```

### ❌ DON'T:

1. **Don't Fire and Forget**
   ```apex
   // ❌ BAD
   @future
   public static void process() { ... }
   // No way to track or stop

   // ✅ GOOD
   Id jobId = System.enqueueJob(new ProcessQueueable());
   logJob(jobId);
   ```

2. **Don't Ignore Duplicates**
   ```apex
   // ❌ BAD
   Database.executeBatch(new MyBatch());
   // Might start duplicate

   // ✅ GOOD
   if (!isBatchRunning()) {
       Database.executeBatch(new MyBatch());
   }
   ```

3. **Don't Hardcode Batch Size**
   ```apex
   // ❌ BAD
   Database.executeBatch(new MyBatch(), 200);

   // ✅ GOOD
   Integer batchSize = getBatchSize('MyBatch'); // From metadata
   Database.executeBatch(new MyBatch(), batchSize);
   ```

## 🚀 Next Steps

Master async operations:

**[→ Real-World Project](/docs/salesforce/apex/real-world-project)** - Build complete feature

**[→ Batch & Queueable Patterns](/docs/salesforce/apex/batch-queueable-patterns)** - Advanced patterns

**[→ Full-Stack Integration](/docs/salesforce/apex/full-stack-integration)** - LWC to Apex to DB

---

**You now have full control over async jobs!** Monitor, stop, and manage all async operations like a pro. ⚡
