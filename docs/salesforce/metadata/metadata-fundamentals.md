---
sidebar_position: 2
title: Metadata Fundamentals
description: Understand Salesforce metadata and deployment concepts
---

# Metadata Fundamentals: Your Bridge to DevOps

Understanding Salesforce metadata is essential before diving into DevOps. Everything you configure or code in Salesforce is metadata, and knowing how to work with it is critical for professional development.

## 🎯 What You'll Learn

- What is metadata and why it matters
- Metadata types and structure
- Salesforce CLI (sf/sfdx) basics
- Source-driven development
- Package types and use cases
- Deployment strategies
- Preparing for DevOps workflows

## 📊 What is Metadata?

**Metadata** = "Data about data"

In Salesforce, everything is metadata:
- Custom objects and fields
- Apex classes and triggers
- Lightning components
- Page layouts and tabs
- Validation rules and workflows
- Profiles and permission sets

### Data vs. Metadata

```
Metadata (Structure):        Data (Content):
├── Account object          ├── Acme Corp (record)
├── Name field              ├── "Acme Corp" (value)
├── Industry field          ├── "Technology" (value)
└── Validation rules        └── Actual account records
```

**Key Difference:**
- **Metadata**: Defines the structure (deployed between orgs)
- **Data**: Actual records (exported/imported separately)

## 🗂️ Metadata API vs. Tooling API

| Feature | Metadata API | Tooling API |
|---------|--------------|-------------|
| **Purpose** | Deploy metadata between orgs | Develop and debug |
| **Use Case** | CI/CD, migrations | IDE integration |
| **Batch Size** | 10,000 components | Small, specific operations |
| **Example** | Deploy 100 Apex classes | Compile single class |

## 📦 Metadata Types

Salesforce has 600+ metadata types! Here are the most common:

### Standard Metadata Types

```
Objects & Fields:
├── CustomObject (.object-meta.xml)
├── CustomField
├── CustomTab
└── ListView

Code:
├── ApexClass (.cls, .cls-meta.xml)
├── ApexTrigger (.trigger, .trigger-meta.xml)
├── ApexPage (Visualforce)
└── AuraDefinitionBundle (Aura)

Lightning:
├── LightningComponentBundle (LWC)
└── ExperienceBundle (Experience Cloud)

Automation:
├── Flow (.flow-meta.xml)
├── WorkflowRule
├── ValidationRule
└── ApprovalProcess

Security:
├── Profile (.profile-meta.xml)
├── PermissionSet (.permissionset-meta.xml)
├── PermissionSetGroup
└── Role

UI:
├── Layout (Page layouts)
├── FlexiPage (Lightning pages)
└── CustomApplication (Apps)
```

## 🏗️ Metadata Structure

### Example: Custom Object Metadata

**Property__c.object-meta.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Property</label>
    <pluralLabel>Properties</pluralLabel>
    <nameField>
        <label>Property Name</label>
        <type>Text</type>
    </nameField>
    <deploymentStatus>Deployed</deploymentStatus>
    <sharingModel>ReadWrite</sharingModel>
    <enableHistory>true</enableHistory>
    <enableReports>true</enableReports>

    <fields>
        <fullName>Listing_Price__c</fullName>
        <label>Listing Price</label>
        <type>Currency</type>
        <precision>18</precision>
        <scale>2</scale>
    </fields>

    <validationRules>
        <fullName>Price_Must_Be_Positive</fullName>
        <active>true</active>
        <errorConditionFormula>Listing_Price__c &lt;= 0</errorConditionFormula>
        <errorMessage>Price must be greater than zero</errorMessage>
    </validationRules>
</CustomObject>
```

### Example: Apex Class Metadata

**PropertyController.cls:**
```apex
public with sharing class PropertyController {
    @AuraEnabled(cacheable=true)
    public static List<Property__c> getProperties() {
        return [SELECT Id, Name FROM Property__c LIMIT 10];
    }
}
```

**PropertyController.cls-meta.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>60.0</apiVersion>
    <status>Active</status>
</ApexClass>
```

## 🛠️ Salesforce CLI (sf/sfdx)

The Salesforce CLI is essential for modern development.

### Installation

```bash
# Install Salesforce CLI
npm install -g @salesforce/cli

# Verify installation
sf --version

# Get help
sf --help
sf org --help
```

### Authenticate to Org

```bash
# Web-based login (opens browser)
sf org login web --alias DevOrg

# Use refresh token (for CI/CD)
sf org login sfdx-url --sfdx-url-file authFile.txt --alias DevOrg

# List authenticated orgs
sf org list
```

### Create Scratch Org

```bash
# Create temporary dev org (7-30 days)
sf org create scratch --definition-file config/project-scratch-def.json \
  --alias MyScratchOrg \
  --duration-days 7

# Open scratch org
sf org open --target-org MyScratchOrg
```

## 📁 Source-Driven Development

Modern Salesforce development uses source format, not metadata format.

### Project Structure

```
my-project/
├── config/
│   └── project-scratch-def.json
├── force-app/
│   └── main/
│       └── default/
│           ├── classes/
│           │   ├── PropertyController.cls
│           │   └── PropertyController.cls-meta.xml
│           ├── lwc/
│           │   └── propertyCard/
│           │       ├── propertyCard.html
│           │       ├── propertyCard.js
│           │       └── propertyCard.js-meta.xml
│           ├── objects/
│           │   └── Property__c/
│           │       ├── Property__c.object-meta.xml
│           │       └── fields/
│           │           └── Listing_Price__c.field-meta.xml
│           └── triggers/
│               ├── PropertyTrigger.trigger
│               └── PropertyTrigger.trigger-meta.xml
├── sfdx-project.json
└── .forceignore
```

### sfdx-project.json

```json
{
  "packageDirectories": [
    {
      "path": "force-app",
      "default": true,
      "package": "RealEstateApp",
      "versionName": "Version 1.0",
      "versionNumber": "1.0.0.NEXT"
    }
  ],
  "name": "real-estate-app",
  "namespace": "",
  "sfdcLoginUrl": "https://login.salesforce.com",
  "sourceApiVersion": "60.0"
}
```

### .forceignore

```
# Ignore local config files
.sfdx/
.vscode/

# Ignore certain profiles
**/profiles/Admin.profile-meta.xml

# Ignore managed packages
**/installedPackages/**

# Ignore scratch org settings
**/settings/**
```

## 🚀 Deployment Commands

### Retrieve Metadata from Org

```bash
# Retrieve all metadata
sf project retrieve start --target-org DevOrg

# Retrieve specific metadata
sf project retrieve start \
  --metadata ApexClass:PropertyController \
  --metadata CustomObject:Property__c \
  --target-org DevOrg

# Retrieve by package.xml
sf project retrieve start \
  --manifest manifest/package.xml \
  --target-org DevOrg
```

### Deploy Metadata to Org

```bash
# Deploy all source
sf project deploy start --target-org DevOrg

# Deploy specific directory
sf project deploy start \
  --source-dir force-app/main/default/classes \
  --target-org DevOrg

# Deploy with tests
sf project deploy start \
  --target-org DevOrg \
  --test-level RunLocalTests
```

### Quick Deploy

```bash
# Validate deployment (check only)
sf project deploy start \
  --target-org ProdOrg \
  --test-level RunLocalTests \
  --dry-run

# If validation passes, get the deploy ID and quick deploy
sf project deploy quick \
  --job-id 0Af1234567890ABC \
  --target-org ProdOrg
```

## 📦 Package Types

### Unmanaged Packages

**Use Case:** Share open-source code, templates, starter apps

**Characteristics:**
- Full source code visible
- Can be modified after installation
- No namespace
- Can't be upgraded (must uninstall/reinstall)
- Free

**Example:**
```bash
# Create package version
sf package version create \
  --package "Real Estate App" \
  --installation-key-bypass \
  --wait 10
```

### Managed Packages

**Use Case:** Commercial AppExchange apps, ISV products

**Characteristics:**
- Code is protected/obfuscated
- Can't be modified by customers
- Requires namespace
- Supports upgrades
- Can be licensed

**Namespace Example:**
```apex
// With namespace "realestate"
global class realestate.PropertyController {
    // ...
}
```

### Unlocked Packages

**Use Case:** Modern modular development, breaking up large orgs

**Characteristics:**
- Org-dependent (can use standard objects)
- Version controlled
- Can be upgraded
- Supports CI/CD
- No namespace required
- Best for enterprise development

**Create Unlocked Package:**
```bash
# Create package
sf package create \
  --name "Real Estate Core" \
  --description "Core functionality" \
  --package-type Unlocked \
  --path force-app

# Create package version
sf package version create \
  --package "Real Estate Core" \
  --installation-key-bypass \
  --wait 10 \
  --code-coverage

# Install in org
sf package install \
  --package 04t... \
  --target-org DevOrg \
  --wait 10
```

### Second-Generation Packages (2GP)

**Comparison:**

| Feature | Unmanaged | Managed | Unlocked | 2GP |
|---------|-----------|---------|----------|-----|
| **Upgradeable** | ❌ | ✅ | ✅ | ✅ |
| **Namespace** | ❌ | ✅ Required | Optional | Optional |
| **Org-Dependent** | N/A | ❌ | ✅ | ❌ |
| **Version Control** | ❌ | ❌ | ✅ | ✅ |
| **Best For** | Templates | AppExchange | Enterprise | Multi-org |

## 🔄 Deployment Strategies

### Strategy 1: Change Sets (Deprecated)

```
✅ Pros:
- Built into UI
- No CLI needed
- Simple for small changes

❌ Cons:
- Manual process
- Error-prone
- No version control
- Can't automate
- Being deprecated
```

**Recommendation:** Don't use for new projects.

### Strategy 2: Salesforce CLI + Git

```
✅ Pros:
- Full version control
- Can automate
- Works with scratch orgs
- Industry standard

❌ Cons:
- Learning curve
- Requires setup
```

**Recommendation:** Use this approach!

### Strategy 3: DevOps Center

```
✅ Pros:
- Built into Salesforce
- Visual interface
- Integrated with GitHub
- Good for admins

❌ Cons:
- Limited flexibility
- Newer tool
```

### Strategy 4: Third-Party Tools

- **Copado**: Enterprise DevOps
- **Gearset**: Deployment automation
- **AutoRABIT**: Release management
- **Flosum**: End-to-end platform

## 🎯 Best Practices

### ✅ DO:

1. **Use Source Control**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Use Scratch Orgs for Development**
   - Disposable, clean environments
   - Start fresh daily
   - No shared sandboxes

3. **Modularize with Packages**
   ```
   Real Estate App
   ├── Core Package (objects, fields)
   ├── Marketing Package (flows, email templates)
   └── Reports Package (dashboards, reports)
   ```

4. **Automate Deployments**
   - CI/CD pipelines
   - Automated testing
   - Environment promotion

5. **Document Your Metadata**
   ```xml
   <!-- PropertyController.cls-meta.xml -->
   <ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
       <apiVersion>60.0</apiVersion>
       <description>Handles property queries and updates</description>
       <status>Active</status>
   </ApexClass>
   ```

### ❌ DON'T:

1. **Don't Develop Directly in Production**
   - Always use sandboxes/scratch orgs
   - Test thoroughly before deploying

2. **Don't Ignore Dependencies**
   ```
   ❌ Deploy Apex class without custom object
   ✅ Deploy object first, then Apex
   ```

3. **Don't Mix Metadata and Data**
   - Use separate processes
   - Data: Data Loader, ETL tools
   - Metadata: CLI, packages

4. **Don't Forget .forceignore**
   ```
   # Always ignore
   **/.sfdx
   **/.vscode
   **/profiles/Admin*
   ```

## 🧪 Hands-On Exercise

### Exercise 1: Create and Deploy Package

```bash
# 1. Create new project
sf project generate --name real-estate-app

# 2. Create scratch org
sf org create scratch \
  --definition-file config/project-scratch-def.json \
  --alias DevScratch \
  --set-default

# 3. Create Apex class
mkdir -p force-app/main/default/classes
cat > force-app/main/default/classes/HelloWorld.cls << 'EOF'
public class HelloWorld {
    public static String sayHello(String name) {
        return 'Hello, ' + name + '!';
    }
}
EOF

# 4. Create metadata file
cat > force-app/main/default/classes/HelloWorld.cls-meta.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>60.0</apiVersion>
    <status>Active</status>
</ApexClass>
EOF

# 5. Deploy to scratch org
sf project deploy start

# 6. Test in scratch org
sf apex run --target-org DevScratch << 'EOF'
String result = HelloWorld.sayHello('Salesforce');
System.debug(result);
EOF

# 7. Retrieve from scratch org (if modified)
sf project retrieve start

# 8. Push to Git
git add .
git commit -m "Add HelloWorld class"
git push
```

## 📚 Interview Questions

**Q: What is metadata in Salesforce?**
A: Metadata is data that describes other data. In Salesforce, metadata defines the structure of your org (objects, fields, code, etc.), while data is the actual records stored in those structures.

**Q: What's the difference between Metadata API and Tooling API?**
A:
- **Metadata API**: Bulk operations, deploy between orgs, CI/CD
- **Tooling API**: Fine-grained operations, development, debugging, IDE integration

**Q: What are the benefits of scratch orgs?**
A:
- Disposable (7-30 days)
- Clean, consistent environments
- Version-controlled configuration
- Fast to create
- Supports modern development practices

**Q: Managed vs. Unlocked packages?**
A:
- **Managed**: AppExchange, protected code, requires namespace, no org dependencies
- **Unlocked**: Enterprise, modular, version controlled, org-dependent, no namespace required

**Q: Why use sfdx-project.json?**
A: Defines project configuration including package directories, version numbers, namespace, and API version. Required for source-driven development.

## 🚀 Next Steps: Bridge to DevOps

Congratulations! You now understand Salesforce metadata. You're ready for the DevOps track!

**[→ Start DevOps Track](/docs/intro)**

Learn to:
- Build CI/CD pipelines with GitHub Actions
- Automate testing and deployment
- Implement Git workflows
- Manage multiple environments
- Production deployment strategies

---

**You're now ready for professional Salesforce DevOps!** Time to automate everything! 🚀
