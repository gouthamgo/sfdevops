---
sidebar_position: 5
title: Advanced LWC Patterns
description: Master advanced Lightning Web Component patterns for building scalable, maintainable enterprise applications
---

# Advanced LWC Patterns: Build Enterprise-Grade Components

Master professional patterns and techniques for building scalable, maintainable Lightning Web Components used in production environments.

## 🎯 What You'll Master

- Component composition patterns
- Provider/Consumer pattern
- Advanced event communication
- Error handling strategies
- Performance optimization patterns
- Dynamic component loading
- Reusable utility components
- State management patterns
- Enterprise design patterns
- Professional best practices

## 🏗️ Component Composition Patterns

### Container/Presentational Pattern

Separate business logic from UI rendering for better testability and reusability.

#### Container Component (Smart)

```javascript
// propertySearchContainer.js
import { LightningElement, wire } from 'lwc';
import getProperties from '@salesforce/apex/PropertyController.getProperties';

export default class PropertySearchContainer extends LightningElement {
    filters = {};

    @wire(getProperties, { filters: '$filters' })
    properties;

    handleFilterChange(event) {
        this.filters = { ...event.detail };
    }

    handlePropertySelect(event) {
        // Handle business logic
        this.navigateToProperty(event.detail);
    }

    navigateToProperty(propertyId) {
        // Navigation logic
    }
}
```

```html
<!-- propertySearchContainer.html -->
<template>
    <!-- Container handles data & logic -->
    <c-property-search-ui
        properties={properties.data}
        loading={properties.loading}
        error={properties.error}
        onfilterchange={handleFilterChange}
        onpropertyselect={handlePropertySelect}>
    </c-property-search-ui>
</template>
```

#### Presentational Component (Dumb)

```javascript
// propertySearchUI.js
import { LightningElement, api } from 'lwc';

export default class PropertySearchUI extends LightningElement {
    @api properties;
    @api loading;
    @api error;

    handleFilterChange(event) {
        // Just emit event, no logic
        this.dispatchEvent(new CustomEvent('filterchange', {
            detail: event.detail
        }));
    }

    handleSelect(event) {
        // Just emit event, no logic
        this.dispatchEvent(new CustomEvent('propertyselect', {
            detail: event.target.dataset.id
        }));
    }
}
```

**Benefits:**
```
Separation of Concerns:
├── Container: Data fetching, business logic, navigation
└── Presentational: UI rendering, user interactions

Advantages:
├── Easy to test (mock data for presentational)
├── Reusable presentational components
├── Clear responsibilities
└── Better maintainability
```

### Higher-Order Component Pattern

```javascript
// withLoading.js
// HOC that adds loading state to any component
export function withLoading(BaseComponent) {
    return class extends BaseComponent {
        _loading = false;

        @api
        get loading() {
            return this._loading;
        }
        set loading(value) {
            this._loading = value;
            this.requestUpdate();
        }

        get containerClass() {
            return this.loading ? 'loading' : '';
        }
    };
}
```

```javascript
// myComponent.js
import { LightningElement } from 'lwc';
import { withLoading } from 'c/withLoading';

class MyComponent extends LightningElement {
    // Your component logic
}

export default withLoading(MyComponent);
```

## 🔌 Provider/Consumer Pattern

Share data across component tree without prop drilling.

### Provider Component

```javascript
// dataProvider.js
import { LightningElement, api } from 'lwc';

export default class DataProvider extends LightningElement {
    @api contextValue;

    connectedCallback() {
        // Register provider with context service
        this.provideContext('myContext', this.contextValue);
    }

    provideContext(key, value) {
        // Custom event that bubbles up
        this.dispatchEvent(new CustomEvent('providecontent', {
            detail: { key, value },
            bubbles: true,
            composed: true
        }));
    }

    @api updateContext(newValue) {
        this.contextValue = newValue;
        this.provideContext('myContext', newValue);
    }
}
```

```html
<!-- dataProvider.html -->
<template>
    <slot></slot>
</template>
```

### Consumer Component

```javascript
// dataConsumer.js
import { LightningElement } from 'lwc';

export default class DataConsumer extends LightningElement {
    contextValue;

    connectedCallback() {
        // Listen for context
        this.addEventListener('providecontent', this.handleContext);

        // Request context
        this.dispatchEvent(new CustomEvent('requestcontext', {
            detail: 'myContext',
            bubbles: true,
            composed: true
        }));
    }

    handleContext = (event) => {
        if (event.detail.key === 'myContext') {
            this.contextValue = event.detail.value;
        }
    }

    disconnectedCallback() {
        this.removeEventListener('providecontent', this.handleContext);
    }
}
```

### Context Service (Shared)

```javascript
// contextService.js
class ContextService {
    contexts = new Map();
    subscribers = new Map();

    provide(key, value) {
        this.contexts.set(key, value);
        // Notify all subscribers
        if (this.subscribers.has(key)) {
            this.subscribers.get(key).forEach(callback => callback(value));
        }
    }

    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);

        // Return current value if exists
        return this.contexts.get(key);
    }

    unsubscribe(key, callback) {
        if (this.subscribers.has(key)) {
            this.subscribers.get(key).delete(callback);
        }
    }
}

export const contextService = new ContextService();
```

**Usage:**

```html
<!-- parent.html -->
<template>
    <c-data-provider context-value={userData}>
        <c-nested-component></c-nested-component>
        <c-deeply-nested>
            <c-data-consumer></c-data-consumer>
        </c-deeply-nested>
    </c-data-provider>
</template>
```

## 🎨 Advanced Slot Patterns

### Named Slots with Defaults

```html
<!-- card.html -->
<template>
    <div class="card">
        <div class="card-header">
            <slot name="header">
                <!-- Default header -->
                <h2>Default Header</h2>
            </slot>
        </div>

        <div class="card-body">
            <slot>
                <!-- Default body content -->
                <p>No content provided</p>
            </slot>
        </div>

        <div class="card-footer">
            <slot name="footer"></slot>
        </div>
    </div>
</template>
```

**Usage:**

```html
<c-card>
    <h2 slot="header">Custom Header</h2>
    <div>
        <p>Custom body content</p>
        <p>Multiple elements allowed</p>
    </div>
    <div slot="footer">
        <button>Action</button>
    </div>
</c-card>
```

### Conditional Slot Rendering

```javascript
// advancedCard.js
import { LightningElement } from 'lwc';

export default class AdvancedCard extends LightningElement {
    get hasHeaderSlot() {
        return this.querySelector('[slot="header"]') !== null;
    }

    get hasFooterSlot() {
        return this.querySelector('[slot="footer"]') !== null;
    }
}
```

```html
<!-- advancedCard.html -->
<template>
    <div class="card">
        <template if:true={hasHeaderSlot}>
            <div class="card-header">
                <slot name="header"></slot>
            </div>
        </template>

        <div class="card-body">
            <slot></slot>
        </div>

        <template if:true={hasFooterSlot}>
            <div class="card-footer">
                <slot name="footer"></slot>
            </div>
        </template>
    </div>
</template>
```

## 🚨 Error Handling Patterns

### Error Boundary Component

```javascript
// errorBoundary.js
import { LightningElement, api } from 'lwc';

export default class ErrorBoundary extends LightningElement {
    @api fallbackMessage = 'Something went wrong';
    hasError = false;
    errorMessage = '';

    connectedCallback() {
        // Catch errors from child components
        this.template.addEventListener('error', this.handleError);
    }

    handleError = (event) => {
        event.stopPropagation();
        this.hasError = true;
        this.errorMessage = event.detail?.message || this.fallbackMessage;

        // Log to monitoring service
        this.logError(event.detail);
    }

    logError(error) {
        // Send to external monitoring (Splunk, DataDog, etc.)
        console.error('Component Error:', error);
    }

    handleRetry() {
        this.hasError = false;
        this.errorMessage = '';
        // Reset child components
        this.template.querySelectorAll('*').forEach(child => {
            if (child.reset) child.reset();
        });
    }
}
```

```html
<!-- errorBoundary.html -->
<template>
    <template if:false={hasError}>
        <slot></slot>
    </template>

    <template if:true={hasError}>
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h3>Error Occurred</h3>
            <p>{errorMessage}</p>
            <button onclick={handleRetry}>Retry</button>
        </div>
    </template>
</template>
```

### Async Error Handling

```javascript
// asyncHandler.js
export async function handleAsync(promise, errorHandler) {
    try {
        const data = await promise;
        return [data, null];
    } catch (error) {
        if (errorHandler) {
            errorHandler(error);
        }
        return [null, error];
    }
}

// Usage in component
import { handleAsync } from 'c/asyncHandler';

async loadData() {
    this.loading = true;

    const [data, error] = await handleAsync(
        getProperties({ filters: this.filters }),
        (err) => this.logError(err)
    );

    this.loading = false;

    if (error) {
        this.showToast('Error', error.body.message, 'error');
        return;
    }

    this.properties = data;
}
```

## ⚡ Performance Optimization Patterns

### Memoization Pattern

```javascript
// memoizedComponent.js
import { LightningElement, api } from 'lwc';

export default class MemoizedComponent extends LightningElement {
    @api items = [];

    // Cache for expensive computations
    _cache = new Map();

    get processedItems() {
        const cacheKey = JSON.stringify(this.items);

        if (this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey);
        }

        // Expensive computation
        const processed = this.items.map(item => ({
            ...item,
            computed: this.expensiveOperation(item)
        }));

        this._cache.set(cacheKey, processed);
        return processed;
    }

    expensiveOperation(item) {
        // Complex calculation
        return item.value * Math.pow(item.factor, 2);
    }
}
```

### Lazy Loading Pattern

```javascript
// lazyLoader.js
import { LightningElement } from 'lwc';

export default class LazyLoader extends LightningElement {
    showExpensiveComponent = false;

    connectedCallback() {
        // Use Intersection Observer for viewport detection
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.showExpensiveComponent = true;
                observer.disconnect();
            }
        });

        observer.observe(this.template.querySelector('.lazy-container'));
    }
}
```

```html
<!-- lazyLoader.html -->
<template>
    <div class="lazy-container">
        <template if:true={showExpensiveComponent}>
            <c-expensive-component></c-expensive-component>
        </template>
        <template if:false={showExpensiveComponent}>
            <div class="placeholder">Loading...</div>
        </template>
    </div>
</template>
```

### Virtual Scrolling Pattern

```javascript
// virtualList.js
import { LightningElement, api } from 'lwc';

export default class VirtualList extends LightningElement {
    @api items = [];
    @api itemHeight = 50;
    @api visibleItems = 20;

    scrollTop = 0;

    get visibleData() {
        const startIndex = Math.floor(this.scrollTop / this.itemHeight);
        const endIndex = startIndex + this.visibleItems;

        return this.items.slice(startIndex, endIndex).map((item, index) => ({
            ...item,
            style: `transform: translateY(${(startIndex + index) * this.itemHeight}px)`
        }));
    }

    get containerHeight() {
        return this.items.length * this.itemHeight;
    }

    handleScroll(event) {
        this.scrollTop = event.target.scrollTop;
    }
}
```

```html
<!-- virtualList.html -->
<template>
    <div class="scroll-container" onscroll={handleScroll}>
        <div class="spacer" style={containerHeight}></div>
        <template for:each={visibleData} for:item="item">
            <div key={item.id} style={item.style} class="list-item">
                {item.name}
            </div>
        </template>
    </div>
</template>
```

## 🔄 State Management Patterns

### Centralized State Pattern

```javascript
// stateManager.js
class StateManager {
    constructor() {
        this.state = {};
        this.subscribers = new Map();
    }

    setState(key, value) {
        this.state[key] = value;
        this.notify(key, value);
    }

    getState(key) {
        return this.state[key];
    }

    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            this.subscribers.get(key).delete(callback);
        };
    }

    notify(key, value) {
        if (this.subscribers.has(key)) {
            this.subscribers.get(key).forEach(callback => {
                callback(value);
            });
        }
    }
}

export const stateManager = new StateManager();
```

**Usage:**

```javascript
// component.js
import { LightningElement } from 'lwc';
import { stateManager } from 'c/stateManager';

export default class MyComponent extends LightningElement {
    userData;
    unsubscribe;

    connectedCallback() {
        // Subscribe to state changes
        this.unsubscribe = stateManager.subscribe('user', (value) => {
            this.userData = value;
        });

        // Get initial state
        this.userData = stateManager.getState('user');
    }

    disconnectedCallback() {
        // Clean up subscription
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    handleUpdate() {
        stateManager.setState('user', { name: 'John', role: 'Admin' });
    }
}
```

### Reducer Pattern

```javascript
// reducer.js
const initialState = {
    properties: [],
    filters: {},
    selectedProperty: null,
    loading: false,
    error: null
};

export function propertyReducer(state = initialState, action) {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, loading: true, error: null };

        case 'FETCH_SUCCESS':
            return {
                ...state,
                properties: action.payload,
                loading: false
            };

        case 'FETCH_ERROR':
            return {
                ...state,
                error: action.payload,
                loading: false
            };

        case 'UPDATE_FILTERS':
            return { ...state, filters: action.payload };

        case 'SELECT_PROPERTY':
            return { ...state, selectedProperty: action.payload };

        default:
            return state;
    }
}
```

```javascript
// component using reducer
import { LightningElement } from 'lwc';
import { propertyReducer } from 'c/reducer';

export default class PropertyManager extends LightningElement {
    state = {};

    connectedCallback() {
        this.state = propertyReducer(undefined, {});
    }

    dispatch(action) {
        this.state = propertyReducer(this.state, action);
    }

    async loadProperties() {
        this.dispatch({ type: 'FETCH_START' });

        try {
            const data = await getProperties({ filters: this.state.filters });
            this.dispatch({
                type: 'FETCH_SUCCESS',
                payload: data
            });
        } catch (error) {
            this.dispatch({
                type: 'FETCH_ERROR',
                payload: error.body.message
            });
        }
    }
}
```

## 🔧 Reusable Utility Patterns

### Debounce Utility

```javascript
// utils.js
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Usage in component
import { debounce } from 'c/utils';

export default class SearchComponent extends LightningElement {
    debouncedSearch;

    connectedCallback() {
        this.debouncedSearch = debounce(this.performSearch.bind(this), 300);
    }

    handleInput(event) {
        const searchTerm = event.target.value;
        this.debouncedSearch(searchTerm);
    }

    performSearch(term) {
        // Actual search logic
    }
}
```

### Event Bus Pattern

```javascript
// eventBus.js
class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    emit(eventName, data) {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName).forEach(callback => {
                callback(data);
            });
        }
    }

    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);
    }

    off(eventName, callback) {
        if (this.listeners.has(eventName)) {
            this.listeners.get(eventName).delete(callback);
        }
    }
}

export const eventBus = new EventBus();
```

**Usage:**

```javascript
// Component A - Emits event
import { eventBus } from 'c/eventBus';

export default class ComponentA extends LightningElement {
    handleAction() {
        eventBus.emit('dataUpdated', { id: '123', value: 'new' });
    }
}
```

```javascript
// Component B - Listens to event
import { eventBus } from 'c/eventBus';

export default class ComponentB extends LightningElement {
    handleDataUpdate;

    connectedCallback() {
        this.handleDataUpdate = (data) => {
            console.log('Received:', data);
        };
        eventBus.on('dataUpdated', this.handleDataUpdate);
    }

    disconnectedCallback() {
        eventBus.off('dataUpdated', this.handleDataUpdate);
    }
}
```

## 🎯 Advanced Event Patterns

### Event Delegation

```javascript
// listContainer.js
export default class ListContainer extends LightningElement {
    items = [...];

    handleContainerClick(event) {
        // Single handler for all list items
        const itemId = event.target.closest('[data-item-id]')?.dataset.itemId;

        if (itemId) {
            const action = event.target.dataset.action;

            switch (action) {
                case 'edit':
                    this.handleEdit(itemId);
                    break;
                case 'delete':
                    this.handleDelete(itemId);
                    break;
                case 'view':
                    this.handleView(itemId);
                    break;
            }
        }
    }
}
```

```html
<!-- listContainer.html -->
<template>
    <div class="container" onclick={handleContainerClick}>
        <template for:each={items} for:item="item">
            <div key={item.id} data-item-id={item.id} class="item">
                <span>{item.name}</span>
                <button data-action="edit">Edit</button>
                <button data-action="delete">Delete</button>
                <button data-action="view">View</button>
            </div>
        </template>
    </div>
</template>
```

### Custom Event with Payload Validation

```javascript
// validatedEventComponent.js
export default class ValidatedEventComponent extends LightningElement {
    dispatchValidatedEvent(eventName, payload, schema) {
        // Validate payload against schema
        if (!this.validatePayload(payload, schema)) {
            throw new Error(`Invalid payload for event: ${eventName}`);
        }

        this.dispatchEvent(new CustomEvent(eventName, {
            detail: payload,
            bubbles: true,
            composed: true
        }));
    }

    validatePayload(payload, schema) {
        for (const [key, type] of Object.entries(schema)) {
            if (typeof payload[key] !== type) {
                console.error(`Invalid type for ${key}`);
                return false;
            }
        }
        return true;
    }

    handleSubmit() {
        this.dispatchValidatedEvent('recordsave',
            {
                id: '123',
                name: 'John',
                age: 30
            },
            {
                id: 'string',
                name: 'string',
                age: 'number'
            }
        );
    }
}
```

## 💡 Best Practices

### ✅ DO:

1. **Use Composition Over Inheritance**
   ```javascript
   // ✅ GOOD - Compose functionality
   import { withLoading } from 'c/withLoading';
   import { withErrorHandling } from 'c/withErrorHandling';

   class MyComponent extends LightningElement {}
   export default withLoading(withErrorHandling(MyComponent));
   ```

2. **Keep Components Focused**
   ```javascript
   // ✅ GOOD - Single responsibility
   <c-property-search-filter></c-property-search-filter>
   <c-property-search-results></c-property-search-results>
   <c-property-details-modal></c-property-details-modal>
   ```

3. **Use Named Exports for Utilities**
   ```javascript
   // utils.js
   export { debounce } from './debounce';
   export { formatCurrency } from './formatters';
   export { validateEmail } from './validators';
   ```

4. **Implement Error Boundaries**
   ```javascript
   <c-error-boundary>
       <c-risky-component></c-risky-component>
   </c-error-boundary>
   ```

5. **Memoize Expensive Computations**
   ```javascript
   get expensiveValue() {
       if (this._cache) return this._cache;
       this._cache = this.computeExpensiveValue();
       return this._cache;
   }
   ```

### ❌ DON'T:

1. **Don't Prop Drill**
   ```javascript
   // ❌ BAD
   <c-level1 data={data}>
       <c-level2 data={data}>
           <c-level3 data={data}></c-level3>
       </c-level2>
   </c-level1>

   // ✅ GOOD - Use provider/consumer or state management
   <c-data-provider value={data}>
       <c-level1>
           <c-level2>
               <c-level3></c-level3>
           </c-level2>
       </c-level1>
   </c-data-provider>
   ```

2. **Don't Mutate Props**
   ```javascript
   // ❌ BAD
   @api record;
   handleChange() {
       this.record.name = 'new';  // Mutating prop!
   }

   // ✅ GOOD
   @api record;
   handleChange() {
       const updated = { ...this.record, name: 'new' };
       this.dispatchEvent(new CustomEvent('update', {
           detail: updated
       }));
   }
   ```

3. **Don't Create Memory Leaks**
   ```javascript
   // ❌ BAD - No cleanup
   connectedCallback() {
       eventBus.on('update', this.handleUpdate);
   }

   // ✅ GOOD - Clean up
   disconnectedCallback() {
       eventBus.off('update', this.handleUpdate);
   }
   ```

## 📚 Complete Pattern Example

Here's a complete example combining multiple patterns:

```javascript
// propertyManagerContainer.js
import { LightningElement } from 'lwc';
import { stateManager } from 'c/stateManager';
import { eventBus } from 'c/eventBus';
import { handleAsync } from 'c/asyncHandler';
import getProperties from '@salesforce/apex/PropertyController.getProperties';

export default class PropertyManagerContainer extends LightningElement {
    state = {
        properties: [],
        loading: false,
        error: null,
        filters: {}
    };

    unsubscribe;

    connectedCallback() {
        // Subscribe to global state
        this.unsubscribe = stateManager.subscribe('properties', (properties) => {
            this.state = { ...this.state, properties };
        });

        // Listen to events
        eventBus.on('filterchange', this.handleFilterChange);

        // Load initial data
        this.loadProperties();
    }

    disconnectedCallback() {
        this.unsubscribe?.();
        eventBus.off('filterchange', this.handleFilterChange);
    }

    async loadProperties() {
        this.state = { ...this.state, loading: true };

        const [data, error] = await handleAsync(
            getProperties({ filters: this.state.filters })
        );

        if (error) {
            this.state = { ...this.state, loading: false, error };
            return;
        }

        this.state = { ...this.state, properties: data, loading: false };
        stateManager.setState('properties', data);
    }

    handleFilterChange = (filters) => {
        this.state = { ...this.state, filters };
        this.loadProperties();
    }
}
```

## 🚀 Next Steps

Master these advanced patterns:

**[→ Lightning Message Service](/docs/salesforce/lwc/lightning-message-service)** - Cross-component communication

**[→ Back to LWC Fundamentals](/docs/salesforce/lwc/fundamentals)** - Review basics

**[→ Testing Guide](/docs/salesforce/lwc/testing)** - Test these patterns

---

**You can now build enterprise-grade LWC applications!** Use these patterns to write scalable, maintainable code. 🎯
