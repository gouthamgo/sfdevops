---
sidebar_position: 3
title: Reports & Dashboards
description: Master Salesforce reporting - custom reports, dashboards, filters, formulas, and data visualization for insights
---

# Reports & Dashboards: Visualize Your Data

Master Salesforce reporting and dashboards to transform raw data into actionable insights. Learn report types, formats, filters, formulas, and dashboard design.

## 🎯 What You'll Master

- Report types (Standard vs Custom)
- Report formats (Tabular, Summary, Matrix, Joined)
- Creating and customizing reports
- Filters, cross-filters, and bucketing
- Report formulas and charts
- Dashboard components and filters
- Dynamic dashboards
- Scheduling and subscriptions
- Best practices
- Real-world scenarios

## 📊 Reports Overview

```
Salesforce Reports:

Report Types (Data Source)
├── Standard Report Types (Built-in)
│   └── Accounts, Contacts, Opportunities, Cases
└── Custom Report Types (You create)
    └── Property with Showings and Offers

Report Formats (Layout)
├── Tabular (Simple list)
├── Summary (Grouped with subtotals)
├── Matrix (Grouped by rows AND columns)
└── Joined (Multiple report blocks)
```

## 🔧 Report Formats

### Tabular Reports

Simple list of records with columns.

```
When to Use:
✅ Simple lists
✅ Export to Excel
✅ Quick data view

Limitations:
❌ No grouping
❌ No charts
❌ No subtotals

Example Use Case:
- All properties in California
- Contact mailing list
- Account export
```

**Example: Property List**
```
Property Name       | Status    | Price      | Agent
─────────────────────────────────────────────────────
Sunset Villa        | Available | $850,000   | John Smith
Ocean View Condo    | Sold      | $650,000   | Jane Doe
Downtown Loft       | Pending   | $550,000   | John Smith
```

### Summary Reports

Grouped records with subtotals.

```
When to Use:
✅ Group by category
✅ Subtotals needed
✅ Charts wanted
✅ Drill-down analysis

Example Use Case:
- Properties grouped by status
- Sales by agent
- Cases by priority
```

**Example: Properties by Status**
```
Status: Available (2 properties, $1,400,000 total)
  Property Name       | Price      | Agent
  ─────────────────────────────────────────
  Sunset Villa        | $850,000   | John Smith
  Beach House         | $550,000   | Jane Doe

Status: Sold (1 property, $650,000 total)
  Property Name       | Price      | Agent
  ─────────────────────────────────────────
  Ocean View Condo    | $650,000   | Jane Doe

Grand Total: 3 properties, $2,050,000
```

### Matrix Reports

Grouped by rows AND columns with totals.

```
When to Use:
✅ Compare across two dimensions
✅ Cross-tabulation
✅ Complex analysis

Example Use Case:
- Properties by Status (rows) and Agent (columns)
- Opportunities by Stage and Month
- Cases by Priority and Owner
```

**Example: Properties Matrix**
```
                    John Smith    Jane Doe      Total
──────────────────────────────────────────────────────
Available           $850,000      $550,000      $1,400,000
Sold                -             $650,000      $650,000
Pending             $550,000      -             $550,000
──────────────────────────────────────────────────────
Total               $1,400,000    $1,200,000    $2,600,000
```

### Joined Reports

Multiple report blocks in one report.

```
When to Use:
✅ Compare different data sets side-by-side
✅ Different groupings
✅ Executive dashboards

Example Use Case:
- Properties by Status + Showings by Month
- Open Opportunities + Closed Opportunities
- This Quarter vs Last Quarter
```

## 📝 Creating Reports

### Step-by-Step: Custom Report

```
1. Reports Tab → New Report

2. Select Report Type:
   - Standard: Accounts, Opportunities, etc.
   - Custom: Your custom report types

3. Choose Format:
   - Tabular (list)
   - Summary (grouped)
   - Matrix (rows + columns)

4. Add Columns (Fields):
   - Drag fields from left panel
   - Property Name, Status, Price, Agent

5. Add Filters:
   - Show Me: All Properties
   - Created Date: Current FY
   - Status: equals Available, Pending

6. Add Grouping (Summary/Matrix):
   - Group by: Status
   - Summarize: SUM of Price

7. Save Report:
   - Name: Properties by Status
   - Folder: Sales Reports
   - Save & Run
```

### Custom Report Type

Create custom report types for specific data needs.

```
Setup → Report Types → New Custom Report Type

Primary Object: Property__c
Report Type Label: Properties with Showings
Category: Properties

Object Relationships:
├── Property__c (Primary)
│   └── Showing__c (Related via Property lookup)
│       └── Contact__c (Related via Contact lookup)

Field Layout:
Select which fields appear in report builder
✓ Property: Name, Status, Price, Address
✓ Showing: Date, Status, Feedback
✓ Contact: Name, Email, Phone
```

**Example Custom Report Type Structure:**
```
Properties with Showings and Offers

Property__c (A)
├── Each Property may or may not have related Showings (B)
│   └── Showing__c
└── Each Property may or may not have related Offers (C)
    └── Offer__c

Use Case:
- View all properties with their showings
- See which properties have no showings
- Analyze showing-to-offer conversion
```

## 🔍 Filters and Criteria

### Standard Filters

```
Show Me:
├── All Properties
├── My Properties (records I own)
├── My Team's Properties (role hierarchy)
└── Recently Viewed Properties

Date Filters:
├── Created Date
├── Last Modified Date
├── Custom Date Fields

Range:
├── Current FY, Last Quarter, This Month
├── Custom: 1/1/2024 to 12/31/2024
└── Relative: Last 90 Days, Next 30 Days
```

### Field Filters

```
Field           Operator            Value
─────────────────────────────────────────────
Status          equals              Available
Price           greater than        500000
State           equals              CA, NY, TX
Agent           not equal to        (blank)
Bedrooms        greater or equal    3
Last Modified   equals              THIS_WEEK
```

### Cross Filters

Show records WITH or WITHOUT related records.

```
Show Properties WITH Showings:
Properties with (Showings greater than 0)

Show Properties WITHOUT Offers:
Properties without Offers

Complex Example:
Properties with (Showings greater than 5)
  AND without Offers

Use Case: High-interest properties with no offers yet
```

### Bucketing

Group numeric or picklist values into categories.

```
Bucket Field: Price Range

Bucket Values:
├── Budget: < 500,000
├── Mid-Range: 500,000 - 1,000,000
├── Luxury: 1,000,000 - 5,000,000
└── Ultra-Luxury: > 5,000,000

Use in Report:
Group by Price Range → See distribution
```

**Example Report with Buckets:**
```
Price Range        Count    Total Price      Avg Price
────────────────────────────────────────────────────────
Budget             45       $18,500,000      $411,111
Mid-Range          30       $22,500,000      $750,000
Luxury             12       $28,000,000      $2,333,333
Ultra-Luxury       3        $18,000,000      $6,000,000
```

## 📐 Report Formulas

### Row-Level Formulas

Calculate values for each record.

```
Formula Name: Days on Market
Formula: TODAY() - Property__c.Listed_Date__c
Format: Number
Decimal Places: 0

Formula Name: Commission Amount
Formula: Property__c.Price__c * 0.03
Format: Currency
Decimal Places: 2

Formula Name: Price per Sq Ft
Formula: Property__c.Price__c / Property__c.Square_Feet__c
Format: Currency
Decimal Places: 2
```

### Summary Formulas

Calculate values across groups.

```
Formula Name: Average Days on Market
Formula: RowCount:SUM / UniqueCount(Property__c)
Format: Number

Formula Name: Conversion Rate
Formula: Sold__c:SUM / Total__c:SUM
Format: Percent

Formula Name: Commission Total
Formula: Price__c:SUM * 0.03
Format: Currency
```

### Formula Functions

```
Math:
- ADD, SUBTRACT, MULTIPLY, DIVIDE
- ABS, ROUND, CEILING, FLOOR
- MAX, MIN

Text:
- CONTAINS, TEXT, VALUE
- LEFT, RIGHT, MID, LEN
- UPPER, LOWER

Date:
- TODAY, NOW
- YEAR, MONTH, DAY
- ADDMONTHS, DATE

Logical:
- IF, AND, OR, NOT
- CASE, ISBLANK, ISNULL
```

**Example Complex Formula:**
```
Formula Name: Property Tier
Formula:
IF(Property__c.Price__c > 5000000, "Ultra-Luxury",
  IF(Property__c.Price__c > 1000000, "Luxury",
    IF(Property__c.Price__c > 500000, "Mid-Range", "Budget")
  )
)
```

## 📊 Charts

Visualize report data with charts.

```
Chart Types:
├── Vertical Bar
├── Horizontal Bar
├── Line Chart
├── Donut Chart
├── Funnel Chart
└── Scatter Chart

Chart Components:
├── X-Axis: Grouping field
├── Y-Axis: Measure (SUM, COUNT, AVG)
└── Legend: Secondary grouping
```

**Example: Properties by Status**
```
Chart Type: Vertical Bar
X-Axis: Status
Y-Axis: Sum of Price
Plot Additional Values: Record Count

Results:
Available: 10 properties, $8.5M
Pending: 5 properties, $3.2M
Sold: 15 properties, $12M
```

**Example: Sales Funnel**
```
Chart Type: Funnel
Grouping: Opportunity Stage
Values: Sum of Amount

Prospecting:    $5M   (100%)
Qualification:  $3M   (60%)
Proposal:       $2M   (40%)
Negotiation:    $1M   (20%)
Closed Won:     $750K (15%)
```

## 📈 Dashboards

### Dashboard Components

```
Component Types:
├── Chart (from report)
├── Gauge (single metric)
├── Metric (number display)
├── Table (report rows)
└── Visualforce Page (custom)

Each Component:
├── Based on a report
├── Customizable title
├── Drilldown to report
└── Refreshable
```

### Creating Dashboard

```
Step-by-Step:

1. Dashboards Tab → New Dashboard

2. Add Components:
   - Click + Component
   - Select Report
   - Choose Component Type (Chart, Table, Metric)
   - Customize Title and Settings

3. Arrange Layout:
   - Drag components to resize
   - 3 columns available
   - Narrow, Medium, Wide

4. Add Dashboard Filters:
   - Filter all components at once
   - Date Range, Owner, Status

5. Set Running User:
   - Run as Me (my data only)
   - Run as Specified User (their view)
   - Dynamic (viewer's data)

6. Save & Schedule Refresh:
   - Auto-refresh daily
   - Subscribe for email delivery
```

### Dashboard Example

```
Sales Performance Dashboard

┌────────────────────────┬────────────────────────┐
│ Total Sales: $2.5M     │ Open Pipeline: $5M     │
│ (vs $2M last quarter)  │ (150 opportunities)    │
├────────────────────────┴────────────────────────┤
│ Sales by Stage (Funnel Chart)                   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                   │
├─────────────────────────┬───────────────────────┤
│ Sales by Rep (Bar)      │ Win Rate by Product   │
│ John: $800K             │ Product A: 45%        │
│ Jane: $900K             │ Product B: 38%        │
│ Mike: $800K             │ Product C: 52%        │
└─────────────────────────┴───────────────────────┘
```

### Dashboard Filters

Allow users to filter dashboard dynamically.

```
Add Dashboard Filter:

1. Edit Dashboard → Add Filter

2. Configure Filter:
   - Field: Date (Opportunity Close Date)
   - Name: "Select Quarter"
   - Options: This Quarter, Last Quarter, This Year

3. Apply to Components:
   - Select which components use this filter
   - Map to report filter field

Result: Users can change quarter to see different data
```

### Dynamic Dashboards

Show viewer-specific data.

```
Static Dashboard (Run as Specified User):
- Everyone sees same data
- Run as "Sales VP" to show all sales data

Dynamic Dashboard (Run as Logged-in User):
- Each viewer sees their own data
- Sales reps see their deals
- Managers see team deals (role hierarchy)

Setup:
Dashboard Properties → View Dashboard As: The dashboard viewer
```

## ⏰ Scheduling & Subscriptions

### Schedule Reports

```
Report → Subscribe

Options:
├── Frequency: Daily, Weekly, Monthly
├── Time: 8 AM PST
├── Conditions: Run only when row count > 0
├── Format: Excel, CSV
└── Recipients: Me, my team, specific users

Example:
Report: High-Value Opportunities Closing This Week
Schedule: Every Monday at 8 AM
Condition: Opportunity Amount > $100K
```

### Dashboard Subscriptions

```
Dashboard → Subscribe

Options:
├── Frequency: Daily, Weekly, Monthly
├── Time and Day
├── Include Image: Dashboard snapshot in email
└── Recipients

Example:
Dashboard: Weekly Sales Summary
Schedule: Every Monday at 9 AM
Recipients: Sales Team + VP Sales
```

### Refresh Dashboards

```
Manual Refresh:
- Click Refresh button
- Shows "As of [time]"

Auto-Refresh (Enterprise+):
- Set refresh schedule
- Daily at specific time
- Or hourly during business hours

Dashboard Properties → Set Refresh Schedule
```

## 🏆 Real-World Scenarios

### Scenario 1: Property Performance Dashboard

**Requirements:**
- Track all properties by status
- Show top-performing agents
- Identify properties with no showings
- Monitor price trends

**Implementation:**

**Report 1: Properties by Status**
```
Type: Summary Report
Group By: Status
Columns: Property Name, Price, Days on Market, Showings Count
Chart: Donut - Count by Status
Filter: Created Date = Current FY
```

**Report 2: Top Agents**
```
Type: Summary Report
Group By: Agent Name
Columns: Properties Sold, Total Sales, Average Price
Sort: Total Sales (descending)
Formula: Commission = Total Sales * 0.03
```

**Report 3: Properties with No Showings**
```
Type: Tabular Report
Cross Filter: Properties without Showings
Columns: Property Name, Status, Price, Listed Date, Days on Market
Sort: Days on Market (descending)
```

**Dashboard Layout:**
```
┌──────────────────────┬──────────────────────┐
│ Active Properties: 45│ Avg Price: $750K     │
├──────────────────────┴──────────────────────┤
│ Properties by Status (Donut)                │
├──────────────────────┬──────────────────────┤
│ Top Agents (Table)   │ No Showings (Table)  │
│ 1. Jane: $2.5M       │ Sunset Villa: 45 days│
│ 2. John: $2.1M       │ Beach House: 30 days │
└──────────────────────┴──────────────────────┘
```

### Scenario 2: Sales Funnel Analysis

**Requirements:**
- Track opportunity progression
- Identify bottlenecks in sales process
- Forecast revenue
- Monitor win rates

**Custom Report Type:**
```
Opportunities with Products

Opportunity (Primary)
└── Opportunity Product (Related)
    └── Product (Lookup)
```

**Report: Opportunity Funnel**
```
Type: Summary Report
Group By: Stage
Columns: Opportunity Name, Amount, Close Date, Probability
Summary: COUNT, SUM Amount, AVG Amount
Chart: Funnel
Formula: Weighted Revenue = Amount * Probability / 100
```

**Report: Win Rate by Source**
```
Type: Matrix Report
Row Grouping: Lead Source
Column Grouping: Stage (Closed Won, Closed Lost, Open)
Values: COUNT of Opportunities
Formula: Win Rate = Closed Won / (Closed Won + Closed Lost)
```

### Scenario 3: Executive KPI Dashboard

**Requirements:**
- High-level metrics
- Month-over-month trends
- Team performance
- Action items

**Reports:**

1. **YTD Revenue vs Target**
```
Type: Summary Report
Group By: Month (Close Date)
Formula: Target = $500,000 per month
Formula: Variance = Actual - Target
Chart: Line chart (Actual vs Target)
```

2. **Pipeline Coverage**
```
Type: Summary Report
Group By: Owner
Formula: Coverage Ratio = Pipeline / Quota
Highlight: RED if < 3x, YELLOW if 3-5x, GREEN if > 5x
```

3. **At-Risk Opportunities**
```
Type: Tabular Report
Filters:
- Stage: not Closed Won, not Closed Lost
- Close Date: Last 30 Days
- Last Activity: older than 14 days

Alert subscription when count > 0
```

**Dashboard with Filters:**
```
Filters:
- Date Range (This Quarter, Last Quarter, This Year)
- Region (West, East, Central)
- Product Line

┌──────────────────────┬──────────────────────┐
│ Revenue: $2.5M       │ Pipeline: $15M       │
│ ↑ 25% vs Last Q      │ Coverage: 6x         │
├──────────────────────┴──────────────────────┤
│ Revenue Trend (Line Chart)                  │
│ Target vs Actual by Month                   │
├──────────────────────┬──────────────────────┤
│ Team Performance     │ At-Risk Deals: 12    │
│ (Gauge by rep)       │ (Table)              │
└──────────────────────┴──────────────────────┘
```

## 💡 Best Practices

### ✅ DO:

1. **Use Folders for Organization**
   ```
   Public Reports/
   ├── Sales Reports/
   │   ├── Weekly Pipeline
   │   └── Closed Deals
   ├── Marketing Reports/
   └── Executive Dashboards/

   Personal Reports/
   └── My WIP Reports/
   ```

2. **Name Reports Clearly**
   ```
   ✅ GOOD:
   - "Open Opportunities by Stage"
   - "Properties Sold This Quarter"
   - "Cases by Priority and Status"

   ❌ BAD:
   - "Report 1"
   - "New Report"
   - "Test"
   ```

3. **Use Custom Report Types**
   ```
   ✅ Create custom report types for:
   - Specific object relationships
   - Frequently used report queries
   - Standardized reporting across team
   ```

4. **Optimize Performance**
   ```
   ✅ Use filters to limit data
   ✅ Index on custom fields used in filters
   ✅ Avoid too many columns (< 20)
   ✅ Use scheduled refresh for dashboards
   ```

5. **Document Complex Formulas**
   ```
   Formula Name: Commission with Tiers
   Description: 3% base, +0.5% if > $1M, +1% if > $5M

   Formula:
   IF(Price__c > 5000000, Price__c * 0.045,
     IF(Price__c > 1000000, Price__c * 0.035,
       Price__c * 0.03
     )
   )
   ```

### ❌ DON'T:

1. **Don't Overload Dashboards**
   ```
   ❌ BAD: 20 components on one dashboard
   ✅ GOOD: 6-8 focused components

   Tip: Create multiple themed dashboards
   - Sales Dashboard
   - Service Dashboard
   - Executive Dashboard
   ```

2. **Don't Ignore Report Run Times**
   ```
   ❌ Reports taking > 30 seconds
   ✅ Use filters to reduce data
   ✅ Index custom fields
   ✅ Simplify formulas
   ```

3. **Don't Share Sensitive Data**
   ```
   ❌ Salary reports in public folders
   ✅ Use folder permissions
   ✅ Run dashboards as specific user
   ✅ Respect field-level security
   ```

4. **Don't Forget Mobile Users**
   ```
   ❌ Complex matrix reports on mobile
   ✅ Simple summary reports
   ✅ Dashboards optimized for mobile
   ✅ Key metrics easily visible
   ```

## 📚 Quick Reference

### Report Format Decision

```
Need simple list? → Tabular
Need grouping? → Summary
Need two-dimensional grouping? → Matrix
Need to compare datasets? → Joined
```

### Filter Operators

```
Text:
- equals, not equal to, contains, starts with
- includes, excludes (multi-select)

Numbers:
- equals, not equal to
- greater than, less than
- greater or equal, less or equal

Dates:
- equals, not equal to
- greater than, less than
- Range: equals, not equal to (relative)
```

### Dashboard Component Limits

```
Enterprise Edition: 20 components per dashboard
Unlimited Edition: 20 components per dashboard
Performance Edition: 20 components per dashboard

Recommendation: 6-8 components for best performance
```

## 🚀 Next Steps

**[→ Platform Overview](/docs/salesforce/fundamentals/platform-overview)** - Salesforce basics

**[→ Data Model](/docs/salesforce/data-model/objects-and-fields)** - Understand your data

**[→ Apex Triggers](/docs/salesforce/apex/triggers)** - Automate reporting data

---

**You now master Salesforce reports and dashboards!** Transform data into insights. 📊
