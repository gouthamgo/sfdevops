---
sidebar_position: 2
title: Security & Permissions
description: Master Salesforce security model - OWD, roles, profiles, permission sets, sharing rules, and field-level security
---

# Security & Permissions: Lock Down Your Data

Master Salesforce's comprehensive security model to control who can see and do what with your data at every level.

## 🎯 What You'll Master

- Organization-Wide Defaults (OWD)
- Role Hierarchy
- Profiles vs Permission Sets
- Sharing Rules
- Field-Level Security (FLS)
- Object permissions (CRUD)
- Record-level security
- Manual sharing
- Security best practices
- Real-world scenarios

## 🔒 Security Layers Overview

```
Salesforce Security Layers (Most Restrictive → Least Restrictive):

1. Organization-Wide Defaults (OWD)
   ↓ Baseline access for all users

2. Role Hierarchy
   ↓ Managers can see subordinate data

3. Sharing Rules
   ↓ Extend access based on criteria

4. Manual Sharing
   ↓ Share specific records

5. Apex Sharing
   ↓ Programmatic sharing

Each layer can only GRANT more access, never restrict.
Most restrictive setting wins!
```

## 🌐 Organization-Wide Defaults (OWD)

Baseline record access for all users.

### OWD Options

```
Private
├── Only owner can see/edit
├── Most restrictive
└── Use when: Sensitive data (HR, Finance)

Public Read Only
├── Everyone can see
├── Only owner can edit
└── Use when: Reference data (Products, Price Books)

Public Read/Write
├── Everyone can see and edit
├── Least restrictive
└── Use when: Collaborative objects (Tasks, Events)

Controlled by Parent (Master-Detail only)
├── Inherits parent's sharing
└── Automatic for master-detail children
```

### Setting OWD

```
Setup → Security → Sharing Settings

Object              Default Access
─────────────────   ──────────────────
Account             Private
Contact             Controlled by Parent
Property__c         Private
Showing__c          Controlled by Parent
```

### OWD Decision Framework

```
Ask yourself:
1. Who should see this data by default?
   - Just owners? → Private
   - Everyone? → Public Read or Read/Write

2. Is data sensitive?
   - Yes → Private
   - No → Public Read Only

3. Is collaboration needed?
   - Yes → Public Read/Write
   - No → Private or Public Read Only

Example:
Property records contain pricing and owner info
→ Sensitive data
→ Set to Private
→ Use sharing rules to grant access to teams
```

## 👥 Role Hierarchy

Managers automatically see data owned by subordinates.

### How It Works

```
CEO
 ├── VP Sales
 │    ├── Sales Manager
 │    │    ├── Sales Rep 1
 │    │    └── Sales Rep 2
 │    └── Sales Manager 2
 └── VP Operations
      └── Operations Manager

Access Flow:
- Sales Rep 1 owns Property A
- Sales Manager sees Property A (role hierarchy)
- VP Sales sees Property A (role hierarchy)
- CEO sees Property A (role hierarchy)
- Operations Manager does NOT see Property A (different branch)
```

### Creating Roles

```
Setup → Users → Roles → Set Up Roles

Role Name: Sales Manager
Reports to: VP Sales
```

### Role Hierarchy Rules

```
✅ Managers see subordinate data
✅ Works when OWD is Private/Public Read Only
✅ Respects object permissions
❌ Doesn't grant edit access (unless OWD allows)
❌ Doesn't work sideways (peer roles)
```

## 👤 Profiles

Define what users can DO in Salesforce.

### Profile Components

```
Profile Controls:
├── Object Permissions
│   ├── Read, Create, Edit, Delete
│   ├── View All, Modify All
│   └── Per object basis
│
├── Field-Level Security
│   ├── Visible, Read Only, Hidden
│   └── Per field basis
│
├── Tab Settings
│   ├── Default On, Default Off, Hidden
│   └── Which tabs users see
│
├── App Settings
│   └── Which apps are available
│
├── Administrative Permissions
│   ├── View Setup, Modify All Data
│   └── System-level permissions
│
└── General User Permissions
    ├── API Enabled
    └── Feature-specific permissions
```

### Standard Profiles

```
System Administrator
├── Full access to everything
└── Cannot be edited (clone to customize)

Standard User
├── Basic CRUD on standard objects
└── Common starting point

Read Only
├── View-only access
└── Cannot edit anything

```

### Creating Custom Profile

```
Setup → Users → Profiles → New Profile

1. Clone existing profile
   - Base: Standard User
   - Name: Sales Representative

2. Set Object Permissions:
   Property__c:
   ☑ Read
   ☑ Create
   ☑ Edit
   ☐ Delete
   ☐ View All
   ☐ Modify All

3. Set Field-Level Security:
   Property__c.Price__c:
   ● Visible
   ○ Read Only

4. Enable features:
   ☑ API Enabled
   ☑ Run Reports
   ☐ Modify All Data
```

## 🎯 Permission Sets

Grant additional permissions without changing profiles.

### Profiles vs Permission Sets

```
Profiles:
├── One per user (required)
├── Defines baseline permissions
└── Harder to manage (one size fits all)

Permission Sets:
├── Multiple per user (optional)
├── Grants additional permissions
├── Easier to manage (mix and match)
└── Best practice for extras

Best Practice:
- Minimal profile (least privilege)
- Permission sets for specific needs
```

### Creating Permission Set

```
Setup → Users → Permission Sets → New

Name: Property Manager
Label: Property Manager
License: Salesforce

Object Settings → Property__c:
☑ Read
☑ Create
☑ Edit
☑ Delete

Field Permissions → Property__c.Price__c:
☑ Read Access
☑ Edit Access

System Permissions:
☑ API Enabled
☑ Run Reports
```

### Assigning Permission Sets

```
Method 1: Individual Assignment
User → Permission Set Assignments → Edit Assignments

Method 2: Permission Set Group
Permission Sets → New Group → Add Permission Sets

Method 3: Apex (Bulk Assignment)
```apex
public class PermissionSetAssigner {

    public static void assignPermissionSet(Set<Id> userIds, String permSetName) {
        PermissionSet ps = [
            SELECT Id
            FROM PermissionSet
            WHERE Name = :permSetName
        ];

        List<PermissionSetAssignment> assignments = new List<PermissionSetAssignment>();

        for (Id userId : userIds) {
            assignments.add(new PermissionSetAssignment(
                PermissionSetId = ps.Id,
                AssigneeId = userId
            ));
        }

        insert assignments;
    }
}
```

## 🤝 Sharing Rules

Extend access beyond OWD and role hierarchy.

### Types of Sharing Rules

```
Criteria-Based Sharing
├── Share based on field values
└── Example: Share properties in CA with CA team

Owner-Based Sharing
├── Share based on record owner
└── Example: Share properties owned by agents with managers
```

### Creating Sharing Rule

```
Setup → Security → Sharing Settings → Property__c → New

Rule Name: Share California Properties
Rule Type: Criteria Based

Share records that meet criteria:
Field: State__c
Operator: equals
Value: California

With: Public Group: California Sales Team
Access Level: Read/Write
```

### Sharing Rule Patterns

**Pattern 1: Territory-Based**
```
Share records where:
- Territory__c equals "West Coast"
With: West Coast Sales Team
Access: Read/Write
```

**Pattern 2: Department-Based**
```
Share records owned by:
- Sales Department users
With: Sales Managers Group
Access: Read Only
```

**Pattern 3: Status-Based**
```
Share records where:
- Status__c equals "Pending Approval"
With: Approval Committee
Access: Read Only
```

## 🔑 Field-Level Security (FLS)

Control visibility of specific fields.

### FLS Options

```
Visible
├── User can see and edit
└── Default for most fields

Read Only
├── User can see but not edit
└── Good for sensitive calculations

Hidden
├── User cannot see or edit
└── Most restrictive
```

### Setting FLS

**Method 1: Via Profile**
```
Profile → Object Settings → Property__c → Edit → Field-Level Security

Commission__c:
● Visible
○ Read Only
```

**Method 2: Via Permission Set**
```
Permission Set → Object Settings → Property__c → Field Permissions

Commission__c:
☑ Read Access
☑ Edit Access
```

**Method 3: Via Field**
```
Object Manager → Property__c → Fields → Commission__c → Set Field-Level Security

Profile              Visible    Read Only
─────────────────   ─────────  ──────────
System Admin        ☑          ☐
Sales Rep           ☐          ☑
Manager             ☑          ☐
```

### FLS in Apex

```apex
// Check FLS before query
if (Schema.sObjectType.Property__c.fields.Commission__c.isAccessible()) {
    List<Property__c> props = [
        SELECT Id, Name, Commission__c
        FROM Property__c
    ];
} else {
    // Handle no access
    System.debug('User cannot access Commission field');
}

// Check FLS before DML
if (Schema.sObjectType.Property__c.fields.Commission__c.isUpdateable()) {
    property.Commission__c = 5000;
    update property;
}

// Strip inaccessible fields (Recommended)
List<Property__c> properties = [
    SELECT Id, Name, Commission__c, Price__c
    FROM Property__c
];

SObjectAccessDecision decision = Security.stripInaccessible(
    AccessType.READABLE,
    properties
);

// Returns only fields user can access
List<Property__c> secureProperties = decision.getRecords();
```

## 🎯 Real-World Security Scenario

### Scenario: Property Management App

**Requirements:**
```
Roles:
- Agents (own properties, manage showings)
- Managers (see team's properties, approve deals)
- Executives (see all properties, reports only)

Objects:
- Property__c
- Showing__c (Master-Detail to Property)
- Offer__c (Lookup to Property)
```

**Security Implementation:**

**Step 1: Set OWD**
```
Property__c: Private
Showing__c: Controlled by Parent
Offer__c: Private
```

**Step 2: Create Role Hierarchy**
```
CEO
 └── VP Sales
      ├── Sales Manager West
      │    ├── Agent 1
      │    └── Agent 2
      └── Sales Manager East
           ├── Agent 3
           └── Agent 4
```

**Step 3: Create Profiles**
```
Agent Profile:
- Property__c: Read, Create, Edit
- Showing__c: Read, Create, Edit, Delete
- Offer__c: Read, Create, Edit
- Cannot see Commission__c field

Manager Profile:
- Property__c: Read, Create, Edit, Delete
- Can see Commission__c (Read Only)
- Can run reports

Executive Profile:
- Property__c: Read, View All
- Can see all fields (Read Only)
- Can run reports and dashboards
```

**Step 4: Create Sharing Rules**
```
Rule 1: Share High-Value Properties
- Share Property__c where Price__c > 1000000
- With: Executive Team
- Access: Read Only

Rule 2: Share Pending Approvals
- Share Offer__c where Status__c = "Pending Approval"
- With: Approval Committee
- Access: Read/Write
```

**Step 5: Permission Sets**
```
Marketing Access:
- Property__c: Read
- Property__c.Address__c: Hidden
- Property__c.Price__c: Hidden

API Integration User:
- API Enabled
- Property__c: Read, Create, Update
```

## 🛡️ Security Best Practices

### ✅ DO:

1. **Start with Least Privilege**
   ```
   - OWD: Private
   - Profile: Minimal permissions
   - Grant access via sharing rules and permission sets
   ```

2. **Use Permission Sets for Extras**
   ```
   - Base profile: Standard features
   - Permission sets: Special access
   - Easier to audit and manage
   ```

3. **Enforce FLS in Apex**
   ```apex
   // Always use Security.stripInaccessible()
   SObjectAccessDecision decision = Security.stripInaccessible(
       AccessType.READABLE,
       records
   );
   return decision.getRecords();
   ```

4. **Review Regularly**
   ```
   - Quarterly permission audits
   - Remove unused permission sets
   - Deactivate former users
   ```

5. **Test with Different Users**
   ```
   - Use "Login As" feature
   - Test as agent, manager, executive
   - Verify sharing rules work
   ```

### ❌ DON'T:

1. **Don't Use "Modify All Data" Unnecessarily**
   ```
   ❌ Grant Modify All to non-admins
   ✅ Use specific object permissions
   ```

2. **Don't Make Everything Public Read/Write**
   ```
   ❌ OWD: Public Read/Write for sensitive data
   ✅ OWD: Private + Sharing Rules
   ```

3. **Don't Ignore Field-Level Security**
   ```
   ❌ Expose all fields to all users
   ✅ Hide sensitive fields (SSN, Salary, Commission)
   ```

4. **Don't Forget Sharing in Apex**
   ```apex
   // ❌ BAD - Bypasses sharing
   public without sharing class MyController {

   }

   // ✅ GOOD - Respects sharing
   public with sharing class MyController {

   }
   ```

## 🚀 Next Steps

**[→ Platform Overview](/docs/salesforce/fundamentals/platform-overview)** - Salesforce basics

**[→ Security & Sharing in Apex](/docs/salesforce/apex/security-sharing)** - Code-level security

**[→ Objects & Fields](/docs/salesforce/data-model/objects-and-fields)** - Build secure data models

---

**You now master Salesforce security!** Lock down your data at every level. 🔒
