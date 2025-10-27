# Salesforce Metadata Explained

**Learning Objective**: Understand what Salesforce metadata is, why it's challenging to manage, and how to work with it effectively.

---

## What IS Metadata, Really?

You click a button in Salesforce Setup. You create a custom field. It instantly appears in your org.

But where did that field actually get stored? What format is it in? How does Salesforce know what you created?

**The answer**: Metadata.

**Simple definition**: Metadata is the configuration that makes your Salesforce org work. It's the blueprint for everything - objects, fields, code, layouts, permissions, flows, everything.

**The weird part**: Behind the friendly UI, it's all XML files. Thousands of them.

When you click "New Custom Field," Salesforce generates an XML file that looks like this:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Priority_Level__c</fullName>
    <label>Priority Level</label>
    <type>Picklist</type>
    <required>false</required>
    <valueSet>
        <valueSetDefinition>
            <value>
                <fullName>High</fullName>
                <default>false</default>
                <label>High</label>
            </value>
            <value>
                <fullName>Medium</fullName>
                <default>true</default>
                <label>Medium</label>
            </value>
            <value>
                <fullName>Low</fullName>
                <default>false</default>
                <label>Low</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>
```

**This XML file IS your custom field**. Everything you configured through the UI is represented here.

---

## The Two Faces of Salesforce

Salesforce has two personalities:

### Face 1: The UI (What You See)

- Click buttons in Setup
- Drag and drop in Lightning App Builder
- Configure flows visually
- User-friendly, intuitive

### Face 2: The Metadata (What Actually Exists)

- XML files defining everything
- Stored in Salesforce database
- Not directly visible
- This is what gets deployed

**Here's the challenge**: You work in the UI, but DevOps works with the metadata.

When you deploy, you're not deploying your clicks. You're deploying XML files.

---

## Show Me: Creating a Field and Seeing the XML

Let's make this concrete. Here's what happens when you create a custom field.

**Step 1: You Click in Salesforce**

Setup → Object Manager → Account → Fields & Relationships → New

Fill out:
- Field Label: "Customer Priority"
- Field Name: "Customer_Priority"
- Data Type: Picklist
- Values: Platinum, Gold, Silver, Bronze

Click Save.

**Step 2: Salesforce Generates XML**

Behind the scenes, Salesforce creates this file:

`Account.Customer_Priority__c.field-meta.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Customer_Priority__c</fullName>
    <label>Customer Priority</label>
    <required>false</required>
    <trackTrending>false</trackTrending>
    <type>Picklist</type>
    <valueSet>
        <restricted>true</restricted>
        <valueSetDefinition>
            <sorted>false</sorted>
            <value>
                <fullName>Platinum</fullName>
                <default>false</default>
                <label>Platinum</label>
            </value>
            <value>
                <fullName>Gold</fullName>
                <default>false</default>
                <label>Gold</label>
            </value>
            <value>
                <fullName>Silver</fullName>
                <default>false</default>
                <label>Silver</label>
            </value>
            <value>
                <fullName>Bronze</fullName>
                <default>false</default>
                <label>Bronze</label>
            </value>
        </valueSetDefinition>
    </valueSet>
</CustomField>
```

**Step 3: The XML is Stored**

This XML goes into Salesforce's metadata storage. When you deploy to another org, you're deploying THIS file.

**Step 4: SFDX Can Retrieve It**

Using Salesforce CLI:

```bash
sfdx force:source:retrieve -m CustomField:Account.Customer_Priority__c
```

Now you have the XML file locally. You can:
- Track it in Git
- Edit it directly
- Deploy it to other orgs

---

## Types of Metadata (There Are Hundreds)

Salesforce has over 600 metadata types. Here are the most important ones:

### Objects and Fields

**What**: Custom objects, custom fields, relationships

**File format**: XML files like `Account.object-meta.xml` or individual field files

**Examples**:
- Custom Object: `My_Custom_Object__c.object-meta.xml`
- Custom Field: `Account.My_Field__c.field-meta.xml`
- Relationship: `Opportunity.Account__c.field-meta.xml`

**Deployment note**: You must deploy the object before the fields. Order matters.

### Apex Classes and Triggers

**What**: Your server-side code

**File format**: `.cls` file (the code) + `.cls-meta.xml` (the metadata)

**Example**:

`AccountTriggerHandler.cls`:
```apex
public class AccountTriggerHandler {
    public static void handleBeforeInsert(List<Account> newAccounts) {
        // Your logic here
    }
}
```

`AccountTriggerHandler.cls-meta.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <status>Active</status>
</ApexClass>
```

**Deployment note**: Test classes must exist and provide coverage before deploying to production.

### Lightning Web Components

**What**: Modern UI components

**File format**: Multiple files per component (.js, .html, .css, .xml)

**Example structure**:
```
lwc/
  myComponent/
    myComponent.js
    myComponent.html
    myComponent.css
    myComponent.js-meta.xml
```

**Deployment note**: All files deploy together as a bundle.

### Flows and Process Builder

**What**: Automation (visual workflows)

**File format**: `.flow-meta.xml` files

**Example**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Flow xmlns="http://soap.sforce.com/2006/04/metadata">
    <processType>AutoLaunchedFlow</processType>
    <start>
        <locationX>50</locationX>
        <locationY>50</locationY>
    </start>
    <status>Active</status>
</Flow>
```

**Deployment note**: Inactive flows can deploy to production. Active flows must pass validation.

### Page Layouts and Record Types

**What**: How records are displayed

**File format**: `.layout-meta.xml` and `.recordType-meta.xml`

**Deployment note**: Layouts reference fields. Deploy fields first, then layouts.

### Validation Rules and Formula Fields

**What**: Business logic and calculations

**File format**: Part of object or field metadata XML

**Example**:
```xml
<validationRules>
    <fullName>Opportunity_Amount_Required</fullName>
    <active>true</active>
    <errorConditionFormula>
        AND(
            ISBLANK(Amount),
            ISPICKVAL(StageName, "Closed Won")
        )
    </errorConditionFormula>
    <errorMessage>Amount is required for Closed Won opportunities</errorMessage>
</validationRules>
```

**Deployment note**: Test these thoroughly. A broken validation rule can block all record saves.

### Profiles and Permission Sets

**What**: User access control

**File format**: `.profile-meta.xml` and `.permissionset-meta.xml`

**Deployment note**: Large XML files. Often cause deployment issues. Use permission sets when possible.

---

## Why Metadata Is Weird (And Challenging)

### Challenge 1: Order Matters (Dependencies)

You can't deploy metadata in random order. Dependencies must be deployed first.

**Example problem**:

You try to deploy:
1. Page Layout (references Field A)
2. Custom Field A

**Result**: FAILED. Page layout tried to reference a field that didn't exist yet.

**Fix**: Deploy in correct order:
1. Custom Field A
2. Page Layout (now the field exists)

**The challenge**: With 1000+ metadata files, figuring out the correct order is complex.

### Challenge 2: Some Things Can't Be Deleted

Created a field you don't need? You can't delete it via metadata deployment.

You can:
- Mark it as deprecated
- Remove it from page layouts
- Hide it with field-level security

But the field XML must stay. Salesforce doesn't allow destructive changes easily.

**Workaround**: Use destructiveChanges.xml (advanced topic for later).

### Challenge 3: Hidden Dependencies

Your Apex trigger references a custom field. The field is used in a validation rule. The validation rule is shown on a page layout. The page layout is assigned to a profile.

Deploy one piece wrong? Everything breaks.

Salesforce doesn't always tell you about these dependencies clearly.

### Challenge 4: Clicks Create Metadata Too

Your admin clicks around in Setup, creating fields. Your developer writes Apex code.

Both are creating metadata. Both need to be in Git. But the admin might not know about Git.

**Solution**: Everyone (developers AND admins) must commit changes to Git. This is a cultural shift.

### Challenge 5: Different Formats (Source vs. Metadata)

Salesforce has TWO metadata formats:

**Metadata API Format**: Older format, used by change sets. One big XML file per object.

**Source Format (SFDX)**: Modern format, one file per metadata item. Better for Git.

**Example**:

Metadata format: `objects/Account.object` (one huge file with everything)

Source format:
```
objects/Account/
  Account.object-meta.xml (basic object def)
  fields/Name.field-meta.xml
  fields/Priority__c.field-meta.xml
  fields/CustomerPriority__c.field-meta.xml
```

**Use source format** for DevOps. It's better for version control because each field is a separate file.

---

## How Changes Are Stored: UI vs Git

Let's compare workflows:

### Traditional Approach (No Git)

1. Developer creates field in Dev sandbox
2. Admin creates field in different Dev sandbox (different name, same purpose)
3. Both create change sets
4. Both deploy to Production
5. Now you have two fields doing the same thing
6. Nobody knows who created what or why

**Result**: Metadata chaos.

### DevOps Approach (With Git)

1. Developer creates field in Dev sandbox
2. Developer retrieves metadata: `sfdx force:source:retrieve -m CustomField:Account.Priority__c`
3. Git shows new file: `Account.Priority__c.field-meta.xml`
4. Developer commits to Git with message explaining why
5. Admin wants to create similar field, sees it in Git first
6. Team discusses, decides to use one field
7. Metadata stays clean and documented

**Result**: Metadata is tracked, reviewed, and managed properly.

---

## Metadata API Basics

The Metadata API is how tools interact with Salesforce to retrieve and deploy metadata.

**Key operations**:

### Retrieve (Download metadata from Salesforce)

```bash
sfdx force:source:retrieve -m ApexClass
sfdx force:source:retrieve -m CustomObject:Account
sfdx force:source:retrieve -x manifest/package.xml
```

Gets metadata from your org and saves it as files locally.

### Deploy (Upload metadata to Salesforce)

```bash
sfdx force:source:deploy -m ApexClass:MyClass
sfdx force:source:deploy -p force-app/
sfdx force:source:deploy -x manifest/package.xml
```

Takes local metadata files and pushes them to Salesforce.

### Validate (Check if deployment would succeed)

```bash
sfdx force:source:deploy -p force-app/ --checkonly
```

Simulates deployment without actually making changes. Critical for testing before production deployments.

---

## The Challenge: You Can't Just Copy/Paste

Why can't you just copy XML from one org to another?

**Problem 1: IDs Are Different**

Every org has different internal IDs for objects, fields, users, etc.

```xml
<recordType>
    <fullName>Enterprise_Account</fullName>
    <recordTypeId>012500000009876</recordTypeId>  <!-- This ID is org-specific! -->
</recordType>
```

**Solution**: Use names instead of IDs. Metadata API handles translation.

**Problem 2: Dependencies Might Not Exist**

Your metadata references another object that doesn't exist in target org.

```xml
<lookupFilter>
    <otherObject>Custom_Object__c</otherObject>  <!-- What if this doesn't exist? -->
</lookupFilter>
```

**Solution**: Deploy dependencies first. Use tools to analyze dependency trees.

**Problem 3: Org Differences**

Source org has Einstein Analytics enabled. Target org doesn't.

Metadata that references Einstein features will fail to deploy.

**Solution**: Conditional deployments. Different package manifests for different org types.

---

## Hands-On Exercise: Pull Metadata and Explore

Time to see metadata in action. This exercise takes about 20 minutes.

### Step 1: Install Salesforce CLI

**Mac**:
```bash
brew install sfdx
```

**Windows**:
Download from: https://developer.salesforce.com/tools/sfdxcli

**Linux**:
```bash
npm install --global sfdx-cli
```

**Verify**:
```bash
sfdx --version
# Should show version number
```

### Step 2: Authenticate to Your Org

```bash
# Authenticate to your Dev org (opens browser)
sfdx auth:web:login -a MyDevOrg

# List your authenticated orgs
sfdx force:org:list

# Set default org
sfdx config:set defaultusername=MyDevOrg
```

The browser will open for you to log in. Once authenticated, SFDX can retrieve metadata.

### Step 3: Create a Salesforce DX Project

```bash
# Create project folder
mkdir my-salesforce-project
cd my-salesforce-project

# Create SFDX project structure
sfdx force:project:create -n my-sf-project

cd my-sf-project
```

This creates the standard folder structure:
```
my-sf-project/
  ├── force-app/          # Your metadata goes here
  ├── config/             # Project configuration
  ├── sfdx-project.json   # Project definition
  └── README.md
```

### Step 4: Retrieve Metadata from Your Org

```bash
# Retrieve the Account object
sfdx force:source:retrieve -m CustomObject:Account

# Retrieve all Apex classes
sfdx force:source:retrieve -m ApexClass

# Retrieve a specific custom field (if you created one earlier)
sfdx force:source:retrieve -m CustomField:Account.Customer_Priority__c
```

Watch the output. SFDX downloads the XML files.

### Step 5: Explore the XML Files

```bash
# Navigate to the metadata folder
cd force-app/main/default/

# List what got retrieved
ls -R

# You'll see structure like:
# objects/Account/
#   fields/
#     Priority__c.field-meta.xml
#   Account.object-meta.xml
```

### Step 6: Open and Read an XML File

```bash
# Use any text editor
code force-app/main/default/objects/Account/Account.object-meta.xml

# Or cat it in terminal
cat force-app/main/default/objects/Account/fields/[some-field].field-meta.xml
```

**Look for**:
- `<fullName>` - The API name
- `<label>` - The display name
- `<type>` - The field type
- `<required>` - Is it required?

**This is the metadata**. This is what Git tracks. This is what gets deployed.

### Step 7: Make a Change and Push Back

```bash
# Open a field XML file
code force-app/main/default/objects/Account/fields/[some-field].field-meta.xml

# Change the description:
# Add: <description>Modified via SFDX!</description>

# Deploy the change back to Salesforce
sfdx force:source:deploy -m CustomField:Account.[field-name]

# Check in Salesforce UI
# The description should now show your change!
```

**What you just did**: Modified metadata locally, deployed to Salesforce. This is DevOps.

### Step 8: Track in Git

```bash
# Initialize Git
git init

# Add all metadata
git add force-app/

# Commit
git commit -m "Initial metadata from dev org

Retrieved Account object and Apex classes.
This is our baseline for source control."

# View your commit
git log
```

Congratulations! You now have Salesforce metadata in Git.

---

## Metadata Folder Structure

SFDX uses this standard structure:

```
force-app/
  └── main/
      └── default/
          ├── applications/        # Lightning Apps
          ├── aura/                # Aura Components
          ├── classes/             # Apex Classes
          │   ├── MyClass.cls
          │   └── MyClass.cls-meta.xml
          ├── flows/               # Flows
          ├── layouts/             # Page Layouts
          ├── lwc/                 # Lightning Web Components
          │   └── myComponent/
          │       ├── myComponent.js
          │       ├── myComponent.html
          │       └── myComponent.js-meta.xml
          ├── objects/             # Objects and Fields
          │   └── Account/
          │       ├── Account.object-meta.xml
          │       ├── fields/
          │       │   └── Priority__c.field-meta.xml
          │       ├── listViews/
          │       └── validationRules/
          ├── permissionsets/      # Permission Sets
          ├── profiles/            # Profiles
          ├── tabs/                # Custom Tabs
          ├── triggers/            # Apex Triggers
          │   ├── AccountTrigger.trigger
          │   └── AccountTrigger.trigger-meta.xml
          └── workflows/           # Workflow Rules
```

**Memorize this structure**. You'll navigate it constantly.

---

## Quick Check: Test Your Understanding

**Question 1**: What format is Salesforce metadata stored in?

<details>
<summary>Click to see answer</summary>

**Answer**: XML (Extensible Markup Language)

**Why**: XML is a structured, text-based format that's human-readable and machine-parsable. It can represent complex hierarchical data (like object definitions with nested fields, validation rules, etc.).

**Key point**: Even though you configure Salesforce through a UI, everything gets converted to XML metadata files.

</details>

**Question 2**: Can you deploy a custom field without deploying the custom object first?

<details>
<summary>Click to see answer</summary>

**Answer**:
- **Standard object** (like Account): Yes, you can deploy just the field
- **Custom object**: No, you must deploy the object first, then the field

**Why**: Custom objects don't exist in the target org until you deploy them. You can't add a field to something that doesn't exist yet.

**Best practice**: Always deploy objects before fields, layouts before they reference fields, etc. Respect dependencies.

</details>

**Question 3**: You see this in Git: `Account.Priority__c.field-meta.xml` was modified. What does this tell you?

<details>
<summary>Click to see answer</summary>

**Answer**: Someone modified the Priority__c custom field on the Account object.

You can see EXACTLY what changed by running:
```bash
git diff Account.Priority__c.field-meta.xml
```

This might show:
- Label changed
- Picklist values added/removed
- Description updated
- Field became required
- Help text modified

**The power**: Complete audit trail of what changed, who changed it, when, and why (from commit message).

</details>

---

## Key Takeaways

Before moving on, make sure you understand:

✅ **Metadata IS Salesforce** - Everything you configure is metadata under the hood

✅ **It's all XML** - Behind the friendly UI, it's XML files

✅ **Order matters** - Dependencies must be deployed before things that reference them

✅ **SFDX retrieves and deploys metadata** - This is how you move changes between orgs

✅ **Source format is better for Git** - One file per metadata item = cleaner version control

✅ **Metadata is the bridge** - Between what you click in UI and what gets deployed

---

## Up Next: CI/CD Concepts

You now understand:
- What DevOps is and why it matters (Page 1)
- Where changes happen (Salesforce environments, Page 2)
- How to track changes (Git, Page 3)
- What you're actually tracking (Metadata, this page)

**Next question**: How do you AUTOMATE moving these metadata changes through environments?

Manual deployments are slow, error-prone, and don't scale. We need automation.

That's CI/CD: Continuous Integration and Continuous Deployment.

Let's learn the concepts: **[CI/CD Concepts for Beginners →](/docs/foundations/cicd-concepts)**

---

**Pro tip**: Bookmark the Salesforce Metadata API Developer Guide. When you see unfamiliar metadata in Git, look it up there: https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/
