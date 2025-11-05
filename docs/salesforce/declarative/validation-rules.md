---
sidebar_position: 2
title: Validation Rules
description: Enforce data quality with validation rules
---

# Validation Rules: Ensuring Data Quality

Validation rules ensure that data entered into Salesforce meets your business requirements before it's saved. They're one of the most powerful declarative tools for maintaining data integrity.

## 🎯 What You'll Learn

- Create and test validation rules
- Use formula syntax effectively
- Handle complex business logic
- Best practices and common patterns
- Real-world validation scenarios

## 📊 What Are Validation Rules?

Validation rules prevent users from saving records with invalid data.

**Key Characteristics:**
- Run **before** the record is saved
- Display custom error message if validation fails
- Can be field-level or page-level errors
- Use formula syntax (TRUE = invalid, FALSE = valid)
- Can check any field on the record or related records

## 🔨 Creating Your First Validation Rule

Let's create a validation rule for our Property object.

### Example 1: Sold Date Required When Status is Sold

**Business Requirement:**
"When a property status is 'Sold', the sold date must be filled in."

**Setup:**
1. Setup → Object Manager → Property__c
2. Validation Rules → New
3. Fill in:

```
Rule Name: Sold_Date_Required_When_Sold
Error Condition Formula:
AND(
    ISPICKVAL(Status__c, 'Sold'),
    ISBLANK(Sold_Date__c)
)

Error Message: "Sold Date is required when Status is 'Sold'"
Error Location: Sold_Date__c (field-level error)
```

**Logic Breakdown:**
- `ISPICKVAL(Status__c, 'Sold')` - Status equals "Sold"
- `ISBLANK(Sold_Date__c)` - Sold Date is empty
- `AND()` - Both conditions must be true
- If TRUE → validation fails, shows error

### Example 2: Price Must Be Positive

**Business Requirement:**
"Listing price must be greater than zero."

```apex
Formula:
Listing_Price__c <= 0

Error Message: "Listing Price must be greater than zero"
Error Location: Listing_Price__c
```

Simple and effective!

### Example 3: End Date After Start Date

**Business Requirement:**
"Sold date cannot be before listing date."

```apex
Formula:
AND(
    NOT(ISBLANK(Sold_Date__c)),
    Sold_Date__c < Listed_Date__c
)

Error Message: "Sold Date cannot be earlier than Listed Date"
Error Location: Sold_Date__c
```

## 📚 Common Validation Functions

### 1. ISBLANK() - Check for Empty Fields

```apex
// Field is empty
ISBLANK(Phone__c)

// Field is NOT empty
NOT(ISBLANK(Phone__c))
```

**Works with:**
- Text fields
- Number fields
- Date fields
- Lookup fields

### 2. ISPICKVAL() - Check Picklist Values

```apex
// Status equals "Sold"
ISPICKVAL(Status__c, 'Sold')

// Status does NOT equal "Available"
NOT(ISPICKVAL(Status__c, 'Available'))

// Status is one of multiple values
OR(
    ISPICKVAL(Status__c, 'Sold'),
    ISPICKVAL(Status__c, 'Under Contract')
)
```

### 3. AND() / OR() / NOT() - Logical Operators

```apex
// ALL conditions must be true
AND(
    condition1,
    condition2,
    condition3
)

// ANY condition can be true
OR(
    condition1,
    condition2
)

// Negates a condition
NOT(condition)
```

### 4. TEXT() - Convert to Text

```apex
// Convert picklist to text for comparison
TEXT(Status__c) = 'Sold'

// Useful for picklists and other special fields
```

### 5. LEN() - String Length

```apex
// Zip code must be 5 digits
AND(
    NOT(ISBLANK(Zip_Code__c)),
    LEN(Zip_Code__c) != 5
)

// Phone must be at least 10 characters
LEN(Phone__c) < 10
```

### 6. REGEX() - Pattern Matching

```apex
// Email must be valid format
NOT(
    REGEX(Email__c, '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}')
)

// Phone format: XXX-XXX-XXXX
NOT(
    REGEX(Phone__c, '[0-9]{3}-[0-9]{3}-[0-9]{4}')
)

// Zip code: 5 digits only
NOT(
    REGEX(Zip_Code__c, '[0-9]{5}')
)
```

### 7. TODAY() / NOW() - Current Date/Time

```apex
// Listed date cannot be in the future
Listed_Date__c > TODAY()

// Event time must be in the future
Event_DateTime__c < NOW()
```

## 💡 Real-World Validation Patterns

### Pattern 1: Conditional Required Fields

**Scenario:** Field required only when certain conditions are met.

```apex
// Commission percentage required when status is Sold
AND(
    ISPICKVAL(Status__c, 'Sold'),
    ISBLANK(Commission_Percent__c)
)

// Rejection reason required when status is Rejected
AND(
    ISPICKVAL(Status__c, 'Rejected'),
    ISBLANK(Rejection_Reason__c)
)
```

### Pattern 2: Mutual Exclusivity

**Scenario:** Only one of two fields can be filled.

```apex
// Either list Buyer Agent OR Buyer Agent Company, not both
AND(
    NOT(ISBLANK(Buyer_Agent__c)),
    NOT(ISBLANK(Buyer_Agent_Company__c))
)

Error Message: "Enter either Buyer Agent OR Buyer Agent Company, not both"
```

### Pattern 3: Dependency Validation

**Scenario:** If field A is filled, field B must also be filled.

```apex
// If Special Features is selected, Description required
AND(
    Has_Special_Features__c = TRUE,
    ISBLANK(Special_Features_Description__c)
)

Error Message: "Please describe the special features"
```

### Pattern 4: Range Validation

**Scenario:** Value must be within a specific range.

```apex
// Commission between 1% and 10%
OR(
    Commission_Percent__c < 1,
    Commission_Percent__c > 10
)

// Square footage between 100 and 50,000
OR(
    Square_Footage__c < 100,
    Square_Footage__c > 50000
)
```

### Pattern 5: Cross-Object Validation

**Scenario:** Check related object fields.

```apex
// Property must have a related Account
ISBLANK(Account__c)

// Agent must be marked as Active
Agent__r.Active__c = FALSE

Error Message: "Agent must be active to list properties"
```

### Pattern 6: Status Transition Rules

**Scenario:** Prevent invalid status changes.

```apex
// Cannot change from Sold back to Available
AND(
    ISPICKVAL(PRIORVALUE(Status__c), 'Sold'),
    ISPICKVAL(Status__c, 'Available')
)

Error Message: "Cannot change status from Sold back to Available"
```

**Note:** `PRIORVALUE()` gets the field value before the current edit.

### Pattern 7: Format Validation

**Scenario:** Enforce specific formats.

```apex
// Phone number format: (XXX) XXX-XXXX
AND(
    NOT(ISBLANK(Phone__c)),
    NOT(
        REGEX(Phone__c, '\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}')
    )
)

// Email domain must be company domain
AND(
    NOT(ISBLANK(Email__c)),
    NOT(CONTAINS(Email__c, '@acmecorp.com'))
)
```

### Pattern 8: User Profile Restrictions

**Scenario:** Different rules for different users.

```apex
// Only admins can mark as Featured
AND(
    Featured__c = TRUE,
    $Profile.Name != 'System Administrator'
)

Error Message: "Only administrators can feature properties"
```

**Profile Variables:**
- `$Profile.Name` - Profile name
- `$User.Id` - Current user ID
- `$User.Email` - Current user email
- `$UserRole.Name` - User role name

## 🧪 Testing Validation Rules

### Method 1: Manual Testing

1. Create/Edit a record
2. Try to violate the rule
3. Verify error message displays
4. Verify valid data saves successfully

### Method 2: Check Validation Rule

1. Validation Rules → Click rule name
2. Click **Check Syntax**
3. Verifies formula is valid

### Method 3: Apex Test Class

```apex
@isTest
private class PropertyValidationTest {

    @isTest
    static void testSoldDateRequired() {
        Property__c prop = new Property__c(
            Name = 'Test Property',
            Status__c = 'Sold'
            // Missing Sold_Date__c - should fail
        );

        Test.startTest();
        try {
            insert prop;
            System.assert(false, 'Should have thrown validation error');
        } catch(DmlException e) {
            System.assert(e.getMessage().contains('Sold Date is required'));
        }
        Test.stopTest();
    }

    @isTest
    static void testValidSoldProperty() {
        Property__c prop = new Property__c(
            Name = 'Test Property',
            Status__c = 'Sold',
            Sold_Date__c = Date.today(),
            Listed_Date__c = Date.today().addDays(-30),
            Listing_Price__c = 500000
        );

        Test.startTest();
        insert prop;
        Test.stopTest();

        System.assertNotEquals(null, prop.Id, 'Property should insert successfully');
    }
}
```

## 🎯 Best Practices

### ✅ DO:

1. **Use descriptive rule names**
   ```
   ✅ Sold_Date_Required_When_Sold
   ❌ Rule1
   ```

2. **Write clear error messages**
   ```
   ✅ "Sold Date is required when Status is 'Sold'"
   ❌ "Error in data"
   ```

3. **Put errors on specific fields when possible**
   - Users see exactly where the problem is

4. **Keep formulas simple and readable**
   ```apex
   ✅ AND(
       ISPICKVAL(Status__c, 'Sold'),
       ISBLANK(Sold_Date__c)
   )

   ❌ ISPICKVAL(Status__c,'Sold')&&ISBLANK(Sold_Date__c)
   ```

5. **Document complex rules**
   - Use the Description field
   - Explain business logic

6. **Test edge cases**
   - Null values
   - Boundary values
   - Status transitions

### ❌ DON'T:

1. **Don't create overly complex rules**
   - Break into multiple rules if needed
   - Consider using Apex triggers for very complex logic

2. **Don't forget bulk operations**
   - Rules run on data imports
   - Can block large data loads
   - Consider "Active" checkbox for maintenance

3. **Don't validate everything**
   - Only validate critical data
   - Too many rules frustrate users

4. **Don't use hard-coded IDs**
   ```apex
   ❌ Owner__c = '0051234567890ABC'
   ✅ $User.Profile.Name = 'Sales User'
   ```

## 💼 Hands-On Exercise

Create these validation rules for the Property object:

### Exercise 1: Basic Validations

```apex
// 1. Bedrooms must be at least 1
Name: Minimum_Bedrooms
Formula: Bedrooms__c < 1
Message: "Property must have at least 1 bedroom"

// 2. Square footage must be positive
Name: Positive_Square_Footage
Formula: Square_Footage__c <= 0
Message: "Square footage must be greater than zero"

// 3. Listing price must be at least $10,000
Name: Minimum_Listing_Price
Formula: Listing_Price__c < 10000
Message: "Listing price must be at least $10,000"
```

### Exercise 2: Conditional Logic

```apex
// 4. Under Contract properties must have buyer information
Name: Buyer_Info_Required_Under_Contract
Formula:
AND(
    ISPICKVAL(Status__c, 'Under Contract'),
    ISBLANK(Buyer_Agent__c),
    ISBLANK(Buyer_Agent_Company__c)
)
Message: "Buyer information required when status is Under Contract"

// 5. Featured properties must have photos
Name: Featured_Requires_Photos
Formula:
AND(
    Featured__c = TRUE,
    Photo_Count__c = 0
)
Message: "Featured properties must have at least one photo"
```

### Exercise 3: Advanced Patterns

```apex
// 6. Sold price cannot exceed listing price by more than 10%
Name: Sold_Price_Reasonable
Formula:
AND(
    NOT(ISBLANK(Sold_Price__c)),
    Sold_Price__c > (Listing_Price__c * 1.1)
)
Message: "Sold price cannot exceed listing price by more than 10%"

// 7. Cannot sell property in less than 1 day
Name: Minimum_Days_On_Market
Formula:
AND(
    NOT(ISBLANK(Sold_Date__c)),
    Sold_Date__c <= Listed_Date__c
)
Message: "Sold date must be at least 1 day after listing date"
```

## 📊 Validation Rule Order of Execution

Understanding when validation rules fire:

```
1. System Validation (required fields, data types)
2. Custom Validation Rules
3. Duplicate Rules
4. Triggers
5. Assignment Rules
6. Auto-Response Rules
7. Workflow Rules
8. Processes
9. Flows (Record-Triggered)
```

**Key Points:**
- Validation rules run BEFORE triggers
- If validation fails, no triggers execute
- All validation rules on an object are evaluated
- If ANY rule fails, the record doesn't save

## 🚨 Common Mistakes to Avoid

### Mistake 1: Wrong Logic

```apex
❌ Wrong:
ISBLANK(Sold_Date__c) = TRUE

✅ Correct:
ISBLANK(Sold_Date__c)
```

### Mistake 2: Forgetting NOT()

```apex
❌ Wrong (wants to require email when checkbox is true):
AND(
    Requires_Email__c = TRUE,
    ISBLANK(Email__c)
)

✅ Correct:
AND(
    Requires_Email__c = TRUE,
    ISBLANK(Email__c)
)
```
This one is actually correct! But be careful with double negatives.

### Mistake 3: Hard-Coding Values

```apex
❌ Wrong:
Owner = '00536000001234ABC'

✅ Correct:
$User.Id = Owner
```

### Mistake 4: Not Handling Nulls

```apex
❌ Wrong (can cause errors):
Square_Footage__c / Bedrooms__c < 200

✅ Correct:
AND(
    NOT(ISBLANK(Bedrooms__c)),
    Bedrooms__c > 0,
    (Square_Footage__c / Bedrooms__c) < 200
)
```

## 📚 Interview Questions

**Q: What happens when a validation rule fails?**
A: The record is not saved, a custom error message is displayed to the user, and no triggers or workflows execute. The user must correct the data before proceeding.

**Q: Can validation rules reference fields from related objects?**
A: Yes, you can reference parent object fields using relationship names (e.g., `Account__r.Industry__c`), but you cannot reference child object fields.

**Q: When should you use a validation rule vs. a trigger?**
A:
- **Validation Rule:** Simple field-level validations, declarative, runs before save
- **Trigger:** Complex logic, need to check child records, need to perform actions, programmatic

**Q: How do you temporarily disable a validation rule?**
A: Uncheck the "Active" checkbox on the validation rule. This is useful during data migrations or bulk operations.

**Q: Can validation rules prevent record deletion?**
A: No, validation rules only fire on insert and update operations, not deletes. Use a trigger for delete prevention.

## 🚀 Next Steps

Great work mastering validation rules! Next, let's learn about Flows for automation:

**[→ Next: Flow Builder Fundamentals](/docs/salesforce/declarative/flow-builder)**

---

**You now know how to enforce data quality with validation rules!** Practice by creating rules for different business scenarios. 🎓
