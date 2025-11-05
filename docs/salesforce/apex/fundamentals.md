---
sidebar_position: 2
title: Apex Fundamentals
description: Learn Apex syntax, data types, and core programming concepts
---

# Apex Fundamentals

Apex is Salesforce's proprietary, strongly-typed, object-oriented programming language. It runs on the Salesforce Platform and allows you to execute flow and transaction control statements alongside database operations.

## 🎯 What You'll Learn

- Apex syntax and structure
- Data types and variables
- Collections (Lists, Sets, Maps)
- Control flow statements
- Object-oriented programming in Apex
- DML operations
- SOQL queries
- Governor limits and bulkification

## 📊 What is Apex?

**Apex characteristics:**
- Runs on Salesforce servers (not client-side)
- Strongly typed (must declare data types)
- Object-oriented (classes, inheritance, interfaces)
- Multi-tenant aware (governor limits)
- Case-insensitive
- Similar to Java syntax

### Where Apex Runs

```
┌─────────────────────────────────────┐
│         User Interface              │
│    (Lightning Web Components)       │
└──────────────┬──────────────────────┘
               │ calls
               ↓
┌──────────────────────────────────────┐
│         Apex Code                    │
│  (Runs on Salesforce Servers)        │
└──────────────┬───────────────────────┘
               │ queries/updates
               ↓
┌──────────────────────────────────────┐
│         Salesforce Database          │
└──────────────────────────────────────┘
```

## 🔨 Your First Apex Code

### Hello World in Developer Console

1. Setup → Developer Console
2. Debug → Open Execute Anonymous Window
3. Enter code:

```apex
System.debug('Hello, Salesforce!');
```

4. Check "Open Log"
5. Click Execute
6. View Debug Log → Filter for "DEBUG"

**Output:**
```
DEBUG|Hello, Salesforce!
```

### Working with Variables

```apex
// Declare and assign
String myName = 'John';
Integer age = 30;
Decimal price = 99.99;
Boolean isActive = true;
Date today = Date.today();

// Output
System.debug('Name: ' + myName);
System.debug('Age: ' + age);
System.debug('Price: ' + price);
System.debug('Active: ' + isActive);
System.debug('Today: ' + today);
```

## 📝 Data Types

### Primitive Data Types

```apex
// String - text
String name = 'Acme Corp';
String fullName = 'Jane' + ' ' + 'Doe';

// Integer - whole numbers
Integer count = 100;
Integer total = count + 50; // 150

// Long - large whole numbers
Long bigNumber = 2147483648L;

// Decimal - numbers with decimals
Decimal price = 99.99;
Decimal discounted = price * 0.9; // 89.991

// Double - scientific notation
Double scientific = 1.23e-4;

// Boolean - true/false
Boolean isActive = true;
Boolean hasPermission = false;

// Date - calendar date
Date birthDate = Date.newInstance(1990, 5, 15);
Date today = Date.today();

// DateTime - date and time
DateTime now = DateTime.now();
DateTime futureTime = now.addHours(24);

// Time - time only
Time startTime = Time.newInstance(9, 0, 0, 0); // 9:00 AM

// ID - Salesforce record ID
ID accountId = '0011234567890ABC';

// Blob - binary data
Blob fileData = Blob.valueOf('File contents');
```

### String Methods

```apex
String text = 'Hello World';

// Length
Integer len = text.length(); // 11

// Uppercase/Lowercase
String upper = text.toUpperCase(); // 'HELLO WORLD'
String lower = text.toLowerCase(); // 'hello world'

// Contains
Boolean hasWorld = text.contains('World'); // true

// Substring
String sub = text.substring(0, 5); // 'Hello'

// Replace
String replaced = text.replace('World', 'Salesforce'); // 'Hello Salesforce'

// Split
List<String> words = text.split(' '); // ['Hello', 'World']

// Trim whitespace
String padded = '  text  ';
String trimmed = padded.trim(); // 'text'
```

### Date and DateTime Methods

```apex
Date today = Date.today();
Date tomorrow = today.addDays(1);
Date nextWeek = today.addDays(7);
Date nextMonth = today.addMonths(1);

// Get components
Integer year = today.year();
Integer month = today.month();
Integer day = today.day();

// DateTime
DateTime now = DateTime.now();
DateTime future = now.addHours(24);
DateTime later = now.addMinutes(30);

// Format
String formatted = now.format('MM/dd/yyyy HH:mm');
```

## 📦 Collections

### Lists (Arrays)

```apex
// Declare list
List<String> cities = new List<String>();

// Add elements
cities.add('San Francisco');
cities.add('New York');
cities.add('Chicago');

// Initialize with values
List<Integer> numbers = new List<Integer>{1, 2, 3, 4, 5};

// Access elements
String firstCity = cities[0]; // 'San Francisco'
String lastCity = cities[2]; // 'Chicago'

// Size
Integer count = cities.size(); // 3

// Loop through list
for(String city : cities) {
    System.debug(city);
}

// Check if contains
Boolean hasNY = cities.contains('New York'); // true

// Remove element
cities.remove(1); // Removes 'New York'

// Clear all
cities.clear();
```

### Sets (Unique Values)

```apex
// Declare set
Set<String> uniqueCities = new Set<String>();

// Add elements
uniqueCities.add('San Francisco');
uniqueCities.add('New York');
uniqueCities.add('San Francisco'); // Duplicate, won't be added

// Size
Integer count = uniqueCities.size(); // 2

// Check if contains
Boolean hasCity = uniqueCities.contains('Chicago'); // false

// Loop through set
for(String city : uniqueCities) {
    System.debug(city);
}

// Convert list to set (removes duplicates)
List<String> cityList = new List<String>{'SF', 'NY', 'SF', 'LA'};
Set<String> uniqueSet = new Set<String>(cityList); // {SF, NY, LA}
```

### Maps (Key-Value Pairs)

```apex
// Declare map
Map<String, String> stateMap = new Map<String, String>();

// Add key-value pairs
stateMap.put('CA', 'California');
stateMap.put('NY', 'New York');
stateMap.put('TX', 'Texas');

// Initialize with values
Map<String, Integer> scores = new Map<String, Integer>{
    'Alice' => 95,
    'Bob' => 87,
    'Charlie' => 92
};

// Get value by key
String state = stateMap.get('CA'); // 'California'

// Check if key exists
Boolean hasKey = stateMap.containsKey('FL'); // false

// Size
Integer count = stateMap.size(); // 3

// Loop through map
for(String key : stateMap.keySet()) {
    String value = stateMap.get(key);
    System.debug(key + ' = ' + value);
}

// Get all keys
Set<String> keys = stateMap.keySet();

// Get all values
List<String> values = stateMap.values();

// Remove by key
stateMap.remove('TX');
```

## 🔄 Control Flow

### If-Else Statements

```apex
Integer age = 25;

if(age < 18) {
    System.debug('Minor');
} else if(age >= 18 && age < 65) {
    System.debug('Adult');
} else {
    System.debug('Senior');
}

// Ternary operator
String status = (age >= 18) ? 'Adult' : 'Minor';
```

### Switch Statements

```apex
String status = 'Sold';

switch on status {
    when 'Available' {
        System.debug('Property is available');
    }
    when 'Under Contract' {
        System.debug('Property is pending');
    }
    when 'Sold' {
        System.debug('Property is sold');
    }
    when else {
        System.debug('Unknown status');
    }
}
```

### For Loops

```apex
// Traditional for loop
for(Integer i = 0; i < 10; i++) {
    System.debug('Count: ' + i);
}

// For-each loop (list)
List<String> cities = new List<String>{'SF', 'NY', 'LA'};
for(String city : cities) {
    System.debug(city);
}

// For-each loop (set)
Set<Integer> numbers = new Set<Integer>{1, 2, 3, 4, 5};
for(Integer num : numbers) {
    System.debug(num);
}
```

### While Loops

```apex
Integer count = 0;

while(count < 5) {
    System.debug('Count: ' + count);
    count++;
}

// Do-while
Integer i = 0;
do {
    System.debug('i = ' + i);
    i++;
} while(i < 3);
```

## 💾 DML Operations

DML = Data Manipulation Language (Create, Read, Update, Delete)

### Insert - Create Records

```apex
// Single record
Account acc = new Account();
acc.Name = 'Acme Corp';
acc.Industry = 'Technology';
insert acc;

System.debug('New Account ID: ' + acc.Id);

// Multiple records (bulk)
List<Contact> contacts = new List<Contact>();

Contact c1 = new Contact(FirstName='John', LastName='Doe');
Contact c2 = new Contact(FirstName='Jane', LastName='Smith');

contacts.add(c1);
contacts.add(c2);

insert contacts;
```

### Update - Modify Records

```apex
// Query record
Account acc = [SELECT Id, Name, Industry FROM Account LIMIT 1];

// Modify fields
acc.Industry = 'Manufacturing';
acc.AnnualRevenue = 1000000;

// Save changes
update acc;

// Bulk update
List<Account> accounts = [SELECT Id, Rating FROM Account WHERE Industry = 'Technology'];

for(Account a : accounts) {
    a.Rating = 'Hot';
}

update accounts;
```

### Upsert - Insert or Update

```apex
// Upsert by ID
Account acc = new Account(Id='0011234567890ABC', Name='Updated Name');
upsert acc;

// Upsert by external ID
Account acc2 = new Account(External_ID__c='EXT123', Name='Acme Corp');
upsert acc2 External_ID__c;

// Bulk upsert
List<Account> accounts = new List<Account>();
// ... populate list ...
upsert accounts;
```

### Delete - Remove Records

```apex
// Delete single record
Account acc = [SELECT Id FROM Account WHERE Name = 'Test' LIMIT 1];
delete acc;

// Bulk delete
List<Account> oldAccounts = [SELECT Id FROM Account WHERE CreatedDate < LAST_YEAR];
delete oldAccounts;

// Undelete (restore from recycle bin)
undelete acc;
```

### DML with Try-Catch

```apex
try {
    Account acc = new Account(); // Missing required Name field
    insert acc;
} catch(DmlException e) {
    System.debug('Error: ' + e.getMessage());
    System.debug('Fields: ' + e.getDmlFields(0));
    System.debug('Status Code: ' + e.getDmlStatusCode(0));
}
```

## 🔍 SOQL Queries

SOQL = Salesforce Object Query Language (like SQL for Salesforce)

### Basic Query

```apex
// Query all accounts
List<Account> accounts = [SELECT Id, Name FROM Account];

// Query with WHERE clause
List<Account> techAccounts = [
    SELECT Id, Name, Industry
    FROM Account
    WHERE Industry = 'Technology'
];

// Query with LIMIT
Account singleAccount = [SELECT Id, Name FROM Account LIMIT 1];
```

### Query with Multiple Conditions

```apex
List<Account> accounts = [
    SELECT Id, Name, AnnualRevenue
    FROM Account
    WHERE Industry = 'Technology'
    AND AnnualRevenue > 1000000
    ORDER BY Name ASC
    LIMIT 10
];
```

### Query with LIKE (Pattern Matching)

```apex
// Names starting with 'Acme'
List<Account> accounts = [
    SELECT Id, Name
    FROM Account
    WHERE Name LIKE 'Acme%'
];

// Names containing 'Corp'
List<Account> accounts2 = [
    SELECT Id, Name
    FROM Account
    WHERE Name LIKE '%Corp%'
];
```

### Query with IN

```apex
Set<String> industries = new Set<String>{'Technology', 'Finance', 'Healthcare'};

List<Account> accounts = [
    SELECT Id, Name
    FROM Account
    WHERE Industry IN :industries
];
```

### Query Related Records (Parent)

```apex
// Query Contacts with related Account data
List<Contact> contacts = [
    SELECT Id, FirstName, LastName,
           Account.Name, Account.Industry
    FROM Contact
];

for(Contact c : contacts) {
    System.debug(c.FirstName + ' works at ' + c.Account.Name);
}
```

### Query Related Records (Child)

```apex
// Query Accounts with related Contacts
List<Account> accounts = [
    SELECT Id, Name,
           (SELECT Id, FirstName, LastName FROM Contacts)
    FROM Account
];

for(Account acc : accounts) {
    System.debug('Account: ' + acc.Name);
    for(Contact c : acc.Contacts) {
        System.debug('  Contact: ' + c.FirstName + ' ' + c.LastName);
    }
}
```

### Dynamic SOQL

```apex
String objectType = 'Account';
String fieldName = 'Name';
String searchValue = 'Acme';

String query = 'SELECT Id, ' + fieldName +
               ' FROM ' + objectType +
               ' WHERE ' + fieldName + ' LIKE \'%' + searchValue + '%\'';

List<SObject> results = Database.query(query);
```

## ⚖️ Governor Limits

Salesforce enforces limits to ensure multi-tenant performance:

| Operation | Synchronous Limit | Asynchronous Limit |
|-----------|-------------------|---------------------|
| SOQL Queries | 100 | 200 |
| Records Retrieved by SOQL | 50,000 | 50,000 |
| DML Statements | 150 | 150 |
| Records Processed by DML | 10,000 | 10,000 |
| CPU Time | 10,000 ms | 60,000 ms |
| Heap Size | 6 MB | 12 MB |

### Checking Limits

```apex
// Check current limits
System.debug('SOQL Queries: ' + Limits.getQueries() + ' / ' + Limits.getLimitQueries());
System.debug('DML Statements: ' + Limits.getDMLStatements() + ' / ' + Limits.getLimitDMLStatements());
System.debug('CPU Time: ' + Limits.getCpuTime() + ' / ' + Limits.getLimitCpuTime());
```

### Bulkification (Avoiding Limits)

```apex
❌ BAD - Query inside loop:
for(Account acc : accounts) {
    List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];
    // This runs 100 SOQL queries for 100 accounts!
}

✅ GOOD - Query once, use map:
Set<Id> accountIds = new Set<Id>();
for(Account acc : accounts) {
    accountIds.add(acc.Id);
}

List<Contact> allContacts = [SELECT Id, AccountId FROM Contact WHERE AccountId IN :accountIds];

Map<Id, List<Contact>> accountToContacts = new Map<Id, List<Contact>>();
for(Contact c : allContacts) {
    if(!accountToContacts.containsKey(c.AccountId)) {
        accountToContacts.put(c.AccountId, new List<Contact>());
    }
    accountToContacts.get(c.AccountId).add(c);
}

// Now use the map
for(Account acc : accounts) {
    List<Contact> contacts = accountToContacts.get(acc.Id);
    // Process contacts
}
```

## 📚 Interview Questions

**Q: What is the difference between List and Set?**
A:
- **List:** Ordered collection, allows duplicates, accessed by index
- **Set:** Unordered collection, no duplicates, faster lookups

**Q: What's the difference between `==` and `.equals()`?**
A: In Apex, `==` compares references for objects, while `.equals()` compares values. For primitives, use `==`. For Strings, both work the same.

**Q: What are governor limits?**
A: Salesforce-enforced runtime limits to ensure efficient resource usage in the multi-tenant environment. Examples: 100 SOQL queries, 150 DML statements per transaction.

**Q: What is bulkification?**
A: Writing code that handles multiple records efficiently to avoid hitting governor limits. Key: Query/DML outside loops, use collections.

**Q: What's the difference between insert and upsert?**
A:
- **insert:** Creates new records only, fails if record exists
- **upsert:** Creates new or updates existing based on ID or external ID

## 🚀 Next Steps

You've learned Apex fundamentals! Next topics coming soon:
- Apex Triggers
- Test Classes
- Asynchronous Apex

---

**You now understand Apex basics!** Practice by writing utility classes and helper methods. 🎓
