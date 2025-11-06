---
sidebar_position: 5
title: Record Types & Page Layouts
description: Master record types and page layouts - customize UI per process, control picklist values, and create role-based experiences
---

# Record Types & Page Layouts: Customize the UI

Master record types and page layouts to create tailored user experiences. Control picklist values, field visibility, and layouts per business process.

## 🎯 What You'll Master

- Record types basics
- Creating record types
- Page layout assignment
- Picklist value control
- Default record types
- Record type assignment
- Page layout customization
- Field placement
- Related lists
- Buttons and links
- Mobile layouts
- Best practices

## 📋 Record Types Overview

```
Record Types:

What They Are:
- Different business processes for same object
- Control picklist values per process
- Assign different page layouts
- Create unique user experiences

Example Use Cases:
├── Opportunity: New Business vs Renewal
├── Case: Customer Support vs Internal IT
├── Lead: Retail vs Enterprise
├── Property: Residential vs Commercial
└── Account: Customer vs Partner
```

## 🔧 Creating Record Types

### Step-by-Step: Record Type

```
Object Manager → Property__c → Record Types → New

Step 1: Basic Information
Record Type Label: Residential Property
Record Type Name: Residential_Property
Description: For residential real estate properties
Active: ✓ Checked

Step 2: Enable for Profiles
Select which profiles can use this record type:
☑ System Administrator
☑ Sales Manager
☑ Sales Representative

Step 3: Assign Page Layouts
Profile: Sales Representative
Page Layout: Residential Property Layout

Profile: Sales Manager
Page Layout: Residential Property - Manager Layout

Step 4: Picklist Value Selection
Choose which picklist values are available:

Property Type:
☑ Single Family
☑ Condo
☑ Townhouse
☐ Office Building (not for residential)
☐ Retail Space (not for residential)

Save
```

### Record Type Components

```
Record Type Controls:

1. Picklist Values
   - Show only relevant values per type
   - Example: Residential vs Commercial property types

2. Page Layout
   - Different layouts per type
   - Show/hide sections and fields

3. Business Process (for Case, Lead, Opportunity, Solution)
   - Control picklist values for Stage/Status
   - Example: Sales Process vs Support Process

4. Record Type Selection
   - Let user choose on creation
   - Or auto-assign based on criteria
```

## 🎨 Page Layouts

Control field placement and UI elements.

### Creating Page Layout

```
Object Manager → Property__c → Page Layouts → New

Step 1: Clone Existing
Start from: Property Layout
New Page Layout Name: Residential Property Layout

Step 2: Drag and Drop Fields
Palette (left) → Layout (right)

Sections:
├── Property Information
│   ├── Property Name
│   ├── Address
│   ├── City, State, ZIP
│   └── Property Type
├── Details
│   ├── Bedrooms
│   ├── Bathrooms
│   ├── Square Feet
│   └── Year Built
└── Pricing
    ├── List Price
    ├── Price per Sq Ft
    └── HOA Fees

Step 3: Field Properties
Click wrench icon on field:
- Required
- Read Only
- Hidden (via Field-Level Security)

Step 4: Section Properties
Edit Section:
- 1-Column, 2-Column layout
- Section Collapsible
- Always Expanded

Save
```

### Page Layout Components

```
Elements You Can Add:

Fields:
- Standard fields
- Custom fields
- Formula fields
- Roll-up summaries

Sections:
- Group related fields
- Collapsible or always expanded

Blank Spaces:
- Visual spacing

Related Lists:
- Child records
- Related records
- Activity history

Buttons:
- Standard actions
- Custom buttons
- Quick actions

Mobile Cards (Mobile only):
- Compact layouts
- Highlight key fields
```

## 🔐 Record Type Assignment

### Assign to Profiles

```
Setup → Users → Profiles → [Profile] → Object Settings

Property__c → Edit:

Record Types Available:
☑ Residential Property
☑ Commercial Property
☐ Land (not available)

Default Record Type:
Selected: Residential Property

Save
```

### Default Record Type

```
Per Profile:

Profile: Sales Representative
Default Record Type: Residential Property
- When creating new property, defaults to Residential

Profile: Commercial Specialist
Default Record Type: Commercial Property
- When creating new property, defaults to Commercial
```

### Record Type Selection UI

```
When user creates new record:

Option 1: Show Record Type Selection
User sees dropdown:
- Residential Property
- Commercial Property

Option 2: Skip Selection (use default)
Automatically uses profile's default record type
```

## 🎨 Page Layout Customization

### Section Layouts

**1-Column Section:**
```
┌──────────────────────────┐
│ Property Name            │
├──────────────────────────┤
│ Address                  │
├──────────────────────────┤
│ Description              │
└──────────────────────────┘

Use for: Long text fields, rich text areas
```

**2-Column Section:**
```
┌─────────────┬─────────────┐
│ Bedrooms    │ Bathrooms   │
├─────────────┼─────────────┤
│ Square Feet │ Year Built  │
└─────────────┴─────────────┘

Use for: Most fields
```

### Field Arrangements

```
Blank Space Usage:

┌─────────────┬─────────────┐
│ Price       │ [blank]     │  ← Full row for emphasis
├─────────────┼─────────────┤
│ Bedrooms    │ Bathrooms   │
└─────────────┴─────────────┘

Required Field Indicators:
- Red bar on left
- Cannot save without value

Read-Only Fields:
- Grayed out
- Cannot edit
```

### Related Lists

```
Add Related Lists:

Showings (Showing__c records):
Fields to Display:
- Showing Date
- Status
- Agent
- Feedback
Buttons:
- New
- Edit
- Delete

Offers (Offer__c records):
Fields to Display:
- Offer Amount
- Buyer Name
- Status
- Expiration Date

Activities:
- Tasks
- Events
- Emails

Files:
- Salesforce Files
- Notes & Attachments
```

## 🔘 Buttons and Actions

### Standard Buttons

```
Available Buttons:

Detail Page:
├── Edit
├── Delete
├── Clone
├── Sharing
├── Submit for Approval
└── Print View

List View:
├── New
├── Import
└── Change Owner

Control Visibility:
Page Layout → Buttons → Select which to show
```

### Custom Buttons

```
Create Custom Button:

Object Manager → Property__c → Buttons, Links, Actions → New Button

Button Type:
- Detail Page Button
- List Button

Display Type:
- Display in new window
- Display in existing window (no sidebar)
- Display as link

Content Source:
- URL
- JavaScript
- Visualforce Page

Example URL Button:
/apex/PropertyMap?id={!Property__c.Id}

Save and add to Page Layout
```

### Quick Actions

```
Create Quick Action:

Global Actions (available everywhere):
- Create new record
- Log a call
- Send email

Object-Specific Actions:
- Create related record
- Update fields
- Log a call

Example: Create Showing

Action Type: Create a Record
Object: Showing__c
Label: New Showing
Name: New_Showing

Predefined Field Values:
Property: {!Property__c.Id}
Status: Scheduled

Success Message: "Showing created successfully"

Add to Page Layout → Quick Actions section
```

## 🏆 Real-World Examples

### Example 1: Opportunity - New Business vs Renewal

**New Business Record Type:**
```
Page Layout: New Business Layout

Visible Sections:
✅ Lead Source
✅ Competitive Analysis
✅ Discovery Questions
✅ Decision Makers
❌ Renewal Information (hidden)

Picklist Values (Stage):
✅ Prospecting
✅ Qualification
✅ Proposal
✅ Negotiation
✅ Closed Won
❌ Renewal (not shown)

Buttons:
- Submit for Approval (new business approval)
- Calculate ROI
```

**Renewal Record Type:**
```
Page Layout: Renewal Layout

Visible Sections:
✅ Renewal Information
✅ Current Contract Details
✅ Usage Metrics
✅ Upsell Opportunities
❌ Lead Source (hidden)

Picklist Values (Stage):
✅ Renewal Initiated
✅ Renewal Negotiation
✅ Renewed
✅ Churned
❌ Prospecting (not shown)

Buttons:
- Submit for Renewal Approval
- View Current Contract
```

### Example 2: Case - Support vs Internal IT

**Customer Support Record Type:**
```
Page Layout: Customer Support Layout

Sections:
- Case Information
  - Case Number
  - Subject
  - Priority
  - Status
- Customer Information
  - Account Name
  - Contact Name
  - Contact Email
  - Contact Phone
- Resolution
  - Resolution Notes
  - Knowledge Articles Used

Related Lists:
- Emails
- Case Comments
- Attachments

Quick Actions:
- Email Customer
- Escalate Case
- Close Case
```

**Internal IT Record Type:**
```
Page Layout: Internal IT Layout

Sections:
- Request Information
  - Request Type
  - Priority
  - Assigned To
- Requester Information
  - Employee Name
  - Department
  - Manager
- Equipment/Software
  - Asset Tag
  - Software Name
  - License Required
- Resolution
  - Completion Notes

Related Lists:
- Assets
- Tasks
- Internal Comments

Quick Actions:
- Assign to Queue
- Request Manager Approval
- Mark Complete
```

### Example 3: Property - Residential vs Commercial

**Residential Record Type:**
```
Page Layout: Residential Layout

Property Details:
- Bedrooms (2-column)
- Bathrooms (2-column)
- Square Feet (2-column)
- Year Built (2-column)
- HOA Fees (1-column)
- School District (1-column)

Features:
- Pool (checkbox)
- Garage Spaces (number)
- Basement (checkbox)
- Fireplace (checkbox)

Picklist Values (Property Type):
✅ Single Family
✅ Condo
✅ Townhouse
✅ Multi-Family
❌ Office
❌ Retail
❌ Industrial

Related Lists:
- Showings
- Offers
- Photos
- Inspection Reports
```

**Commercial Record Type:**
```
Page Layout: Commercial Layout

Property Details:
- Total Square Feet (1-column)
- Usable Square Feet (2-column)
- Office Space (2-column)
- Warehouse Space (2-column)
- Year Built (2-column)
- Zoning (1-column)

Commercial Features:
- Loading Docks (number)
- Parking Spaces (number)
- Clear Height (number)
- Power (text - "480V 3-phase")

Picklist Values (Property Type):
✅ Office Building
✅ Retail Space
✅ Industrial
✅ Warehouse
✅ Mixed Use
❌ Single Family
❌ Condo

Related Lists:
- Lease Agreements
- Tenants
- Maintenance Requests
- Property Inspections
- Environmental Reports
```

## 📱 Mobile Layouts

Customize compact layouts for mobile devices.

### Compact Layout

```
Object Manager → Property__c → Compact Layouts → New

Compact Layout Name: Property Mobile Layout

Select up to 10 fields to display:
1. Property Name
2. Price
3. Address
4. Property Type
5. Status

Primary Compact Layout: Yes

Save

Where It Appears:
- Salesforce Mobile App
- List views (highlights panel)
- Lookup dialogs
- Related lists
```

### Mobile Page Layout Optimization

```
Mobile-Friendly Design:

✅ DO:
- Put important fields at top
- Use collapsible sections
- Minimize scrolling
- Use compact layouts
- Limit related lists

❌ DON'T:
- Too many fields
- Wide sections (hard to view)
- Complex custom buttons
- Visualforce pages (may not work)
```

## 💡 Best Practices

### ✅ DO:

1. **Use Record Types Sparingly**
   ```
   ✅ GOOD: 2-4 record types per object
   ❌ BAD: 10+ record types

   Too many = confusion and maintenance nightmare
   ```

2. **Name Clearly**
   ```
   ✅ GOOD:
   - "Residential Property"
   - "Commercial Property"
   - "Customer Support Case"
   - "Internal IT Request"

   ❌ BAD:
   - "Type 1"
   - "Process A"
   - "RecType_New"
   ```

3. **Group Related Fields**
   ```
   ✅ Section: Property Details
   - Price
   - Bedrooms
   - Bathrooms
   - Square Feet

   ✅ Section: Location
   - Street
   - City
   - State
   - ZIP
   ```

4. **Consistent Section Layout**
   ```
   ✅ Use 2-column for most sections
   ✅ Use 1-column for long text fields
   ✅ Keep consistent across layouts
   ```

5. **Test on Mobile**
   ```
   ✅ Test layout on Salesforce Mobile App
   ✅ Verify compact layout
   ✅ Check field visibility
   ✅ Test quick actions
   ```

### ❌ DON'T:

1. **Don't Duplicate Record Types**
   ```
   ❌ BAD:
   - "Residential - Agent"
   - "Residential - Manager"
   - "Residential - Executive"

   ✅ GOOD:
   - One "Residential" record type
   - Use page layout assignment to show different layouts per profile
   ```

2. **Don't Clutter Layouts**
   ```
   ❌ 50 fields on one page
   ✅ Group in sections, use related lists

   ❌ All sections always expanded
   ✅ Make non-critical sections collapsible
   ```

3. **Don't Forget Required Fields**
   ```
   ❌ Required field not on page layout
   Result: Users can't save!

   ✅ All required fields on layout
   ✅ Or make field not required
   ```

4. **Don't Hide Fields Users Need**
   ```
   ❌ Field-Level Security hides field
   ✅ Check FLS for each profile
   ✅ Grant visibility as needed
   ```

5. **Don't Use Record Types as Security**
   ```
   ❌ Record types don't control data access
   ✅ Use sharing rules for record access
   ✅ Use field-level security for field access
   ✅ Use profiles/permission sets for object access
   ```

## 🔧 Advanced Patterns

### Pattern 1: Progressive Disclosure

Show fields based on stage/status using Dynamic Forms (Lightning).

```
Stage: Qualification
Show: Basic fields

Stage: Proposal
Show: Basic + Pricing fields

Stage: Negotiation
Show: Basic + Pricing + Legal fields

Stage: Closed Won
Show: All fields
```

### Pattern 2: Role-Based Layouts

Same record type, different layouts per profile.

```
Record Type: Commercial Property

Sales Rep Profile:
- Basic property information
- Showing-related fields
- Can't see commission

Sales Manager Profile:
- All property information
- Showing and offer details
- Commission fields visible

Executive Profile:
- Summary information only
- Key metrics
- Read-only access
```

### Pattern 3: Conditional Record Type Assignment

Use Flow to auto-assign record type.

```
Flow: Property Record Type Assignment

Trigger: Before Save
Object: Property

Decision:
- If Price > $5M → Commercial Record Type
- If Bedrooms exists → Residential Record Type
- Else → Land Record Type

Update: Record Type Id
```

## 📚 Quick Reference

```
Create Record Type:
Object Manager → [Object] → Record Types → New

Assign Page Layout:
Page Layout Assignment → Assign

Create Page Layout:
Page Layouts → New → Clone existing

Assign to Profile:
Profiles → [Profile] → Object Settings → [Object]

Compact Layout:
Compact Layouts → New → Assign Primary

Field Properties:
Wrench icon on field → Required/Read-Only

Section Properties:
Wrench icon on section → Columns/Collapsible
```

## 🚀 Next Steps

**[→ Security & Permissions](/docs/salesforce/fundamentals/security-permissions)** - Control access

**[→ Validation Rules](/docs/salesforce/declarative/validation-rules)** - Enforce data quality

**[→ Lightning App Builder](/docs/salesforce/fundamentals/lightning-app-builder)** - Build custom pages

---

**You now master record types and page layouts!** Customize UI like a pro. 🎨
