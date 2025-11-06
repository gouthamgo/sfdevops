---
sidebar_position: 6
title: Lightning App Builder
description: Master Lightning App Builder - create custom pages with drag-and-drop, build dashboards, and design mobile experiences
---

# Lightning App Builder: Build Custom Pages

Master Lightning App Builder to create custom pages without code. Learn components, templates, regions, and build powerful user experiences.

## 🎯 What You'll Master

- Lightning App Builder basics
- Page types (App, Home, Record)
- Page templates and regions
- Standard components
- Custom LWC components
- Component visibility rules
- Mobile optimization
- Dynamic pages
- Activation and assignment
- Best practices
- Real-world examples

## 🏗️ Lightning App Builder Overview

```
Lightning App Builder:

What It Is:
- Drag-and-drop page builder
- No code required
- Build custom Lightning pages
- Use standard and custom components

Page Types:
├── App Page (custom tab pages)
├── Home Page (home page customization)
└── Record Page (record detail pages)

Benefits:
✅ Fast development
✅ No code needed
✅ Reusable components
✅ Mobile responsive
✅ Dynamic experiences
```

## 📄 Page Types

### App Page

Custom pages for Lightning apps.

```
Use Cases:
- Custom dashboards
- Reports page
- Analytics page
- Team workspace
- Training center

Creation:
Setup → Lightning App Builder → New → App Page

Access:
Add as tab in Lightning app
Or navigate via URL
```

### Home Page

Customize the Home tab.

```
Use Cases:
- Personalized home page
- Executive dashboard
- Sales rep homepage
- Service agent homepage

Creation:
Setup → Lightning App Builder → New → Home Page

Activation:
Assign to Lightning app
Assign to profiles
Set as default
```

### Record Page

Customize record detail pages.

```
Use Cases:
- Property detail page
- Opportunity page
- Account page
- Case page

Creation:
Object Manager → [Object] → Lightning Record Pages → New
Or: Lightning App Builder → New → Record Page

Activation:
Assign as org default
Assign to app + record type + profile
```

## 🎨 Creating Lightning Page

### Step-by-Step: Record Page

```
Step 1: Select Page Type
Lightning App Builder → New
Choose: Record Page
Next

Step 2: Select Object
Object: Property__c
Label: Property Detail Page
Next

Step 3: Choose Template
Header and Two Columns:
┌────────────────────────┐
│       Header           │
├──────────┬─────────────┤
│  Left    │    Right    │
│  Region  │    Region   │
└──────────┴─────────────┘

Templates Available:
- Header and Two Columns
- Header and Three Columns
- Header and Right Sidebar
- Header and Subheader
- Tabs
- Tabs with Subtabs

Finish

Step 4: Drag Components
Palette (left) → Canvas (center)

Header Region:
- Highlights Panel

Left Region:
- Details
- Activity
- Related Lists

Right Region:
- Chatter
- News
- Path

Step 5: Configure Components
Click component → Properties (right panel)
Set filters, fields, visibility

Step 6: Save
Save
Save As: Property Detail Page

Step 7: Activate
Activation → Assign as Org Default
Or: Assign to specific app, record type, profile
```

## 🧩 Standard Components

### Record Components

```
Highlights Panel:
- Shows key fields (compact layout)
- Record owner
- Following/Follow button

Details:
- Shows all record fields
- Standard/Custom fields
- Sections and columns

Related Lists:
- Child records
- Related records
- Single or All related lists

Path:
- Visual process guidance
- Shows stages/status
- Guidance for success

Activity:
- Tasks
- Events
- Emails
- Calls
```

### Engagement Components

```
Chatter:
- Feed for record
- @mentions
- File sharing
- Polls

Chatter Publisher:
- Post updates
- Share files
- Create polls

Files:
- Salesforce Files
- Upload/Download
- Preview

Notes:
- Add notes to record
- Rich text formatting
```

### Reporting Components

```
Report Chart:
- Display report as chart
- Select report
- Configure chart type

Dashboard:
- Embed dashboard
- Select dashboard
- Show refresh date

Rich Text:
- Add formatted text
- Instructions
- Help text
- Announcements
```

### Custom Components

```
Your LWC Components:
- Appear in component list
- Drag onto page
- Configure properties

Third-Party Components:
- AppExchange components
- Install package
- Use in pages
```

## ⚙️ Component Configuration

### Component Properties

```
Component: Related List

Properties Panel:
├── Related List
│   └── Select: Showings
├── Number of Records
│   └── 10
├── Enable Inline Editing
│   └── ☑ Yes
├── Show Action Bar
│   └── ☑ Yes
└── Visibility
    └── Set component visibility
```

### Component Visibility Rules

Control when components appear.

```
Visibility Options:

1. Always show
2. Show based on record field
3. Show based on user
4. Show based on device

Example: Show Commission Only to Managers

Visibility Rules:
- Rule Type: User
- Field: Profile
- Operator: Equals
- Value: Sales Manager

Logic: Show component if rules are met
```

### Advanced Visibility Rules

```
Multiple Rules:

Rule 1:
- Field: $User.Profile.Name
- Operator: Equals
- Value: Sales Manager

Rule 2:
- Field: Price__c
- Operator: Greater Than
- Value: 1000000

Logic: Show if (Rule 1 AND Rule 2) is true

Result: Only managers see component for properties > $1M
```

## 📱 Templates and Regions

### Template Selection

```
Common Templates:

Header and Two Columns:
┌────────────────────────┐
│       Header           │
├──────────┬─────────────┤
│  Left    │    Right    │
│  60%     │    40%      │
└──────────┴─────────────┘

Header and Three Columns:
┌────────────────────────┐
│       Header           │
├────┬──────────┬────────┤
│Left│  Middle  │ Right  │
│30% │   40%    │  30%   │
└────┴──────────┴────────┘

Tabs:
┌────────────────────────┐
│ [Tab1] [Tab2] [Tab3]   │
├────────────────────────┤
│                        │
│     Tab Content        │
│                        │
└────────────────────────┘

Use tabs for:
- Lots of content
- Grouping by category
- Reducing scrolling
```

### Region Configuration

```
Column Properties:

Width:
- Adjust column widths
- Drag divider
- Or set percentage

Background:
- White (default)
- Gray
- Custom color

Padding:
- None
- Small
- Medium
- Large
```

## 🏆 Real-World Examples

### Example 1: Property Management Dashboard

**App Page: Property Dashboard**

```
Template: Header and Three Columns

Header Region:
┌────────────────────────────────┐
│ Rich Text: "Property Dashboard"│
│ Instructions and key metrics   │
└────────────────────────────────┘

Left Column (30%):
┌────────────────────────┐
│ Report Chart:          │
│ Properties by Status   │
├────────────────────────┤
│ Report Chart:          │
│ Properties by Price    │
└────────────────────────┘

Middle Column (40%):
┌────────────────────────┐
│ Report:                │
│ Recent Property List   │
│ (Tabular format)       │
│                        │
│ - Name                 │
│ - Price                │
│ - Status               │
│ - Agent                │
└────────────────────────┘

Right Column (30%):
┌────────────────────────┐
│ Report Chart:          │
│ Top Agents This Month  │
├────────────────────────┤
│ Rich Text:             │
│ Quick Links            │
│ - New Property         │
│ - Reports              │
│ - Settings             │
└────────────────────────┘

Activation:
- Add as "Dashboard" tab in Sales app
- Assign to Sales profiles
```

### Example 2: Property Record Page

**Record Page: Enhanced Property Detail**

```
Template: Header and Two Columns

Header Region:
┌────────────────────────────────┐
│ Highlights Panel               │
│ - Property Name, Price, Status │
│ - Follow button                │
└────────────────────────────────┘

Left Column (60%):
┌────────────────────────┐
│ Path                   │
│ (Listing → Showing →   │
│  Offer → Closing)      │
├────────────────────────┤
│ Details                │
│ - All property fields  │
│ - Sections:            │
│   * Property Info      │
│   * Location           │
│   * Features           │
│   * Pricing            │
├────────────────────────┤
│ Related List - Single  │
│ Showings (last 10)     │
├────────────────────────┤
│ Related List - Single  │
│ Offers (all)           │
├────────────────────────┤
│ Files                  │
│ Photos & documents     │
└────────────────────────┘

Right Column (40%):
┌────────────────────────┐
│ Chatter                │
│ Activity feed          │
├────────────────────────┤
│ Custom LWC:            │
│ Property Map           │
│ (Shows location)       │
├────────────────────────┤
│ Custom LWC:            │
│ Market Insights        │
│ (Comparable homes)     │
├────────────────────────┤
│ Activity               │
│ Tasks & Events         │
└────────────────────────┘

Component Visibility:

Commission Panel:
- Visibility: User Profile = Sales Manager
- Only managers see commission details

Sensitive Documents:
- Visibility: $User.Profile.Name equals "Executive"
- Only executives see confidential files

Activation:
- Assign to Property object
- Assign to Residential record type
- Assign to Sales profiles
- Set as default for Sales app
```

### Example 3: Sales Rep Home Page

**Home Page: Sales Rep Dashboard**

```
Template: Tabs

Tab 1: My Performance
┌────────────────────────────────┐
│ Dashboard:                     │
│ Sales Performance Dashboard    │
│ - Revenue this month           │
│ - Pipeline                     │
│ - Win rate                     │
├────────────────────────────────┤
│ Report Chart:                  │
│ My Deals by Stage              │
└────────────────────────────────┘

Tab 2: My Work
┌────────────────────────────────┐
│ Activity:                      │
│ Today's Tasks & Events         │
├────────────────────────────────┤
│ Related List:                  │
│ My Open Opportunities          │
│ (Sorted by close date)         │
├────────────────────────────────┤
│ Related List:                  │
│ My Open Properties             │
└────────────────────────────────┘

Tab 3: Team Updates
┌────────────────────────────────┐
│ Chatter:                       │
│ Company feed                   │
├────────────────────────────────┤
│ Rich Text:                     │
│ Team announcements             │
└────────────────────────────────┘

Tab 4: Resources
┌────────────────────────────────┐
│ Rich Text:                     │
│ Quick Links:                   │
│ - Training videos              │
│ - Sales playbook               │
│ - Commission calculator        │
│ - Support                      │
├────────────────────────────────┤
│ Files:                         │
│ Shared team files              │
└────────────────────────────────┘

Activation:
- Assign to Sales app
- Assign to Sales Rep profile
- Set as default home page
```

## 🎯 Page Activation

### Activation Options

```
Setup → Lightning App Builder → [Page] → Activation

1. Org Default
   - Page becomes default for everyone
   - Simplest option

2. App Default
   - Default for specific app
   - Example: Sales app

3. App, Record Type, and Profile
   - Most specific
   - Example:
     * App: Sales
     * Record Type: Residential Property
     * Profile: Sales Representative

4. Form Factor
   - Desktop
   - Phone
   - Tablet
```

### Assignment Priority

```
When multiple pages assigned, priority:

1. Most specific wins:
   App + Record Type + Profile

2. Next specific:
   App + Record Type

3. Then:
   App Default

4. Finally:
   Org Default

Example:
- Org Default: Standard Property Page
- Sales App + Residential + Sales Rep: Custom Residential Page
→ Sales Rep sees Custom Residential Page in Sales app
→ Everyone else sees Standard Property Page
```

## 📱 Mobile Optimization

### Mobile Considerations

```
Mobile Best Practices:

✅ DO:
- Use one-column layouts
- Put important info at top
- Use collapsible sections
- Limit components per page
- Test on actual mobile device

❌ DON'T:
- Use three-column layouts
- Add too many components
- Use tiny fonts
- Rely on hover effects
- Forget to test mobile
```

### Mobile-Specific Pages

```
Create Mobile Page:

1. Create separate page for mobile
2. Use mobile-friendly template
3. Add fewer components
4. Prioritize critical info

Activation:
- Device: Phone
- App: Sales
- Assign to mobile users

Desktop users see desktop page
Mobile users see mobile page
```

## 💡 Best Practices

### ✅ DO:

1. **Start with Standard Templates**
   ```
   ✅ Use proven templates
   ✅ Modify as needed
   ✅ Don't start from scratch
   ```

2. **Group Related Components**
   ```
   ✅ Details + Related Lists together
   ✅ Chatter + Activity together
   ✅ Reports + Charts together
   ```

3. **Use Component Visibility**
   ```
   ✅ Show commission to managers only
   ✅ Show exec dashboard to execs only
   ✅ Hide sensitive data from non-owners
   ```

4. **Test Before Activating**
   ```
   ✅ Preview on desktop
   ✅ Preview on mobile
   ✅ Test as different users
   ✅ Verify visibility rules work
   ```

5. **Name Pages Clearly**
   ```
   ✅ GOOD:
   - "Property - Residential Detail"
   - "Sales Rep Home Page"
   - "Executive Dashboard"

   ❌ BAD:
   - "Page 1"
   - "Test"
   - "New Page"
   ```

### ❌ DON'T:

1. **Don't Overload Pages**
   ```
   ❌ 20 components on one page
   ✅ 5-8 well-chosen components

   ❌ All related lists showing
   ✅ Most important related lists only
   ```

2. **Don't Forget Performance**
   ```
   ❌ Multiple complex dashboards
   ✅ One dashboard per page max

   ❌ Large reports with 1000s of rows
   ✅ Reports with filters (< 500 rows)
   ```

3. **Don't Ignore Mobile**
   ```
   ❌ Desktop-only design
   ✅ Test on mobile

   ❌ Three-column layout
   ✅ One or two columns for mobile
   ```

4. **Don't Break Standard Functionality**
   ```
   ❌ Remove Details component
   Result: Users can't edit!

   ✅ Keep Details component
   ✅ Add custom components around it
   ```

5. **Don't Forget Training**
   ```
   ❌ Launch without telling users
   ✅ Train users on new layout
   ✅ Provide documentation
   ✅ Gather feedback
   ```

## 🔧 Advanced Patterns

### Pattern 1: Dynamic Pages

Show different components based on record state.

```
Property Record Page:

Status = "Available":
- Show: Showing scheduler
- Show: Marketing materials
- Hide: Closing checklist

Status = "Pending":
- Show: Offer management
- Show: Inspection tracker
- Hide: Showing scheduler

Status = "Sold":
- Show: Closing checklist
- Show: Commission calculator
- Hide: Showing scheduler

Implementation:
Use component visibility rules on Status__c field
```

### Pattern 2: Role-Based Pages

Different pages for different roles.

```
Property Record Page:

Sales Rep Page:
- Focus on showings, offers
- Can't see commission
- Limited analytics

Manager Page:
- All info including commission
- Team performance metrics
- Approval buttons

Executive Page:
- High-level metrics only
- No detailed fields
- Quick summary view

Activation:
Assign different pages to different profiles
```

### Pattern 3: Dashboard Tabs

Organize dashboards with tabs.

```
App Page: Executive Dashboard

Tab 1: Sales
- Revenue dashboard
- Pipeline metrics

Tab 2: Service
- Case volume
- Customer satisfaction

Tab 3: Marketing
- Campaign performance
- Lead generation

Tab 4: Operations
- Efficiency metrics
- Resource utilization

Benefits:
- Organized by department
- Easy navigation
- All info in one place
```

## 📚 Quick Reference

```
Create Page:
Lightning App Builder → New → [Page Type]

Edit Existing Page:
Object Manager → [Object] → Lightning Record Pages → [Page] → Edit

Activate Page:
Lightning App Builder → [Page] → Activation

Clone Page:
Lightning App Builder → [Page] → Save As

Delete Page:
Lightning App Builder → [Page] → Delete

Component Visibility:
Click component → Set Component Visibility

Preview:
Lightning App Builder → Preview (Desktop/Phone/Tablet)

Mobile Optimization:
Use mobile templates, test on phone
```

## 🚀 Next Steps

**[→ Lightning Web Components](/docs/salesforce/lwc/introduction)** - Build custom components

**[→ Record Types](/docs/salesforce/fundamentals/record-types-page-layouts)** - Assign pages to record types

**[→ Reports & Dashboards](/docs/salesforce/fundamentals/reports-dashboards)** - Add reports to pages

---

**You now master Lightning App Builder!** Build stunning pages without code. 🏗️
