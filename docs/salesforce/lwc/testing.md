---
sidebar_position: 4
title: Testing & Debugging LWC
description: Master Jest testing, debugging techniques, and quality assurance for Lightning Web Components
---

# LWC Testing & Debugging: Build Quality Components

Learn to write comprehensive tests for Lightning Web Components using Jest, debug issues effectively, and ensure production-quality code.

## 🎯 What You'll Master

- Jest testing framework for LWC
- Writing unit tests for components
- Mocking Apex calls and wire adapters
- Testing user interactions
- Debugging techniques
- Chrome DevTools for LWC
- Performance testing
- Best practices for testable components

## 🧪 Jest Testing Framework

### Why Test LWC?

```
Benefits of Testing:
├── Catch bugs early
├── Refactor with confidence
├── Document component behavior
├── Faster development over time
└── Production-ready code
```

### Setup Jest Testing

```bash
# Install @salesforce/sfdx-lwc-jest
npm install --save-dev @salesforce/sfdx-lwc-jest

# package.json
{
  "scripts": {
    "test:unit": "sfdx-lwc-jest",
    "test:unit:watch": "sfdx-lwc-jest --watch",
    "test:unit:debug": "sfdx-lwc-jest --debug",
    "test:unit:coverage": "sfdx-lwc-jest --coverage"
  }
}

# Run tests
npm run test:unit
```

## ✅ Basic Component Testing

### Simple Component

```javascript
// helloWorld.js
import { LightningElement, api } from 'lwc';

export default class HelloWorld extends LightningElement {
    @api greeting = 'Hello';

    get displayMessage() {
        return `${this.greeting}, World!`;
    }
}
```

```html
<!-- helloWorld.html -->
<template>
    <div class="greeting">{displayMessage}</div>
</template>
```

### Test File

```javascript
// helloWorld.test.js
import { createElement } from 'lwc';
import HelloWorld from 'c/helloWorld';

describe('c-hello-world', () => {
    afterEach(() => {
        // Clean up DOM after each test
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('displays default greeting', () => {
        // Create component
        const element = createElement('c-hello-world', {
            is: HelloWorld
        });
        document.body.appendChild(element);

        // Query DOM
        const div = element.shadowRoot.querySelector('.greeting');

        // Assert
        expect(div.textContent).toBe('Hello, World!');
    });

    it('displays custom greeting', () => {
        const element = createElement('c-hello-world', {
            is: HelloWorld
        });
        element.greeting = 'Hi';
        document.body.appendChild(element);

        const div = element.shadowRoot.querySelector('.greeting');
        expect(div.textContent).toBe('Hi, World!');
    });
});
```

## 🎭 Testing User Interactions

### Component with Button

```javascript
// counter.js
import { LightningElement, track } from 'lwc';

export default class Counter extends LightningElement {
    @track count = 0;

    handleIncrement() {
        this.count++;
    }

    handleDecrement() {
        this.count--;
    }

    handleReset() {
        this.count = 0;
    }
}
```

```html
<!-- counter.html -->
<template>
    <div class="counter">
        <p class="count-value">{count}</p>
        <button class="increment" onclick={handleIncrement}>+</button>
        <button class="decrement" onclick={handleDecrement}>-</button>
        <button class="reset" onclick={handleReset}>Reset</button>
    </div>
</template>
```

### Test User Interactions

```javascript
// counter.test.js
import { createElement } from 'lwc';
import Counter from 'c/counter';

describe('c-counter', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('starts at zero', () => {
        const element = createElement('c-counter', {
            is: Counter
        });
        document.body.appendChild(element);

        const countValue = element.shadowRoot.querySelector('.count-value');
        expect(countValue.textContent).toBe('0');
    });

    it('increments count', () => {
        const element = createElement('c-counter', {
            is: Counter
        });
        document.body.appendChild(element);

        const button = element.shadowRoot.querySelector('.increment');
        button.click();

        return Promise.resolve().then(() => {
            const countValue = element.shadowRoot.querySelector('.count-value');
            expect(countValue.textContent).toBe('1');
        });
    });

    it('decrements count', () => {
        const element = createElement('c-counter', {
            is: Counter
        });
        document.body.appendChild(element);

        const button = element.shadowRoot.querySelector('.decrement');
        button.click();

        return Promise.resolve().then(() => {
            const countValue = element.shadowRoot.querySelector('.count-value');
            expect(countValue.textContent).toBe('-1');
        });
    });

    it('resets count', () => {
        const element = createElement('c-counter', {
            is: Counter
        });
        document.body.appendChild(element);

        // Increment first
        const incrementBtn = element.shadowRoot.querySelector('.increment');
        incrementBtn.click();

        return Promise.resolve().then(() => {
            // Then reset
            const resetBtn = element.shadowRoot.querySelector('.reset');
            resetBtn.click();

            return Promise.resolve();
        }).then(() => {
            const countValue = element.shadowRoot.querySelector('.count-value');
            expect(countValue.textContent).toBe('0');
        });
    });
});
```

**Key Pattern:**
```javascript
button.click();  // Trigger event

return Promise.resolve().then(() => {
    // DOM has updated, now assert
});
```

## 📡 Mocking Apex Calls

### Component with Apex

```javascript
// accountList.js
import { LightningElement, wire } from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';

export default class AccountList extends LightningElement {
    @wire(getAccounts)
    accounts;

    get hasAccounts() {
        return this.accounts.data && this.accounts.data.length > 0;
    }
}
```

### Mock Apex Data

```javascript
// accountList.test.js
import { createElement } from 'lwc';
import AccountList from 'c/accountList';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';

// Mock Apex method
jest.mock(
    '@salesforce/apex/AccountController.getAccounts',
    () => ({
        default: jest.fn()
    }),
    { virtual: true }
);

// Import mock data
const mockAccounts = require('./data/accounts.json');

describe('c-account-list', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('displays accounts', () => {
        const element = createElement('c-account-list', {
            is: AccountList
        });
        document.body.appendChild(element);

        // Emit mock data
        getAccounts.emit(mockAccounts);

        return Promise.resolve().then(() => {
            const accountCards = element.shadowRoot.querySelectorAll('.account-card');
            expect(accountCards.length).toBe(mockAccounts.length);
        });
    });

    it('handles error', () => {
        const element = createElement('c-account-list', {
            is: AccountList
        });
        document.body.appendChild(element);

        // Emit error
        getAccounts.error();

        return Promise.resolve().then(() => {
            const errorElement = element.shadowRoot.querySelector('.error');
            expect(errorElement).not.toBeNull();
        });
    });
});
```

### Mock Data File

```json
// __tests__/data/accounts.json
[
    {
        "Id": "001000000000001",
        "Name": "Acme Corp",
        "Industry": "Technology"
    },
    {
        "Id": "001000000000002",
        "Name": "Global Inc",
        "Industry": "Finance"
    }
]
```

## 🔌 Mocking Wire Adapters

### Component with Wire Adapter

```javascript
// recordDetails.js
import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Account.Name';
import INDUSTRY_FIELD from '@salesforce/schema/Account.Industry';

export default class RecordDetails extends LightningElement {
    @api recordId;

    @wire(getRecord, {
        recordId: '$recordId',
        fields: [NAME_FIELD, INDUSTRY_FIELD]
    })
    record;

    get name() {
        return this.record.data?.fields.Name.value;
    }

    get industry() {
        return this.record.data?.fields.Industry.value;
    }
}
```

### Test with Wire Mock

```javascript
// recordDetails.test.js
import { createElement } from 'lwc';
import RecordDetails from 'c/recordDetails';
import { getRecord } from 'lightning/uiRecordApi';

// Mock wire adapter
jest.mock(
    'lightning/uiRecordApi',
    () => ({
        getRecord: jest.fn()
    }),
    { virtual: true }
);

const mockRecord = {
    fields: {
        Name: { value: 'Acme Corp' },
        Industry: { value: 'Technology' }
    }
};

describe('c-record-details', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it('displays record data', () => {
        const element = createElement('c-record-details', {
            is: RecordDetails
        });
        element.recordId = '001000000000001';
        document.body.appendChild(element);

        // Emit data
        getRecord.emit(mockRecord);

        return Promise.resolve().then(() => {
            const name = element.shadowRoot.querySelector('.name');
            expect(name.textContent).toBe('Acme Corp');

            const industry = element.shadowRoot.querySelector('.industry');
            expect(industry.textContent).toBe('Technology');
        });
    });
});
```

## 🎨 Testing Conditional Rendering

```javascript
// conditionalDisplay.js
import { LightningElement, track } from 'lwc';

export default class ConditionalDisplay extends LightningElement {
    @track showDetails = false;

    handleToggle() {
        this.showDetails = !this.showDetails;
    }
}
```

```html
<!-- conditionalDisplay.html -->
<template>
    <button onclick={handleToggle}>Toggle Details</button>

    <template if:true={showDetails}>
        <div class="details">Details are visible</div>
    </template>

    <template if:false={showDetails}>
        <div class="no-details">No details to show</div>
    </template>
</template>
```

```javascript
// conditionalDisplay.test.js
describe('c-conditional-display', () => {
    it('shows no details initially', () => {
        const element = createElement('c-conditional-display', {
            is: ConditionalDisplay
        });
        document.body.appendChild(element);

        const noDetails = element.shadowRoot.querySelector('.no-details');
        expect(noDetails).not.toBeNull();

        const details = element.shadowRoot.querySelector('.details');
        expect(details).toBeNull();
    });

    it('toggles details visibility', () => {
        const element = createElement('c-conditional-display', {
            is: ConditionalDisplay
        });
        document.body.appendChild(element);

        const button = element.shadowRoot.querySelector('button');
        button.click();

        return Promise.resolve().then(() => {
            const details = element.shadowRoot.querySelector('.details');
            expect(details).not.toBeNull();

            const noDetails = element.shadowRoot.querySelector('.no-details');
            expect(noDetails).toBeNull();
        });
    });
});
```

## 🔍 Debugging Techniques

### Chrome DevTools

```javascript
// Add debugger statement
handleClick() {
    debugger;  // Execution pauses here
    this.count++;
}

// Console logging
connectedCallback() {
    console.log('Component connected');
    console.log('RecordId:', this.recordId);
}

// Log wire data
@wire(getRecord, { recordId: '$recordId' })
wiredRecord({ error, data }) {
    if (data) {
        console.log('Data received:', JSON.stringify(data, null, 2));
    }
    if (error) {
        console.error('Error:', error);
    }
}
```

### Lightning Inspector

1. Install Lightning Inspector Chrome Extension
2. Open Chrome DevTools → Lightning tab
3. View component tree
4. Inspect component properties
5. View event log
6. Monitor performance

### Debug Mode

```javascript
// Enable debug mode in component
import { LightningElement } from 'lwc';

export default class DebugComponent extends LightningElement {
    debug = true;  // Toggle for debug logging

    log(message, data) {
        if (this.debug) {
            console.log(`[DebugComponent] ${message}`, data);
        }
    }

    handleClick() {
        this.log('Button clicked', { timestamp: Date.now() });
    }
}
```

## ⚡ Testing Events

### Component that Fires Events

```javascript
// productSelector.js
import { LightningElement, api } from 'lwc';

export default class ProductSelector extends LightningElement {
    @api products;

    handleSelect(event) {
        const productId = event.target.dataset.id;

        // Fire custom event
        this.dispatchEvent(new CustomEvent('productselect', {
            detail: productId
        }));
    }
}
```

### Test Event Dispatching

```javascript
// productSelector.test.js
describe('c-product-selector', () => {
    it('fires productselect event', () => {
        const element = createElement('c-product-selector', {
            is: ProductSelector
        });
        element.products = [
            { Id: '001', Name: 'Product 1' }
        ];
        document.body.appendChild(element);

        // Create event handler
        const handler = jest.fn();
        element.addEventListener('productselect', handler);

        return Promise.resolve().then(() => {
            const button = element.shadowRoot.querySelector('button');
            button.click();

            return Promise.resolve();
        }).then(() => {
            // Verify event was fired
            expect(handler).toHaveBeenCalled();
            expect(handler.mock.calls[0][0].detail).toBe('001');
        });
    });
});
```

## 💡 Best Practices

### ✅ DO:

1. **Clean Up After Tests**
   ```javascript
   afterEach(() => {
       while (document.body.firstChild) {
           document.body.removeChild(document.body.firstChild);
       }
       jest.clearAllMocks();
   });
   ```

2. **Test User Scenarios**
   ```javascript
   it('completes purchase flow', () => {
       // Test entire user journey
   });
   ```

3. **Use Descriptive Test Names**
   ```javascript
   it('displays error when API call fails', () => {
       // Clear what's being tested
   });
   ```

4. **Wait for DOM Updates**
   ```javascript
   return Promise.resolve().then(() => {
       // DOM is updated
   });
   ```

5. **Test Edge Cases**
   ```javascript
   it('handles empty list', () => {});
   it('handles null values', () => {});
   it('handles error responses', () => {});
   ```

### ❌ DON'T:

1. **Don't Test Implementation Details**
   ```javascript
   // ❌ BAD - Testing internal state
   expect(element.internalCounter).toBe(5);

   // ✅ GOOD - Testing user-visible behavior
   expect(element.shadowRoot.querySelector('.count').textContent).toBe('5');
   ```

2. **Don't Skip Async Handling**
   ```javascript
   // ❌ BAD
   button.click();
   expect(result).toBe('updated');  // Won't work!

   // ✅ GOOD
   button.click();
   return Promise.resolve().then(() => {
       expect(result).toBe('updated');
   });
   ```

3. **Don't Forget to Clear Mocks**
   ```javascript
   afterEach(() => {
       jest.clearAllMocks();  // Important!
   });
   ```

## 📚 Common Testing Patterns

### Pattern 1: Arrange-Act-Assert

```javascript
it('updates display on input', () => {
    // Arrange
    const element = createElement('c-my-component', {
        is: MyComponent
    });
    document.body.appendChild(element);

    // Act
    const input = element.shadowRoot.querySelector('input');
    input.value = 'test';
    input.dispatchEvent(new Event('input'));

    // Assert
    return Promise.resolve().then(() => {
        const display = element.shadowRoot.querySelector('.display');
        expect(display.textContent).toBe('test');
    });
});
```

### Pattern 2: Testing Async Operations

```javascript
it('loads data asynchronously', async () => {
    const element = createElement('c-async-component', {
        is: AsyncComponent
    });
    document.body.appendChild(element);

    getAccounts.emit(mockAccounts);

    await Promise.resolve();

    const items = element.shadowRoot.querySelectorAll('.item');
    expect(items.length).toBe(mockAccounts.length);
});
```

### Pattern 3: Testing Multiple States

```javascript
describe('loading states', () => {
    it('shows loading spinner initially', () => {
        // Test loading state
    });

    it('shows data when loaded', () => {
        // Test success state
    });

    it('shows error on failure', () => {
        // Test error state
    });
});
```

## 🚀 Next Steps

Apply testing to your components:

**[→ Back to Practical Guide](/docs/salesforce/lwc/practical-guide)** - Build testable components

**[→ Start DevOps Track](/docs/intro)** - Deploy tested solutions

---

**You can now test your LWC components professionally!** Write tests first, code with confidence. 🧪
