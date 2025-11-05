---
sidebar_position: 6
title: Integration & APIs
description: Connect Salesforce with external systems using REST and SOAP APIs
---

# Integration & APIs: Connect to External Systems

Integration connects Salesforce with external systems, enabling data exchange and process automation across platforms. Master REST and SOAP APIs, callouts, and integration patterns.

## 🎯 What You'll Learn

- REST vs. SOAP APIs
- Making HTTP callouts from Apex
- Consuming external REST APIs
- Building custom REST APIs
- Authentication patterns (OAuth, API keys)
- Handling responses and errors
- Integration best practices
- Testing callouts

## 📊 REST vs. SOAP

### Comparison

| Feature | REST | SOAP |
|---------|------|------|
| **Protocol** | HTTP | Multiple (HTTP, SMTP, etc.) |
| **Format** | JSON, XML | XML only |
| **Standards** | Less rigid | Strict standards (WSDL) |
| **Performance** | Faster, lightweight | Slower, more overhead |
| **State** | Stateless | Can be stateful |
| **Caching** | Supports caching | No caching |
| **Best For** | Web/mobile apps | Enterprise systems |

### When to Use Each

```
Use REST When:
├── Modern web/mobile apps
├── Public APIs
├── JSON data preferred
├── Simplicity matters
└── Performance is critical

Use SOAP When:
├── Enterprise systems
├── ACID compliance required
├── Security is paramount
├── Legacy system integration
└── Formal contracts (WSDL) needed
```

## 🌐 HTTP Callouts

### Basic REST Callout (GET)

```apex
public class WeatherService {

    public static String getWeather(String city) {
        // Create HTTP request
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.weather.com/v1/current?city=' + city);
        req.setMethod('GET');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Authorization', 'Bearer YOUR_API_KEY');

        // Send request
        Http http = new Http();
        HttpResponse res = http.send(req);

        // Handle response
        if(res.getStatusCode() == 200) {
            return res.getBody();
        } else {
            throw new CalloutException('Weather API failed: ' + res.getStatusCode());
        }
    }
}

// Call the method
String weather = WeatherService.getWeather('San Francisco');
System.debug(weather);
```

### POST Request with JSON Body

```apex
public class PropertyExternalSync {

    public static void createPropertyInExternalSystem(Property__c prop) {
        // Prepare JSON body
        Map<String, Object> body = new Map<String, Object>{
            'name' => prop.Name,
            'price' => prop.Listing_Price__c,
            'address' => prop.Address__c,
            'status' => prop.Status__c
        };

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.example.com/properties');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Authorization', 'Bearer ' + getAccessToken());
        req.setBody(JSON.serialize(body));
        req.setTimeout(120000); // 120 seconds

        Http http = new Http();
        HttpResponse res = http.send(req);

        if(res.getStatusCode() == 201) {
            // Parse response
            Map<String, Object> responseData = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
            String externalId = (String)responseData.get('id');

            // Update Salesforce record
            prop.External_ID__c = externalId;
            update prop;
        } else {
            System.debug('Error: ' + res.getBody());
        }
    }

    private static String getAccessToken() {
        // Implementation to get OAuth token
        return 'YOUR_ACCESS_TOKEN';
    }
}
```

### PUT Request (Update)

```apex
public class PropertyUpdateService {

    public static void updateExternalProperty(Property__c prop) {
        Map<String, Object> body = new Map<String, Object>{
            'price' => prop.Listing_Price__c,
            'status' => prop.Status__c
        };

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.example.com/properties/' + prop.External_ID__c);
        req.setMethod('PUT');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(JSON.serialize(body));

        Http http = new Http();
        HttpResponse res = http.send(req);

        if(res.getStatusCode() != 200) {
            throw new CalloutException('Update failed: ' + res.getBody());
        }
    }
}
```

### DELETE Request

```apex
public class PropertyDeleteService {

    public static void deleteExternalProperty(String externalId) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.example.com/properties/' + externalId);
        req.setMethod('DELETE');
        req.setHeader('Authorization', 'Bearer ' + getAccessToken());

        Http http = new Http();
        HttpResponse res = http.send(req);

        if(res.getStatusCode() != 204) {
            throw new CalloutException('Delete failed');
        }
    }

    private static String getAccessToken() {
        return 'YOUR_ACCESS_TOKEN';
    }
}
```

## 🔐 Authentication Patterns

### API Key Authentication

```apex
public class APIKeyAuth {

    private static final String API_KEY = 'your_api_key_here';

    public static HttpResponse makeAuthenticatedRequest(String endpoint) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        // API key in header
        req.setHeader('X-API-Key', API_KEY);

        Http http = new Http();
        return http.send(req);
    }
}
```

### Basic Authentication

```apex
public class BasicAuth {

    public static HttpResponse makeAuthenticatedRequest(String endpoint) {
        String username = 'your_username';
        String password = 'your_password';

        // Encode credentials
        String credentials = username + ':' + password;
        Blob headerValue = Blob.valueOf(credentials);
        String authorizationHeader = 'Basic ' + EncodingUtil.base64Encode(headerValue);

        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        req.setHeader('Authorization', authorizationHeader);

        Http http = new Http();
        return http.send(req);
    }
}
```

### OAuth 2.0 (Client Credentials)

```apex
public class OAuth2Service {

    private static String accessToken;
    private static DateTime tokenExpiry;

    public static String getAccessToken() {
        // Return cached token if still valid
        if(accessToken != null && tokenExpiry > DateTime.now()) {
            return accessToken;
        }

        // Request new token
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://oauth.example.com/token');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/x-www-form-urlencoded');

        String body = 'grant_type=client_credentials';
        body += '&client_id=' + getClientId();
        body += '&client_secret=' + getClientSecret();
        req.setBody(body);

        Http http = new Http();
        HttpResponse res = http.send(req);

        if(res.getStatusCode() == 200) {
            Map<String, Object> responseData = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
            accessToken = (String)responseData.get('access_token');
            Integer expiresIn = (Integer)responseData.get('expires_in');
            tokenExpiry = DateTime.now().addSeconds(expiresIn);

            return accessToken;
        } else {
            throw new CalloutException('OAuth failed: ' + res.getBody());
        }
    }

    private static String getClientId() {
        // Retrieve from Custom Metadata or Protected Custom Settings
        return 'YOUR_CLIENT_ID';
    }

    private static String getClientSecret() {
        // Retrieve from Named Credentials or Protected Custom Settings
        return 'YOUR_CLIENT_SECRET';
    }
}
```

### Named Credentials (Recommended)

```apex
public class NamedCredentialCallout {

    public static void makeCallout() {
        // Named Credential handles authentication automatically
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:My_Named_Credential/api/properties');
        req.setMethod('GET');

        Http http = new Http();
        HttpResponse res = http.send(req);

        System.debug('Response: ' + res.getBody());
    }
}
```

**Setup Named Credential:**
1. Setup → Named Credentials
2. Create New Named Credential
3. Enter URL, Authentication Protocol
4. Save credentials securely

## 📥 Consuming External REST APIs

### Parse JSON Response

```apex
public class GitHubService {

    public class Repository {
        public String name;
        public String description;
        public Integer stargazers_count;
    }

    public static List<Repository> getUserRepos(String username) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.github.com/users/' + username + '/repos');
        req.setMethod('GET');
        req.setHeader('Accept', 'application/json');
        req.setHeader('User-Agent', 'Salesforce-Integration');

        Http http = new Http();
        HttpResponse res = http.send(req);

        if(res.getStatusCode() == 200) {
            // Deserialize JSON to list of objects
            List<Repository> repos = (List<Repository>)JSON.deserialize(
                res.getBody(),
                List<Repository>.class
            );
            return repos;
        }

        return new List<Repository>();
    }
}

// Usage
List<GitHubService.Repository> repos = GitHubService.getUserRepos('octocat');
for(GitHubService.Repository repo : repos) {
    System.debug(repo.name + ': ' + repo.stargazers_count + ' stars');
}
```

### Handle Complex JSON

```apex
public class ComplexJSONExample {

    public static void parseComplexResponse() {
        String jsonResponse = '{"user": {"name": "John", "addresses": [{"city": "SF"}, {"city": "LA"}]}}';

        // Method 1: Untyped deserialization
        Map<String, Object> data = (Map<String, Object>)JSON.deserializeUntyped(jsonResponse);
        Map<String, Object> user = (Map<String, Object>)data.get('user');
        String name = (String)user.get('name');

        List<Object> addresses = (List<Object>)user.get('addresses');
        for(Object addr : addresses) {
            Map<String, Object> address = (Map<String, Object>)addr;
            System.debug('City: ' + address.get('city'));
        }

        // Method 2: Typed deserialization with wrapper class
        ResponseWrapper wrapper = (ResponseWrapper)JSON.deserialize(jsonResponse, ResponseWrapper.class);
        System.debug('Name: ' + wrapper.user.name);
    }

    public class ResponseWrapper {
        public UserInfo user;
    }

    public class UserInfo {
        public String name;
        public List<Address> addresses;
    }

    public class Address {
        public String city;
    }
}
```

## 🔧 Building Custom REST APIs

### Expose Apex Class as REST Endpoint

```apex
@RestResource(urlMapping='/properties/*')
global with sharing class PropertyRESTService {

    // GET: Retrieve property by ID
    @HttpGet
    global static Property__c getProperty() {
        RestRequest req = RestContext.request;
        String propertyId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);

        Property__c property = [
            SELECT Id, Name, Listing_Price__c, Address__c, Status__c
            FROM Property__c
            WHERE Id = :propertyId
            LIMIT 1
        ];

        return property;
    }

    // POST: Create new property
    @HttpPost
    global static String createProperty(String name, Decimal price, String address) {
        Property__c prop = new Property__c(
            Name = name,
            Listing_Price__c = price,
            Address__c = address,
            Status__c = 'Available'
        );

        insert prop;

        return prop.Id;
    }

    // PUT: Update property
    @HttpPut
    global static String updateProperty(String id, Decimal price, String status) {
        Property__c prop = [SELECT Id FROM Property__c WHERE Id = :id];
        prop.Listing_Price__c = price;
        prop.Status__c = status;

        update prop;

        return 'Updated successfully';
    }

    // DELETE: Delete property
    @HttpDelete
    global static String deleteProperty() {
        RestRequest req = RestContext.request;
        String propertyId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);

        Property__c prop = [SELECT Id FROM Property__c WHERE Id = :id];
        delete prop;

        return 'Deleted successfully';
    }

    // PATCH: Partial update
    @HttpPatch
    global static String patchProperty() {
        RestRequest req = RestContext.request;
        String propertyId = req.requestURI.substring(req.requestURI.lastIndexOf('/') + 1);

        // Parse JSON body
        Map<String, Object> updates = (Map<String, Object>)JSON.deserializeUntyped(req.requestBody.toString());

        Property__c prop = [SELECT Id FROM Property__c WHERE Id = :propertyId];

        if(updates.containsKey('price')) {
            prop.Listing_Price__c = (Decimal)updates.get('price');
        }

        if(updates.containsKey('status')) {
            prop.Status__c = (String)updates.get('status');
        }

        update prop;

        return 'Patched successfully';
    }
}
```

### Call Custom REST API

```bash
# GET request
curl https://yourinstance.salesforce.com/services/apexrest/properties/a001234567890ABC \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# POST request
curl -X POST https://yourinstance.salesforce.com/services/apexrest/properties \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Beach House", "price": 850000, "address": "123 Ocean Ave"}'

# PUT request
curl -X PUT https://yourinstance.salesforce.com/services/apexrest/properties \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "a001234567890ABC", "price": 900000, "status": "Sold"}'
```

## 🔄 Integration Patterns

### Pattern 1: Request-Response (Synchronous)

```apex
// Immediate response required
public class SyncIntegration {

    public static String validateAddress(String address) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.usps.com/validate?address=' + EncodingUtil.urlEncode(address, 'UTF-8'));
        req.setMethod('GET');

        Http http = new Http();
        HttpResponse res = http.send(req);

        return res.getBody(); // Return immediately
    }
}
```

### Pattern 2: Fire-and-Forget (Asynchronous)

```apex
// No response needed
public class AsyncIntegration {

    @future(callout=true)
    public static void logEventToExternalSystem(String eventData) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.analytics.com/events');
        req.setMethod('POST');
        req.setBody(eventData);

        Http http = new Http();
        http.send(req); // Don't wait for response
    }
}
```

### Pattern 3: Batch Integration

```apex
// Process many records
public class BatchIntegration implements Database.Batchable<SObject>, Database.AllowsCallouts {

    public Database.QueryLocator start(Database.BatchableContext bc) {
        return Database.getQueryLocator([
            SELECT Id, Name, External_ID__c
            FROM Property__c
            WHERE Needs_Sync__c = true
        ]);
    }

    public void execute(Database.BatchableContext bc, List<Property__c> scope) {
        // Batch callout
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.example.com/batch');
        req.setMethod('POST');
        req.setBody(JSON.serialize(scope));

        Http http = new Http();
        HttpResponse res = http.send(req);

        if(res.getStatusCode() == 200) {
            for(Property__c prop : scope) {
                prop.Needs_Sync__c = false;
            }
            update scope;
        }
    }

    public void finish(Database.BatchableContext bc) {
        System.debug('Batch integration complete');
    }
}
```

### Pattern 4: Platform Events (Pub/Sub)

```apex
// Publish event
public class EventPublisher {

    public static void publishPropertyEvent(Property__c prop) {
        Property_Event__e event = new Property_Event__e(
            Property_Id__c = prop.Id,
            Property_Name__c = prop.Name,
            Action__c = 'Created'
        );

        Database.SaveResult result = EventBus.publish(event);

        if(result.isSuccess()) {
            System.debug('Event published successfully');
        }
    }
}

// Subscribe to event
trigger PropertyEventTrigger on Property_Event__e (after insert) {
    for(Property_Event__e event : Trigger.new) {
        // Make callout to external system
        ExternalSystemIntegration.notifyExternalSystem(event);
    }
}
```

## ⚠️ Error Handling

### Comprehensive Error Handling

```apex
public class RobustCallout {

    public static void makeCallout() {
        Integer retryCount = 0;
        Integer maxRetries = 3;
        Boolean success = false;

        while(retryCount < maxRetries && !success) {
            try {
                HttpRequest req = new HttpRequest();
                req.setEndpoint('https://api.example.com/data');
                req.setMethod('GET');
                req.setTimeout(30000);

                Http http = new Http();
                HttpResponse res = http.send(req);

                // Check status code
                if(res.getStatusCode() == 200) {
                    success = true;
                    processResponse(res.getBody());
                } else if(res.getStatusCode() == 429) {
                    // Rate limit - wait and retry
                    System.debug('Rate limited, retrying...');
                    retryCount++;
                } else if(res.getStatusCode() >= 500) {
                    // Server error - retry
                    System.debug('Server error, retrying...');
                    retryCount++;
                } else {
                    // Client error - don't retry
                    throw new CalloutException('Client error: ' + res.getStatusCode());
                }

            } catch(System.CalloutException e) {
                System.debug('Callout failed: ' + e.getMessage());
                retryCount++;

                if(retryCount >= maxRetries) {
                    // Log error to custom object
                    logIntegrationError(e.getMessage());
                    throw e;
                }
            }
        }
    }

    private static void processResponse(String body) {
        // Process successful response
    }

    private static void logIntegrationError(String errorMsg) {
        Integration_Error__c error = new Integration_Error__c(
            Error_Message__c = errorMsg,
            Timestamp__c = DateTime.now()
        );
        insert error;
    }
}
```

## 🧪 Testing Callouts

### Mock HTTP Response

```apex
@isTest
global class MockHttpResponseGenerator implements HttpCalloutMock {

    global HTTPResponse respond(HTTPRequest req) {
        // Create mock response
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{"name": "Test Property", "price": 500000}');
        res.setStatusCode(200);

        return res;
    }
}
```

### Test Class with Mock

```apex
@isTest
private class PropertyExternalSyncTest {

    @isTest
    static void testCreateProperty() {
        // Set mock
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());

        Property__c prop = new Property__c(Name = 'Test Property');
        insert prop;

        Test.startTest();
        PropertyExternalSync.createPropertyInExternalSystem(prop);
        Test.stopTest();

        // Verify
        Property__c updated = [SELECT External_ID__c FROM Property__c WHERE Id = :prop.Id];
        System.assertNotEquals(null, updated.External_ID__c);
    }
}
```

### Multi-Response Mock

```apex
@isTest
global class MultiResponseMock implements HttpCalloutMock {

    global HTTPResponse respond(HTTPRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');

        // Different responses based on endpoint
        if(req.getEndpoint().contains('/properties')) {
            res.setBody('{"id": "ext123", "name": "Property"}');
            res.setStatusCode(201);
        } else if(req.getEndpoint().contains('/auth')) {
            res.setBody('{"access_token": "token123"}');
            res.setStatusCode(200);
        }

        return res;
    }
}
```

## 💡 Best Practices

### ✅ DO:

1. **Use Named Credentials**
   ```apex
   // ✅ GOOD - Secure, manageable
   req.setEndpoint('callout:My_Named_Credential/api/data');
   ```

2. **Set Timeouts**
   ```apex
   req.setTimeout(120000); // 2 minutes
   ```

3. **Handle All Status Codes**
   ```apex
   if(res.getStatusCode() == 200) {
       // Success
   } else if(res.getStatusCode() == 429) {
       // Rate limit
   } else {
       // Error
   }
   ```

4. **Use Remote Site Settings**
   - Setup → Remote Site Settings
   - Add external URLs

5. **Log Integration Errors**
   ```apex
   Integration_Error__c error = new Integration_Error__c(
       Error_Message__c = e.getMessage(),
       Request_Body__c = requestBody,
       Response_Code__c = res.getStatusCode()
   );
   insert error;
   ```

### ❌ DON'T:

1. **Don't Hardcode Credentials**
   ```apex
   // ❌ WRONG
   String apiKey = 'sk_live_abc123';
   ```

2. **Don't Make Callouts Without @future or Queueable**
   ```apex
   // ❌ WRONG - Can't make callouts in triggers without async
   trigger PropertyTrigger on Property__c (after insert) {
       Http http = new Http(); // Will fail!
   }
   ```

3. **Don't Ignore Timeouts**
   ```apex
   // ❌ WRONG - Default is 10 seconds
   // May timeout for slow APIs
   ```

## 📚 Interview Questions

**Q: Can you make a callout from a trigger?**
A: No, not directly. You must use `@future(callout=true)`, Queueable with `Database.AllowsCallouts`, or Platform Events.

**Q: What is a Named Credential?**
A: A secure way to store endpoint URLs and authentication credentials. Salesforce manages authentication automatically.

**Q: How do you handle rate limiting in integrations?**
A: Check for HTTP 429 status code, implement exponential backoff, and retry logic. Consider Platform Events for decoupling.

**Q: What's the maximum callout timeout?**
A: 120 seconds (2 minutes).

**Q: How do you test code with callouts?**
A: Use `Test.setMock(HttpCalloutMock.class, mockClass)` to provide mock responses in tests.

**Q: What's the difference between synchronous and asynchronous integration?**
A: Synchronous waits for response (request-response), asynchronous doesn't wait (fire-and-forget).

## 🚀 Next Steps

Excellent! You now understand Salesforce integration. Ready to deploy?

**[→ Back to Metadata & Deployment](/docs/salesforce/metadata/metadata-fundamentals)**

Or continue with DevOps:

**[→ Start DevOps Track](/docs/intro)**

---

**You can now integrate Salesforce with any external system!** Remember to use Named Credentials and handle errors gracefully. 🎓
