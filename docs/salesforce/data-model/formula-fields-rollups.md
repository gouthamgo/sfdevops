---
sidebar_position: 4
title: Formula Fields & Roll-Up Summaries
description: Master formula fields and roll-up summaries - calculated fields, functions, cross-object formulas, and aggregations
---

# Formula Fields & Roll-Up Summaries: Calculated Data

Master formula fields for dynamic calculations and roll-up summaries for parent-level aggregations. Learn functions, operators, and real-world use cases.

## 🎯 What You'll Master

- Formula field basics
- Formula field types
- Functions and operators
- Text formulas
- Date/time formulas
- Logical formulas
- Cross-object formulas
- Roll-up summary fields
- Advanced patterns
- Best practices
- Real-world examples

## 📐 Formula Fields Overview

```
Formula Fields:

What They Are:
- Read-only fields
- Calculated automatically
- No storage required
- Recalculated when viewed

Use Cases:
├── Calculate values (Price * Tax Rate)
├── Concatenate text (First Name + Last Name)
├── Format data (UPPER(Name))
├── Date calculations (TODAY() - Created Date)
├── Conditional logic (IF Status = "Active", "Yes", "No")
└── Cross-object references (Account.Industry)
```

## 🔧 Creating Formula Fields

### Basic Formula Field

```
Object Manager → Property__c → Fields & Relationships → New

Step 1: Data Type
Select: Formula

Step 2: Field Details
Field Label: Days on Market
Field Name: Days_on_Market
Formula Return Type: Number
Decimal Places: 0

Step 3: Formula Editor
TODAY() - Listed_Date__c

Step 4: Field-Level Security
Set visibility per profile

Step 5: Page Layout
Add to page layout
```

### Formula Return Types

```
Return Types:

Checkbox (Boolean)
├── Returns TRUE or FALSE
└── Example: Price__c > 1000000

Currency
├── Returns dollar amount
└── Example: Price__c * 0.06

Date
├── Returns date value
└── Example: Close_Date__c + 30

Date/Time
├── Returns date and time
└── Example: NOW()

Number
├── Returns numeric value
└── Example: Square_Feet__c * Price_per_SqFt__c

Percent
├── Returns percentage
└── Example: Commission__c / Price__c

Text
├── Returns text string
└── Example: First_Name__c & " " & Last_Name__c
```

## 🔤 Text Formulas

### Concatenation

```
Full Name:
First_Name__c & " " & Last_Name__c
Result: "John Smith"

Property Address:
Street__c & ", " & City__c & ", " & State__c & " " & ZIP_Code__c
Result: "123 Main St, San Francisco, CA 94102"

Full Description:
Bedrooms__c & "BR / " & Bathrooms__c & "BA - " & Square_Feet__c & " sqft"
Result: "3BR / 2BA - 1500 sqft"
```

### Text Functions

```
UPPER(text)
UPPER(Name)
Result: "SUNSET VILLA"

LOWER(text)
LOWER(Email__c)
Result: "john@example.com"

PROPER(text)
PROPER(City__c)
Result: "San Francisco"

TEXT(value)
"$" & TEXT(Price__c)
Result: "$850000"

VALUE(text)
VALUE(Price_Text__c)
Result: 850000

LEN(text)
LEN(Description__c)
Result: 250

LEFT(text, num_chars)
LEFT(Phone__c, 3)
Result: "415"

RIGHT(text, num_chars)
RIGHT(Phone__c, 4)
Result: "5678"

MID(text, start, num_chars)
MID(Phone__c, 4, 3)
Result: "555"

SUBSTITUTE(text, old_text, new_text)
SUBSTITUTE(Phone__c, "-", "")
Result: "4155551234"

FIND(search_text, text)
FIND("@", Email__c)
Result: 5

CONTAINS(text, search_text)
CONTAINS(Description__c, "pool")
Result: TRUE or FALSE

BR()
"Line 1" & BR() & "Line 2"
Result: Line break in text

HYPERLINK(url, friendly_name)
HYPERLINK("https://maps.google.com/?q=" & Street__c, "View Map")
Result: Clickable link
```

### Practical Text Examples

**Property Display Name:**
```
Property_Type__c & " - " &
Bedrooms__c & "BR/" & Bathrooms__c & "BA - " &
TEXT(Price__c)

Result: "Single Family - 3BR/2BA - 850000"
```

**Email Link:**
```
HYPERLINK(
  "mailto:" & Agent_Email__c & "?subject=Property: " & Name,
  "Email Agent"
)
```

**Phone Formatting:**
```
"(" & LEFT(Phone__c, 3) & ") " &
MID(Phone__c, 4, 3) & "-" &
RIGHT(Phone__c, 4)

Result: "(415) 555-1234"
```

## 📅 Date & Time Formulas

### Date Functions

```
TODAY()
Returns: Current date
Example: TODAY() - Created_Date__c
Result: Days since created

NOW()
Returns: Current date and time
Example: NOW() - Last_Modified_Date__c
Result: Hours since modified

DATE(year, month, day)
DATE(2024, 12, 31)
Result: December 31, 2024

YEAR(date)
YEAR(Close_Date__c)
Result: 2024

MONTH(date)
MONTH(Close_Date__c)
Result: 6

DAY(date)
DAY(Close_Date__c)
Result: 15

WEEKDAY(date)
WEEKDAY(Close_Date__c)
Result: 1 (Sunday) to 7 (Saturday)

ADDMONTHS(date, num)
ADDMONTHS(Start_Date__c, 12)
Result: Date plus 12 months
```

### Date Calculations

**Days on Market:**
```
IF(
  ISBLANK(Sold_Date__c),
  TODAY() - Listed_Date__c,
  Sold_Date__c - Listed_Date__c
)

Result: Days between listed and sold (or today if not sold)
```

**Age in Years:**
```
FLOOR((TODAY() - Birth_Date__c) / 365.25)

Result: Person's age in years
```

**Quarter:**
```
CASE(
  MONTH(Close_Date__c),
  1, "Q1", 2, "Q1", 3, "Q1",
  4, "Q2", 5, "Q2", 6, "Q2",
  7, "Q3", 8, "Q3", 9, "Q3",
  "Q4"
)

Result: Q1, Q2, Q3, or Q4
```

**Business Days Between Dates:**
```
// Approximate (excludes weekends)
(Close_Date__c - Open_Date__c) -
(FLOOR((Close_Date__c - Open_Date__c) / 7) * 2)
```

**Contract Expiration:**
```
Start_Date__c + 365

Result: One year from start date
```

**Is Overdue:**
```
Due_Date__c < TODAY()

Result: TRUE if overdue, FALSE otherwise
```

## 🔢 Number & Math Formulas

### Math Operators

```
+ Addition
Price__c + Closing_Costs__c

- Subtraction
Price__c - Discount__c

* Multiplication
Square_Feet__c * Price_Per_SqFt__c

/ Division
Commission__c / Price__c

^ Exponentiation
2 ^ 10
Result: 1024
```

### Math Functions

```
ABS(number)
ABS(Variance__c)
Result: Absolute value

CEILING(number)
CEILING(4.2)
Result: 5

FLOOR(number)
FLOOR(4.8)
Result: 4

ROUND(number, decimals)
ROUND(3.14159, 2)
Result: 3.14

MAX(num1, num2, ...)
MAX(Price__c, Minimum_Price__c)
Result: Larger value

MIN(num1, num2, ...)
MIN(Price__c, Maximum_Price__c)
Result: Smaller value

MOD(number, divisor)
MOD(10, 3)
Result: 1 (remainder)

SQRT(number)
SQRT(16)
Result: 4

EXP(number)
EXP(1)
Result: 2.71828

LN(number)
LN(2.71828)
Result: 1

LOG(number)
LOG(100)
Result: 2
```

### Practical Number Examples

**Commission Calculation:**
```
IF(
  Price__c > 1000000,
  Price__c * 0.04,
  Price__c * 0.03
)

Result: 4% commission if over $1M, else 3%
```

**Price per Square Foot:**
```
ROUND(Price__c / Square_Feet__c, 2)

Result: Price divided by square footage, rounded to 2 decimals
```

**Total Property Value:**
```
Price__c + (Price__c * Tax_Rate__c)

Result: Price plus taxes
```

**Discount Percentage:**
```
IF(
  Original_Price__c > 0,
  ((Original_Price__c - Price__c) / Original_Price__c) * 100,
  0
)

Result: Percentage discount
```

## 🎯 Logical Formulas

### Logical Functions

```
IF(logical_test, value_if_true, value_if_false)
IF(Price__c > 1000000, "Luxury", "Standard")

AND(logical1, logical2, ...)
AND(Price__c > 500000, Square_Feet__c > 2000)

OR(logical1, logical2, ...)
OR(Status__c = "Active", Status__c = "Pending")

NOT(logical)
NOT(ISBLANK(Description__c))

ISBLANK(field)
ISBLANK(Sold_Date__c)

ISNULL(field)
ISNULL(Commission__c)

ISBLANK vs ISNULL:
- ISBLANK: Checks for blank text or NULL
- ISNULL: Checks only for NULL (use ISBLANK instead)

ISNUMBER(text)
ISNUMBER(ZIP_Code__c)

BLANKVALUE(field, substitute_value)
BLANKVALUE(Phone__c, "No Phone")
```

### CASE Function

```
CASE(expression,
  value1, result1,
  value2, result2,
  else_result
)

Property Status:
CASE(
  Status__c,
  "Available", "🟢 Available",
  "Pending", "🟡 Pending",
  "Sold", "🔴 Sold",
  "Unknown"
)

Priority Level:
CASE(
  Priority__c,
  1, "Critical",
  2, "High",
  3, "Medium",
  4, "Low",
  "Not Set"
)
```

### Nested IF Statements

**Property Tier:**
```
IF(
  Price__c > 5000000,
  "Ultra-Luxury",
  IF(
    Price__c > 1000000,
    "Luxury",
    IF(
      Price__c > 500000,
      "Mid-Range",
      "Budget"
    )
  )
)
```

**Lead Score:**
```
IF(
  AND(
    Annual_Revenue__c > 1000000,
    Employees__c > 100,
    Industry__c = "Technology"
  ),
  "Hot",
  IF(
    OR(
      Annual_Revenue__c > 500000,
      Employees__c > 50
    ),
    "Warm",
    "Cold"
  )
)
```

## 🔗 Cross-Object Formulas

Access fields from related records.

### Parent Object Formulas

```
Property → Account (Lookup)

Account Industry:
Account__r.Industry

Account Annual Revenue:
Account__r.AnnualRevenue

Account Owner Name:
Account__r.Owner.Name

Account Type:
IF(
  ISPICKVAL(Account__r.Type, "Customer"),
  "Existing Customer",
  "Prospect"
)
```

### Multiple Relationship Hops

```
Property → Account → Parent Account

Parent Account Name:
Account__r.Parent.Name

Property → Contact → Account

Contact's Account Name:
Agent__r.Account.Name

Max 10 relationship hops allowed
```

### Practical Cross-Object Examples

**Full Property Info:**
```
Name & " - " &
Account__r.Name & " - " &
"Owner: " & Owner.Name
```

**Agent Commission Email:**
```
HYPERLINK(
  "mailto:" & Agent__r.Email &
  "?subject=Commission Payment - " & Name,
  Agent__r.Name
)
```

**Days Since Account Created:**
```
TODAY() - Account__r.CreatedDate
```

## 📊 Roll-Up Summary Fields

Aggregate data from child records to parent.

### Roll-Up Summary Basics

```
Requirements:
- Master-Detail relationship only
- Created on parent (master) object
- Aggregates child (detail) records

Available on Parent:
✅ Master-Detail relationship
❌ Lookup relationship (use Apex or Flow instead)

Aggregate Functions:
├── COUNT
├── SUM
├── MIN
└── MAX
```

### Creating Roll-Up Summary

```
Object Manager → Property__c → Fields & Relationships → New

Step 1: Data Type
Select: Roll-Up Summary

Step 2: Field Details
Field Label: Total Showing Count
Field Name: Total_Showing_Count
Description: Count of all showings

Step 3: Summarized Object
Summarized Object: Showing__c

Step 4: Aggregate Function
COUNT

Step 5: Filter Criteria (Optional)
All records
OR
Only records where:
  Status__c equals "Completed"
```

### Roll-Up Summary Types

**COUNT:**
```
Field: Total Showings
Summarized Object: Showing__c
Function: COUNT
Filter: None

Result: 15 (total showing count)
```

**SUM:**
```
Field: Total Offer Amount
Summarized Object: Offer__c
Function: SUM
Field to Aggregate: Amount__c
Filter: Status__c equals "Submitted"

Result: $2,450,000 (sum of all submitted offers)
```

**MIN:**
```
Field: Earliest Showing Date
Summarized Object: Showing__c
Function: MIN
Field to Aggregate: Showing_Date__c
Filter: None

Result: 2024-01-15 (earliest showing date)
```

**MAX:**
```
Field: Highest Offer
Summarized Object: Offer__c
Function: MAX
Field to Aggregate: Amount__c
Filter: Status__c not equals "Rejected"

Result: $875,000 (highest non-rejected offer)
```

### Roll-Up Summary with Filters

**Completed Showings Only:**
```
Field: Completed Showings
Summarized Object: Showing__c
Function: COUNT
Filter Criteria: Status__c equals "Completed"
```

**Recent Offers:**
```
Field: Offers Last 30 Days
Summarized Object: Offer__c
Function: COUNT
Filter Criteria: Created Date greater than LAST_N_DAYS:30
```

**High-Value Offers:**
```
Field: High Value Offer Count
Summarized Object: Offer__c
Function: COUNT
Filter Criteria: Amount__c greater than 800000
```

## 🏆 Real-World Examples

### Example 1: Property Management Dashboard

**Formula: Property Status Badge**
```
Field: Status_Badge__c
Type: Formula (Text)

Formula:
CASE(
  Status__c,
  "Available", "🟢 " & Status__c,
  "Pending", "🟡 " & Status__c,
  "Sold", "🔴 " & Status__c,
  "Off Market", "⚫ " & Status__c,
  Status__c
)

Result: "🟢 Available"
```

**Formula: Days Since Price Change**
```
Field: Days_Since_Price_Change__c
Type: Formula (Number)

Formula:
IF(
  ISBLANK(Price_Change_Date__c),
  TODAY() - Listed_Date__c,
  TODAY() - Price_Change_Date__c
)

Result: 45
```

**Roll-Up Summary: Showing Conversion Rate**
```
First create roll-ups:
1. Total_Showings__c (COUNT of Showings)
2. Completed_Showings__c (COUNT where Status = "Completed")

Then formula field:
Field: Showing_Completion_Rate__c
Type: Formula (Percent)

Formula:
IF(
  Total_Showings__c > 0,
  Completed_Showings__c / Total_Showings__c,
  0
)

Result: 0.75 (75% completion rate)
```

### Example 2: Opportunity Management

**Formula: Opportunity Score**
```
Field: Opportunity_Score__c
Type: Formula (Number)

Formula:
(Amount__c / 100000) * 0.3 +
Probability * 0.5 +
IF(ISPICKVAL(LeadSource, "Referral"), 20, 0) +
IF(ISPICKVAL(Type, "Existing Customer"), 15, 0) +
IF(CloseDate <= TODAY() + 30, 10, 0)

Result: 45.5 (scoring based on multiple factors)
```

**Roll-Up Summary: Account Total Pipeline**
```
On Account object:

Field: Total_Pipeline__c
Type: Roll-Up Summary (Currency)
Summarized Object: Opportunity
Function: SUM
Field to Aggregate: Amount
Filter: Stage not equals "Closed Lost", not equals "Closed Won"

Result: $2,500,000 (total open pipeline)
```

**Formula: Weighted Revenue**
```
Field: Weighted_Revenue__c
Type: Formula (Currency)

Formula:
Amount * (Probability / 100)

Result: $425,000 (if Amount = $500,000 and Probability = 85%)
```

### Example 3: Service Case Management

**Roll-Up Summary: Open Cases**
```
On Account object:

Field: Open_Cases__c
Type: Roll-Up Summary (Number)
Summarized Object: Case
Function: COUNT
Filter: Status not equals "Closed"

Result: 12
```

**Formula: SLA Breach**
```
Field: SLA_Breached__c
Type: Formula (Checkbox)

Formula:
AND(
  NOT(ISPICKVAL(Status, "Closed")),
  CreatedDate + CASE(
    Priority,
    "Critical", 0.125,  // 3 hours
    "High", 0.5,        // 12 hours
    "Medium", 1,        // 24 hours
    2                   // 48 hours
  ) < NOW()
)

Result: TRUE if SLA breached
```

**Formula: Response Time**
```
Field: Response_Time_Hours__c
Type: Formula (Number)

Formula:
IF(
  ISBLANK(First_Response_Date__c),
  (NOW() - CreatedDate) * 24,
  (First_Response_Date__c - CreatedDate) * 24
)

Result: 4.5 (hours until first response)
```

## 💡 Best Practices

### ✅ DO:

1. **Keep Formulas Simple**
   ```
   ✅ GOOD:
   Price__c * 0.06

   ❌ BAD (too complex):
   IF(AND(OR(Price__c > 500000, Square_Feet__c > 2000),
   NOT(ISBLANK(Description__c))),
   Price__c * IF(MONTH(TODAY()) > 6, 0.07, 0.06),
   Price__c * 0.05)

   Solution: Break into multiple formula fields
   ```

2. **Use BLANKVALUE for Defaults**
   ```
   ✅ GOOD:
   BLANKVALUE(Phone__c, "No Phone Provided")

   ❌ BAD:
   IF(ISBLANK(Phone__c), "No Phone Provided", Phone__c)
   ```

3. **Document Complex Formulas**
   ```
   Add Description field:
   "Calculates days on market. If sold, uses sold date;
   otherwise uses today's date. Formula:
   IF(ISBLANK(Sold_Date__c), TODAY() - Listed_Date__c,
   Sold_Date__c - Listed_Date__c)"
   ```

4. **Test with Edge Cases**
   ```
   Test with:
   - NULL values
   - Zero values
   - Very large numbers
   - Very old/future dates
   - Empty text fields
   ```

5. **Use Roll-Up Summaries Instead of Apex**
   ```
   ✅ Use roll-up summary when possible (no code needed)
   ❌ Don't write Apex if roll-up summary works
   ```

### ❌ DON'T:

1. **Don't Create Circular References**
   ```
   ❌ BAD:
   Field A references Field B
   Field B references Field A

   Error: "Formula contains circular references"
   ```

2. **Don't Exceed Formula Size Limit**
   ```
   Limits:
   - 3,900 characters (text formulas)
   - 1,300 characters (other return types)
   - Max 10 unique relationship references

   ❌ Formula too long? Break into multiple fields
   ```

3. **Don't Use Formulas for Frequently Changing Data**
   ```
   ❌ BAD: Formula field that queries external API
   ✅ GOOD: Use triggers or scheduled batch for external data
   ```

4. **Don't Forget Governor Limits**
   ```
   Roll-up summaries recalculate on:
   - Parent insert/update
   - Child insert/update/delete

   Be careful with:
   - Large number of child records
   - Bulk operations
   - Triggers on same object
   ```

## 🚀 Advanced Patterns

### Conditional Roll-Up Summary Alternative

Since roll-up summaries require Master-Detail, use formulas for Lookup relationships:

**Pattern: Count Related Records (Lookup)**
```
Can't do: Roll-up summary on Lookup

Alternative 1: Create formula field on child
Child: Is_Active__c (Formula Checkbox) = Status__c = "Active"

Then use roll-up summary to COUNT Is_Active__c = TRUE

Alternative 2: Use Flow or Apex to maintain count field
```

### Formula Field Performance

```
Best Performance:
✅ Simple calculations
✅ TEXT() function
✅ Date math

Medium Performance:
⚠️ Cross-object formulas (1-2 hops)
⚠️ Complex IF statements

Lower Performance:
❌ Many relationship hops (5+)
❌ Very complex nested formulas
❌ REGEX functions
```

## 📚 Quick Reference

### Common Formula Patterns

```
Full Name:
FirstName & " " & LastName

Age:
FLOOR((TODAY() - Birthdate) / 365.25)

Days Old:
TODAY() - CreatedDate

Price with Currency:
"$" & TEXT(ROUND(Price__c, 0))

Percentage:
TEXT(ROUND((Part / Whole) * 100, 0)) & "%"

Default Value:
BLANKVALUE(Field__c, "Default")

Checkbox Logic:
Price__c > 1000000

Link:
HYPERLINK("/lightning/r/Account/" & AccountId & "/view", "View Account")
```

## 🚀 Next Steps

**[→ Objects & Fields](/docs/salesforce/data-model/objects-and-fields)** - Data model basics

**[→ Relationships](/docs/salesforce/data-model/relationships-lookups)** - Master-Detail and Lookup

**[→ Validation Rules](/docs/salesforce/declarative/validation-rules)** - Data quality

---

**You now master formula fields and roll-up summaries!** Calculate and aggregate like a pro. 📐
