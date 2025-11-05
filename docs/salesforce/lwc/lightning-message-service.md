---
sidebar_position: 6
title: Lightning Message Service
description: Master Lightning Message Service for cross-component and cross-page communication in Salesforce
---

# Lightning Message Service: Component Communication at Scale

Learn to use Lightning Message Service (LMS) for reliable, efficient communication between Lightning Web Components, Aura Components, and Visualforce pages.

## 🎯 What You'll Master

- Lightning Message Service fundamentals
- Creating message channels
- Publishing messages
- Subscribing to messages
- Cross-component communication
- Cross-page communication
- Debugging message flow
- Enterprise patterns
- Performance optimization
- Best practices

## 📡 What is Lightning Message Service?

Lightning Message Service is Salesforce's pub/sub communication system for Lightning components.

### Why Use LMS?

```
Traditional Communication:
├── Parent-Child: Limited to component hierarchy
├── Events: Limited scope, complex bubbling
└── Custom Events: Don't cross page boundaries

Lightning Message Service:
├── ✅ Works across component hierarchy
├── ✅ Works across Visualforce pages
├── ✅ Works between LWC and Aura
├── ✅ Works across utility bar/navigation
├── ✅ Decoupled architecture
└── ✅ Centralized message channels
```

### When to Use LMS

**Use LMS When:**
- Components are not in parent-child relationship
- Communication across different pages
- Broadcasting to multiple components
- Decoupled architecture needed
- Communication between LWC and Aura

**Use Events When:**
- Parent-child communication
- Simple component hierarchy
- Single page, related components

## 🛠️ Creating Message Channels

### Message Channel Metadata

Create a message channel in force-app/main/default/messageChannels:

```xml
<!-- propertySelected.messageChannel-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<LightningMessageChannel xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Message channel for property selection events</description>
    <isExposed>true</isExposed>
    <lightningMessageFields>
        <fieldName>propertyId</fieldName>
        <description>Selected property ID</description>
    </lightningMessageFields>
    <lightningMessageFields>
        <fieldName>propertyName</fieldName>
        <description>Selected property name</description>
    </lightningMessageFields>
    <lightningMessageFields>
        <fieldName>price</fieldName>
        <description>Property price</description>
    </lightningMessageFields>
    <masterLabel>Property Selected Channel</masterLabel>
</LightningMessageChannel>
```

### Deploy Message Channel

```bash
# Deploy using SFDX
sfdx force:source:deploy -p force-app/main/default/messageChannels

# Or deploy using VS Code
# Right-click on messageChannels folder → SFDX: Deploy Source to Org
```

### Multiple Message Channels Example

```xml
<!-- filterChanged.messageChannel-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<LightningMessageChannel xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Notifies when search filters change</description>
    <isExposed>true</isExposed>
    <lightningMessageFields>
        <fieldName>filters</fieldName>
        <description>Current filter values</description>
    </lightningMessageFields>
    <masterLabel>Filter Changed Channel</masterLabel>
</LightningMessageChannel>
```

```xml
<!-- recordUpdated.messageChannel-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<LightningMessageChannel xmlns="http://soap.sforce.com/2006/04/metadata">
    <description>Notifies when a record is updated</description>
    <isExposed>true</isExposed>
    <lightningMessageFields>
        <fieldName>recordId</fieldName>
        <description>Updated record ID</description>
    </lightningMessageFields>
    <lightningMessageFields>
        <fieldName>objectType</fieldName>
        <description>SObject type</description>
    </lightningMessageFields>
    <lightningMessageFields>
        <fieldName>action</fieldName>
        <description>Action performed (create, update, delete)</description>
    </lightningMessageFields>
    <masterLabel>Record Updated Channel</masterLabel>
</LightningMessageChannel>
```

## 📤 Publishing Messages

### Basic Publisher Component

```javascript
// propertySelector.js
import { LightningElement, wire } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import PROPERTY_SELECTED_CHANNEL from '@salesforce/messageChannel/propertySelected__c';

export default class PropertySelector extends LightningElement {
    @wire(MessageContext)
    messageContext;

    handlePropertySelect(event) {
        const propertyId = event.target.dataset.id;
        const propertyName = event.target.dataset.name;
        const price = event.target.dataset.price;

        // Publish message
        const message = {
            propertyId: propertyId,
            propertyName: propertyName,
            price: parseFloat(price)
        };

        publish(this.messageContext, PROPERTY_SELECTED_CHANNEL, message);
    }
}
```

```html
<!-- propertySelector.html -->
<template>
    <div class="property-list">
        <template for:each={properties} for:item="property">
            <div key={property.Id} class="property-card">
                <h3>{property.Name}</h3>
                <p>Price: {property.Price__c}</p>
                <button
                    data-id={property.Id}
                    data-name={property.Name}
                    data-price={property.Price__c}
                    onclick={handlePropertySelect}>
                    Select Property
                </button>
            </div>
        </template>
    </div>
</template>
```

### Publisher with Validation

```javascript
// validatedPublisher.js
import { LightningElement, wire } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import PROPERTY_SELECTED_CHANNEL from '@salesforce/messageChannel/propertySelected__c';

export default class ValidatedPublisher extends LightningElement {
    @wire(MessageContext)
    messageContext;

    publishPropertySelection(propertyData) {
        // Validate before publishing
        if (!this.validatePropertyData(propertyData)) {
            this.showToast('Error', 'Invalid property data', 'error');
            return;
        }

        // Validate message context
        if (!this.messageContext) {
            console.error('Message context not available');
            return;
        }

        const message = {
            propertyId: propertyData.id,
            propertyName: propertyData.name,
            price: propertyData.price
        };

        publish(this.messageContext, PROPERTY_SELECTED_CHANNEL, message);

        this.showToast('Success', 'Property selected', 'success');
    }

    validatePropertyData(data) {
        return data && data.id && data.name && data.price > 0;
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

## 📥 Subscribing to Messages

### Basic Subscriber Component

```javascript
// propertyDetails.js
import { LightningElement, wire } from 'lwc';
import { subscribe, unsubscribe, MessageContext } from 'lightning/messageService';
import PROPERTY_SELECTED_CHANNEL from '@salesforce/messageChannel/propertySelected__c';
import getPropertyDetails from '@salesforce/apex/PropertyController.getPropertyDetails';

export default class PropertyDetails extends LightningElement {
    subscription = null;
    selectedProperty = null;
    propertyDetails = null;

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    subscribeToMessageChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                PROPERTY_SELECTED_CHANNEL,
                (message) => this.handleMessage(message)
            );
        }
    }

    handleMessage(message) {
        // Handle received message
        this.selectedProperty = {
            id: message.propertyId,
            name: message.propertyName,
            price: message.price
        };

        // Load additional details
        this.loadPropertyDetails(message.propertyId);
    }

    async loadPropertyDetails(propertyId) {
        try {
            this.propertyDetails = await getPropertyDetails({
                propertyId: propertyId
            });
        } catch (error) {
            console.error('Error loading details:', error);
        }
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }
}
```

```html
<!-- propertyDetails.html -->
<template>
    <div class="property-details">
        <template if:true={selectedProperty}>
            <h2>{selectedProperty.name}</h2>
            <p class="price">${selectedProperty.price}</p>

            <template if:true={propertyDetails}>
                <div class="details-section">
                    <p>Bedrooms: {propertyDetails.Bedrooms__c}</p>
                    <p>Bathrooms: {propertyDetails.Bathrooms__c}</p>
                    <p>Square Feet: {propertyDetails.Square_Feet__c}</p>
                </div>
            </template>
        </template>

        <template if:false={selectedProperty}>
            <p class="placeholder">Select a property to view details</p>
        </template>
    </div>
</template>
```

### Subscriber with Scope

```javascript
// scopedSubscriber.js
import { LightningElement, api, wire } from 'lwc';
import { subscribe, unsubscribe, MessageContext, APPLICATION_SCOPE } from 'lightning/messageService';
import PROPERTY_SELECTED_CHANNEL from '@salesforce/messageChannel/propertySelected__c';

export default class ScopedSubscriber extends LightningElement {
    @api recordId;
    subscription = null;

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    subscribeToMessageChannel() {
        // APPLICATION_SCOPE: Receives messages from entire app
        // Default: Receives messages from current page only
        this.subscription = subscribe(
            this.messageContext,
            PROPERTY_SELECTED_CHANNEL,
            (message) => this.handleMessage(message),
            { scope: APPLICATION_SCOPE }
        );
    }

    handleMessage(message) {
        // Filter messages if needed
        if (this.shouldProcessMessage(message)) {
            this.processMessage(message);
        }
    }

    shouldProcessMessage(message) {
        // Only process if property matches our record
        return message.propertyId === this.recordId;
    }

    processMessage(message) {
        console.log('Processing message:', message);
    }

    disconnectedCallback() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }
}
```

## 🏗️ Enterprise Patterns

### Message Service Manager

```javascript
// messageServiceManager.js
import { MessageContext, publish, subscribe, unsubscribe, APPLICATION_SCOPE } from 'lightning/messageService';

class MessageServiceManager {
    subscriptions = new Map();

    /**
     * Subscribe to a message channel
     * @param {Object} messageContext - Wire adapter message context
     * @param {Object} channel - Message channel to subscribe to
     * @param {Function} callback - Handler function for messages
     * @param {String} key - Unique key for this subscription
     * @param {Object} options - Subscription options (scope, etc.)
     */
    subscribe(messageContext, channel, callback, key, options = {}) {
        // Unsubscribe if already subscribed with this key
        if (this.subscriptions.has(key)) {
            this.unsubscribe(key);
        }

        const subscription = subscribe(
            messageContext,
            channel,
            callback,
            options
        );

        this.subscriptions.set(key, subscription);
        return subscription;
    }

    /**
     * Unsubscribe from a message channel
     * @param {String} key - Unique key for the subscription
     */
    unsubscribe(key) {
        const subscription = this.subscriptions.get(key);
        if (subscription) {
            unsubscribe(subscription);
            this.subscriptions.delete(key);
        }
    }

    /**
     * Unsubscribe from all channels
     */
    unsubscribeAll() {
        this.subscriptions.forEach(subscription => {
            unsubscribe(subscription);
        });
        this.subscriptions.clear();
    }

    /**
     * Publish a message with validation
     * @param {Object} messageContext - Wire adapter message context
     * @param {Object} channel - Message channel to publish to
     * @param {Object} message - Message payload
     * @param {Object} schema - Optional validation schema
     */
    publish(messageContext, channel, message, schema) {
        if (!messageContext) {
            console.error('Message context not available');
            return false;
        }

        if (schema && !this.validate(message, schema)) {
            console.error('Message validation failed');
            return false;
        }

        publish(messageContext, channel, message);
        return true;
    }

    /**
     * Validate message against schema
     */
    validate(message, schema) {
        for (const [field, type] of Object.entries(schema)) {
            if (typeof message[field] !== type) {
                console.error(`Invalid type for field ${field}`);
                return false;
            }
        }
        return true;
    }
}

export const messageServiceManager = new MessageServiceManager();
```

### Using the Manager

```javascript
// component.js
import { LightningElement, wire } from 'lwc';
import { MessageContext } from 'lightning/messageService';
import { messageServiceManager } from 'c/messageServiceManager';
import PROPERTY_CHANNEL from '@salesforce/messageChannel/propertySelected__c';
import FILTER_CHANNEL from '@salesforce/messageChannel/filterChanged__c';

export default class AdvancedComponent extends LightningElement {
    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        // Subscribe to multiple channels with unique keys
        messageServiceManager.subscribe(
            this.messageContext,
            PROPERTY_CHANNEL,
            (msg) => this.handlePropertyMessage(msg),
            'property-subscription'
        );

        messageServiceManager.subscribe(
            this.messageContext,
            FILTER_CHANNEL,
            (msg) => this.handleFilterMessage(msg),
            'filter-subscription'
        );
    }

    handlePropertyMessage(message) {
        console.log('Property selected:', message);
    }

    handleFilterMessage(message) {
        console.log('Filters changed:', message);
    }

    publishProperty(propertyData) {
        // Publish with validation
        const schema = {
            propertyId: 'string',
            propertyName: 'string',
            price: 'number'
        };

        messageServiceManager.publish(
            this.messageContext,
            PROPERTY_CHANNEL,
            propertyData,
            schema
        );
    }

    disconnectedCallback() {
        // Clean up all subscriptions
        messageServiceManager.unsubscribeAll();
    }
}
```

### Message Logger Pattern

```javascript
// messageLogger.js
class MessageLogger {
    logs = [];
    maxLogs = 100;
    listeners = new Set();

    log(channel, message, direction) {
        const entry = {
            timestamp: new Date().toISOString(),
            channel: channel.toString(),
            message: JSON.parse(JSON.stringify(message)),
            direction: direction // 'publish' or 'receive'
        };

        this.logs.unshift(entry);

        // Keep only recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        // Notify listeners
        this.notifyListeners(entry);
    }

    getLogs(channelFilter) {
        if (channelFilter) {
            return this.logs.filter(log =>
                log.channel.includes(channelFilter)
            );
        }
        return this.logs;
    }

    clear() {
        this.logs = [];
    }

    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(entry) {
        this.listeners.forEach(callback => callback(entry));
    }
}

export const messageLogger = new MessageLogger();
```

### Debug Component

```javascript
// lmsDebugger.js
import { LightningElement, wire } from 'lwc';
import { MessageContext, subscribe, APPLICATION_SCOPE } from 'lightning/messageService';
import { messageLogger } from 'c/messageLogger';
import PROPERTY_CHANNEL from '@salesforce/messageChannel/propertySelected__c';
import FILTER_CHANNEL from '@salesforce/messageChannel/filterChanged__c';

export default class LmsDebugger extends LightningElement {
    logs = [];
    subscriptions = [];
    unsubscribeLogger;

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        // Subscribe to all channels for debugging
        this.subscribeToChannel(PROPERTY_CHANNEL, 'Property');
        this.subscribeToChannel(FILTER_CHANNEL, 'Filter');

        // Listen to logger updates
        this.unsubscribeLogger = messageLogger.subscribe((entry) => {
            this.logs = messageLogger.getLogs();
        });
    }

    subscribeToChannel(channel, name) {
        const subscription = subscribe(
            this.messageContext,
            channel,
            (message) => {
                messageLogger.log(name, message, 'receive');
            },
            { scope: APPLICATION_SCOPE }
        );
        this.subscriptions.push(subscription);
    }

    handleClearLogs() {
        messageLogger.clear();
        this.logs = [];
    }

    disconnectedCallback() {
        this.subscriptions.forEach(sub => unsubscribe(sub));
        if (this.unsubscribeLogger) {
            this.unsubscribeLogger();
        }
    }
}
```

```html
<!-- lmsDebugger.html -->
<template>
    <lightning-card title="LMS Message Debugger" icon-name="utility:debug">
        <div class="slds-p-around_medium">
            <lightning-button
                label="Clear Logs"
                onclick={handleClearLogs}
                class="slds-m-bottom_small">
            </lightning-button>

            <div class="log-container">
                <template for:each={logs} for:item="log">
                    <div key={log.timestamp} class="log-entry">
                        <div class="log-header">
                            <span class="timestamp">{log.timestamp}</span>
                            <span class={log.direction}>{log.direction}</span>
                            <span class="channel">{log.channel}</span>
                        </div>
                        <pre class="log-message">{log.message}</pre>
                    </div>
                </template>

                <template if:false={logs.length}>
                    <p class="slds-text-color_weak">No messages logged</p>
                </template>
            </div>
        </div>
    </lightning-card>
</template>
```

## 🎯 Real-World Use Cases

### Use Case 1: Property Management Dashboard

```javascript
// propertyDashboard.js (Publisher)
import { LightningElement, wire } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import PROPERTY_CHANNEL from '@salesforce/messageChannel/propertySelected__c';

export default class PropertyDashboard extends LightningElement {
    @wire(MessageContext)
    messageContext;

    handleCardClick(event) {
        const property = event.currentTarget.dataset;

        publish(this.messageContext, PROPERTY_CHANNEL, {
            propertyId: property.id,
            propertyName: property.name,
            price: parseFloat(property.price)
        });
    }
}
```

```javascript
// propertyMap.js (Subscriber)
import { LightningElement, wire } from 'lwc';
import { subscribe, MessageContext } from 'lightning/messageService';
import PROPERTY_CHANNEL from '@salesforce/messageChannel/propertySelected__c';

export default class PropertyMap extends LightningElement {
    subscription = null;
    mapMarkers = [];

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        this.subscription = subscribe(
            this.messageContext,
            PROPERTY_CHANNEL,
            (message) => this.centerMapOnProperty(message)
        );
    }

    centerMapOnProperty(message) {
        // Update map center and highlight marker
        this.mapMarkers = [{
            location: {
                Latitude: message.latitude,
                Longitude: message.longitude
            },
            title: message.propertyName,
            description: `Price: $${message.price}`
        }];
    }
}
```

```javascript
// propertyInspections.js (Subscriber)
import { LightningElement, wire } from 'lwc';
import { subscribe, MessageContext } from 'lightning/messageService';
import PROPERTY_CHANNEL from '@salesforce/messageChannel/propertySelected__c';
import getInspections from '@salesforce/apex/InspectionController.getInspections';

export default class PropertyInspections extends LightningElement {
    subscription = null;
    inspections = [];

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        this.subscription = subscribe(
            this.messageContext,
            PROPERTY_CHANNEL,
            (message) => this.loadInspections(message.propertyId)
        );
    }

    async loadInspections(propertyId) {
        this.inspections = await getInspections({ propertyId });
    }
}
```

### Use Case 2: Multi-Step Form Wizard

```javascript
// formWizard.js (Coordinator)
import { LightningElement, wire } from 'lwc';
import { publish, subscribe, MessageContext } from 'lightning/messageService';
import STEP_COMPLETE_CHANNEL from '@salesforce/messageChannel/stepComplete__c';

export default class FormWizard extends LightningElement {
    currentStep = 1;
    formData = {};
    subscription = null;

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        // Subscribe to step completion messages
        this.subscription = subscribe(
            this.messageContext,
            STEP_COMPLETE_CHANNEL,
            (message) => this.handleStepComplete(message)
        );
    }

    handleStepComplete(message) {
        // Merge step data
        this.formData = { ...this.formData, ...message.data };

        // Move to next step
        if (message.isValid) {
            this.currentStep = message.nextStep;
        }
    }

    handleSubmit() {
        // Final submission with all collected data
        console.log('Complete form data:', this.formData);
    }
}
```

## 💡 Best Practices

### ✅ DO:

1. **Always Clean Up Subscriptions**
   ```javascript
   disconnectedCallback() {
       unsubscribe(this.subscription);
       this.subscription = null;
   }
   ```

2. **Use Descriptive Channel Names**
   ```xml
   <!-- ✅ GOOD -->
   <masterLabel>Property Selected Channel</masterLabel>
   <masterLabel>Filter Changed Channel</masterLabel>
   <masterLabel>Record Updated Channel</masterLabel>
   ```

3. **Validate Message Payloads**
   ```javascript
   if (!message.propertyId || !message.propertyName) {
       console.error('Invalid message format');
       return;
   }
   ```

4. **Use Application Scope Wisely**
   ```javascript
   // Use APPLICATION_SCOPE for cross-page communication
   subscribe(context, channel, handler, { scope: APPLICATION_SCOPE });
   ```

5. **Document Message Structures**
   ```javascript
   /**
    * Property Selected Message Format:
    * {
    *   propertyId: string,
    *   propertyName: string,
    *   price: number
    * }
    */
   ```

### ❌ DON'T:

1. **Don't Forget to Unsubscribe**
   ```javascript
   // ❌ BAD - Memory leak!
   connectedCallback() {
       subscribe(this.messageContext, CHANNEL, this.handler);
   }

   // ✅ GOOD
   disconnectedCallback() {
       unsubscribe(this.subscription);
   }
   ```

2. **Don't Publish Without Validation**
   ```javascript
   // ❌ BAD
   publish(this.messageContext, CHANNEL, someData);

   // ✅ GOOD
   if (this.messageContext && this.validateData(someData)) {
       publish(this.messageContext, CHANNEL, someData);
   }
   ```

3. **Don't Use LMS for Parent-Child Communication**
   ```javascript
   // ❌ BAD - Overkill for parent-child
   publish(this.messageContext, CHANNEL, data);

   // ✅ GOOD - Use properties and events
   this.dispatchEvent(new CustomEvent('datachange', { detail: data }));
   ```

## 🚀 Next Steps

Master component communication:

**[→ Advanced Patterns](/docs/salesforce/lwc/advanced-patterns)** - Enterprise component patterns

**[→ LWC Testing](/docs/salesforce/lwc/testing)** - Test message service

**[→ Back to Fundamentals](/docs/salesforce/lwc/fundamentals)** - Review basics

---

**You can now build scalable component communication!** Use LMS to decouple your architecture. 📡
