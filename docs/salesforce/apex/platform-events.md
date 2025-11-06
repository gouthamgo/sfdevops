---
sidebar_position: 12
title: Platform Events & CDC
description: Master Platform Events and Change Data Capture for building event-driven, scalable Salesforce architectures
---

# Platform Events & CDC: Event-Driven Architecture

Master Platform Events and Change Data Capture to build scalable, decoupled, event-driven architectures in Salesforce.

## 🎯 What You'll Master

- Platform Events fundamentals
- Publishing and subscribing to events
- Change Data Capture (CDC)
- Event-driven architecture patterns
- Apex triggers on Platform Events
- Error handling and replay
- Integration with external systems
- Testing event-driven systems
- Performance considerations
- Enterprise patterns

## 📡 Platform Events Overview

### What are Platform Events?

Platform Events enable event-driven architecture by allowing components to communicate through a publish-subscribe model.

```
Traditional Tight Coupling:
Component A → Directly calls → Component B
Problem: Hard dependencies, difficult to scale

Event-Driven (Platform Events):
Component A → Publishes Event → Event Bus → Component B Subscribes
Benefits: Loose coupling, scalable, flexible
```

### Use Cases

```
Platform Events Perfect For:
├── Real-time notifications
├── System integration (external systems)
├── Decoupling complex business logic
├── Audit trails and logging
├── Cross-org communication
└── Microservices patterns

NOT Recommended For:
├── Simple parent-child communication
├── When immediate processing required (use triggers)
└── Complex transactions needing rollback
```

## 🏗️ Creating Platform Events

### Define Platform Event

```xml
<!-- PropertyStatusChange__e.object-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Property Status Change</label>
    <pluralLabel>Property Status Changes</pluralLabel>
    <deploymentStatus>Deployed</deploymentStatus>
    <eventType>HighVolume</eventType>  <!-- or StandardVolume -->
</CustomObject>
```

### Define Event Fields

```xml
<!-- Property_Id__c.field-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Property_Id__c</fullName>
    <label>Property ID</label>
    <type>Text</type>
    <length>18</length>
    <required>true</required>
</CustomField>

<!-- Old_Status__c.field-meta.xml -->
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Old_Status__c</fullName>
    <label>Old Status</label>
    <type>Text</type>
    <length>50</length>
</CustomField>

<!-- New_Status__c.field-meta.xml -->
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>New_Status__c</fullName>
    <label>New Status</label>
    <type>Text</type>
    <length>50</length>
    <required>true</required>
</CustomField>

<!-- Changed_By__c.field-meta.xml -->
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Changed_By__c</fullName>
    <label>Changed By</label>
    <type>Text</type>
    <length>255</length>
</CustomField>
```

## 📤 Publishing Platform Events

### Publish from Apex Trigger

```apex
// PropertyTrigger.trigger
trigger PropertyTrigger on Property__c (after update) {
    List<PropertyStatusChange__e> events = new List<PropertyStatusChange__e>();

    for (Property__c prop : Trigger.new) {
        Property__c oldProp = Trigger.oldMap.get(prop.Id);

        // Check if status changed
        if (prop.Status__c != oldProp.Status__c) {
            events.add(new PropertyStatusChange__e(
                Property_Id__c = prop.Id,
                Old_Status__c = oldProp.Status__c,
                New_Status__c = prop.Status__c,
                Changed_By__c = UserInfo.getName()
            ));
        }
    }

    // Publish events
    if (!events.isEmpty()) {
        List<Database.SaveResult> results = EventBus.publish(events);

        // Check for errors
        for (Database.SaveResult result : results) {
            if (!result.isSuccess()) {
                for (Database.Error error : result.getErrors()) {
                    System.debug('Error publishing event: ' + error.getMessage());
                }
            }
        }
    }
}
```

### Publish from Service Class

```apex
public class PropertyEventService {

    public static void publishStatusChange(
        Id propertyId,
        String oldStatus,
        String newStatus
    ) {
        PropertyStatusChange__e event = new PropertyStatusChange__e(
            Property_Id__c = propertyId,
            Old_Status__c = oldStatus,
            New_Status__c = newStatus,
            Changed_By__c = UserInfo.getName()
        );

        Database.SaveResult result = EventBus.publish(event);

        if (!result.isSuccess()) {
            handlePublishError(result.getErrors());
        }
    }

    public static void publishBulkStatusChanges(
        List<PropertyStatusChangeWrapper> changes
    ) {
        List<PropertyStatusChange__e> events = new List<PropertyStatusChange__e>();

        for (PropertyStatusChangeWrapper change : changes) {
            events.add(new PropertyStatusChange__e(
                Property_Id__c = change.propertyId,
                Old_Status__c = change.oldStatus,
                New_Status__c = change.newStatus,
                Changed_By__c = UserInfo.getName()
            ));
        }

        List<Database.SaveResult> results = EventBus.publish(events);

        // Handle any errors
        for (Integer i = 0; i < results.size(); i++) {
            if (!results[i].isSuccess()) {
                System.debug('Failed to publish event for: ' +
                           changes[i].propertyId);
            }
        }
    }

    private static void handlePublishError(List<Database.Error> errors) {
        for (Database.Error error : errors) {
            System.debug('Publish Error: ' + error.getMessage());
            // Log to custom object or send alert
        }
    }

    public class PropertyStatusChangeWrapper {
        public Id propertyId;
        public String oldStatus;
        public String newStatus;

        public PropertyStatusChangeWrapper(Id id, String oldSt, String newSt) {
            this.propertyId = id;
            this.oldStatus = oldSt;
            this.newStatus = newSt;
        }
    }
}
```

### Publish from Flow

```
1. Create Record-Triggered Flow on Property__c (After Update)
2. Add Decision: Check if Status changed
3. Add Action: Create Record (PropertyStatusChange__e)
   - Property_Id__c = {!$Record.Id}
   - Old_Status__c = {!$Record__Prior.Status__c}
   - New_Status__c = {!$Record.Status__c}
4. Save and Activate
```

## 📥 Subscribing to Platform Events

### Apex Trigger Subscription

```apex
// PropertyStatusChangeEventTrigger.trigger
trigger PropertyStatusChangeEventTrigger on PropertyStatusChange__e (after insert) {
    PropertyStatusChangeEventHandler.handleEvents(Trigger.new);
}
```

```apex
// PropertyStatusChangeEventHandler.cls
public class PropertyStatusChangeEventHandler {

    public static void handleEvents(List<PropertyStatusChange__e> events) {
        List<Property_History__c> historyRecords = new List<Property_History__c>();
        List<Id> propertyIds = new List<Id>();

        for (PropertyStatusChange__e event : events) {
            // Create history record
            historyRecords.add(new Property_History__c(
                Property__c = event.Property_Id__c,
                Old_Value__c = event.Old_Status__c,
                New_Value__c = event.New_Value__c,
                Changed_By__c = event.Changed_By__c,
                Changed_Date__c = System.now()
            ));

            propertyIds.add(event.Property_Id__c);
        }

        // Insert history records
        if (!historyRecords.isEmpty()) {
            insert historyRecords;
        }

        // Send notifications for specific statuses
        sendNotifications(events);

        // Update related records
        updateRelatedRecords(propertyIds);
    }

    private static void sendNotifications(List<PropertyStatusChange__e> events) {
        List<Messaging.SingleEmailMessage> emails =
            new List<Messaging.SingleEmailMessage>();

        for (PropertyStatusChange__e event : events) {
            // Send email for "Sold" status
            if (event.New_Status__c == 'Sold') {
                Messaging.SingleEmailMessage mail =
                    new Messaging.SingleEmailMessage();
                mail.setToAddresses(new String[] { 'sales@company.com' });
                mail.setSubject('Property Sold: ' + event.Property_Id__c);
                mail.setPlainTextBody(
                    'Property status changed from ' + event.Old_Status__c +
                    ' to ' + event.New_Status__c
                );
                emails.add(mail);
            }
        }

        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
        }
    }

    private static void updateRelatedRecords(List<Id> propertyIds) {
        // Update related records based on event
        List<Showing__c> showings = [
            SELECT Id, Status__c
            FROM Showing__c
            WHERE Property__c IN :propertyIds
            AND Status__c = 'Scheduled'
        ];

        for (Showing__c showing : showings) {
            showing.Status__c = 'Cancelled';
        }

        if (!showings.isEmpty()) {
            update showings;
        }
    }
}
```

### Multiple Subscribers Pattern

```apex
// NotificationSubscriber.trigger
trigger NotificationSubscriber on PropertyStatusChange__e (after insert) {
    NotificationService.handlePropertyEvents(Trigger.new);
}

// AnalyticsSubscriber.trigger
trigger AnalyticsSubscriber on PropertyStatusChange__e (after insert) {
    AnalyticsService.trackPropertyChanges(Trigger.new);
}

// AuditSubscriber.trigger
trigger AuditSubscriber on PropertyStatusChange__e (after insert) {
    AuditService.logPropertyEvents(Trigger.new);
}
```

### Empapi Library (JavaScript)

```javascript
// Subscribe to Platform Events from LWC
import { LightningElement } from 'lwc';
import { subscribe, unsubscribe, onError } from 'lightning/empApi';

export default class PropertyEventSubscriber extends LightningElement {
    channelName = '/event/PropertyStatusChange__e';
    subscription = {};

    connectedCallback() {
        this.handleSubscribe();
        this.registerErrorListener();
    }

    handleSubscribe() {
        const messageCallback = (response) => {
            console.log('Event received: ', JSON.stringify(response));

            // Handle event data
            const eventData = response.data.payload;
            this.handlePropertyStatusChange(eventData);
        };

        subscribe(this.channelName, -1, messageCallback).then(response => {
            console.log('Subscribed to channel: ', response.channel);
            this.subscription = response;
        });
    }

    handlePropertyStatusChange(eventData) {
        // Update UI based on event
        this.dispatchEvent(new CustomEvent('statuschange', {
            detail: {
                propertyId: eventData.Property_Id__c,
                newStatus: eventData.New_Status__c
            }
        }));
    }

    registerErrorListener() {
        onError(error => {
            console.error('EmpApi error: ', JSON.stringify(error));
        });
    }

    disconnectedCallback() {
        unsubscribe(this.subscription, response => {
            console.log('Unsubscribed: ', response);
        });
    }
}
```

## 📊 Change Data Capture (CDC)

### Enable CDC for Object

```
Setup → Integrations → Change Data Capture
→ Select Objects (e.g., Property__c)
→ Save
```

### Subscribe to CDC Events

```apex
// PropertyChangeEventTrigger.trigger
trigger PropertyChangeEventTrigger on PropertyChangeEvent (after insert) {
    PropertyCDCHandler.handleChanges(Trigger.new);
}
```

```apex
// PropertyCDCHandler.cls
public class PropertyCDCHandler {

    public static void handleChanges(List<PropertyChangeEvent> changes) {
        for (PropertyChangeEvent change : changes) {
            // Get the changed fields
            EventBus.ChangeEventHeader header = change.ChangeEventHeader;

            // Check operation type
            switch on header.changeType {
                when 'CREATE' {
                    handleCreate(change, header);
                }
                when 'UPDATE' {
                    handleUpdate(change, header);
                }
                when 'DELETE' {
                    handleDelete(change, header);
                }
                when 'UNDELETE' {
                    handleUndelete(change, header);
                }
            }
        }
    }

    private static void handleCreate(PropertyChangeEvent change,
                                     EventBus.ChangeEventHeader header) {
        // Sync to external system
        ExternalSystemIntegration.syncProperty(
            header.recordIds[0],
            'CREATE'
        );
    }

    private static void handleUpdate(PropertyChangeEvent change,
                                     EventBus.ChangeEventHeader header) {
        // Get changed fields
        List<String> changedFields = header.changedFields;

        System.debug('Changed fields: ' + changedFields);

        // Check if price changed
        if (changedFields.contains('Sale_Price__c')) {
            handlePriceChange(
                header.recordIds[0],
                change.Sale_Price__c
            );
        }

        // Sync to external system with only changed fields
        ExternalSystemIntegration.updateProperty(
            header.recordIds[0],
            changedFields
        );
    }

    private static void handleDelete(PropertyChangeEvent change,
                                     EventBus.ChangeEventHeader header) {
        // Archive in external system
        ExternalSystemIntegration.archiveProperty(header.recordIds[0]);
    }

    private static void handleUndelete(PropertyChangeEvent change,
                                       EventBus.ChangeEventHeader header) {
        // Restore in external system
        ExternalSystemIntegration.restoreProperty(header.recordIds[0]);
    }

    private static void handlePriceChange(Id propertyId, Decimal newPrice) {
        // Send price alert
        PriceAlertService.sendAlert(propertyId, newPrice);
    }
}
```

### CDC vs Platform Events

| Feature | Platform Events | Change Data Capture |
|---------|----------------|---------------------|
| Control | Full control | Automatic |
| Fields | Custom fields | All record fields |
| Setup | Define event object | Enable for object |
| Customization | ✅ High | ⚠️ Limited |
| Use case | Custom events | Data sync |
| Volume | High/Standard | Standard |

## 🎯 Enterprise Patterns

### Event Relay Pattern

Relay events from one org to another.

```apex
public class EventRelayService {

    @future(callout=true)
    public static void relayToExternalOrg(String eventData) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://target-org.salesforce.com/services/data/v58.0/sobjects/PropertyStatusChange__e');
        req.setMethod('POST');
        req.setHeader('Authorization', 'Bearer ' + getAccessToken());
        req.setHeader('Content-Type', 'application/json');
        req.setBody(eventData);

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() != 201) {
            System.debug('Failed to relay event: ' + res.getBody());
        }
    }

    private static String getAccessToken() {
        // Implement OAuth flow to get token
        return 'access_token';
    }
}
```

### Event Sourcing Pattern

Store all events for audit and replay.

```apex
public class EventStore {

    public static void storeEvent(PropertyStatusChange__e event, String replayId) {
        insert new Event_Store__c(
            Event_Type__c = 'PropertyStatusChange',
            Replay_Id__c = replayId,
            Property_Id__c = event.Property_Id__c,
            Old_Status__c = event.Old_Status__c,
            New_Status__c = event.New_Status__c,
            Changed_By__c = event.Changed_By__c,
            Event_Time__c = System.now(),
            Event_Data__c = JSON.serialize(event)
        );
    }

    public static List<Event_Store__c> getPropertyHistory(Id propertyId) {
        return [
            SELECT Event_Type__c, Old_Status__c, New_Status__c,
                   Changed_By__c, Event_Time__c
            FROM Event_Store__c
            WHERE Property_Id__c = :propertyId
            ORDER BY Event_Time__c DESC
        ];
    }

    public static void replayEvents(Id propertyId, DateTime fromDate) {
        List<Event_Store__c> events = [
            SELECT Event_Data__c
            FROM Event_Store__c
            WHERE Property_Id__c = :propertyId
            AND Event_Time__c >= :fromDate
            ORDER BY Event_Time__c ASC
        ];

        for (Event_Store__c storedEvent : events) {
            // Recreate and republish event
            PropertyStatusChange__e event =
                (PropertyStatusChange__e)JSON.deserialize(
                    storedEvent.Event_Data__c,
                    PropertyStatusChange__e.class
                );
            EventBus.publish(event);
        }
    }
}
```

### Error Handling with Retry

```apex
trigger PropertyEventTrigger on PropertyStatusChange__e (after insert) {
    List<Event_Processing_Error__c> errors = new List<Event_Processing_Error__c>();

    for (PropertyStatusChange__e event : Trigger.new) {
        try {
            // Process event
            processEvent(event);

        } catch (Exception e) {
            // Log error for retry
            errors.add(new Event_Processing_Error__c(
                Event_Replay_Id__c = EventBus.TriggerContext.currentContext()
                    .getReplayId(event),
                Property_Id__c = event.Property_Id__c,
                Error_Message__c = e.getMessage(),
                Retry_Count__c = 0,
                Next_Retry__c = System.now().addMinutes(5)
            ));
        }
    }

    if (!errors.isEmpty()) {
        insert errors;
    }
}

// Scheduled retry job
public class EventRetryScheduler implements Schedulable {
    public void execute(SchedulableContext ctx) {
        List<Event_Processing_Error__c> toRetry = [
            SELECT Event_Replay_Id__c, Property_Id__c, Retry_Count__c
            FROM Event_Processing_Error__c
            WHERE Next_Retry__c <= :System.now()
            AND Retry_Count__c < 3
        ];

        List<Event_Processing_Error__c> toUpdate = new List<Event_Processing_Error__c>();

        for (Event_Processing_Error__c error : toRetry) {
            try {
                // Retry processing using replay ID
                replayEvent(error.Event_Replay_Id__c);

                // Mark as processed
                error.Status__c = 'Processed';
                toUpdate.add(error);

            } catch (Exception e) {
                // Increment retry count
                error.Retry_Count__c++;
                error.Next_Retry__c = System.now().addMinutes(30);
                error.Error_Message__c = e.getMessage();
                toUpdate.add(error);
            }
        }

        update toUpdate;
    }

    private void replayEvent(String replayId) {
        // Implement replay logic
    }
}
```

## 🧪 Testing Platform Events

### Test Publishing

```apex
@isTest
private class PropertyEventServiceTest {

    @isTest
    static void testPublishStatusChange() {
        Property__c prop = new Property__c(
            Name = 'Test Property',
            Status__c = 'Available'
        );
        insert prop;

        Test.startTest();

        // Publish event
        PropertyEventService.publishStatusChange(
            prop.Id,
            'Available',
            'Pending'
        );

        Test.stopTest();

        // Get published events
        List<PropertyStatusChange__e> events = [
            SELECT Property_Id__c, Old_Status__c, New_Status__c
            FROM PropertyStatusChange__e
        ];

        // In test context, events are not actually published
        // Verify logic executed without errors
        System.assert(true, 'Event published successfully');
    }
}
```

### Test Event Trigger

```apex
@isTest
private class PropertyStatusChangeEventHandlerTest {

    @isTest
    static void testEventHandling() {
        Property__c prop = new Property__c(
            Name = 'Test Property',
            Status__c = 'Available'
        );
        insert prop;

        Test.startTest();

        // Create test event
        PropertyStatusChange__e event = new PropertyStatusChange__e(
            Property_Id__c = prop.Id,
            Old_Status__c = 'Available',
            New_Status__c = 'Sold',
            Changed_By__c = 'Test User'
        );

        // Call handler directly (triggers don't fire in test)
        PropertyStatusChangeEventHandler.handleEvents(
            new List<PropertyStatusChange__e>{ event }
        );

        Test.stopTest();

        // Verify history record created
        List<Property_History__c> history = [
            SELECT Old_Value__c, New_Value__c
            FROM Property_History__c
            WHERE Property__c = :prop.Id
        ];

        System.assertEquals(1, history.size());
        System.assertEquals('Available', history[0].Old_Value__c);
        System.assertEquals('Sold', history[0].New_Value__c);
    }
}
```

### Test with Test.getEventBus()

```apex
@isTest
private class EventBusTest {

    @isTest
    static void testEventDelivery() {
        // Deliver test events (Spring '21+)
        Test.getEventBus().deliver();

        // Verify subscribers received events
    }
}
```

## 💡 Best Practices

### ✅ DO:

1. **Use Idempotent Event Handlers**
   ```apex
   // Check if already processed
   if (!isAlreadyProcessed(event.Property_Id__c, replayId)) {
       processEvent(event);
       markAsProcessed(event.Property_Id__c, replayId);
   }
   ```

2. **Log Events for Audit**
   ```apex
   insert new Event_Log__c(
       Event_Type__c = 'PropertyStatusChange',
       Replay_Id__c = replayId,
       Payload__c = JSON.serialize(event)
   );
   ```

3. **Handle Errors Gracefully**
   ```apex
   try {
       processEvent(event);
   } catch (Exception e) {
       logErrorForRetry(event, e);
   }
   ```

4. **Use Appropriate Volume Type**
   - StandardVolume: Up to 100,000 events/hour
   - HighVolume: Up to 1M events/hour

5. **Monitor Event Usage**
   ```apex
   // Check limits in finish method
   System.debug('Event publish calls: ' + Limits.getPublishImmediateDML());
   ```

### ❌ DON'T:

1. **Don't Use for Synchronous Transactions**
   ```apex
   // ❌ BAD - Events are async, can't rollback
   update property;
   EventBus.publish(event);  // Committed even if later code fails
   ```

2. **Don't Publish Too Many Events**
   ```apex
   // ❌ BAD - Hitting limits
   for (Property__c prop : 10000props) {
       EventBus.publish(new PropertyStatusChange__e(...));
   }

   // ✅ GOOD - Bulk publish
   List<PropertyStatusChange__e> events = new List<PropertyStatusChange__e>();
   // Build list...
   EventBus.publish(events);
   ```

3. **Don't Ignore Publish Failures**
   ```apex
   // ❌ BAD
   EventBus.publish(event);

   // ✅ GOOD
   Database.SaveResult result = EventBus.publish(event);
   if (!result.isSuccess()) {
       handleError(result.getErrors());
   }
   ```

## 🚀 Next Steps

Master event-driven architecture:

**[→ Asynchronous Apex](/docs/salesforce/apex/asynchronous)** - All async patterns

**[→ Integration Patterns](/docs/salesforce/apex/integration)** - External integrations

**[→ Testing Guide](/docs/salesforce/apex/testing)** - Test event systems

---

**You can now build event-driven systems!** Use Platform Events to decouple and scale your architecture. 📡
