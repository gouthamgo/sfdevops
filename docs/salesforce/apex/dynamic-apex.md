---
sidebar_position: 9
title: Dynamic Apex
description: Build flexible code with Schema methods, reflection, and dynamic instantiation
---

# Dynamic Apex: Build Flexible, Reusable Code

Learn to write code that adapts at runtime using Schema methods, reflection, and dynamic instantiation. Build generic frameworks that work across objects, fields, and classes.

## 🎯 What You'll Master

- Schema class and describe methods
- Dynamic field access
- Type class and reflection
- Dynamic class instantiation
- Dynamic DML and SOQL
- Building generic frameworks
- Real-world use cases

## 📐 Schema Class

### Describe Objects

```apex
// Get object describe
Schema.DescribeSObjectResult accountDescribe = Account.sObjectType.getDescribe();

// Object information
String objectName = accountDescribe.getName();  // 'Account'
String objectLabel = accountDescribe.getLabel();  // 'Account'
String objectPluralLabel = accountDescribe.getLabelPlural();  // 'Accounts'
Boolean isCustom = accountDescribe.isCustom();  // false
Boolean isCreateable = accountDescribe.isCreateable();  // true (depends on permissions)
Boolean isUpdateable = accountDescribe.isUpdateable();  // true
Boolean isDeletable = accountDescribe.isDeletable();  // true

System.debug('Object: ' + objectLabel);
System.debug('API Name: ' + objectName);
System.debug('Is Custom: ' + isCustom);
```

### Describe Fields

```apex
// Get all fields
Map<String, Schema.SObjectField> fieldMap = Account.sObjectType.getDescribe().fields.getMap();

// Iterate through fields
for(String fieldName : fieldMap.keySet()) {
    Schema.SObjectField field = fieldMap.get(fieldName);
    Schema.DescribeFieldResult fieldDescribe = field.getDescribe();

    System.debug('Field: ' + fieldDescribe.getLabel());
    System.debug('API Name: ' + fieldDescribe.getName());
    System.debug('Type: ' + fieldDescribe.getType());
    System.debug('Length: ' + fieldDescribe.getLength());
    System.debug('Is Custom: ' + fieldDescribe.isCustom());
}
```

### Field Properties

```apex
Schema.DescribeFieldResult fieldDescribe = Account.Name.getDescribe();

// Field metadata
String fieldName = fieldDescribe.getName();  // 'Name'
String fieldLabel = fieldDescribe.getLabel();  // 'Account Name'
Schema.DisplayType fieldType = fieldDescribe.getType();  // STRING
Integer fieldLength = fieldDescribe.getLength();  // 255

// Field properties
Boolean isRequired = !fieldDescribe.isNillable();
Boolean isUnique = fieldDescribe.isUnique();
Boolean isExternalId = fieldDescribe.isExternalId();
Boolean isFormula = fieldDescribe.isCalculated();
Boolean isEncrypted = fieldDescribe.isEncrypted();

// Relationship info
if(fieldType == Schema.DisplayType.REFERENCE) {
    List<Schema.sObjectType> references = fieldDescribe.getReferenceTo();
    System.debug('References: ' + references);
}
```

### Picklist Values

```apex
public class PicklistUtils {

    public static List<String> getPicklistValues(String objectName, String fieldName) {
        List<String> values = new List<String>();

        // Get object describe
        Schema.SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
        Schema.DescribeSObjectResult objectDescribe = objectType.getDescribe();

        // Get field describe
        Schema.SObjectField field = objectDescribe.fields.getMap().get(fieldName);
        Schema.DescribeFieldResult fieldDescribe = field.getDescribe();

        // Get picklist values
        List<Schema.PicklistEntry> entries = fieldDescribe.getPicklistValues();
        for(Schema.PicklistEntry entry : entries) {
            if(entry.isActive()) {
                values.add(entry.getValue());
            }
        }

        return values;
    }
}

// Usage
List<String> stages = PicklistUtils.getPicklistValues('Opportunity', 'StageName');
System.debug('Opportunity Stages: ' + stages);
```

### Record Types

```apex
public class RecordTypeUtils {

    public static Map<String, Id> getRecordTypeMap(String objectName) {
        Map<String, Id> recordTypeMap = new Map<String, Id>();

        Schema.SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
        Schema.DescribeSObjectResult objectDescribe = objectType.getDescribe();

        // Get record types
        Map<String, Schema.RecordTypeInfo> recordTypes = objectDescribe.getRecordTypeInfosByName();

        for(String rtName : recordTypes.keySet()) {
            Schema.RecordTypeInfo rtInfo = recordTypes.get(rtName);
            if(rtInfo.isAvailable()) {
                recordTypeMap.put(rtName, rtInfo.getRecordTypeId());
            }
        }

        return recordTypeMap;
    }
}

// Usage
Map<String, Id> accountRTs = RecordTypeUtils.getRecordTypeMap('Account');
Id businessRT = accountRTs.get('Business Account');
```

## 🔄 Dynamic Field Access

### Get Field Values Dynamically

```apex
public class DynamicFieldAccess {

    public static Object getFieldValue(SObject record, String fieldName) {
        return record.get(fieldName);
    }

    public static void setFieldValue(SObject record, String fieldName, Object value) {
        record.put(fieldName, value);
    }
}

// Usage
Account acc = new Account(Name = 'Test');

// Get value
String name = (String)DynamicFieldAccess.getFieldValue(acc, 'Name');
System.debug('Name: ' + name);

// Set value
DynamicFieldAccess.setFieldValue(acc, 'Industry', 'Technology');
System.debug('Industry: ' + acc.Industry);
```

### Traverse Relationships Dynamically

```apex
public class RelationshipTraversal {

    public static Object getRelationshipValue(SObject record, String relationshipPath) {
        List<String> parts = relationshipPath.split('\\.');

        SObject currentRecord = record;
        for(Integer i = 0; i < parts.size() - 1; i++) {
            currentRecord = currentRecord.getSObject(parts[i]);
            if(currentRecord == null) {
                return null;
            }
        }

        return currentRecord.get(parts[parts.size() - 1]);
    }
}

// Usage
Contact con = [SELECT Id, Account.Owner.Name FROM Contact LIMIT 1];
String ownerName = (String)RelationshipTraversal.getRelationshipValue(con, 'Account.Owner.Name');
System.debug('Account Owner: ' + ownerName);
```

### Clone Records Dynamically

```apex
public class RecordCloner {

    public static SObject cloneRecord(SObject original, List<String> fieldsToClone) {
        SObject cloned = original.getSObjectType().newSObject();

        for(String fieldName : fieldsToClone) {
            Object value = original.get(fieldName);
            if(value != null) {
                cloned.put(fieldName, value);
            }
        }

        return cloned;
    }
}

// Usage
Account original = [SELECT Name, Industry, AnnualRevenue FROM Account LIMIT 1];
Account cloned = (Account)RecordCloner.cloneRecord(
    original,
    new List<String>{'Name', 'Industry', 'AnnualRevenue'}
);
cloned.Name = cloned.Name + ' (Clone)';
insert cloned;
```

## 🏗️ Type Class and Reflection

### Get Type Information

```apex
// Get type of object
Account acc = new Account();
Type accountType = Type.forName('Account');
System.debug('Type: ' + accountType);

// Check type
if(acc instanceof Account) {
    System.debug('Is Account');
}

// Get type from string
String className = 'Account';
Type objectType = Type.forName(className);
System.debug('Type from string: ' + objectType);
```

### Dynamic Class Instantiation

```apex
public interface Processor {
    void process();
}

public class AccountProcessor implements Processor {
    public void process() {
        System.debug('Processing accounts');
    }
}

public class ContactProcessor implements Processor {
    public void process() {
        System.debug('Processing contacts');
    }
}

public class ProcessorFactory {

    public static Processor getProcessor(String processorName) {
        Type processorType = Type.forName(processorName);

        if(processorType == null) {
            throw new IllegalArgumentException('Processor not found: ' + processorName);
        }

        return (Processor)processorType.newInstance();
    }
}

// Usage
Processor processor = ProcessorFactory.getProcessor('AccountProcessor');
processor.process();  // Outputs: Processing accounts
```

### Generic Interface Pattern

```apex
public interface DataService {
    List<SObject> getRecords();
    void saveRecords(List<SObject> records);
}

public class AccountService implements DataService {
    public List<SObject> getRecords() {
        return [SELECT Id, Name FROM Account LIMIT 10];
    }

    public void saveRecords(List<SObject> records) {
        update records;
    }
}

public class ServiceFactory {

    private static Map<String, String> serviceMap = new Map<String, String>{
        'Account' => 'AccountService',
        'Contact' => 'ContactService'
    };

    public static DataService getService(String objectName) {
        String serviceName = serviceMap.get(objectName);

        if(serviceName == null) {
            throw new IllegalArgumentException('No service for object: ' + objectName);
        }

        Type serviceType = Type.forName(serviceName);
        return (DataService)serviceType.newInstance();
    }
}

// Usage
DataService service = ServiceFactory.getService('Account');
List<SObject> records = service.getRecords();
```

## 📝 Dynamic DML

### Generic Insert/Update/Delete

```apex
public class DynamicDML {

    public static void insertRecords(List<SObject> records) {
        // Check permissions
        String objectName = records[0].getSObjectType().getDescribe().getName();
        Schema.DescribeSObjectResult objectDescribe =
            Schema.getGlobalDescribe().get(objectName).getDescribe();

        if(!objectDescribe.isCreateable()) {
            throw new DmlException('No permission to create ' + objectName);
        }

        insert records;
    }

    public static void updateRecords(List<SObject> records) {
        String objectName = records[0].getSObjectType().getDescribe().getName();
        Schema.DescribeSObjectResult objectDescribe =
            Schema.getGlobalDescribe().get(objectName).getDescribe();

        if(!objectDescribe.isUpdateable()) {
            throw new DmlException('No permission to update ' + objectName);
        }

        update records;
    }

    public static void deleteRecords(List<SObject> records) {
        String objectName = records[0].getSObjectType().getDescribe().getName();
        Schema.DescribeSObjectResult objectDescribe =
            Schema.getGlobalDescribe().get(objectName).getDescribe();

        if(!objectDescribe.isDeletable()) {
            throw new DmlException('No permission to delete ' + objectName);
        }

        delete records;
    }
}
```

### Field-Level Security Check

```apex
public class FLS {

    public static Boolean isFieldAccessible(String objectName, String fieldName) {
        Schema.SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
        Schema.DescribeSObjectResult objectDescribe = objectType.getDescribe();

        Schema.SObjectField field = objectDescribe.fields.getMap().get(fieldName);
        return field.getDescribe().isAccessible();
    }

    public static Boolean isFieldUpdateable(String objectName, String fieldName) {
        Schema.SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
        Schema.DescribeSObjectResult objectDescribe = objectType.getDescribe();

        Schema.SObjectField field = objectDescribe.fields.getMap().get(fieldName);
        Schema.DescribeFieldResult fieldDescribe = field.getDescribe();

        return fieldDescribe.isUpdateable() || fieldDescribe.isCreateable();
    }

    public static List<String> getAccessibleFields(String objectName, List<String> fields) {
        List<String> accessibleFields = new List<String>();

        for(String field : fields) {
            if(isFieldAccessible(objectName, field)) {
                accessibleFields.add(field);
            }
        }

        return accessibleFields;
    }
}

// Usage
List<String> fields = new List<String>{'Name', 'Industry', 'AnnualRevenue'};
List<String> accessible = FLS.getAccessibleFields('Account', fields);
```

## 🎨 Real-World Use Cases

### Generic Search Framework

```apex
public class UniversalSearch {

    public class SearchCriteria {
        public String objectName;
        public Map<String, Object> filters;
        public List<String> fields;
        public Integer limitCount;
    }

    public static List<SObject> search(SearchCriteria criteria) {
        // Build query
        String query = 'SELECT ' + String.join(criteria.fields, ', ');
        query += ' FROM ' + criteria.objectName;

        // Add filters
        if(criteria.filters != null && !criteria.filters.isEmpty()) {
            List<String> conditions = new List<String>();

            for(String fieldName : criteria.filters.keySet()) {
                Object value = criteria.filters.get(fieldName);

                if(value instanceof String) {
                    conditions.add(fieldName + ' = \'' + String.escapeSingleQuotes((String)value) + '\'');
                } else {
                    conditions.add(fieldName + ' = ' + value);
                }
            }

            query += ' WHERE ' + String.join(conditions, ' AND ');
        }

        // Add limit
        if(criteria.limitCount != null) {
            query += ' LIMIT ' + criteria.limitCount;
        }

        return Database.query(query);
    }
}

// Usage
UniversalSearch.SearchCriteria criteria = new UniversalSearch.SearchCriteria();
criteria.objectName = 'Account';
criteria.fields = new List<String>{'Id', 'Name', 'Industry'};
criteria.filters = new Map<String, Object>{'Industry' => 'Technology'};
criteria.limitCount = 10;

List<SObject> results = UniversalSearch.search(criteria);
```

### Generic Trigger Handler

```apex
public interface ITriggerHandler {
    void beforeInsert(List<SObject> newRecords);
    void afterInsert(List<SObject> newRecords);
    void beforeUpdate(List<SObject> newRecords, Map<Id, SObject> oldMap);
    void afterUpdate(List<SObject> newRecords, Map<Id, SObject> oldMap);
    void beforeDelete(List<SObject> oldRecords);
    void afterDelete(List<SObject> oldRecords);
    void afterUndelete(List<SObject> newRecords);
}

public abstract class TriggerHandler implements ITriggerHandler {
    public virtual void beforeInsert(List<SObject> newRecords) {}
    public virtual void afterInsert(List<SObject> newRecords) {}
    public virtual void beforeUpdate(List<SObject> newRecords, Map<Id, SObject> oldMap) {}
    public virtual void afterUpdate(List<SObject> newRecords, Map<Id, SObject> oldMap) {}
    public virtual void beforeDelete(List<SObject> oldRecords) {}
    public virtual void afterDelete(List<SObject> oldRecords) {}
    public virtual void afterUndelete(List<SObject> newRecords) {}
}

public class TriggerDispatcher {

    public static void run(ITriggerHandler handler) {
        if(Trigger.isBefore) {
            if(Trigger.isInsert) {
                handler.beforeInsert(Trigger.new);
            } else if(Trigger.isUpdate) {
                handler.beforeUpdate(Trigger.new, Trigger.oldMap);
            } else if(Trigger.isDelete) {
                handler.beforeDelete(Trigger.old);
            }
        } else if(Trigger.isAfter) {
            if(Trigger.isInsert) {
                handler.afterInsert(Trigger.new);
            } else if(Trigger.isUpdate) {
                handler.afterUpdate(Trigger.new, Trigger.oldMap);
            } else if(Trigger.isDelete) {
                handler.afterDelete(Trigger.old);
            } else if(Trigger.isUndelete) {
                handler.afterUndelete(Trigger.new);
            }
        }
    }
}

// Specific handler
public class AccountTriggerHandler extends TriggerHandler {

    public override void beforeInsert(List<SObject> newRecords) {
        for(Account acc : (List<Account>)newRecords) {
            if(acc.Name == null) {
                acc.Name = 'Default Name';
            }
        }
    }

    public override void afterInsert(List<SObject> newRecords) {
        System.debug('Accounts inserted: ' + newRecords.size());
    }
}

// Trigger
trigger AccountTrigger on Account (before insert, after insert, before update, after update) {
    TriggerDispatcher.run(new AccountTriggerHandler());
}
```

### CSV Export Framework

```apex
public class CSVExporter {

    public static String exportToCSV(List<SObject> records, List<String> fields) {
        if(records == null || records.isEmpty()) {
            return '';
        }

        // Header row
        String csv = String.join(fields, ',') + '\n';

        // Data rows
        for(SObject record : records) {
            List<String> values = new List<String>();

            for(String field : fields) {
                Object value = record.get(field);
                values.add(value != null ? String.valueOf(value) : '');
            }

            csv += String.join(values, ',') + '\n';
        }

        return csv;
    }
}

// Usage
List<Account> accounts = [SELECT Id, Name, Industry FROM Account LIMIT 10];
String csv = CSVExporter.exportToCSV(accounts, new List<String>{'Id', 'Name', 'Industry'});
System.debug(csv);
```

## 💡 Best Practices

### ✅ DO:

1. **Cache Describe Results**
   ```apex
   private static Map<String, Schema.DescribeSObjectResult> describeCache =
       new Map<String, Schema.DescribeSObjectResult>();

   public static Schema.DescribeSObjectResult getDescribe(String objectName) {
       if(!describeCache.containsKey(objectName)) {
           describeCache.put(objectName,
               Schema.getGlobalDescribe().get(objectName).getDescribe());
       }
       return describeCache.get(objectName);
   }
   ```

2. **Validate Input**
   ```apex
   public static List<SObject> query(String objectName, List<String> fields) {
       if(Schema.getGlobalDescribe().get(objectName) == null) {
           throw new IllegalArgumentException('Invalid object: ' + objectName);
       }
       // Continue...
   }
   ```

3. **Use Type-Safe Casting**
   ```apex
   Account acc = (Account)recordMap.get(accountId);
   ```

### ❌ DON'T:

1. **Call getGlobalDescribe() Repeatedly**
   ```apex
   // ❌ BAD
   for(String obj : objectNames) {
       Schema.getGlobalDescribe().get(obj);  // Called multiple times
   }

   // ✅ GOOD
   Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
   for(String obj : objectNames) {
       globalDescribe.get(obj);
   }
   ```

2. **Build Unsafe Dynamic SOQL**
   ```apex
   // ❌ BAD - SQL injection risk
   String name = getUserInput();
   String query = 'SELECT Id FROM Account WHERE Name = \'' + name + '\'';

   // ✅ GOOD
   String name = String.escapeSingleQuotes(getUserInput());
   ```

## 📚 Interview Questions

**Q: What is the Schema class used for?**
A: Provides describe methods to get metadata about objects, fields, picklists, and record types at runtime.

**Q: How do you dynamically instantiate a class?**
A: Use `Type.forName('ClassName').newInstance()`

**Q: What's the difference between `getSObject()` and `get()`?**
A: `getSObject()` returns related SObject, `get()` returns field value as Object.

**Q: How do you check field-level security dynamically?**
A: Use `fieldDescribe.isAccessible()`, `isUpdateable()`, or `isCreateable()`

**Q: Why cache describe results?**
A: Describe calls are expensive. Caching improves performance, especially in loops.

## 🚀 Next Steps

Practice building generic frameworks with this knowledge:

**[→ Back to Practical Guide](/docs/salesforce/apex/practical-guide)** - Apply dynamic Apex concepts

**[→ Start DevOps Track](/docs/intro)** - Deploy your dynamic solutions

---

**You can now build flexible, generic frameworks!** Use dynamic Apex to write reusable code. 💪
