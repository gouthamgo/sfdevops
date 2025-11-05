---
sidebar_position: 2
title: LWC Fundamentals
description: Build modern UI components with Lightning Web Components
---

# Lightning Web Components Fundamentals

Lightning Web Components (LWC) is Salesforce's modern framework for building fast, lightweight user interfaces using standard web technologies.

## 🎯 What You'll Learn

- LWC architecture and component structure
- HTML templates and data binding
- JavaScript decorators and reactivity
- Component lifecycle hooks
- Event handling and communication
- Calling Apex methods
- Lightning Data Service
- Styling with CSS
- Debugging and testing

## 📊 What is LWC?

**Lightning Web Components** is built on web standards:
- Web Components specification
- ES6+ JavaScript
- Shadow DOM
- Custom Elements
- CSS3

### LWC vs. Other Frameworks

| Feature | LWC | Aura | React |
|---------|-----|------|-------|
| **Performance** | ⚡ Fast | Slower | Fast |
| **Bundle Size** | Small | Large | Medium |
| **Learning Curve** | Moderate | Steep | Moderate |
| **Web Standards** | ✅ Yes | ❌ No | Partial |
| **Salesforce Direction** | ✅ Active | 🚫 Maintenance | N/A |

**Recommendation:** Use LWC for all new development.

## 🏗️ Component Structure

An LWC component consists of 3 files:

```
myComponent/
├── myComponent.html     (Template)
├── myComponent.js       (JavaScript)
└── myComponent.js-meta.xml (Configuration)
```

### File Naming Rules

- **Folder name** = **Component name** (camelCase)
- All files must have same base name
- Component names must start with lowercase

```
✅ Good:
propertyCard/
├── propertyCard.html
├── propertyCard.js
└── propertyCard.js-meta.xml

❌ Bad:
PropertyCard/    (uppercase folder)
property-card/   (kebab-case)
```

## 🎨 Your First Component

Let's create a simple greeting component!

### Step 1: Create Component Files

**greetingCard.html:**
```html
<template>
    <lightning-card title="Hello LWC" icon-name="standard:account">
        <div class="slds-m-around_medium">
            <p>Hello, {name}!</p>
            <p>Today is {currentDate}</p>
        </div>
    </lightning-card>
</template>
```

**greetingCard.js:**
```javascript
import { LightningElement } from 'lwc';

export default class GreetingCard extends LightningElement {
    name = 'Salesforce Developer';

    get currentDate() {
        return new Date().toLocaleDateString();
    }
}
```

**greetingCard.js-meta.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>60.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__AppPage</target>
        <target>lightning__RecordPage</target>
        <target>lightning__HomePage</target>
    </targets>
</LightningComponentBundle>
```

### Step 2: Deploy to Org

Using VS Code with Salesforce Extensions:

1. Right-click folder → "Deploy Source to Org"
2. Or use CLI: `sf project deploy start -d force-app/main/default/lwc/greetingCard`

### Step 3: Add to Lightning Page

1. Setup → Lightning App Builder
2. Edit any page
3. Find "greetingCard" in component list
4. Drag onto page
5. Save and activate

## 📝 HTML Templates

### Data Binding

```html
<template>
    <!-- One-way binding (read-only) -->
    <p>{propertyName}</p>
    <p>{owner.firstName} {owner.lastName}</p>

    <!-- Conditional rendering -->
    <template if:true={isAvailable}>
        <p>Property is available!</p>
    </template>

    <template if:false={isAvailable}>
        <p>Property is not available</p>
    </template>

    <!-- Looping -->
    <template for:each={properties} for:item="property">
        <div key={property.Id}>
            <p>{property.Name} - ${property.Price__c}</p>
        </div>
    </template>

    <!-- Iterator (with index) -->
    <template iterator:it={properties}>
        <div key={it.value.Id}>
            <p>#{it.index}: {it.value.Name}</p>
        </div>
    </template>
</template>
```

### Event Handling

```html
<template>
    <!-- Button click -->
    <lightning-button
        label="Click Me"
        onclick={handleClick}>
    </lightning-button>

    <!-- Input change -->
    <lightning-input
        label="Name"
        value={name}
        onchange={handleNameChange}>
    </lightning-input>

    <!-- Custom events -->
    <c-child-component onselect={handleSelect}></c-child-component>
</template>
```

## 💻 JavaScript Decorators

### @api - Public Properties

```javascript
import { LightningElement, api } from 'lwc';

export default class PropertyCard extends LightningElement {
    @api recordId;  // Available to parent components
    @api propertyName;
    @api price;

    // Can be called from parent
    @api
    refreshData() {
        // Refresh logic
    }
}
```

**Usage in Parent:**
```html
<c-property-card
    record-id="a001234567890ABC"
    property-name="Sunset Villa"
    price="1200000">
</c-property-card>
```

### @track - Reactive Private Properties

```javascript
import { LightningElement, track } from 'lwc';

export default class PropertyList extends LightningElement {
    // Simple property (automatically reactive)
    propertyName = 'Default Name';

    // Complex object (use @track for nested properties)
    @track property = {
        name: 'Sunset Villa',
        address: {
            street: '123 Main St',
            city: 'San Francisco'
        }
    };

    handleClick() {
        // This triggers re-render
        this.property.address.city = 'Los Angeles';
    }
}
```

**Note:** Since Winter '20, @track is only needed for nested object mutations. Simple properties are automatically reactive.

### @wire - Data Service

```javascript
import { LightningElement, wire, api } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

const FIELDS = ['Account.Name', 'Account.Industry'];

export default class AccountInfo extends LightningElement {
    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    account;

    get accountName() {
        return this.account.data ? this.account.data.fields.Name.value : '';
    }
}
```

## 🔄 Component Lifecycle

```javascript
export default class MyComponent extends LightningElement {
    // 1. Constructor - Component created
    constructor() {
        super();
        console.log('Component constructed');
        // Can't access DOM or attributes yet
    }

    // 2. Connected Callback - Component inserted into DOM
    connectedCallback() {
        console.log('Component connected');
        // Can access public properties
        // Good for: Initial data fetch, event listeners
    }

    // 3. Rendered Callback - After every render
    renderedCallback() {
        console.log('Component rendered');
        // Can access DOM elements
        // Be careful: Runs after EVERY render!
    }

    // 4. Disconnected Callback - Component removed
    disconnectedCallback() {
        console.log('Component disconnected');
        // Good for: Cleanup, remove event listeners
    }

    // 5. Error Callback - Error in component/child
    errorCallback(error, stack) {
        console.error('Error:', error);
        console.error('Stack:', stack);
    }
}
```

## 📡 Calling Apex Methods

### Step 1: Create Apex Class

```apex
public with sharing class PropertyController {
    @AuraEnabled(cacheable=true)
    public static List<Property__c> getAvailableProperties() {
        return [
            SELECT Id, Name, Listing_Price__c, Status__c
            FROM Property__c
            WHERE Status__c = 'Available'
            ORDER BY Listing_Price__c DESC
            LIMIT 10
        ];
    }

    @AuraEnabled
    public static void updatePropertyStatus(String propertyId, String status) {
        Property__c prop = new Property__c(
            Id = propertyId,
            Status__c = status
        );
        update prop;
    }
}
```

### Step 2: Import and Call in LWC

**Wire Adapter (Cached, Read-Only):**
```javascript
import { LightningElement, wire } from 'lwc';
import getAvailableProperties from '@salesforce/apex/PropertyController.getAvailableProperties';

export default class PropertyList extends LightningElement {
    @wire(getAvailableProperties)
    properties;

    get hasProperties() {
        return this.properties.data && this.properties.data.length > 0;
    }
}
```

**Imperative Call (For Updates):**
```javascript
import { LightningElement } from 'lwc';
import updatePropertyStatus from '@salesforce/apex/PropertyController.updatePropertyStatus';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PropertyActions extends LightningElement {
    async handleMarkSold() {
        try {
            await updatePropertyStatus({
                propertyId: this.recordId,
                status: 'Sold'
            });

            this.showToast('Success', 'Property marked as sold', 'success');

        } catch (error) {
            this.showToast('Error', error.body.message, 'error');
        }
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

## 🎨 Lightning Data Service (LDS)

No Apex needed for CRUD operations!

### Get Record

```javascript
import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

const FIELDS = [
    'Property__c.Name',
    'Property__c.Listing_Price__c',
    'Property__c.Status__c'
];

export default class PropertyDetail extends LightningElement {
    @api recordId;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    property;

    get name() {
        return this.property.data?.fields.Name.value;
    }
}
```

### Update Record

```javascript
import { LightningElement, api } from 'lwc';
import { updateRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PropertyEditor extends LightningElement {
    @api recordId;

    async handleSave(event) {
        const fields = {};
        fields.Id = this.recordId;
        fields.Listing_Price__c = event.target.value;

        const recordInput = { fields };

        try {
            await updateRecord(recordInput);
            this.showToast('Success', 'Property updated', 'success');
        } catch (error) {
            this.showToast('Error', error.body.message, 'error');
        }
    }
}
```

### Create Record

```javascript
import { LightningElement } from 'lwc';
import { createRecord } from 'lightning/uiRecordApi';
import PROPERTY_OBJECT from '@salesforce/schema/Property__c';

export default class PropertyCreator extends LightningElement {
    async handleCreate() {
        const fields = {
            Name: 'New Property',
            Listing_Price__c: 500000,
            Status__c: 'Available'
        };

        const recordInput = {
            apiName: PROPERTY_OBJECT.objectApiName,
            fields
        };

        try {
            const property = await createRecord(recordInput);
            console.log('Created property:', property.id);
        } catch (error) {
            console.error('Error:', error);
        }
    }
}
```

## 🎯 Component Communication

### Parent to Child (Public Properties)

**Parent:**
```html
<template>
    <c-child-component
        message="Hello from parent"
        count={parentCount}>
    </c-child-component>
</template>
```

**Child:**
```javascript
import { LightningElement, api } from 'lwc';

export default class ChildComponent extends LightningElement {
    @api message;
    @api count;
}
```

### Child to Parent (Events)

**Child:**
```javascript
import { LightningElement } from 'lwc';

export default class ChildComponent extends LightningElement {
    handleClick() {
        const event = new CustomEvent('select', {
            detail: {
                propertyId: 'a001234567890ABC',
                propertyName: 'Sunset Villa'
            }
        });
        this.dispatchEvent(event);
    }
}
```

**Parent:**
```html
<template>
    <c-child-component onselect={handleSelect}></c-child-component>
    <p>Selected: {selectedProperty}</p>
</template>
```

```javascript
export default class ParentComponent extends LightningElement {
    selectedProperty;

    handleSelect(event) {
        this.selectedProperty = event.detail.propertyName;
    }
}
```

### Publish-Subscribe (Sibling Communication)

**Publisher:**
```javascript
import { LightningElement } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import PROPERTY_SELECTED from '@salesforce/messageChannel/PropertySelected__c';

export default class Publisher extends LightningElement {
    @wire(MessageContext)
    messageContext;

    handleSelect(propertyId) {
        const payload = { propertyId: propertyId };
        publish(this.messageContext, PROPERTY_SELECTED, payload);
    }
}
```

**Subscriber:**
```javascript
import { LightningElement, wire } from 'lwc';
import { subscribe, MessageContext } from 'lightning/messageService';
import PROPERTY_SELECTED from '@salesforce/messageChannel/PropertySelected__c';

export default class Subscriber extends LightningElement {
    @wire(MessageContext)
    messageContext;

    subscription = null;

    connectedCallback() {
        this.subscription = subscribe(
            this.messageContext,
            PROPERTY_SELECTED,
            (message) => this.handleMessage(message)
        );
    }

    handleMessage(message) {
        console.log('Received:', message.propertyId);
    }
}
```

## 🎨 Styling Components

### Component CSS

```css
/* propertyCard.css */
.container {
    padding: 1rem;
    background: white;
    border-radius: 8px;
}

.title {
    font-size: 1.5rem;
    font-weight: bold;
    color: #0176d3;
}

.price {
    font-size: 1.2rem;
    color: #080707;
}

/* Host element */
:host {
    display: block;
}
```

### SLDS (Salesforce Lightning Design System)

```html
<template>
    <!-- Use SLDS utility classes -->
    <div class="slds-card">
        <div class="slds-card__header slds-grid">
            <h2 class="slds-text-heading_small">Property Details</h2>
        </div>
        <div class="slds-card__body slds-card__body_inner">
            <p class="slds-text-color_success">Available</p>
            <p class="slds-m-top_small">Price: $1,200,000</p>
        </div>
    </div>
</template>
```

### Design Tokens

```css
/* Use design tokens for consistency */
.container {
    padding: var(--lwc-spacing-medium);
    background: var(--lwc-color-background);
    border: 1px solid var(--lwc-color-border);
}

.text {
    color: var(--lwc-color-text-default);
    font-size: var(--lwc-font-size-medium);
}
```

## 🐛 Debugging LWC

### Console Logging

```javascript
export default class MyComponent extends LightningElement {
    connectedCallback() {
        console.log('Component loaded');
        console.log('RecordId:', this.recordId);
        console.table(this.properties);
    }
}
```

### Chrome DevTools

1. Open Chrome DevTools (F12)
2. Find component: `$0` in console
3. Inspect shadow DOM
4. Check network requests
5. Use Lightning Inspector extension

### Debug Mode

Enable in:
Setup → Debug Mode → Add your user

Benefits:
- Unminified JavaScript
- Better error messages
- Easier debugging

## 💼 Real-World Example: Property Card

Let's build a complete property listing card!

**propertyCard.html:**
```html
<template>
    <lightning-card>
        <div class="slds-p-around_medium">
            <!-- Image -->
            <template if:true={imageUrl}>
                <img src={imageUrl} alt={propertyName} class="property-image"/>
            </template>

            <!-- Details -->
            <h2 class="slds-text-heading_medium slds-m-top_small">
                {propertyName}
            </h2>

            <p class="slds-text-color_weak">
                <lightning-formatted-address
                    street={street}
                    city={city}
                    province={state}
                    postal-code={zipCode}>
                </lightning-formatted-address>
            </p>

            <!-- Price and Details -->
            <div class="slds-grid slds-wrap slds-m-top_medium">
                <div class="slds-col slds-size_1-of-2">
                    <p class="slds-text-title">Price</p>
                    <p class="slds-text-heading_large">
                        <lightning-formatted-number
                            value={price}
                            format-style="currency"
                            currency-code="USD">
                        </lightning-formatted-number>
                    </p>
                </div>
                <div class="slds-col slds-size_1-of-2">
                    <p class="slds-text-title">Status</p>
                    <lightning-badge
                        label={status}
                        class={statusVariant}>
                    </lightning-badge>
                </div>
            </div>

            <!-- Features -->
            <div class="slds-grid slds-wrap slds-m-top_small">
                <div class="slds-col slds-size_1-of-3">
                    <p><strong>{bedrooms}</strong> Beds</p>
                </div>
                <div class="slds-col slds-size_1-of-3">
                    <p><strong>{bathrooms}</strong> Baths</p>
                </div>
                <div class="slds-col slds-size_1-of-3">
                    <p><strong>{squareFeet}</strong> Sq Ft</p>
                </div>
            </div>

            <!-- Actions -->
            <div class="slds-m-top_medium">
                <lightning-button
                    variant="brand"
                    label="View Details"
                    onclick={handleViewDetails}>
                </lightning-button>
                <template if:true={canEdit}>
                    <lightning-button
                        label="Edit"
                        onclick={handleEdit}
                        class="slds-m-left_x-small">
                    </lightning-button>
                </template>
            </div>
        </div>
    </lightning-card>
</template>
```

**propertyCard.js:**
```javascript
import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';

const FIELDS = [
    'Property__c.Name',
    'Property__c.Street_Address__c',
    'Property__c.City__c',
    'Property__c.State__c',
    'Property__c.Zip_Code__c',
    'Property__c.Listing_Price__c',
    'Property__c.Status__c',
    'Property__c.Bedrooms__c',
    'Property__c.Bathrooms__c',
    'Property__c.Square_Footage__c',
    'Property__c.Image_URL__c'
];

export default class PropertyCard extends NavigationMixin(LightningElement) {
    @api recordId;
    @api canEdit = false;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    property;

    get propertyName() {
        return this.property.data?.fields.Name.value;
    }

    get street() {
        return this.property.data?.fields.Street_Address__c.value;
    }

    get city() {
        return this.property.data?.fields.City__c.value;
    }

    get state() {
        return this.property.data?.fields.State__c.value;
    }

    get zipCode() {
        return this.property.data?.fields.Zip_Code__c.value;
    }

    get price() {
        return this.property.data?.fields.Listing_Price__c.value;
    }

    get status() {
        return this.property.data?.fields.Status__c.value;
    }

    get statusVariant() {
        const status = this.status;
        if (status === 'Available') return 'success';
        if (status === 'Under Contract') return 'warning';
        if (status === 'Sold') return 'error';
        return 'default';
    }

    get bedrooms() {
        return this.property.data?.fields.Bedrooms__c.value;
    }

    get bathrooms() {
        return this.property.data?.fields.Bathrooms__c.value;
    }

    get squareFeet() {
        return this.property.data?.fields.Square_Footage__c.value;
    }

    get imageUrl() {
        return this.property.data?.fields.Image_URL__c.value;
    }

    handleViewDetails() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                actionName: 'view'
            }
        });
    }

    handleEdit() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                actionName: 'edit'
            }
        });
    }
}
```

**propertyCard.css:**
```css
.property-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 4px;
}
```

## 📚 Interview Questions

**Q: What are the benefits of LWC over Aura?**
A:
- Better performance (smaller bundle size, faster rendering)
- Web standards-based (easier for web developers)
- Better tooling and debugging
- Official Salesforce direction
- Can coexist with Aura

**Q: When do you use @api vs @track?**
A:
- **@api**: Public properties accessible from parent components
- **@track**: Only needed for nested object mutations (not needed for simple properties in modern LWC)

**Q: What's the difference between wire and imperative Apex calls?**
A:
- **Wire**: Cached, automatic refresh, read-only, declarative
- **Imperative**: Not cached, manual control, can perform DML, for updates

**Q: How do components communicate?**
A:
- **Parent → Child**: Public properties (@api)
- **Child → Parent**: Custom events
- **Any → Any**: Lightning Message Service (publish-subscribe)

**Q: What are lifecycle hooks?**
A: Methods that run at specific points:
- constructor(): Component created
- connectedCallback(): Added to DOM
- renderedCallback(): After every render
- disconnectedCallback(): Removed from DOM
- errorCallback(): Error occurred

## 🚀 Next Steps

Excellent! You've mastered LWC fundamentals. Continue your journey:

**[→ Next: Metadata & Deployment](/docs/salesforce/metadata/introduction)**

Learn how to package and deploy your components to different environments!

---

**You can now build modern Lightning Web Components!** Practice by creating reusable UI components. 🎓
