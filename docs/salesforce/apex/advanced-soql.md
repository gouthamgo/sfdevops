---
sidebar_position: 8
title: Advanced SOQL & SOSL
description: Master complex queries, subqueries, aggregations, and query optimization
---

# Advanced SOQL & SOSL: Query Like a Pro

Master advanced querying techniques to retrieve data efficiently and build complex applications. Learn when to use SOQL vs SOSL, optimization strategies, and advanced query patterns.

## 🎯 What You'll Master

- Complex SOQL queries with relationships
- Subqueries (parent-to-child and child-to-parent)
- Aggregate functions and GROUP BY
- Dynamic SOQL
- SOSL for full-text search
- Query optimization techniques
- QueryLocator vs Iterable
- Best practices and common pitfalls

## 📊 SOQL Deep Dive

### Relationship Queries

#### Parent-to-Child (1-to-Many)

```apex
// Query accounts with related contacts
List<Account> accounts = [
    SELECT Id, Name,
        (SELECT Id, FirstName, LastName, Email
         FROM Contacts
         WHERE Email != null
         ORDER BY CreatedDate DESC)
    FROM Account
    WHERE Industry = 'Technology'
];

// Access related contacts
for(Account acc : accounts) {
    System.debug('Account: ' + acc.Name);
    System.debug('Contact count: ' + acc.Contacts.size());

    for(Contact con : acc.Contacts) {
        System.debug('  Contact: ' + con.FirstName + ' ' + con.LastName);
    }
}
```

**Key Points:**
- Subquery in SELECT clause
- Relationship name is plural (Contacts, not Contact)
- Returns List of related records
- Can have up to 20 levels deep

#### Child-to-Parent (Many-to-1)

```apex
// Query contacts with related account
List<Contact> contacts = [
    SELECT Id, FirstName, LastName,
           Account.Name,
           Account.Industry,
           Account.Owner.Name,
           Account.Parent.Name
    FROM Contact
    WHERE Account.Industry = 'Technology'
];

// Access parent fields
for(Contact con : contacts) {
    System.debug('Contact: ' + con.FirstName);
    System.debug('Account: ' + con.Account.Name);
    System.debug('Account Owner: ' + con.Account.Owner.Name);
    System.debug('Parent Account: ' + con.Account.Parent.Name);
}
```

**Key Points:**
- Use relationship name (Account, not Account__c)
- Can traverse up to 5 levels (Account.Owner.Manager.Name)
- Use dot notation

### Complex Subqueries

#### Multiple Subqueries

```apex
List<Account> accounts = [
    SELECT Id, Name,
        (SELECT Id, Name FROM Contacts),
        (SELECT Id, Name FROM Opportunities WHERE StageName = 'Closed Won'),
        (SELECT Id, Subject FROM Tasks WHERE Status = 'Open')
    FROM Account
    WHERE Type = 'Customer'
];
```

#### Subquery with Aggregation

```apex
List<Account> accounts = [
    SELECT Id, Name,
        (SELECT COUNT() FROM Contacts) ContactCount,
        (SELECT SUM(Amount) FROM Opportunities WHERE StageName = 'Closed Won') TotalRevenue
    FROM Account
];

// NOTE: This won't work! Can't use aggregate in subquery
// Instead, use parent query aggregation or Apex calculation
```

### Aggregate Functions

#### Basic Aggregates

```apex
// COUNT
AggregateResult[] results = [
    SELECT COUNT(Id) totalContacts
    FROM Contact
];
Integer total = (Integer)results[0].get('totalContacts');

// SUM, AVG, MIN, MAX
AggregateResult[] results = [
    SELECT
        SUM(Amount) totalAmount,
        AVG(Amount) avgAmount,
        MIN(Amount) minAmount,
        MAX(Amount) maxAmount
    FROM Opportunity
    WHERE StageName = 'Closed Won'
];

Decimal total = (Decimal)results[0].get('totalAmount');
Decimal average = (Decimal)results[0].get('avgAmount');
```

#### GROUP BY

```apex
// Group by single field
AggregateResult[] results = [
    SELECT StageName, COUNT(Id) oppCount, SUM(Amount) totalAmount
    FROM Opportunity
    GROUP BY StageName
];

for(AggregateResult result : results) {
    String stage = (String)result.get('StageName');
    Integer count = (Integer)result.get('oppCount');
    Decimal amount = (Decimal)result.get('totalAmount');

    System.debug(stage + ': ' + count + ' opportunities, $' + amount);
}

// Group by multiple fields
AggregateResult[] results = [
    SELECT StageName, OwnerId, COUNT(Id) oppCount
    FROM Opportunity
    GROUP BY StageName, OwnerId
];
```

#### HAVING Clause

```apex
// Filter groups
AggregateResult[] results = [
    SELECT AccountId, SUM(Amount) totalAmount
    FROM Opportunity
    GROUP BY AccountId
    HAVING SUM(Amount) > 100000
];

// HAVING with COUNT
AggregateResult[] results = [
    SELECT AccountId, COUNT(Id) oppCount
    FROM Opportunity
    GROUP BY AccountId
    HAVING COUNT(Id) > 5
];
```

#### GROUP BY with Relationships

```apex
// Group by parent field
AggregateResult[] results = [
    SELECT Account.Industry, COUNT(Id) contactCount
    FROM Contact
    GROUP BY Account.Industry
];

// Group by with date functions
AggregateResult[] results = [
    SELECT CALENDAR_YEAR(CreatedDate) year,
           CALENDAR_MONTH(CreatedDate) month,
           COUNT(Id) oppCount,
           SUM(Amount) totalAmount
    FROM Opportunity
    GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)
    ORDER BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)
];
```

### Advanced WHERE Conditions

#### Date Functions

```apex
// Date literals
List<Opportunity> opps = [
    SELECT Id, Name
    FROM Opportunity
    WHERE CreatedDate = TODAY
];

List<Opportunity> opps = [
    SELECT Id, Name
    FROM Opportunity
    WHERE CreatedDate = LAST_N_DAYS:30
];

List<Opportunity> opps = [
    SELECT Id, Name
    FROM Opportunity
    WHERE CloseDate = THIS_MONTH
];

// Date range
Date startDate = Date.today().addDays(-30);
Date endDate = Date.today();

List<Opportunity> opps = [
    SELECT Id, Name
    FROM Opportunity
    WHERE CloseDate >= :startDate
      AND CloseDate <= :endDate
];
```

**Common Date Literals:**
- TODAY, TOMORROW, YESTERDAY
- LAST_WEEK, THIS_WEEK, NEXT_WEEK
- LAST_MONTH, THIS_MONTH, NEXT_MONTH
- LAST_N_DAYS:n, NEXT_N_DAYS:n
- THIS_FISCAL_QUARTER, NEXT_FISCAL_YEAR

#### Semi-Joins (Filtering with Subqueries)

```apex
// Find accounts that have opportunities
List<Account> accounts = [
    SELECT Id, Name
    FROM Account
    WHERE Id IN (
        SELECT AccountId
        FROM Opportunity
        WHERE StageName = 'Closed Won'
    )
];

// Anti-join: Accounts WITHOUT opportunities
List<Account> accounts = [
    SELECT Id, Name
    FROM Account
    WHERE Id NOT IN (
        SELECT AccountId
        FROM Opportunity
    )
];
```

#### Complex Conditions

```apex
// Multiple conditions with OR
List<Opportunity> opps = [
    SELECT Id, Name
    FROM Opportunity
    WHERE (StageName = 'Prospecting' OR StageName = 'Qualification')
      AND Amount > 50000
      AND CloseDate <= NEXT_30_DAYS
];

// LIKE operator
List<Contact> contacts = [
    SELECT Id, Name
    FROM Contact
    WHERE Email LIKE '%@gmail.com'
       OR Email LIKE '%@yahoo.com'
];

// IN with dynamic list
Set<String> industries = new Set<String>{'Technology', 'Healthcare', 'Finance'};
List<Account> accounts = [
    SELECT Id, Name
    FROM Account
    WHERE Industry IN :industries
];
```

### Query Limits and FOR Loops

#### FOR Loop with SOQL

```apex
// Standard approach (loads all in memory)
for(Account acc : [SELECT Id, Name FROM Account]) {
    // Process account
}

// Better for large datasets (chunked querying)
for(List<Account> accounts : [SELECT Id, Name FROM Account]) {
    for(Account acc : accounts) {
        // Process account
    }
}
```

#### LIMIT and OFFSET

```apex
// Pagination
Integer pageSize = 50;
Integer pageNumber = 0;

List<Account> accounts = [
    SELECT Id, Name
    FROM Account
    ORDER BY Name
    LIMIT :pageSize
    OFFSET :(pageNumber * pageSize)
];

// Get first record
Account acc = [SELECT Id, Name FROM Account LIMIT 1];
```

#### ORDER BY

```apex
// Single field
List<Contact> contacts = [
    SELECT Id, Name
    FROM Contact
    ORDER BY LastName ASC
];

// Multiple fields
List<Contact> contacts = [
    SELECT Id, Name
    FROM Contact
    ORDER BY LastName ASC, FirstName ASC
];

// With NULLS FIRST/LAST
List<Opportunity> opps = [
    SELECT Id, Name, Amount
    FROM Opportunity
    ORDER BY Amount DESC NULLS LAST
];
```

## 🔍 Dynamic SOQL

### Building Queries Dynamically

```apex
public class DynamicSOQLExample {

    public static List<SObject> searchRecords(
        String objectName,
        List<String> fields,
        String whereClause,
        Integer limitCount
    ) {
        // Validate input
        if(String.isBlank(objectName) || fields == null || fields.isEmpty()) {
            throw new IllegalArgumentException('Invalid parameters');
        }

        // Build query
        String query = 'SELECT ' + String.join(fields, ', ');
        query += ' FROM ' + objectName;

        if(String.isNotBlank(whereClause)) {
            query += ' WHERE ' + whereClause;
        }

        if(limitCount != null && limitCount > 0) {
            query += ' LIMIT ' + limitCount;
        }

        System.debug('Executing query: ' + query);

        return Database.query(query);
    }
}

// Usage
List<SObject> results = DynamicSOQLExample.searchRecords(
    'Account',
    new List<String>{'Id', 'Name', 'Industry'},
    'Industry = \'Technology\'',
    10
);

for(SObject result : results) {
    Account acc = (Account)result;
    System.debug(acc.Name);
}
```

### Dynamic WHERE Conditions

```apex
public class DynamicFilterExample {

    public static List<Account> getFilteredAccounts(
        String industry,
        Decimal minRevenue,
        String city
    ) {
        String query = 'SELECT Id, Name, Industry, AnnualRevenue FROM Account WHERE Id != null';

        // Add filters dynamically
        if(String.isNotBlank(industry)) {
            query += ' AND Industry = :industry';
        }

        if(minRevenue != null) {
            query += ' AND AnnualRevenue >= :minRevenue';
        }

        if(String.isNotBlank(city)) {
            query += ' AND BillingCity = :city';
        }

        return Database.query(query);
    }
}
```

### Security Considerations

```apex
// ❌ WRONG - SQL Injection risk
String searchTerm = 'test\' OR \'1\'=\'1';
String query = 'SELECT Id FROM Account WHERE Name = \'' + searchTerm + '\'';
List<Account> accounts = Database.query(query);

// ✅ RIGHT - Use bind variables
String searchTerm = getUserInput();
String query = 'SELECT Id FROM Account WHERE Name = :searchTerm';
List<Account> accounts = Database.query(query);

// ✅ RIGHT - Escape special characters
String searchTerm = String.escapeSingleQuotes(getUserInput());
String query = 'SELECT Id FROM Account WHERE Name = \'' + searchTerm + '\'';
List<Account> accounts = Database.query(query);
```

## 🔎 SOSL (Salesforce Object Search Language)

### When to Use SOSL vs SOQL

```
Use SOSL when:
├── Searching across multiple objects
├── Full-text search needed
├── Don't know which field contains data
├── Need fuzzy matching
└── Search in long text fields

Use SOQL when:
├── Querying single object
├── Need specific field values
├── Need relationships
├── Need ordering and grouping
└── Building reports
```

### Basic SOSL

```apex
// Search across all searchable fields
List<List<SObject>> searchResults = [
    FIND 'John Smith'
    IN ALL FIELDS
    RETURNING Account(Id, Name), Contact(Id, Name, Email)
];

// Extract results
List<Account> accounts = (List<Account>)searchResults[0];
List<Contact> contacts = (List<Contact>)searchResults[1];

System.debug('Found ' + accounts.size() + ' accounts');
System.debug('Found ' + contacts.size() + ' contacts');
```

### SOSL Search Groups

```apex
// Search in name fields only
List<List<SObject>> searchResults = [
    FIND 'Acme'
    IN NAME FIELDS
    RETURNING Account(Id, Name), Opportunity(Id, Name)
];

// Search in email fields
List<List<SObject>> searchResults = [
    FIND 'john@example.com'
    IN EMAIL FIELDS
    RETURNING Contact(Id, Name, Email), Lead(Id, Name, Email)
];

// Search in phone fields
List<List<SObject>> searchResults = [
    FIND '415*'
    IN PHONE FIELDS
    RETURNING Contact(Id, Name, Phone)
];
```

### SOSL with WHERE and ORDER BY

```apex
List<List<SObject>> searchResults = [
    FIND 'Technology'
    IN ALL FIELDS
    RETURNING
        Account(Id, Name, Industry WHERE Industry = 'Technology' ORDER BY Name LIMIT 10),
        Contact(Id, Name WHERE Account.Industry = 'Technology')
];
```

### Dynamic SOSL

```apex
public class DynamicSOSLExample {

    public static Map<String, List<SObject>> search(String searchTerm, List<String> objects) {
        String returning = String.join(objects, '(Id, Name), ') + '(Id, Name)';
        String soslQuery = 'FIND \'' + String.escapeSingleQuotes(searchTerm) +
                          '\' IN ALL FIELDS RETURNING ' + returning;

        List<List<SObject>> results = Search.query(soslQuery);

        Map<String, List<SObject>> resultMap = new Map<String, List<SObject>>();
        for(Integer i = 0; i < objects.size(); i++) {
            resultMap.put(objects[i], results[i]);
        }

        return resultMap;
    }
}

// Usage
Map<String, List<SObject>> results = DynamicSOSLExample.search(
    'John',
    new List<String>{'Account', 'Contact', 'Lead'}
);
```

## ⚡ Query Optimization

### Selective Queries

```apex
// ❌ BAD - Non-selective (scans entire table)
List<Contact> contacts = [
    SELECT Id, Name
    FROM Contact
    WHERE LastName != 'Smith'
];

// ✅ GOOD - Selective (uses index)
List<Contact> contacts = [
    SELECT Id, Name
    FROM Contact
    WHERE Email = 'john@example.com'
];

// ✅ GOOD - Selective with indexed field
List<Contact> contacts = [
    SELECT Id, Name
    FROM Contact
    WHERE AccountId = :accountId
];
```

**Indexed Fields (Selective):**
- Id
- Name
- OwnerId
- CreatedDate
- SystemModstamp
- Lookup/Master-Detail fields
- Custom fields with "External ID" or "Unique"

### Query Plans

```apex
// View query plan in Developer Console
// 1. Open Developer Console
// 2. Go to Query Editor
// 3. Check "Use Tooling API"
// 4. Run: SELECT Id FROM Account WHERE Industry = 'Technology'
// 5. View "Query Plan" tab

// Example of efficient query plan:
// Index: Account.Industry
// Cost: 10 (lower is better)
// Cardinality: 100 (number of rows)
```

### Bulkify Queries

```apex
// ❌ BAD - Query in loop
for(Opportunity opp : opportunities) {
    Account acc = [SELECT Id, Name FROM Account WHERE Id = :opp.AccountId];
    // Process
}

// ✅ GOOD - Single query
Set<Id> accountIds = new Set<Id>();
for(Opportunity opp : opportunities) {
    accountIds.add(opp.AccountId);
}

Map<Id, Account> accounts = new Map<Id, Account>([
    SELECT Id, Name FROM Account WHERE Id IN :accountIds
]);

for(Opportunity opp : opportunities) {
    Account acc = accounts.get(opp.AccountId);
    // Process
}
```

### Query Result Caching

```apex
public class QueryCache {
    private static Map<Id, Account> accountCache = new Map<Id, Account>();

    public static Account getAccount(Id accountId) {
        // Check cache first
        if(accountCache.containsKey(accountId)) {
            return accountCache.get(accountId);
        }

        // Query if not cached
        Account acc = [SELECT Id, Name FROM Account WHERE Id = :accountId];
        accountCache.put(accountId, acc);

        return acc;
    }
}
```

## 💡 Best Practices

### ✅ DO:

1. **Use Selective Filters**
   ```apex
   // Use indexed fields in WHERE clause
   WHERE Id = :recordId
   WHERE OwnerId = :userId
   WHERE CreatedDate = LAST_N_DAYS:30
   ```

2. **Limit Query Results**
   ```apex
   SELECT Id FROM Account LIMIT 50000  // Max governor limit
   ```

3. **Use For Loop for Large Datasets**
   ```apex
   for(Account acc : [SELECT Id FROM Account]) {
       // Chunked automatically
   }
   ```

4. **Query Only Needed Fields**
   ```apex
   // ✅ GOOD
   SELECT Id, Name FROM Account

   // ❌ BAD (not supported anyway)
   SELECT * FROM Account
   ```

5. **Use Bind Variables for Security**
   ```apex
   String name = getUserInput();
   List<Account> accounts = [SELECT Id FROM Account WHERE Name = :name];
   ```

### ❌ DON'T:

1. **Query in Loops**
   ```apex
   // ❌ NEVER DO THIS
   for(Id accId : accountIds) {
       Account acc = [SELECT Id FROM Account WHERE Id = :accId];
   }
   ```

2. **Use Non-Selective Queries**
   ```apex
   // ❌ BAD
   SELECT Id FROM Contact WHERE Email != null  // Not selective
   ```

3. **Query Without LIMIT on Large Tables**
   ```apex
   // ❌ BAD
   List<Task> tasks = [SELECT Id FROM Task];  // Could return millions

   // ✅ GOOD
   List<Task> tasks = [SELECT Id FROM Task LIMIT 1000];
   ```

## 📚 Interview Questions

**Q: What's the difference between SOQL and SOSL?**
A:
- **SOQL**: Queries single object, returns exact matches, supports relationships
- **SOSL**: Searches multiple objects, full-text search, fuzzy matching

**Q: What is a selective query?**
A: A query with WHERE clause that uses indexed fields and returns small subset of records (typically < 10% of total). Uses index for faster execution.

**Q: How many levels of relationships can you query?**
A:
- Parent-to-child: Up to 20 levels
- Child-to-parent: Up to 5 levels

**Q: What's the maximum SOQL queries per transaction?**
A: 100 SOQL queries (synchronous), 200 (asynchronous)

**Q: How do you prevent SQL injection in dynamic SOQL?**
A: Use bind variables (`:variable`) or `String.escapeSingleQuotes()`

## 🚀 Next Steps

Master dynamic Apex for even more powerful code:

**[→ Next: Dynamic Apex](/docs/salesforce/apex/dynamic-apex)**

---

**You can now query data like a pro!** Practice with complex queries to build muscle memory. 💪
