---
sidebar_position: 3
title: Data Management
description: Master importing, exporting, updating, and managing data in Salesforce with Data Loader, Data Import Wizard, and APIs
---

# Data Management: Import, Export, and Manage Data

Master all methods for managing data in Salesforce - from simple CSV imports to complex data migrations using Data Loader and APIs.

## 🎯 What You'll Master

- Data Import Wizard vs Data Loader
- Importing records with relationships
- Exporting data safely
- Updating bulk records
- Upserting data (insert or update)
- Deleting and hard deleting records
- Handling errors and rollbacks
- Data validation and cleansing
- Migration strategies
- Best practices

## 🔧 Tools Overview

```
Salesforce Data Tools:
├── Data Import Wizard (UI)
│   ├── Up to 50,000 records
│   ├── Standard & Custom objects
│   ├── Duplicate checking
│   └── Easy for beginners
│
├── Data Loader (Desktop App)
│   ├── Up to 5 million records
│   ├── All objects
│   ├── Command-line support
│   ├── Scheduled operations
│   └── More control
│
├── Dataloader.io (Web)
│   ├── Cloud-based
│   ├── Scheduled imports
│   ├── Integrations
│   └── Premium features
│
└── Apex & APIs
    ├── Custom logic
    ├── Real-time processing
    ├── Complex transformations
    └── Bulk API 2.0
```

## 📊 Data Import Wizard

### When to Use

```
Use Data Import Wizard When:
├── < 50,000 records
├── Standard objects (Accounts, Contacts, Leads)
├── Simple imports
├── Need duplicate checking
└── One-time imports

Don't Use When:
├── > 50,000 records
├── Complex relationships
├── Need automation
└── Custom objects (use Data Loader instead)
```

### Step-by-Step Import

**1. Prepare CSV File**
```csv
Name,Website,Industry,AnnualRevenue,Phone
"Acme Corporation",www.acme.com,Technology,5000000,555-0123
"Global Industries",www.global.com,Manufacturing,10000000,555-0456
"Tech Startup Inc",www.techstartup.com,Technology,500000,555-0789
```

**2. Launch Import Wizard**
```
Setup → Data Import Wizard → Launch Wizard!

Choose:
- Object: Accounts and Contacts
- Operation: Add new records
```

**3. Map Fields**
```
CSV Column          →  Salesforce Field
─────────────────────  ─────────────────
Name                →  Account Name
Website             →  Website
Industry            →  Industry
AnnualRevenue       →  Annual Revenue
Phone               →  Phone
```

**4. Review and Import**
```
- Check duplicate rules
- Review mappings
- Click "Start Import"
- Monitor progress in email
```

### Handling Duplicates

```
Duplicate Rule Options:
├── Block: Prevent duplicate creation
├── Allow: Allow duplicates
└── Report: Create duplicate, but flag it

Matching Rules:
├── Account: Name + Website
├── Contact: Email
├── Lead: Email + Company
└── Custom: Define your own
```

## 🚀 Data Loader

### Installation and Setup

```bash
# Download from Salesforce
# https://developer.salesforce.com/tools/data-loader

# System Requirements:
- Windows/Mac/Linux
- Java Runtime Environment (JRE) 11+

# First Time Setup:
1. Launch Data Loader
2. Settings → Login → OAuth
3. Authorize with Salesforce
4. Configure batch size (default: 200)
```

### Operations Overview

```
Data Loader Operations:
├── Insert: Add new records
├── Update: Modify existing records
├── Upsert: Insert or Update (uses External ID)
├── Delete: Soft delete (to Recycle Bin)
├── Hard Delete: Permanent deletion
└── Export: Download records
```

### Insert Records

**Step 1: Prepare CSV with required fields**
```csv
Name,Address__c,Price__c,Square_Feet__c,Status__c
"123 Main St Property","123 Main St, New York, NY",500000,2000,Active
"456 Oak Ave Property","456 Oak Ave, Los Angeles, CA",750000,2500,Active
"789 Pine Rd Property","789 Pine Rd, Chicago, IL",350000,1500,Pending
```

**Step 2: Insert Operation**
```
1. Data Loader → Insert
2. Select Object: Property__c
3. Browse CSV file
4. Map fields:
   CSV Column    → Salesforce API Name
   Name          → Name
   Address__c    → Address__c
   Price__c      → Price__c
   Square_Feet__c → Square_Feet__c
   Status__c     → Status__c

5. Choose success/error file locations
6. Click "Finish"
```

**Step 3: Review Results**
```
Success File: success.csv
- Contains Salesforce IDs of inserted records

Error File: error.csv
- Contains failed records with error messages
- Fix issues and re-import failed records
```

### Update Records

**CSV with Salesforce IDs:**
```csv
Id,Status__c,Price__c
a075500000DxYZ1AAN,Sold,525000
a075500000DxYZ2AAN,Pending,780000
a075500000DxYZ3AAN,Active,350000
```

**Update Operation:**
```
1. Data Loader → Update
2. Select Object: Property__c
3. Upload CSV with Id column
4. Map fields
5. Execute
```

### Upsert (Insert or Update)

Uses External ID to determine if record exists.

**Step 1: Create External ID Field**
```
Field Name: Property_External_Id__c
Type: Text (Unique, External ID)
```

**Step 2: Prepare CSV**
```csv
Property_External_Id__c,Name,Address__c,Price__c
PROP-001,"123 Main St Property","123 Main St",500000
PROP-002,"456 Oak Ave Property","456 Oak Ave",750000
PROP-003,"789 Pine Rd Property","789 Pine Rd",350000
```

**Step 3: Upsert Operation**
```
1. Data Loader → Upsert
2. Select Object: Property__c
3. Choose External ID Field: Property_External_Id__c
4. Upload CSV
5. Map fields
6. Execute

Result:
- Existing records (matching External ID) → Updated
- New records → Inserted
```

### Export Records

**Simple Export:**
```
1. Data Loader → Export
2. Select Object: Property__c
3. Choose SOQL query:
   SELECT Id, Name, Address__c, Price__c, Status__c, CreatedDate
   FROM Property__c
   WHERE Status__c = 'Active'

4. Choose export file location
5. Click "Finish"
```

**Export All Data:**
```
1. Data Loader → Export All
   - Includes deleted records
   - Good for backups
   - Requires "View All Data" permission
```

## 🔗 Importing with Relationships

### Import Parent, Then Children

**Step 1: Import Accounts (Parents)**
```csv
Name,Website,Industry
Acme Corp,www.acme.com,Technology
Global Inc,www.global.com,Finance
```

After import, save success file with IDs:
```csv
Id,Name
001000000012345AAA,Acme Corp
001000000012346AAA,Global Inc
```

**Step 2: Import Contacts (Children)**

Use Account IDs or External IDs:
```csv
FirstName,LastName,Email,AccountId
John,Doe,john@acme.com,001000000012345AAA
Jane,Smith,jane@acme.com,001000000012345AAA
Bob,Johnson,bob@global.com,001000000012346AAA
```

Or using External ID:
```csv
FirstName,LastName,Email,Account.External_Id__c
John,Doe,john@acme.com,ACCT-001
Jane,Smith,jane@acme.com,ACCT-001
Bob,Johnson,bob@global.com,ACCT-002
```

### Import Junction Objects

**Import many-to-many relationships:**
```csv
Property__c,Feature__c,Included__c,Notes__c
a075500000DxYZ1AAN,a085500000DxAB1AAN,true,"Built-in pool"
a075500000DxYZ1AAN,a085500000DxAB2AAN,true,"2 car garage"
a075500000DxYZ2AAN,a085500000DxAB1AAN,true,"Heated pool"
```

Or using External IDs:
```csv
Property__r.Property_External_Id__c,Feature__r.Feature_Code__c,Included__c
PROP-001,FEAT-POOL,true
PROP-001,FEAT-GARAGE,true
PROP-002,FEAT-POOL,true
```

## 🎯 Command-Line Data Loader

Automate with command-line operations.

### Configuration Files

**config.properties:**
```properties
# Connection
sfdc.endpoint=https://login.salesforce.com
sfdc.username=your@email.com
sfdc.password=yourPasswordAndSecurityToken

# Operation
sfdc.entity=Property__c
process.operation=insert

# Files
process.mappingFile=propertyMapping.sdl
process.csvFile=properties.csv
process.outputSuccess=success.csv
process.outputError=error.csv

# Settings
sfdc.bulkApiEnabled=true
sfdc.loadBatchSize=200
```

**Mapping File (propertyMapping.sdl):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapping PUBLIC "-//SALESFORCE//MAPPING 1.0//EN"
  "https://www.salesforce.com/us/developer/docs/dataloader/dataloader.dtd">
<mapping>
  <entry field="Name" mapping="Name"/>
  <entry field="Address__c" mapping="Address"/>
  <entry field="Price__c" mapping="Price"/>
  <entry field="Status__c" mapping="Status"/>
</mapping>
```

### Run Command-Line

```bash
# Windows
process.bat config.properties

# Mac/Linux
./process.sh config.properties

# Scheduled Task (Windows)
schtasks /create /tn "Property Import" /tr "C:\DataLoader\process.bat config.properties" /sc daily /st 02:00

# Cron Job (Linux)
0 2 * * * /opt/dataloader/process.sh /opt/dataloader/config.properties
```

## 🔄 Bulk API 2.0

For large-scale operations, use Bulk API.

### Apex Bulk Processing

```apex
public class BulkDataProcessor {

    // Process large datasets efficiently
    public static void bulkUpdateProperties(List<Property__c> properties) {
        // Bulk API automatically handles batching

        // Validate first
        for (Property__c prop : properties) {
            if (prop.Price__c == null || prop.Price__c <= 0) {
                prop.addError('Invalid price');
            }
        }

        // Update in bulk
        Database.SaveResult[] results = Database.update(properties, false);

        // Handle errors
        for (Integer i = 0; i < results.size(); i++) {
            if (!results[i].isSuccess()) {
                System.debug('Error on ' + properties[i].Id + ': ' +
                           results[i].getErrors()[0].getMessage());
            }
        }
    }

    // Process with Database methods (partial success)
    public static Map<String, Integer> bulkImportWithErrors(
        List<Property__c> properties
    ) {
        Map<String, Integer> stats = new Map<String, Integer>{
            'success' => 0,
            'errors' => 0
        };

        Database.SaveResult[] results = Database.insert(properties, false);

        for (Integer i = 0; i < results.size(); i++) {
            if (results[i].isSuccess()) {
                stats.put('success', stats.get('success') + 1);
            } else {
                stats.put('errors', stats.get('errors') + 1);

                // Log error
                insert new Error_Log__c(
                    Record_Name__c = properties[i].Name,
                    Error_Message__c = results[i].getErrors()[0].getMessage()
                );
            }
        }

        return stats;
    }
}
```

## 🧹 Data Cleansing

### Deduplication

```apex
public class DataDeduplicationService {

    // Find duplicate accounts
    public static Map<String, List<Account>> findDuplicateAccounts() {
        Map<String, List<Account>> duplicates = new Map<String, List<Account>>();

        for (Account acc : [
            SELECT Id, Name, Website
            FROM Account
            ORDER BY Name
        ]) {
            String key = acc.Name + '|' + acc.Website;

            if (!duplicates.containsKey(key)) {
                duplicates.put(key, new List<Account>());
            }

            duplicates.get(key).add(acc);
        }

        // Filter only duplicates
        Map<String, List<Account>> result = new Map<String, List<Account>>();
        for (String key : duplicates.keySet()) {
            if (duplicates.get(key).size() > 1) {
                result.put(key, duplicates.get(key));
            }
        }

        return result;
    }

    // Merge duplicates
    public static void mergeDuplicateAccounts(Id masterAccountId, List<Id> duplicateIds) {
        Account master = [SELECT Id FROM Account WHERE Id = :masterAccountId];
        List<Account> duplicates = [SELECT Id FROM Account WHERE Id IN :duplicateIds];

        // Salesforce merge (up to 3 records at once)
        merge master duplicates[0];
    }
}
```

### Data Validation

```apex
public class DataValidationService {

    public class ValidationResult {
        public Boolean isValid;
        public List<String> errors;

        public ValidationResult() {
            this.isValid = true;
            this.errors = new List<String>();
        }
    }

    public static ValidationResult validateProperty(Property__c property) {
        ValidationResult result = new ValidationResult();

        // Required fields
        if (String.isBlank(property.Name)) {
            result.isValid = false;
            result.errors.add('Name is required');
        }

        if (String.isBlank(property.Address__c)) {
            result.isValid = false;
            result.errors.add('Address is required');
        }

        // Price validation
        if (property.Price__c == null || property.Price__c <= 0) {
            result.isValid = false;
            result.errors.add('Price must be greater than 0');
        }

        if (property.Price__c > 100000000) {
            result.isValid = false;
            result.errors.add('Price exceeds maximum ($100M)');
        }

        // Square feet validation
        if (property.Square_Feet__c != null && property.Square_Feet__c < 100) {
            result.isValid = false;
            result.errors.add('Square feet seems too small');
        }

        // Email format
        if (String.isNotBlank(property.Contact_Email__c)) {
            Pattern emailPattern = Pattern.compile('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$');
            if (!emailPattern.matcher(property.Contact_Email__c.toUpperCase()).matches()) {
                result.isValid = false;
                result.errors.add('Invalid email format');
            }
        }

        return result;
    }

    // Validate before bulk import
    public static List<Property__c> validateBulkProperties(List<Property__c> properties) {
        List<Property__c> validProperties = new List<Property__c>();

        for (Property__c prop : properties) {
            ValidationResult validation = validateProperty(prop);

            if (validation.isValid) {
                validProperties.add(prop);
            } else {
                // Log invalid record
                System.debug('Invalid property: ' + prop.Name + ' - ' +
                           String.join(validation.errors, ', '));
            }
        }

        return validProperties;
    }
}
```

## 💡 Best Practices

### ✅ DO:

1. **Always Backup Before Bulk Operations**
   ```apex
   // Export data before bulk delete/update
   Data Loader → Export All → Save with timestamp
   ```

2. **Test with Small Batch First**
   ```apex
   // Test with 10-100 records first
   // Then scale to full dataset
   ```

3. **Use External IDs for Upserts**
   ```csv
   Property_External_Id__c,Name,Price__c
   PROP-001,"Property 1",500000
   ```

4. **Handle Errors Gracefully**
   ```apex
   Database.SaveResult[] results = Database.insert(records, false);
   // Log errors, don't fail entire batch
   ```

5. **Validate Data Before Import**
   ```apex
   List<Property__c> valid = DataValidationService.validateBulkProperties(properties);
   insert valid;
   ```

### ❌ DON'T:

1. **Don't Import Without Testing**
   ```apex
   // ❌ BAD - Import 1M records without test
   // ✅ GOOD - Test with 100 records first
   ```

2. **Don't Skip Error Files**
   ```apex
   // ❌ BAD - Ignore error.csv
   // ✅ GOOD - Review and fix errors
   ```

3. **Don't Hard Delete Without Backup**
   ```apex
   // ❌ BAD - Hard delete without export
   // ✅ GOOD - Export → Review → Hard delete
   ```

4. **Don't Import During Business Hours**
   ```apex
   // ❌ BAD - Import during peak usage
   // ✅ GOOD - Schedule imports during off-hours
   ```

## 🚀 Next Steps

**[→ Relationships & Lookups](/docs/salesforce/data-model/relationships-lookups)** - Connect data

**[→ SOQL](/docs/salesforce/apex/advanced-soql)** - Query data

**[→ Apex Triggers](/docs/salesforce/apex/triggers)** - Automate on data changes

---

**You now master Salesforce data management!** Import, export, and manage data like a pro. 📊
