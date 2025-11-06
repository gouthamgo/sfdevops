---
sidebar_position: 2
title: Relationships & Lookups
description: Master object relationships, lookups, master-detail, and junction objects for building connected data models
---

# Relationships & Lookups: Connect Your Data

Master all relationship types in Salesforce to build connected, relational data models that power your applications.

## 🎯 What You'll Master

- Lookup relationships vs Master-Detail
- When to use each relationship type
- Creating and querying relationships
- Junction objects (many-to-many)
- Relationship fields in action
- Roll-up summary fields
- Cascade delete behavior
- Parent-child queries
- Best practices and patterns

## 🔗 Relationship Types Overview

```
Salesforce Relationships:
├── Lookup Relationship
│   ├── Loose coupling
│   ├── Optional relationship
│   ├── No cascade delete
│   └── Independent records
│
├── Master-Detail Relationship
│   ├── Tight coupling
│   ├── Required relationship
│   ├── Cascade delete
│   ├── Roll-up summaries
│   └── Shares parent security
│
├── Hierarchical Relationship
│   ├── Special type for User object
│   └── User reports to User
│
└── External Lookup
    ├── Links to external data
    └── Uses External IDs
```

## 📍 Lookup Relationships

### When to Use Lookup

```
Use Lookup When:
├── Relationship is optional
├── Child can exist without parent
├── Need to delete parent without deleting children
├── Parent and child in different ownership contexts
└── More flexible relationship needed

Example: Property → Agent (Lookup)
- Property can exist without assigned agent
- Deleting agent doesn't delete properties
- Properties can be reassigned to different agents
```

### Creating Lookup Relationship

**Via UI:**
```
Setup → Object Manager → Property__c → Fields & Relationships → New

Field Type: Lookup Relationship
Related To: User
Field Label: Agent
Field Name: Agent

Options:
☐ Required
☑ Allow reparenting
☑ Allow deletion of the lookup record
```

**Via Metadata:**
```xml
<!-- Agent__c.field-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Agent__c</fullName>
    <label>Agent</label>
    <referenceTo>User</referenceTo>
    <relationshipLabel>Properties</relationshipLabel>
    <relationshipName>Properties</relationshipName>
    <type>Lookup</type>
    <deleteConstraint>SetNull</deleteConstraint>
</CustomField>
```

### Querying Lookup Relationships

```apex
// Parent to Child (One-to-Many)
User agent = [
    SELECT Id, Name,
        (SELECT Id, Name, Address__c, Price__c
         FROM Properties__r  // Relationship name + __r
         WHERE Status__c = 'Active')
    FROM User
    WHERE Id = :agentId
];

// Access related records
System.debug('Agent: ' + agent.Name);
for (Property__c prop : agent.Properties__r) {
    System.debug('Property: ' + prop.Name + ' - $' + prop.Price__c);
}

// Child to Parent (Many-to-One)
List<Property__c> properties = [
    SELECT Id, Name, Price__c,
           Agent__c,                    // Lookup ID
           Agent__r.Name,                // Parent field via __r
           Agent__r.Email,               // Another parent field
           Agent__r.Profile.Name         // Parent's parent field
    FROM Property__c
    WHERE Agent__c != null
];

for (Property__c prop : properties) {
    System.debug('Property: ' + prop.Name);
    System.debug('Agent: ' + prop.Agent__r.Name);
    System.debug('Email: ' + prop.Agent__r.Email);
}
```

### Lookup in LWC

```javascript
// propertyCard.js
import { LightningElement, api, wire } from 'lwc';
import getProperty from '@salesforce/apex/PropertyController.getProperty';

export default class PropertyCard extends LightningElement {
    @api recordId;

    @wire(getProperty, { propertyId: '$recordId' })
    property;

    get agentName() {
        return this.property.data?.Agent__r?.Name;
    }

    get agentEmail() {
        return this.property.data?.Agent__r?.Email;
    }
}
```

```apex
// PropertyController.cls
@AuraEnabled(cacheable=true)
public static Property__c getProperty(Id propertyId) {
    return [
        SELECT Id, Name, Price__c, Address__c,
               Agent__c,
               Agent__r.Name,
               Agent__r.Email,
               Agent__r.Phone
        FROM Property__c
        WHERE Id = :propertyId
    ];
}
```

## 🔐 Master-Detail Relationships

### When to Use Master-Detail

```
Use Master-Detail When:
├── Child MUST have a parent
├── Parent controls child lifecycle
├── Need roll-up summary fields on parent
├── Want cascade delete behavior
├── Share parent's security with child
└── Tight coupling is appropriate

Example: Property → Showing (Master-Detail)
- Showing cannot exist without Property
- Deleting Property deletes all Showings
- Can count/sum Showings on Property
- Showing inherits Property's sharing rules
```

### Creating Master-Detail Relationship

**Via UI:**
```
Setup → Object Manager → Showing__c → Fields & Relationships → New

Field Type: Master-Detail Relationship
Related To: Property__c
Field Label: Property
Field Name: Property

Sharing Settings:
● Read/Write (child inherits parent's read/write access)
○ Read Only (child only inherits read access)
```

**Via Metadata:**
```xml
<!-- Property__c.field-meta.xml on Showing__c object -->
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Property__c</fullName>
    <label>Property</label>
    <referenceTo>Property__c</referenceTo>
    <relationshipLabel>Showings</relationshipLabel>
    <relationshipName>Showings</relationshipName>
    <relationshipOrder>0</relationshipOrder>
    <reparentableMasterDetail>false</reparentableMasterDetail>
    <type>MasterDetail</type>
    <writeRequiresMasterRead>false</writeRequiresMasterRead>
</CustomField>
```

### Roll-Up Summary Fields

Master-Detail enables roll-up summaries on the parent.

```
Setup → Object Manager → Property__c → Fields & Relationships → New

Field Type: Roll-Up Summary
Field Label: Total Showings
Field Name: Total_Showings

Summarized Object: Showing__c
Roll-Up Type: COUNT
Filter Criteria: None (or add filters)
```

**Available Roll-Up Types:**
```apex
COUNT    // Count related records
SUM      // Sum numeric field
MIN      // Minimum value
MAX      // Maximum value
```

**Example Roll-Ups:**
```xml
<!-- Total_Showings__c -->
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Total_Showings__c</fullName>
    <label>Total Showings</label>
    <summarizedField>Showing__c.Id</summarizedField>
    <summaryForeignKey>Showing__c.Property__c</summaryForeignKey>
    <summaryOperation>count</summaryOperation>
    <type>Summary</type>
</CustomField>

<!-- Confirmed_Showings__c -->
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Confirmed_Showings__c</fullName>
    <label>Confirmed Showings</label>
    <summarizedField>Showing__c.Id</summarizedField>
    <summaryForeignKey>Showing__c.Property__c</summaryForeignKey>
    <summaryFilterItems>
        <field>Showing__c.Status__c</field>
        <operation>equals</operation>
        <value>Confirmed</value>
    </summaryFilterItems>
    <summaryOperation>count</summaryOperation>
    <type>Summary</type>
</CustomField>
```

### Querying Master-Detail

```apex
// Parent to Children
Property__c property = [
    SELECT Id, Name, Total_Showings__c,  // Roll-up field
        (SELECT Id, Showing_Date__c, Status__c, Contact__r.Name
         FROM Showings__r
         ORDER BY Showing_Date__c DESC)
    FROM Property__c
    WHERE Id = :propertyId
];

System.debug('Property: ' + property.Name);
System.debug('Total Showings: ' + property.Total_Showings__c);

for (Showing__c showing : property.Showings__r) {
    System.debug('Showing on ' + showing.Showing_Date__c +
                 ' with ' + showing.Contact__r.Name);
}

// Child to Parent
List<Showing__c> showings = [
    SELECT Id, Showing_Date__c,
           Property__c,
           Property__r.Name,
           Property__r.Address__c,
           Property__r.Agent__r.Name  // Parent's parent
    FROM Showing__c
    WHERE Showing_Date__c = TODAY
];
```

## 🔄 Junction Objects (Many-to-Many)

Use junction objects for many-to-many relationships.

### Real-World Example: Property ←→ Feature

**Scenario:**
- A Property can have many Features (Pool, Garage, Fireplace)
- A Feature can be on many Properties

**Solution: Junction Object**

```
Property__c ← Property_Feature__c → Feature__c
  (Master)         (Junction)         (Master)
```

### Creating Junction Object

```
1. Create Feature__c object
   - Name (Text)
   - Description__c (Text Area)
   - Category__c (Picklist: Amenity, Appliance, Structure)

2. Create Property_Feature__c junction object
   - Property__c (Master-Detail to Property__c)
   - Feature__c (Master-Detail to Feature__c)
   - Included__c (Checkbox - is this feature included?)
   - Notes__c (Text Area)

3. Set Primary Master-Detail (required for junction)
   - Choose Property__c as primary
   - This determines:
     * Whose sharing rules apply
     * Which related list shows first
```

### Junction Object Metadata

```xml
<!-- Property_Feature__c object -->
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Property Feature</label>
    <pluralLabel>Property Features</pluralLabel>
    <nameField>
        <displayFormat>PF-{0000}</displayFormat>
        <type>AutoNumber</type>
    </nameField>
    <deploymentStatus>Deployed</deploymentStatus>
    <sharingModel>ControlledByParent</sharingModel>
</CustomObject>

<!-- Property__c field -->
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Property__c</fullName>
    <label>Property</label>
    <referenceTo>Property__c</referenceTo>
    <relationshipLabel>Features</relationshipLabel>
    <relationshipName>Property_Features</relationshipName>
    <relationshipOrder>0</relationshipOrder>
    <type>MasterDetail</type>
</CustomField>

<!-- Feature__c field -->
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Feature__c</fullName>
    <label>Feature</label>
    <referenceTo>Feature__c</referenceTo>
    <relationshipLabel>Properties</relationshipLabel>
    <relationshipName>Property_Features</relationshipName>
    <relationshipOrder>1</relationshipOrder>
    <type>MasterDetail</type>
</CustomField>
```

### Querying Junction Objects

```apex
// Get all features for a property
Property__c property = [
    SELECT Id, Name,
        (SELECT Id, Feature__r.Name, Feature__r.Category__c,
                Included__c, Notes__c
         FROM Property_Features__r
         WHERE Included__c = true)
    FROM Property__c
    WHERE Id = :propertyId
];

for (Property_Feature__c pf : property.Property_Features__r) {
    System.debug('Feature: ' + pf.Feature__r.Name);
    System.debug('Category: ' + pf.Feature__r.Category__c);
    System.debug('Notes: ' + pf.Notes__c);
}

// Get all properties with a specific feature
Feature__c feature = [
    SELECT Id, Name,
        (SELECT Id, Property__r.Name, Property__r.Address__c,
                Property__r.Price__c
         FROM Property_Features__r)
    FROM Feature__c
    WHERE Name = 'Swimming Pool'
];

// Using junction in SOQL
List<Property__c> propertiesWithPool = [
    SELECT Id, Name, Address__c, Price__c
    FROM Property__c
    WHERE Id IN (
        SELECT Property__c
        FROM Property_Feature__c
        WHERE Feature__r.Name = 'Swimming Pool'
        AND Included__c = true
    )
];
```

### Managing Junction Records

```apex
public class PropertyFeatureService {

    // Add feature to property
    public static void addFeatureToProperty(Id propertyId, Id featureId, String notes) {
        // Check if already exists
        List<Property_Feature__c> existing = [
            SELECT Id
            FROM Property_Feature__c
            WHERE Property__c = :propertyId
            AND Feature__c = :featureId
        ];

        if (existing.isEmpty()) {
            insert new Property_Feature__c(
                Property__c = propertyId,
                Feature__c = featureId,
                Included__c = true,
                Notes__c = notes
            );
        }
    }

    // Remove feature from property
    public static void removeFeatureFromProperty(Id propertyId, Id featureId) {
        List<Property_Feature__c> toDelete = [
            SELECT Id
            FROM Property_Feature__c
            WHERE Property__c = :propertyId
            AND Feature__c = :featureId
        ];

        if (!toDelete.isEmpty()) {
            delete toDelete;
        }
    }

    // Get all features for property
    public static List<Feature__c> getPropertyFeatures(Id propertyId) {
        List<Feature__c> features = new List<Feature__c>();

        for (Property_Feature__c pf : [
            SELECT Feature__r.Id, Feature__r.Name,
                   Feature__r.Category__c, Included__c
            FROM Property_Feature__c
            WHERE Property__c = :propertyId
        ]) {
            features.add(pf.Feature__r);
        }

        return features;
    }

    // Bulk add features to property
    public static void addFeaturesToProperty(Id propertyId, Set<Id> featureIds) {
        List<Property_Feature__c> toInsert = new List<Property_Feature__c>();

        // Get existing
        Set<Id> existingFeatureIds = new Set<Id>();
        for (Property_Feature__c pf : [
            SELECT Feature__c
            FROM Property_Feature__c
            WHERE Property__c = :propertyId
        ]) {
            existingFeatureIds.add(pf.Feature__c);
        }

        // Add new ones
        for (Id featureId : featureIds) {
            if (!existingFeatureIds.contains(featureId)) {
                toInsert.add(new Property_Feature__c(
                    Property__c = propertyId,
                    Feature__c = featureId,
                    Included__c = true
                ));
            }
        }

        if (!toInsert.isEmpty()) {
            insert toInsert;
        }
    }
}
```

## 🎨 Relationship Patterns

### Pattern 1: Self-Lookup (Hierarchy)

Properties can have parent properties (e.g., apartments in a building).

```xml
<!-- Parent_Property__c field on Property__c -->
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Parent_Property__c</fullName>
    <label>Parent Property</label>
    <referenceTo>Property__c</referenceTo>
    <relationshipLabel>Sub Properties</relationshipLabel>
    <relationshipName>Sub_Properties</relationshipName>
    <type>Lookup</type>
</CustomField>
```

```apex
// Query hierarchy
Property__c building = [
    SELECT Id, Name,
        (SELECT Id, Name, Unit_Number__c, Price__c
         FROM Sub_Properties__r)
    FROM Property__c
    WHERE Id = :buildingId
];

// Get parent and children
Property__c apartment = [
    SELECT Id, Name, Unit_Number__c,
           Parent_Property__c,
           Parent_Property__r.Name,
           Parent_Property__r.Address__c,
        (SELECT Id, Name FROM Sub_Properties__r)
    FROM Property__c
    WHERE Id = :apartmentId
];
```

### Pattern 2: Polymorphic Lookup (Task/Event)

Task and Event objects use polymorphic lookups (WhoId, WhatId).

```apex
// WhoId can reference: Lead, Contact
// WhatId can reference: Account, Opportunity, Custom Objects

Task newTask = new Task(
    Subject = 'Follow up on property',
    WhoId = contactId,        // Contact or Lead
    WhatId = propertyId,      // Custom object
    ActivityDate = Date.today().addDays(7)
);
insert newTask;

// Query tasks
List<Task> tasks = [
    SELECT Id, Subject, Who.Name, What.Name
    FROM Task
    WHERE WhatId = :propertyId
];
```

### Pattern 3: Circular References

Avoid circular Master-Detail relationships. Use Lookup for one direction.

```
❌ BAD:
Property (MD) → Inspection
Inspection (MD) → Property

✅ GOOD:
Property (MD) → Inspection
Inspection (Lookup) → Property
```

## 💡 Best Practices

### ✅ DO:

1. **Use Master-Detail for Strong Relationships**
   ```apex
   // Child MUST have parent
   Property__c (Master) ←→ Showing__c (Detail)
   ```

2. **Use Lookup for Flexible Relationships**
   ```apex
   // Child can exist independently
   Property__c (Lookup) ← Agent (User)
   ```

3. **Validate Relationship Data**
   ```apex
   if (property.Agent__c == null) {
       property.addError('Agent is required');
   }
   ```

4. **Query Efficiently**
   ```apex
   // Get related data in one query
   List<Property__c> props = [
       SELECT Id, Agent__r.Name, Agent__r.Email,
           (SELECT Id, Showing_Date__c FROM Showings__r)
       FROM Property__c
   ];
   ```

5. **Use Junction for Many-to-Many**
   ```apex
   Property ← Property_Feature → Feature
   ```

### ❌ DON'T:

1. **Don't Create Too Many Relationships**
   ```apex
   // ❌ BAD - 10+ lookup fields on one object
   // ✅ GOOD - Consolidate related data
   ```

2. **Don't Use Master-Detail When Lookup Suffices**
   ```apex
   // ❌ BAD - Master-Detail when optional
   // ✅ GOOD - Use Lookup for optional relationships
   ```

3. **Don't Forget Cascade Delete Impact**
   ```apex
   // Master-Detail: Deleting parent deletes ALL children
   // Consider data retention requirements
   ```

4. **Don't Query Relationships in Loops**
   ```apex
   // ❌ BAD
   for (Property__c prop : properties) {
       List<Showing__c> showings = [SELECT Id FROM Showing__c WHERE Property__c = :prop.Id];
   }

   // ✅ GOOD
   Map<Id, Property__c> propMap = new Map<Id, Property__c>([
       SELECT Id, (SELECT Id FROM Showings__r) FROM Property__c
   ]);
   ```

## 🚀 Next Steps

**[→ Data Management](/docs/salesforce/data-model/data-management)** - Import/Export data

**[→ Objects and Fields](/docs/salesforce/data-model/objects-and-fields)** - Create objects

**[→ SOQL](/docs/salesforce/apex/advanced-soql)** - Query relationships

---

**You now master Salesforce relationships!** Build connected data models that scale. 🔗
