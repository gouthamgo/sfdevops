---
sidebar_position: 13
title: Custom Metadata & Settings
description: Master Custom Metadata Types and Custom Settings for building configurable, maintainable Salesforce applications
---

# Custom Metadata & Settings: Build Configurable Apps

Master Custom Metadata Types and Custom Settings to build flexible, configuration-driven applications that adapt without code changes.

## 🎯 What You'll Master

- Custom Metadata Types fundamentals
- Custom Settings (Hierarchy vs List)
- When to use each approach
- Creating and deploying metadata
- Querying in Apex
- Protected Custom Metadata
- Testing with custom metadata
- Migration patterns
- Enterprise configuration patterns
- Best practices

## 🤔 Custom Metadata vs Custom Settings

### Comparison Table

| Feature | Custom Metadata | Custom Settings (Hierarchy) | Custom Settings (List) |
|---------|----------------|---------------------------|---------------------|
| **Deployable** | ✅ Yes (metadata) | ❌ No (data) | ❌ No (data) |
| **Query** | SOQL | Cached methods | Cached methods |
| **Count against limits** | ❌ No | ✅ Yes (query rows) | ✅ Yes (query rows) |
| **Relationships** | ✅ Lookup fields | ❌ No | ❌ No |
| **Visibility** | Org-wide | User/Profile/Org | Org-wide |
| **Packagable** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Performance** | Fast | Very fast (cached) | Very fast (cached) |
| **Use case** | App config | User-specific config | Simple key-value |

### Decision Framework

```
Use Custom Metadata When:
├── Need to deploy config across orgs
├── Config changes require deployment
├── Need relationships between configs
├── Building managed packages
└── Complex configuration schemas

Use Custom Settings (Hierarchy) When:
├── User/Profile-specific settings
├── Need different values per user
├── Performance is critical (cached)
└── Simple configuration values

Use Custom Settings (List) When:
├── Simple key-value pairs
├── Org-wide settings only
├── Performance is critical (cached)
└── No relationships needed
```

## 📦 Custom Metadata Types

### Creating Custom Metadata Type

```
Setup → Custom Metadata Types → New Custom Metadata Type

Name: Payment_Gateway__mdt
Label: Payment Gateway
Plural Label: Payment Gateways

Fields:
- Endpoint__c (URL)
- API_Key__c (Text, Encrypted)
- Timeout__c (Number)
- Is_Active__c (Checkbox)
- Retry_Count__c (Number)
- Payment_Methods__c (Text, Long)
```

### Define in VS Code

```xml
<!-- paymentGateway__mdt.object-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Payment Gateway</label>
    <pluralLabel>Payment Gateways</pluralLabel>
    <visibility>Public</visibility>
</CustomObject>
```

```xml
<!-- Endpoint__c.field-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Endpoint__c</fullName>
    <label>Endpoint</label>
    <type>Url</type>
    <required>true</required>
</CustomField>
```

### Create Metadata Records

```xml
<!-- Stripe.md-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Stripe</label>
    <protected>false</protected>
    <values>
        <field>Endpoint__c</field>
        <value xsi:type="xsd:string">https://api.stripe.com</value>
    </values>
    <values>
        <field>API_Key__c</field>
        <value xsi:type="xsd:string">sk_test_xyz</value>
    </values>
    <values>
        <field>Timeout__c</field>
        <value xsi:type="xsd:double">30000</value>
    </values>
    <values>
        <field>Is_Active__c</field>
        <value xsi:type="xsd:boolean">true</value>
    </values>
</CustomMetadata>
```

### Query Custom Metadata in Apex

```apex
public class PaymentGatewayService {

    // Cache for better performance
    private static Map<String, Payment_Gateway__mdt> gatewayCache;

    // Query all active gateways
    public static List<Payment_Gateway__mdt> getActiveGateways() {
        return [
            SELECT DeveloperName, Endpoint__c, API_Key__c,
                   Timeout__c, Retry_Count__c, Payment_Methods__c
            FROM Payment_Gateway__mdt
            WHERE Is_Active__c = true
        ];
    }

    // Get specific gateway with caching
    public static Payment_Gateway__mdt getGateway(String gatewayName) {
        if (gatewayCache == null) {
            loadCache();
        }

        if (!gatewayCache.containsKey(gatewayName)) {
            throw new PaymentException('Gateway not found: ' + gatewayName);
        }

        return gatewayCache.get(gatewayName);
    }

    private static void loadCache() {
        gatewayCache = new Map<String, Payment_Gateway__mdt>();

        for (Payment_Gateway__mdt gateway : getActiveGateways()) {
            gatewayCache.put(gateway.DeveloperName, gateway);
        }
    }

    // Use metadata for configuration
    public static HttpResponse processPayment(String gatewayName, Decimal amount) {
        Payment_Gateway__mdt gateway = getGateway(gatewayName);

        HttpRequest req = new HttpRequest();
        req.setEndpoint(gateway.Endpoint__c + '/charge');
        req.setMethod('POST');
        req.setHeader('Authorization', 'Bearer ' + gateway.API_Key__c);
        req.setTimeout(Integer.valueOf(gateway.Timeout__c));

        Map<String, Object> payload = new Map<String, Object>{
            'amount' => amount,
            'currency' => 'usd'
        };
        req.setBody(JSON.serialize(payload));

        Http http = new Http();
        HttpResponse res;

        // Retry logic based on metadata
        Integer retries = Integer.valueOf(gateway.Retry_Count__c);
        for (Integer i = 0; i <= retries; i++) {
            try {
                res = http.send(req);
                if (res.getStatusCode() == 200) {
                    return res;
                }
            } catch (Exception e) {
                if (i == retries) {
                    throw e;
                }
            }
        }

        return res;
    }

    public class PaymentException extends Exception {}
}
```

### Custom Metadata with Relationships

```xml
<!-- Integration_Endpoint__mdt -->
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Integration Endpoint</label>
    <pluralLabel>Integration Endpoints</pluralLabel>
</CustomObject>

<!-- Service__c field (Lookup to another custom metadata) -->
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Service__c</fullName>
    <label>Service</label>
    <type>MetadataRelationship</type>
    <referenceTo>Integration_Service__mdt</referenceTo>
    <relationshipLabel>Endpoints</relationshipLabel>
    <relationshipName>Endpoints</relationshipName>
</CustomField>
```

```apex
// Query with relationships
List<Integration_Endpoint__mdt> endpoints = [
    SELECT DeveloperName, URL__c,
           Service__r.DeveloperName,
           Service__r.Authentication_Type__c,
           Service__r.Base_URL__c
    FROM Integration_Endpoint__mdt
    WHERE Service__r.Is_Active__c = true
];

for (Integration_Endpoint__mdt endpoint : endpoints) {
    System.debug('Endpoint: ' + endpoint.URL__c);
    System.debug('Service: ' + endpoint.Service__r.DeveloperName);
    System.debug('Auth: ' + endpoint.Service__r.Authentication_Type__c);
}
```

## ⚙️ Custom Settings

### Hierarchy Custom Settings

Perfect for user/profile-specific configurations.

```
Setup → Custom Settings → New

Setting Type: Hierarchy
Label: Application_Settings
Object Name: Application_Settings
Description: User and profile-specific settings

Fields:
- Debug_Mode__c (Checkbox)
- Max_Records__c (Number)
- Email_Notifications__c (Checkbox)
- Theme__c (Text)
```

```apex
public class ApplicationSettingsService {

    // Get setting for current user (checks User → Profile → Org hierarchy)
    public static Application_Settings__c getSettings() {
        return Application_Settings__c.getInstance();
    }

    // Get setting for specific user
    public static Application_Settings__c getSettings(Id userId) {
        return Application_Settings__c.getInstance(userId);
    }

    // Get setting for specific profile
    public static Application_Settings__c getSettings(Id profileId) {
        return Application_Settings__c.getInstance(profileId);
    }

    // Use settings in code
    public static void processRecords() {
        Application_Settings__c settings = getSettings();

        if (settings.Debug_Mode__c) {
            System.debug('Debug mode is ON');
        }

        Integer maxRecords = Integer.valueOf(settings.Max_Records__c);
        List<Property__c> properties = [
            SELECT Id, Name
            FROM Property__c
            LIMIT :maxRecords
        ];

        if (settings.Email_Notifications__c) {
            sendNotifications(properties);
        }
    }

    private static void sendNotifications(List<Property__c> properties) {
        // Send emails
    }

    // Helper methods for common settings
    public static Boolean isDebugEnabled() {
        return getSettings().Debug_Mode__c == true;
    }

    public static Integer getMaxRecords() {
        Application_Settings__c settings = getSettings();
        return settings.Max_Records__c != null ?
               Integer.valueOf(settings.Max_Records__c) : 100;
    }

    public static Boolean areEmailsEnabled() {
        return getSettings().Email_Notifications__c == true;
    }
}
```

**Set Values:**

```apex
// Create org-level default
Application_Settings__c orgDefaults = new Application_Settings__c(
    SetupOwnerId = UserInfo.getOrganizationId(),
    Debug_Mode__c = false,
    Max_Records__c = 100,
    Email_Notifications__c = true
);
insert orgDefaults;

// Create profile-specific setting
Application_Settings__c profileSettings = new Application_Settings__c(
    SetupOwnerId = profileId,
    Debug_Mode__c = true,
    Max_Records__c = 50
);
insert profileSettings;

// Create user-specific setting
Application_Settings__c userSettings = new Application_Settings__c(
    SetupOwnerId = userId,
    Debug_Mode__c = true
);
insert userSettings;
```

### List Custom Settings

Simple key-value storage for org-wide configuration.

```
Setup → Custom Settings → New

Setting Type: List
Label: API_Configuration
Object Name: API_Configuration
Description: API endpoint configurations

Fields:
- Endpoint__c (URL)
- API_Key__c (Text)
- Timeout__c (Number)
```

```apex
public class APIConfigService {

    // Get all configurations
    public static Map<String, API_Configuration__c> getAllConfigs() {
        return API_Configuration__c.getAll();
    }

    // Get specific configuration by name
    public static API_Configuration__c getConfig(String configName) {
        return API_Configuration__c.getInstance(configName);
    }

    // Use configuration
    public static HttpResponse callAPI(String apiName, String endpoint) {
        API_Configuration__c config = getConfig(apiName);

        if (config == null) {
            throw new ConfigException('API configuration not found: ' + apiName);
        }

        HttpRequest req = new HttpRequest();
        req.setEndpoint(config.Endpoint__c + endpoint);
        req.setMethod('GET');
        req.setHeader('Authorization', 'Bearer ' + config.API_Key__c);
        req.setTimeout(Integer.valueOf(config.Timeout__c));

        Http http = new Http();
        return http.send(req);
    }

    public class ConfigException extends Exception {}
}
```

**Set Values:**

```apex
// Create configuration records
API_Configuration__c stripeConfig = new API_Configuration__c(
    Name = 'Stripe',
    Endpoint__c = 'https://api.stripe.com',
    API_Key__c = 'sk_live_xyz',
    Timeout__c = 30000
);
insert stripeConfig;

API_Configuration__c paypalConfig = new API_Configuration__c(
    Name = 'PayPal',
    Endpoint__c = 'https://api.paypal.com',
    API_Key__c = 'paypal_key',
    Timeout__c = 20000
);
insert paypalConfig;
```

## 🏗️ Enterprise Configuration Patterns

### Feature Flag Pattern

```apex
// Feature_Flag__mdt
public class FeatureFlagService {

    private static Map<String, Feature_Flag__mdt> flagCache;

    public static Boolean isEnabled(String featureName) {
        if (flagCache == null) {
            loadFlags();
        }

        Feature_Flag__mdt flag = flagCache.get(featureName);

        if (flag == null) {
            return false;  // Default to disabled
        }

        // Check if feature is enabled
        if (!flag.Is_Enabled__c) {
            return false;
        }

        // Check start and end dates
        if (flag.Start_Date__c != null && System.today() < flag.Start_Date__c) {
            return false;
        }

        if (flag.End_Date__c != null && System.today() > flag.End_Date__c) {
            return false;
        }

        // Check percentage rollout
        if (flag.Rollout_Percentage__c != null && flag.Rollout_Percentage__c < 100) {
            return isUserInRollout(flag.Rollout_Percentage__c);
        }

        return true;
    }

    private static void loadFlags() {
        flagCache = new Map<String, Feature_Flag__mdt>();

        for (Feature_Flag__mdt flag : [
            SELECT DeveloperName, Is_Enabled__c, Start_Date__c,
                   End_Date__c, Rollout_Percentage__c
            FROM Feature_Flag__mdt
        ]) {
            flagCache.put(flag.DeveloperName, flag);
        }
    }

    private static Boolean isUserInRollout(Decimal percentage) {
        // Hash user ID to determine if in rollout
        Integer hash = Math.abs(UserInfo.getUserId().hashCode());
        return Math.mod(hash, 100) < percentage;
    }
}

// Usage in code
if (FeatureFlagService.isEnabled('New_Property_Search')) {
    // New implementation
    executeNewPropertySearch();
} else {
    // Old implementation
    executeOldPropertySearch();
}
```

### Environment Configuration Pattern

```apex
// Environment__mdt (Sandbox, UAT, Production)
public class EnvironmentService {

    private static Environment__mdt currentEnvironment;

    public static Environment__mdt getCurrentEnvironment() {
        if (currentEnvironment == null) {
            // Detect current environment
            String orgId = UserInfo.getOrganizationId();

            currentEnvironment = [
                SELECT DeveloperName, Type__c, API_Endpoint__c,
                       Log_Level__c, Email_Domain__c, Max_Retries__c
                FROM Environment__mdt
                WHERE Organization_Id__c = :orgId
                LIMIT 1
            ];
        }

        return currentEnvironment;
    }

    public static Boolean isProduction() {
        return getCurrentEnvironment().Type__c == 'Production';
    }

    public static Boolean isSandbox() {
        return getCurrentEnvironment().Type__c == 'Sandbox';
    }

    public static String getAPIEndpoint() {
        return getCurrentEnvironment().API_Endpoint__c;
    }

    public static String getLogLevel() {
        return getCurrentEnvironment().Log_Level__c;
    }
}

// Usage
if (EnvironmentService.isProduction()) {
    // Production-specific logic
    endpoint = EnvironmentService.getAPIEndpoint();
} else {
    // Sandbox-specific logic
    endpoint = 'https://test-api.example.com';
}
```

### Configuration Service Pattern

Centralized service for all configuration access.

```apex
public class ConfigurationService {

    // Custom Metadata
    public static Payment_Gateway__mdt getPaymentGateway(String name) {
        return [
            SELECT Endpoint__c, API_Key__c, Timeout__c
            FROM Payment_Gateway__mdt
            WHERE DeveloperName = :name
            LIMIT 1
        ];
    }

    // Hierarchy Custom Setting
    public static Integer getMaxRecordsForUser() {
        Application_Settings__c settings =
            Application_Settings__c.getInstance();
        return Integer.valueOf(settings.Max_Records__c);
    }

    // List Custom Setting
    public static String getAPIKey(String apiName) {
        API_Configuration__c config =
            API_Configuration__c.getInstance(apiName);
        return config != null ? config.API_Key__c : null;
    }

    // Combined configuration logic
    public static HttpRequest buildAPIRequest(String apiName, String endpoint) {
        // Get metadata config
        Payment_Gateway__mdt gateway = getPaymentGateway(apiName);

        // Get custom setting
        String apiKey = getAPIKey(apiName);

        HttpRequest req = new HttpRequest();
        req.setEndpoint(gateway.Endpoint__c + endpoint);
        req.setMethod('POST');
        req.setHeader('Authorization', 'Bearer ' + apiKey);
        req.setTimeout(Integer.valueOf(gateway.Timeout__c));

        return req;
    }
}
```

## 🔒 Protected Custom Metadata

Prevent subscribers from modifying configuration.

```xml
<CustomMetadata xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Stripe Production</label>
    <protected>true</protected>  <!-- Prevents modification -->
    <values>
        <field>Endpoint__c</field>
        <value xsi:type="xsd:string">https://api.stripe.com</value>
    </values>
</CustomMetadata>
```

## 🧪 Testing with Custom Metadata

### Test Custom Metadata

```apex
@isTest
private class PaymentGatewayServiceTest {

    @isTest
    static void testGetActiveGateways() {
        // Custom metadata is available in tests
        List<Payment_Gateway__mdt> gateways =
            PaymentGatewayService.getActiveGateways();

        System.assertNotEquals(0, gateways.size(),
                             'Should have active gateways');
    }

    @isTest
    static void testProcessPayment() {
        // Set mock callout
        Test.setMock(HttpCalloutMock.class, new MockPaymentCallout());

        Test.startTest();

        HttpResponse res = PaymentGatewayService.processPayment('Stripe', 100);

        Test.stopTest();

        System.assertEquals(200, res.getStatusCode());
    }
}
```

### Test Custom Settings

```apex
@isTest
private class ApplicationSettingsServiceTest {

    @isTest
    static void testGetSettings() {
        // Create test setting
        Application_Settings__c testSettings = new Application_Settings__c(
            SetupOwnerId = UserInfo.getUserId(),
            Debug_Mode__c = true,
            Max_Records__c = 50,
            Email_Notifications__c = false
        );
        insert testSettings;

        Test.startTest();

        Application_Settings__c settings =
            ApplicationSettingsService.getSettings();

        Test.stopTest();

        System.assertEquals(true, settings.Debug_Mode__c);
        System.assertEquals(50, settings.Max_Records__c);
    }

    @isTest
    static void testIsDebugEnabled() {
        Application_Settings__c testSettings = new Application_Settings__c(
            SetupOwnerId = UserInfo.getOrganizationId(),
            Debug_Mode__c = true
        );
        insert testSettings;

        Test.startTest();

        Boolean debugEnabled = ApplicationSettingsService.isDebugEnabled();

        Test.stopTest();

        System.assertEquals(true, debugEnabled);
    }
}
```

## 🔄 Migration Patterns

### Migrate Custom Settings to Custom Metadata

```apex
public class SettingsMigration {

    public static void migrateToMetadata() {
        // Read from Custom Settings
        Map<String, API_Configuration__c> oldConfigs =
            API_Configuration__c.getAll();

        // Convert to Custom Metadata (prepare deployment package)
        List<Map<String, Object>> metadataRecords =
            new List<Map<String, Object>>();

        for (String key : oldConfigs.keySet()) {
            API_Configuration__c config = oldConfigs.get(key);

            metadataRecords.add(new Map<String, Object>{
                'DeveloperName' => key.replaceAll(' ', '_'),
                'Endpoint__c' => config.Endpoint__c,
                'API_Key__c' => config.API_Key__c,
                'Timeout__c' => config.Timeout__c
            });
        }

        // Generate metadata XML files (manual process)
        System.debug(JSON.serializePretty(metadataRecords));
    }
}
```

## 💡 Best Practices

### ✅ DO:

1. **Use Custom Metadata for Deployable Config**
   ```apex
   // ✅ GOOD - Deploy across environments
   Payment_Gateway__mdt gateway = [
       SELECT Endpoint__c FROM Payment_Gateway__mdt WHERE DeveloperName = 'Stripe'
   ];
   ```

2. **Cache Metadata Queries**
   ```apex
   private static Map<String, Payment_Gateway__mdt> cache;

   if (cache == null) {
       cache = loadMetadata();
   }
   ```

3. **Provide Defaults**
   ```apex
   Integer maxRecords = settings.Max_Records__c != null ?
                       Integer.valueOf(settings.Max_Records__c) : 100;
   ```

4. **Document Configuration**
   ```apex
   /**
    * Feature Flags:
    * - New_Property_Search: Enables new search UI (rollout: 50%)
    * - Advanced_Filters: Enables advanced filtering (enabled)
    */
   ```

5. **Version Configuration**
   ```apex
   // Add Version__c field to track changes
   if (config.Version__c >= 2.0) {
       useNewLogic();
   }
   ```

### ❌ DON'T:

1. **Don't Store Secrets in List Settings**
   ```apex
   // ❌ BAD - Visible in setup
   API_Configuration__c config = API_Configuration__c.getInstance('API');
   String apiKey = config.API_Key__c;

   // ✅ GOOD - Use Named Credentials or Custom Metadata with encryption
   ```

2. **Don't Query in Loops**
   ```apex
   // ❌ BAD
   for (String gateway : gateways) {
       Payment_Gateway__mdt config = [SELECT ... WHERE DeveloperName = :gateway];
   }

   // ✅ GOOD
   Map<String, Payment_Gateway__mdt> configs = new Map<String, Payment_Gateway__mdt>();
   for (Payment_Gateway__mdt config : [SELECT ... WHERE DeveloperName IN :gateways]) {
       configs.put(config.DeveloperName, config);
   }
   ```

3. **Don't Hardcode Values**
   ```apex
   // ❌ BAD
   Integer timeout = 30000;

   // ✅ GOOD
   Integer timeout = Integer.valueOf(gateway.Timeout__c);
   ```

## 🚀 Next Steps

Master configuration management:

**[→ Dynamic Apex](/docs/salesforce/apex/dynamic-apex)** - Build flexible code

**[→ Security & Sharing](/docs/salesforce/apex/security-sharing)** - Secure your config

**[→ Testing Guide](/docs/salesforce/apex/testing)** - Test configurations

---

**You can now build configurable applications!** Use metadata and settings to adapt without code changes. ⚙️
