---
sidebar_position: 3
title: LWC Practical Development
description: Build real Lightning Web Components from scratch with decision frameworks
---

# LWC Practical Development: Building Real Components

Learn to build production-ready Lightning Web Components by understanding WHEN to use each feature, HOW components work together, and WHY certain patterns are better than others.

## 🎯 What You'll Master

- How to approach UI requirements
- Decision frameworks for component design
- Complete component implementations
- Parent-child communication patterns
- Real-world component architectures
- Building muscle memory through patterns

## 🧠 The LWC Developer's Thought Process

### Scenario: Property Search & Display

**Business Requirement:**
> "Build a property search interface where users can filter by price, bedrooms, and location. Show results as cards with images. When clicked, show detailed view with ability to mark as favorite."

### Step 1: Break Down into Components

```
Component Architecture:
PropertySearchApp (Parent/Container)
    ├── propertySearchFilter (Filter UI)
    │   └── Emits: filterchange event
    ├── propertyList (Display Results)
    │   └── Receives: properties array
    │   └── Contains: propertyCard (repeated)
    │       └── Emits: selectproperty event
    └── propertyDetailModal (Detail View)
        └── Receives: selected property
        └── Emits: favorite event
```

### Step 2: Architecture Decisions

**Q: One big component or multiple small ones?**

```
Decision Framework:
├── One Component if:
│   ├── Simple UI (< 100 lines)
│   ├── No reusability needed
│   └── No complex state management
│
└── Multiple Components if:
    ├── Reusable pieces
    ├── Complex state management
    ├── Team collaboration
    └── Easier testing
```

**✅ We choose: Multiple Components** (filters, list, card, modal are all reusable)

**Q: How should components communicate?**

```
Communication Patterns:
├── Parent → Child: Use @api properties
├── Child → Parent: Use custom events
├── Sibling → Sibling: Through parent
└── Unrelated: Use Lightning Message Service (LMS)
```

## 💻 Complete Implementation

### Component 1: Property Search Filter

**File Structure:**
```
propertySearchFilter/
├── propertySearchFilter.js
├── propertySearchFilter.html
├── propertySearchFilter.css
└── propertySearchFilter.js-meta.xml
```

#### propertySearchFilter.html
```html
<template>
    <lightning-card title="Search Properties" icon-name="standard:search">
        <div class="slds-p-around_medium">
            <!-- Price Range -->
            <div class="slds-form-element">
                <lightning-input
                    label="Min Price"
                    type="number"
                    value={minPrice}
                    onchange={handleMinPriceChange}
                    formatter="currency">
                </lightning-input>
            </div>

            <div class="slds-form-element">
                <lightning-input
                    label="Max Price"
                    type="number"
                    value={maxPrice}
                    onchange={handleMaxPriceChange}
                    formatter="currency">
                </lightning-input>
            </div>

            <!-- Bedrooms -->
            <div class="slds-form-element">
                <lightning-combobox
                    label="Bedrooms"
                    value={bedrooms}
                    options={bedroomOptions}
                    onchange={handleBedroomsChange}>
                </lightning-combobox>
            </div>

            <!-- Location -->
            <div class="slds-form-element">
                <lightning-input
                    label="Location"
                    value={location}
                    onchange={handleLocationChange}>
                </lightning-input>
            </div>

            <!-- Search Button -->
            <lightning-button
                variant="brand"
                label="Search"
                onclick={handleSearch}
                class="slds-m-top_medium">
            </lightning-button>
        </div>
    </lightning-card>
</template>
```

#### propertySearchFilter.js
```javascript
import { LightningElement } from 'lwc';

export default class PropertySearchFilter extends LightningElement {
    minPrice = 0;
    maxPrice = 1000000;
    bedrooms = '';
    location = '';

    bedroomOptions = [
        { label: 'Any', value: '' },
        { label: '1+', value: '1' },
        { label: '2+', value: '2' },
        { label: '3+', value: '3' },
        { label: '4+', value: '4' }
    ];

    // Event handlers
    handleMinPriceChange(event) {
        this.minPrice = event.target.value;
    }

    handleMaxPriceChange(event) {
        this.maxPrice = event.target.value;
    }

    handleBedroomsChange(event) {
        this.bedrooms = event.detail.value;
    }

    handleLocationChange(event) {
        this.location = event.target.value;
    }

    // Emit event to parent
    handleSearch() {
        const filters = {
            minPrice: this.minPrice,
            maxPrice: this.maxPrice,
            bedrooms: this.bedrooms,
            location: this.location
        };

        // Create and dispatch custom event
        const filterEvent = new CustomEvent('filterchange', {
            detail: filters
        });
        this.dispatchEvent(filterEvent);
    }
}
```

**Key Learning Points:**

1. **State Management**: Each input has its own property
   ```javascript
   minPrice = 0;  // Initialize with default
   ```

2. **Event Handling**: Standard pattern for input changes
   ```javascript
   handleMinPriceChange(event) {
       this.minPrice = event.target.value;  // Update state
   }
   ```

3. **Custom Events**: How child talks to parent
   ```javascript
   const filterEvent = new CustomEvent('filterchange', {
       detail: filters  // Pass data to parent
   });
   this.dispatchEvent(filterEvent);
   ```

### Component 2: Property Card (Child Component)

#### propertyCard.html
```html
<template>
    <div class="property-card" onclick={handleClick}>
        <lightning-card>
            <!-- Image -->
            <div class="property-image" if:true={property.Image_URL__c}>
                <img src={property.Image_URL__c} alt={property.Name} />
            </div>

            <!-- Details -->
            <div class="slds-p-around_medium">
                <h2 class="slds-text-heading_medium">{property.Name}</h2>

                <div class="slds-m-top_small">
                    <lightning-formatted-number
                        value={property.Listing_Price__c}
                        format-style="currency"
                        currency-code="USD">
                    </lightning-formatted-number>
                </div>

                <div class="property-details slds-m-top_small">
                    <lightning-icon
                        icon-name="utility:bed"
                        size="x-small">
                    </lightning-icon>
                    <span class="slds-m-left_x-small">{property.Bedrooms__c} beds</span>

                    <lightning-icon
                        icon-name="utility:location"
                        size="x-small"
                        class="slds-m-left_medium">
                    </lightning-icon>
                    <span class="slds-m-left_x-small">{property.City__c}</span>
                </div>

                <!-- Status Badge -->
                <lightning-badge
                    label={property.Status__c}
                    class={badgeClass}>
                </lightning-badge>
            </div>
        </lightning-card>
    </div>
</template>
```

#### propertyCard.js
```javascript
import { LightningElement, api } from 'lwc';

export default class PropertyCard extends LightningElement {
    // @api makes this property public
    @api property;

    // Computed property for dynamic styling
    get badgeClass() {
        const statusClasses = {
            'Available': 'slds-theme_success',
            'Pending': 'slds-theme_warning',
            'Sold': 'slds-theme_error'
        };
        return statusClasses[this.property.Status__c] || '';
    }

    handleClick() {
        // Emit event with property data
        const selectEvent = new CustomEvent('selectproperty', {
            detail: this.property.Id
        });
        this.dispatchEvent(selectEvent);
    }
}
```

#### propertyCard.css
```css
.property-card {
    cursor: pointer;
    transition: transform 0.2s;
}

.property-card:hover {
    transform: translateY(-4px);
}

.property-image {
    height: 200px;
    overflow: hidden;
}

.property-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.property-details {
    display: flex;
    align-items: center;
    color: #706e6b;
}
```

**Key Learning Points:**

1. **@api Decorator**: Makes property public
   ```javascript
   @api property;  // Parent can set this
   ```

2. **Getter for Computed Values**: Dynamic properties
   ```javascript
   get badgeClass() {
       // Compute class based on status
       return statusClasses[this.property.Status__c];
   }
   ```

3. **Event Bubbling**: Child to parent communication
   ```javascript
   this.dispatchEvent(new CustomEvent('selectproperty', {
       detail: this.property.Id
   }));
   ```

### Component 3: Property List (Parent of Cards)

#### propertyList.html
```html
<template>
    <div class="property-list">
        <!-- Loading State -->
        <template if:true={isLoading}>
            <lightning-spinner alternative-text="Loading properties..."></lightning-spinner>
        </template>

        <!-- No Results -->
        <template if:true={showNoResults}>
            <div class="slds-text-align_center slds-p-around_large">
                <lightning-icon icon-name="utility:search" size="large"></lightning-icon>
                <p class="slds-text-heading_small slds-m-top_small">No properties found</p>
                <p>Try adjusting your search filters</p>
            </div>
        </template>

        <!-- Results -->
        <template if:true={hasResults}>
            <div class="slds-grid slds-wrap slds-gutters">
                <template for:each={properties} for:item="property">
                    <div key={property.Id} class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-3">
                        <!-- Property Card Component -->
                        <c-property-card
                            property={property}
                            onselectproperty={handlePropertySelect}>
                        </c-property-card>
                    </div>
                </template>
            </div>
        </template>
    </div>
</template>
```

#### propertyList.js
```javascript
import { LightningElement, api, track } from 'lwc';

export default class PropertyList extends LightningElement {
    @api properties = [];
    @track isLoading = false;

    // Computed properties for conditional rendering
    get hasResults() {
        return !this.isLoading && this.properties && this.properties.length > 0;
    }

    get showNoResults() {
        return !this.isLoading && (!this.properties || this.properties.length === 0);
    }

    handlePropertySelect(event) {
        const propertyId = event.detail;

        // Pass event up to parent
        const selectEvent = new CustomEvent('propertyselect', {
            detail: propertyId
        });
        this.dispatchEvent(selectEvent);
    }

    // Public method that parent can call
    @api
    showLoading() {
        this.isLoading = true;
    }

    @api
    hideLoading() {
        this.isLoading = false;
    }
}
```

**Key Learning Points:**

1. **Conditional Rendering**: if:true/if:false
   ```html
   <template if:true={isLoading}>
       <!-- Show spinner -->
   </template>
   ```

2. **Loop Rendering**: for:each
   ```html
   <template for:each={properties} for:item="property">
       <div key={property.Id}>  <!-- MUST have key -->
           <c-property-card property={property}></c-property-card>
       </div>
   </template>
   ```

3. **Public Methods**: @api on methods
   ```javascript
   @api
   showLoading() {
       this.isLoading = true;
   }
   // Parent can call: this.template.querySelector('c-property-list').showLoading()
   ```

### Component 4: Main Container (Parent)

#### propertySearchApp.js
```javascript
import { LightningElement, track } from 'lwc';
import searchProperties from '@salesforce/apex/PropertyController.searchProperties';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class PropertySearchApp extends LightningElement {
    @track properties = [];
    @track selectedPropertyId;
    @track showModal = false;

    // Handle filter change from child
    handleFilterChange(event) {
        const filters = event.detail;
        this.searchProperties(filters);
    }

    // Call Apex method
    searchProperties(filters) {
        // Show loading
        const listComponent = this.template.querySelector('c-property-list');
        if(listComponent) {
            listComponent.showLoading();
        }

        searchProperties({ filters: filters })
            .then(result => {
                this.properties = result;
                if(listComponent) {
                    listComponent.hideLoading();
                }
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
                if(listComponent) {
                    listComponent.hideLoading();
                }
            });
    }

    // Handle property selection
    handlePropertySelect(event) {
        this.selectedPropertyId = event.detail;
        this.showModal = true;
    }

    // Handle modal close
    handleModalClose() {
        this.showModal = false;
        this.selectedPropertyId = null;
    }

    // Handle favorite
    handleFavorite(event) {
        const propertyId = event.detail;
        this.showToast('Success', 'Property added to favorites!', 'success');
        this.handleModalClose();
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
}
```

#### propertySearchApp.html
```html
<template>
    <div class="property-search-app">
        <!-- Search Filter -->
        <c-property-search-filter
            onfilterchange={handleFilterChange}>
        </c-property-search-filter>

        <!-- Property List -->
        <c-property-list
            properties={properties}
            onpropertyselect={handlePropertySelect}>
        </c-property-list>

        <!-- Detail Modal -->
        <template if:true={showModal}>
            <c-property-detail-modal
                property-id={selectedPropertyId}
                onclose={handleModalClose}
                onfavorite={handleFavorite}>
            </c-property-detail-modal>
        </template>
    </div>
</template>
```

**Key Learning Points:**

1. **Wire Properties Down**:
   ```html
   <c-property-list properties={properties}>
   <!-- Parent passes data to child via @api property -->
   ```

2. **Fire Events Up**:
   ```html
   <c-property-search-filter onfilterchange={handleFilterChange}>
   <!-- Child fires event, parent handles it -->
   ```

3. **Call Apex from LWC**:
   ```javascript
   import searchProperties from '@salesforce/apex/PropertyController.searchProperties';

   searchProperties({ filters: filters })
       .then(result => { /* success */ })
       .catch(error => { /* error */ });
   ```

## 🎓 Decision-Making Frameworks

### Framework 1: Which Decorator to Use?

```
START: I need to expose a property/method
    ↓
Q: Should it be accessible from parent?
├── YES → Use @api
│   └── @api property;
│   └── @api method() {}
└── NO → Continue
    ↓
Q: Does it trigger re-render when changed?
├── YES → Use @track (for objects/arrays)
│   └── @track myArray = [];
└── NO → Plain property
    └── myValue = '';
```

**Quick Reference:**
```javascript
// @api - Public (parent can access)
@api recordId;

// @track - Tracks changes to objects/arrays (auto re-render)
@track filters = {};

// @wire - Get data from Salesforce
@wire(getRecord, { recordId: '$recordId' })

// Plain - Private, primitive types
isVisible = false;
```

### Framework 2: When to Use @wire vs Imperative Apex?

```
Use @wire when:
├── Need real-time data updates
├── Want automatic refresh
├── Simple query parameters
└── Cacheable data

Use Imperative (then/catch) when:
├── User-triggered actions (button click)
├── Need to process result before display
├── DML operations (insert, update, delete)
└── Complex error handling
```

**Examples:**

```javascript
// @wire - Automatic, reactive
@wire(getProperties, { status: '$status' })
properties;

// Imperative - Manual, controlled
handleSearch() {
    searchProperties({ filters: this.filters })
        .then(result => {
            this.properties = result;
        });
}
```

### Framework 3: Component Communication Strategy

```
Scenario: Component A needs to talk to Component B

Q: Is B a child of A?
├── YES → Use @api property
│   └── Parent: <c-child my-prop={value}></c-child>
│   └── Child: @api myProp;
└── NO → Continue
    ↓
Q: Is A a child of B?
├── YES → Use CustomEvent
│   └── Child: this.dispatchEvent(new CustomEvent('myevent'))
│   └── Parent: <c-child onmyevent={handler}></c-child>
└── NO → Continue
    ↓
Q: Are they siblings?
├── YES → Communicate through parent
│   └── Child A → Parent → Child B
└── NO → Use Lightning Message Service (LMS)
```

## 💪 Common Patterns to Memorize

### Pattern 1: The Loading Pattern

**Problem**: Show spinner while fetching data

**Solution**: Loading state property

```javascript
export default class MyComponent extends LightningElement {
    isLoading = false;

    async loadData() {
        this.isLoading = true;
        try {
            const result = await getMyData();
            this.data = result;
        } catch(error) {
            this.showError(error);
        } finally {
            this.isLoading = false;  // Always hide spinner
        }
    }
}
```

```html
<template if:true={isLoading}>
    <lightning-spinner></lightning-spinner>
</template>
```

### Pattern 2: The Conditional Rendering Pattern

**Problem**: Show different content based on state

**Solution**: Computed properties

```javascript
export default class MyComponent extends LightningElement {
    @track data = [];

    get hasData() {
        return this.data && this.data.length > 0;
    }

    get noData() {
        return !this.data || this.data.length === 0;
    }
}
```

```html
<template if:true={hasData}>
    <!-- Show data -->
</template>

<template if:true={noData}>
    <p>No data available</p>
</template>
```

### Pattern 3: The Form Input Pattern

**Problem**: Handle form inputs and validation

**Solution**: Event handlers with validation

```javascript
export default class MyForm extends LightningElement {
    name = '';
    email = '';

    handleNameChange(event) {
        this.name = event.target.value;
    }

    handleEmailChange(event) {
        this.email = event.target.value;
    }

    handleSubmit() {
        // Validate all inputs
        const allValid = [...this.template.querySelectorAll('lightning-input')]
            .reduce((validSoFar, inputCmp) => {
                inputCmp.reportValidity();
                return validSoFar && inputCmp.checkValidity();
            }, true);

        if(allValid) {
            // Submit form
            this.submitData();
        }
    }

    async submitData() {
        try {
            await saveRecord({
                name: this.name,
                email: this.email
            });
            this.showSuccess();
        } catch(error) {
            this.showError(error);
        }
    }
}
```

### Pattern 4: The Error Handling Pattern

**Problem**: Handle errors gracefully

**Solution**: Standardized error handler

```javascript
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class MyComponent extends LightningElement {

    async loadData() {
        try {
            const result = await getData();
            this.data = result;
        } catch(error) {
            this.handleError(error);
        }
    }

    handleError(error) {
        let message = 'Unknown error';

        if(error && error.body) {
            if(error.body.message) {
                message = error.body.message;
            } else if(error.body.pageErrors && error.body.pageErrors.length > 0) {
                message = error.body.pageErrors[0].message;
            }
        } else if(error && error.message) {
            message = error.message;
        }

        this.showToast('Error', message, 'error');
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
}
```

## 🔄 Complete Example: Editable Data Table

**Requirement**: Build a data table where users can edit properties inline and save changes.

### Component Structure:
```javascript
// editablePropertyTable.js
import { LightningElement, wire, track } from 'lwc';
import getProperties from '@salesforce/apex/PropertyController.getProperties';
import updateProperties from '@salesforce/apex/PropertyController.updateProperties';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class EditablePropertyTable extends LightningElement {
    @track draftValues = [];
    wiredPropertiesResult;

    columns = [
        { label: 'Name', fieldName: 'Name', editable: false },
        { label: 'Price', fieldName: 'Listing_Price__c', type: 'currency', editable: true },
        { label: 'Status', fieldName: 'Status__c', type: 'picklist', editable: true },
        { label: 'Bedrooms', fieldName: 'Bedrooms__c', type: 'number', editable: true }
    ];

    // Wire with caching
    @wire(getProperties)
    wiredProperties(result) {
        this.wiredPropertiesResult = result;  // Store for refresh
        if(result.error) {
            this.showToast('Error', result.error.body.message, 'error');
        }
    }

    get properties() {
        return this.wiredPropertiesResult.data || [];
    }

    handleSave(event) {
        const updatedFields = event.detail.draftValues;

        updateProperties({ properties: updatedFields })
            .then(() => {
                this.showToast('Success', 'Properties updated successfully', 'success');
                this.draftValues = [];  // Clear draft values
                return refreshApex(this.wiredPropertiesResult);  // Refresh data
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }
}
```

```html
<!-- editablePropertyTable.html -->
<template>
    <lightning-card title="Edit Properties">
        <lightning-datatable
            key-field="Id"
            data={properties}
            columns={columns}
            draft-values={draftValues}
            onsave={handleSave}>
        </lightning-datatable>
    </lightning-card>
</template>
```

**Key Learning Points:**

1. **Store Wire Result**: For refreshApex
   ```javascript
   @wire(getProperties)
   wiredProperties(result) {
       this.wiredPropertiesResult = result;  // Store!
   }
   ```

2. **Refresh After Update**:
   ```javascript
   return refreshApex(this.wiredPropertiesResult);
   ```

3. **Draft Values**: Temporary edits
   ```javascript
   this.draftValues = [];  // Clear after save
   ```

## 🎯 Practice Exercises

### Exercise 1: Search Component
Build a reusable search component that:
- Takes @api label
- Emits search event with search term
- Has debouncing (wait 300ms after user stops typing)

### Exercise 2: Favorite Button
Create a favorite button component:
- Shows heart icon (filled if favorited)
- Calls Apex to save favorite
- Updates UI optimistically
- Handles errors gracefully

### Exercise 3: Infinite Scroll List
Build a list that loads more data as user scrolls:
- Initial load: 20 records
- Load more when scrolled to bottom
- Show loading spinner at bottom
- Handle "no more data" state

## 🚀 Next Steps

Practice building components! Start with small pieces and combine them:

**[→ Back to Apex Practical Guide](/docs/salesforce/apex/practical-guide)** - See how Apex and LWC work together

**[→ Start Building](/docs/hands-on/labs-exercises)** - Real projects to practice

---

**Remember**: Build small, test often, combine components. That's how you master LWC! 💪
