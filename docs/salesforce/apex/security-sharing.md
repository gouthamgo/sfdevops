---
sidebar_position: 10
title: Security & Sharing
description: Master record-level security, sharing rules, and secure coding practices
---

# Apex Security & Sharing: Secure Your Code

Master Salesforce's record-level security model, sharing rules, and secure coding practices. Learn to write code that respects security settings and protects sensitive data.

## 🎯 What You'll Master

- Salesforce security model (OWD, sharing rules, roles)
- with sharing vs without sharing vs inherited sharing
- Manual sharing and Apex Managed Sharing
- Field-Level Security (FLS) and CRUD
- Query security and data access
- Security best practices
- Common security vulnerabilities

## 🔐 Salesforce Security Model

### Security Layers

```
Security Layers (Most to Least Restrictive):
1. Organization-Wide Defaults (OWD)
   └── Baseline access level for all records
2. Role Hierarchy
   └── Managers see subordinates' data
3. Sharing Rules
   └── Extend access beyond OWD
4. Manual Sharing
   └── Share individual records
5. Apex Managed Sharing
   └── Programmatic sharing
```

### Organization-Wide Defaults (OWD)

```
OWD Settings:
├── Private: Only owner + higher roles
├── Public Read Only: Everyone can read, only owner can edit
├── Public Read/Write: Everyone can read and edit
└── Controlled by Parent: Inherits from master record
```

**Example Scenario:**
- Account OWD: Private
- Contact OWD: Controlled by Parent
- Opportunity OWD: Private

Result: Users can only see Accounts they own or that are shared with them.

## 📝 Sharing Keywords

### with sharing

```apex
// Respects user's sharing rules
public with sharing class SecureAccountController {

    @AuraEnabled
    public static List<Account> getAccounts() {
        // Returns only accounts user has access to
        return [SELECT Id, Name FROM Account];
    }
}
```

**Key Points:**
- Enforces record-level security
- Users only see records they have access to
- **Always use for user-facing operations**

### without sharing

```apex
// Ignores sharing rules - runs in system context
public without sharing class SystemAccountController {

    public static List<Account> getAllAccounts() {
        // Returns ALL accounts regardless of user access
        return [SELECT Id, Name FROM Account];
    }
}
```

**Key Points:**
- Runs with full admin access
- Ignores OWD and sharing rules
- **Only use when necessary** (integrations, scheduled jobs)

### inherited sharing

```apex
// Inherits sharing from calling context
public inherited sharing class FlexibleController {

    public static List<Account> getAccounts() {
        // Respects sharing if called from 'with sharing'
        // Ignores sharing if called from 'without sharing'
        return [SELECT Id, Name FROM Account];
    }
}
```

**Key Points:**
- Default for inner classes
- Flexible based on caller
- Good for utility classes

### No Keyword (Legacy)

```apex
// No keyword = depends on context
public class LegacyController {
    // Behavior varies - avoid this!
}
```

**Modern Best Practice:**
Always specify `with sharing`, `without sharing`, or `inherited sharing`

## 🎭 When to Use Each

### Use `with sharing` when:

```apex
// ✅ User-facing operations
@AuraEnabled(cacheable=true)
public with sharing class PropertySearchController {
    public static List<Property__c> searchProperties(String location) {
        // User only sees properties they have access to
        return [
            SELECT Id, Name, Address__c
            FROM Property__c
            WHERE City__c = :location
        ];
    }
}
```

### Use `without sharing` when:

```apex
// ✅ System operations
public without sharing class NotificationService {

    // Send notifications to all property owners
    public static void notifyAllPropertyOwners(String message) {
        // Need to access ALL properties for notifications
        List<Property__c> properties = [
            SELECT Id, OwnerId, Owner.Email
            FROM Property__c
        ];

        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        for(Property__c prop : properties) {
            // Build email
        }

        Messaging.sendEmail(emails);
    }
}
```

### Use `inherited sharing` when:

```apex
// ✅ Utility classes
public inherited sharing class StringUtils {

    public static String formatCurrency(Decimal amount) {
        return '$' + amount.format();
    }

    // No data access, so sharing doesn't matter
    // But respects caller's context
}
```

## 🔄 Mixing Sharing Contexts

```apex
public with sharing class SecureController {

    @AuraEnabled
    public static void processAccount(Id accountId) {
        // This runs with sharing
        Account acc = [SELECT Id, Name FROM Account WHERE Id = :accountId];

        // Call without sharing for system operation
        SystemOperations.logAccess(acc.Id);
    }
}

public without sharing class SystemOperations {

    public static void logAccess(Id recordId) {
        // This runs without sharing
        Access_Log__c log = new Access_Log__c(
            Record_Id__c = recordId,
            User__c = UserInfo.getUserId(),
            Access_Time__c = DateTime.now()
        );
        insert log;
    }
}
```

**Pattern:**
- User operations: `with sharing`
- System operations: `without sharing`
- Keep them separate

## 🛡️ Field-Level Security (FLS)

### Check FLS Before Access

```apex
public class FLSExample {

    public static List<Account> getAccounts() {
        // Check object access
        if(!Schema.sObjectType.Account.isAccessible()) {
            throw new SecurityException('No access to Account');
        }

        // Check field access
        if(!Schema.sObjectType.Account.fields.Industry.isAccessible()) {
            throw new SecurityException('No access to Industry field');
        }

        return [SELECT Id, Name, Industry FROM Account];
    }
}
```

### Security.stripInaccessible()

```apex
public class StripInaccessibleExample {

    public static List<Account> getSecureAccounts() {
        List<Account> accounts = [
            SELECT Id, Name, Industry, AnnualRevenue, Phone
            FROM Account
        ];

        // Remove fields user can't access
        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.READABLE,
            accounts
        );

        return decision.getRecords();
    }

    public static void updateSecureAccounts(List<Account> accounts) {
        // Remove fields user can't update
        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.UPDATABLE,
            accounts
        );

        update decision.getRecords();
    }
}
```

### WITH SECURITY_ENFORCED

```apex
// Enforce FLS in SOQL (pilot feature)
List<Account> accounts = [
    SELECT Id, Name, Industry
    FROM Account
    WITH SECURITY_ENFORCED
];

// Query fails if user lacks access to any field
// More strict than stripInaccessible
```

## 📊 CRUD Permissions

### Check Before DML

```apex
public class CRUDExample {

    public static void createAccount(Account acc) {
        // Check create permission
        if(!Schema.sObjectType.Account.isCreateable()) {
            throw new DmlException('Cannot create Account');
        }

        insert acc;
    }

    public static void updateAccount(Account acc) {
        // Check update permission
        if(!Schema.sObjectType.Account.isUpdateable()) {
            throw new DmlException('Cannot update Account');
        }

        update acc;
    }

    public static void deleteAccount(Account acc) {
        // Check delete permission
        if(!Schema.sObjectType.Account.isDeletable()) {
            throw new DmlException('Cannot delete Account');
        }

        delete acc;
    }
}
```

### Comprehensive FLS Check

```apex
public class ComprehensiveSecurity {

    public static void secureUpdate(Account acc, Map<String, Object> updates) {
        // Check object updateable
        if(!Schema.sObjectType.Account.isUpdateable()) {
            throw new SecurityException('Cannot update Account');
        }

        // Check each field
        for(String fieldName : updates.keySet()) {
            Schema.SObjectField field =
                Schema.sObjectType.Account.fields.getMap().get(fieldName);

            if(field == null) {
                throw new IllegalArgumentException('Invalid field: ' + fieldName);
            }

            if(!field.getDescribe().isUpdateable()) {
                throw new SecurityException('Cannot update field: ' + fieldName);
            }

            acc.put(fieldName, updates.get(fieldName));
        }

        update acc;
    }
}
```

## 🤝 Manual Sharing

### Share Records Programmatically

```apex
public class ManualSharingExample {

    public static void shareAccountWithUser(Id accountId, Id userId, String accessLevel) {
        AccountShare share = new AccountShare();
        share.AccountId = accountId;
        share.UserOrGroupId = userId;
        share.AccountAccessLevel = accessLevel;  // 'Read' or 'Edit'
        share.OpportunityAccessLevel = 'None';
        share.CaseAccessLevel = 'None';
        share.RowCause = Schema.AccountShare.RowCause.Manual;

        insert share;
    }

    public static void removeAccountShare(Id accountId, Id userId) {
        List<AccountShare> shares = [
            SELECT Id
            FROM AccountShare
            WHERE AccountId = :accountId
              AND UserOrGroupId = :userId
              AND RowCause = :Schema.AccountShare.RowCause.Manual
        ];

        if(!shares.isEmpty()) {
            delete shares;
        }
    }
}
```

### Share with Public Group

```apex
public class GroupSharingExample {

    public static void shareWithGroup(Id accountId, String groupName, String accessLevel) {
        // Get group ID
        Group publicGroup = [
            SELECT Id
            FROM Group
            WHERE DeveloperName = :groupName
            AND Type = 'Regular'
            LIMIT 1
        ];

        AccountShare share = new AccountShare();
        share.AccountId = accountId;
        share.UserOrGroupId = publicGroup.Id;
        share.AccountAccessLevel = accessLevel;
        share.OpportunityAccessLevel = 'None';
        share.CaseAccessLevel = 'None';
        share.RowCause = Schema.AccountShare.RowCause.Manual;

        insert share;
    }
}
```

## 🎯 Apex Managed Sharing

### Create Sharing Reason

First, create custom sharing reason on object:
1. Setup → Object Manager → Property__c → Sharing Settings
2. Create new reason: `Property_Team_Access__c`

### Use Apex Managed Sharing

```apex
public class ApexManagedSharingExample {

    public static void sharePropertyWithTeam(Id propertyId, Id teamMemberId) {
        Property__Share share = new Property__Share();
        share.ParentId = propertyId;
        share.UserOrGroupId = teamMemberId;
        share.AccessLevel = 'Edit';
        share.RowCause = Schema.Property__Share.RowCause.Property_Team_Access__c;

        insert share;
    }

    public static void removeTeamAccess(Id propertyId) {
        List<Property__Share> shares = [
            SELECT Id
            FROM Property__Share
            WHERE ParentId = :propertyId
              AND RowCause = :Schema.Property__Share.RowCause.Property_Team_Access__c
        ];

        if(!shares.isEmpty()) {
            delete shares;
        }
    }
}
```

### Trigger Pattern for Auto-Sharing

```apex
trigger PropertyTrigger on Property__c (after insert, after update) {
    if(Trigger.isAfter) {
        if(Trigger.isInsert) {
            PropertySharingHandler.shareWithTeam(Trigger.new);
        }
        else if(Trigger.isUpdate) {
            PropertySharingHandler.updateSharing(Trigger.new, Trigger.oldMap);
        }
    }
}

public class PropertySharingHandler {

    public static void shareWithTeam(List<Property__c> properties) {
        List<Property__Share> shares = new List<Property__Share>();

        for(Property__c prop : properties) {
            if(prop.Team_Lead__c != null) {
                Property__Share share = new Property__Share();
                share.ParentId = prop.Id;
                share.UserOrGroupId = prop.Team_Lead__c;
                share.AccessLevel = 'Edit';
                share.RowCause = Schema.Property__Share.RowCause.Property_Team_Access__c;
                shares.add(share);
            }
        }

        if(!shares.isEmpty()) {
            insert shares;
        }
    }

    public static void updateSharing(List<Property__c> properties, Map<Id, Property__c> oldMap) {
        Set<Id> propertiesToReshare = new Set<Id>();

        for(Property__c prop : properties) {
            Property__c oldProp = oldMap.get(prop.Id);

            if(prop.Team_Lead__c != oldProp.Team_Lead__c) {
                propertiesToReshare.add(prop.Id);
            }
        }

        if(!propertiesToReshare.isEmpty()) {
            // Remove old shares
            delete [
                SELECT Id
                FROM Property__Share
                WHERE ParentId IN :propertiesToReshare
                  AND RowCause = :Schema.Property__Share.RowCause.Property_Team_Access__c
            ];

            // Add new shares
            shareWithTeam([
                SELECT Id, Team_Lead__c
                FROM Property__c
                WHERE Id IN :propertiesToReshare
            ]);
        }
    }
}
```

## 🚨 Common Security Vulnerabilities

### 1. SOQL Injection

```apex
// ❌ VULNERABLE
@AuraEnabled
public static List<Account> searchAccounts(String searchTerm) {
    String query = 'SELECT Id, Name FROM Account WHERE Name LIKE \'%' + searchTerm + '%\'';
    return Database.query(query);
}

// Attack: searchTerm = "test' OR '1'='1"

// ✅ SECURE
@AuraEnabled
public static List<Account> searchAccounts(String searchTerm) {
    searchTerm = String.escapeSingleQuotes(searchTerm);
    String query = 'SELECT Id, Name FROM Account WHERE Name LIKE \'%' + searchTerm + '%\'';
    return Database.query(query);
}

// ✅ BETTER - Use bind variables
@AuraEnabled
public static List<Account> searchAccounts(String searchTerm) {
    String likePattern = '%' + searchTerm + '%';
    return [SELECT Id, Name FROM Account WHERE Name LIKE :likePattern];
}
```

### 2. Missing FLS Checks

```apex
// ❌ VULNERABLE
@AuraEnabled
public static void updateAccount(Id accountId, String industry) {
    Account acc = new Account(Id = accountId, Industry = industry);
    update acc;  // No FLS check!
}

// ✅ SECURE
@AuraEnabled
public static void updateAccount(Id accountId, String industry) {
    if(!Schema.sObjectType.Account.isUpdateable() ||
       !Schema.sObjectType.Account.fields.Industry.isUpdateable()) {
        throw new SecurityException('Insufficient permissions');
    }

    Account acc = new Account(Id = accountId, Industry = industry);
    update acc;
}
```

### 3. Exposing Sensitive Data

```apex
// ❌ VULNERABLE
@AuraEnabled(cacheable=true)
public static List<Account> getAllAccounts() {
    // Returns ALL accounts with ALL fields
    return [SELECT Id, Name, (SELECT * FROM Contacts) FROM Account];
}

// ✅ SECURE
@AuraEnabled(cacheable=true)
public with sharing class SecureAccountController {
    public static List<Account> getAccessibleAccounts() {
        // Only returns accounts user can see
        // Only returns specific fields
        List<Account> accounts = [
            SELECT Id, Name
            FROM Account
        ];

        return Security.stripInaccessible(
            AccessType.READABLE,
            accounts
        ).getRecords();
    }
}
```

### 4. Missing Sharing Enforcement

```apex
// ❌ VULNERABLE
public class AccountService {
    // No sharing keyword = unpredictable behavior
    public static List<Account> getAccounts() {
        return [SELECT Id, Name FROM Account];
    }
}

// ✅ SECURE
public with sharing class AccountService {
    public static List<Account> getAccounts() {
        return [SELECT Id, Name FROM Account];
    }
}
```

## 💡 Best Practices

### ✅ DO:

1. **Always Specify Sharing**
   ```apex
   public with sharing class MyController {
       // Explicit is better
   }
   ```

2. **Check FLS for LWC Controllers**
   ```apex
   @AuraEnabled
   public with sharing class PropertyController {
       public static List<Property__c> getProperties() {
           if(!Schema.sObjectType.Property__c.isAccessible()) {
               throw new AuraHandledException('No access');
           }
           return [SELECT Id, Name FROM Property__c];
       }
   }
   ```

3. **Use stripInaccessible**
   ```apex
   SObjectAccessDecision decision = Security.stripInaccessible(
       AccessType.READABLE,
       records
   );
   return decision.getRecords();
   ```

4. **Validate User Input**
   ```apex
   public static void search(String term) {
       term = String.escapeSingleQuotes(term);
       // Use safely
   }
   ```

5. **Document Security Decisions**
   ```apex
   // Using without sharing because this is a scheduled job
   // that needs to access all records for reporting
   public without sharing class ReportScheduler {
       // ...
   }
   ```

### ❌ DON'T:

1. **Don't Skip Sharing Keywords**
   ```apex
   // ❌ BAD
   public class MyClass {  // Which sharing?
   ```

2. **Don't Expose All Data**
   ```apex
   // ❌ BAD
   @AuraEnabled
   public static List<Account> getAll() {
       return [SELECT Id, Name, (SELECT * FROM Contacts) FROM Account];
   }
   ```

3. **Don't Build Dynamic SOQL Unsafely**
   ```apex
   // ❌ BAD
   String query = 'SELECT Id FROM Account WHERE Name = \'' + name + '\'';
   ```

## 📚 Interview Questions

**Q: What's the difference between with sharing and without sharing?**
A:
- **with sharing**: Enforces record-level security, users only see records they have access to
- **without sharing**: Runs in system context, ignores sharing rules, sees all records

**Q: When should you use without sharing?**
A: System operations like integrations, scheduled jobs, triggers that need to access all records, or audit logging.

**Q: What is stripInaccessible used for?**
A: Removes fields from records that the user doesn't have access to read or update, enforcing Field-Level Security.

**Q: What's the difference between Manual and Apex Managed Sharing?**
A:
- **Manual**: Created via UI or Apex, RowCause = Manual
- **Apex Managed**: Uses custom sharing reason, automatically managed by code

**Q: How do you prevent SOQL injection?**
A: Use bind variables (`:variable`) or `String.escapeSingleQuotes()`

## 🚀 Next Steps

You now understand Salesforce security! Continue learning:

**[→ Back to Practical Guide](/docs/salesforce/apex/practical-guide)** - Apply security concepts

**[→ Start DevOps Track](/docs/intro)** - Deploy secure solutions

---

**You can now build secure, production-ready Apex code!** Always think security first. 🔐
