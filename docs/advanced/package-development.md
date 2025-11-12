# Package Development with Second-Generation Packages (2GP)

## The Monolith Problem

Your Salesforce org has grown organically over 5 years. You now have:

- 500+ Apex classes
- 200+ custom objects
- Hundreds of flows and process builders
- Countless validation rules and workflows

A new developer joins the team. "What does this class do?" They have no idea. Everything is interconnected. Change one thing, break three others.

You want to deploy a feature to production. But it depends on changes in 15 different classes spread across the org. You can't deploy just the feature. You have to deploy everything or nothing.

You've built a monolith. And it's becoming unmaintainable.

**Packages solve this problem.**

## What Are Salesforce Packages?

Packages are modular units of metadata that can be:

- **Developed independently**: Work on one feature without affecting others
- **Versioned**: Track changes over time with semantic versioning
- **Dependency-managed**: Declare explicit dependencies between packages
- **Deployed separately**: Deploy just the package that changed
- **Distributed**: Share with other orgs, customers, or AppExchange

Think of packages like npm packages for JavaScript or Python packages. They're the building blocks of modular Salesforce applications.

## Package Types

Salesforce offers two types of packages:

### First-Generation Packages (1GP)

Legacy packaging. Still used for AppExchange apps but being phased out.

**Don't use these for new projects.** Use 2GP instead.

### Second-Generation Packages (2GP)

Modern, source-driven packaging. Two subtypes:

**Unlocked Packages**
- For internal development
- Metadata can be edited in the target org
- Great for modular application development
- Free (no additional cost)

**Managed Packages**
- For ISV partners distributing apps
- Metadata is locked (read-only in target org)
- Supports licensing and intellectual property protection
- Requires partner business org

**We'll focus on unlocked packages** - the most common use case for enterprise development.

## Why Use Packages?

**1. Modularity**

Break your application into logical modules:

```
├── core-objects (Base objects and fields)
├── sales-automation (Sales-specific features)
├── service-cloud-extension (Service features)
└── reporting-dashboards (Reports and dashboards)
```

**2. Clear Dependencies**

```
service-cloud-extension depends on core-objects (v1.2.0)
sales-automation depends on core-objects (v1.2.0)
reporting-dashboards depends on sales-automation (v2.1.0)
```

**3. Independent Deployment**

Deploy just the package that changed:

```bash
# Only deploy sales-automation, not the entire org
sf package install --package sales-automation@2.2.0
```

**4. Parallel Development**

Different teams work on different packages without conflicts.

**5. Versioning and Rollback**

```bash
# Rollback to previous version
sf package install --package core-objects@1.1.0
```

**6. Testing in Isolation**

```bash
# Test just the package
sf package version create --package sales-automation --code-coverage
```

Let's build a packaged application.

## Setting Up Package Development

### Enable Dev Hub and 2GP

1. Log into your Dev Hub org (production or Developer Edition)
2. Setup → Dev Hub → Enable Dev Hub
3. Setup → Dev Hub → Enable Unlocked Packages and Second-Generation Managed Packages

### Create Package Structure

**Project structure for modular development:**

```
my-app/
├── sfdx-project.json
├── force-app/
│   ├── core/          # Core package
│   ├── sales/         # Sales package
│   └── service/       # Service package
├── config/
│   └── project-scratch-def.json
└── README.md
```

### Configure sfdx-project.json

```json
{
  "packageDirectories": [
    {
      "path": "force-app/core",
      "package": "CoreObjects",
      "versionName": "Winter 24",
      "versionNumber": "1.0.0.NEXT",
      "default": false
    },
    {
      "path": "force-app/sales",
      "package": "SalesAutomation",
      "versionName": "Winter 24",
      "versionNumber": "1.0.0.NEXT",
      "default": false,
      "dependencies": [
        {
          "package": "CoreObjects",
          "versionNumber": "1.0.0.LATEST"
        }
      ]
    },
    {
      "path": "force-app/service",
      "package": "ServiceExtension",
      "versionName": "Winter 24",
      "versionNumber": "1.0.0.NEXT",
      "default": false,
      "dependencies": [
        {
          "package": "CoreObjects",
          "versionNumber": "1.0.0.LATEST"
        }
      ]
    }
  ],
  "namespace": "",
  "sourceApiVersion": "59.0"
}
```

## Creating Your First Package

### Step 1: Create Package

```bash
# Create the package definition
sf package create \
  --name CoreObjects \
  --description "Core data model and shared objects" \
  --package-type Unlocked \
  --path force-app/core \
  --target-dev-hub devhub
```

This registers the package with Dev Hub. Output:

```
Successfully created a package. 0Ho...
Name: CoreObjects
Package Id: 0Ho...
```

Update `sfdx-project.json` with the package ID (if not already there).

### Step 2: Add Metadata to Package

Create your metadata in the package directory:

```bash
# Create custom object in core package
force-app/core/main/default/objects/
├── Product__c/
│   ├── fields/
│   │   ├── Category__c.field-meta.xml
│   │   ├── Price__c.field-meta.xml
│   │   └── SKU__c.field-meta.xml
│   └── Product__c.object-meta.xml
```

### Step 3: Create Package Version

```bash
# Create a package version
sf package version create \
  --package CoreObjects \
  --installation-key-bypass \
  --wait 10 \
  --code-coverage

# This creates a version like: CoreObjects@1.0.0-1
```

**What happens:**
1. Salesforce creates a scratch org
2. Deploys your metadata
3. Runs all tests
4. Validates code coverage (>=75%)
5. Creates a package version

This takes 5-10 minutes.

### Step 4: Promote Version to Released

```bash
# Get the package version ID from creation output (04t...)
sf package version promote \
  --package CoreObjects@1.0.0-1

# Now version is "released" and can be installed in production
```

**Beta vs Released:**
- **Beta**: Can be installed, but not in production orgs
- **Released**: Production-ready, can be installed anywhere

### Step 5: Install Package

```bash
# Install in a sandbox or scratch org
sf package install \
  --package CoreObjects@1.0.0-1 \
  --target-org sandbox \
  --wait 10 \
  --publish-wait 10

# Or use the subscriber package version ID (04t...)
sf package install \
  --package 04txx... \
  --target-org sandbox
```

Congratulations! You've created, versioned, and installed your first package.

## Package Dependencies

Let's create a second package that depends on the first.

### Define Dependency in sfdx-project.json

```json
{
  "path": "force-app/sales",
  "package": "SalesAutomation",
  "versionNumber": "1.0.0.NEXT",
  "dependencies": [
    {
      "package": "CoreObjects",
      "versionNumber": "1.0.0.LATEST"
    }
  ]
}
```

This declares: "SalesAutomation depends on the latest 1.0.0.x version of CoreObjects."

### Create Dependent Package

```bash
# Create the sales package
sf package create \
  --name SalesAutomation \
  --description "Sales-specific features" \
  --package-type Unlocked \
  --path force-app/sales

# Add metadata that references CoreObjects
# For example, a field lookup to Product__c
force-app/sales/main/default/objects/Opportunity/
└── fields/
    └── Product__c.field-meta.xml  # Lookup to Product__c from CoreObjects

# Create version
sf package version create \
  --package SalesAutomation \
  --installation-key-bypass \
  --wait 10
```

Salesforce automatically:
1. Installs the dependency (CoreObjects) first
2. Then installs SalesAutomation
3. Validates all references

### Install with Dependencies

```bash
# Installing SalesAutomation automatically installs CoreObjects
sf package install \
  --package SalesAutomation@1.0.0-1 \
  --target-org sandbox \
  --wait 10

# Output shows both packages installed:
# Installing CoreObjects@1.0.0-1... done
# Installing SalesAutomation@1.0.0-1... done
```

## Versioning Strategy

### Semantic Versioning

Packages use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (incompatible API changes)
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes (backward-compatible)

**Examples:**

```
1.0.0 → 1.0.1: Bug fix
1.0.1 → 1.1.0: New feature added
1.1.0 → 2.0.0: Breaking change (removed method, changed API)
```

### Configure Auto-Incrementing Versions

In `sfdx-project.json`:

```json
{
  "versionNumber": "1.2.3.NEXT"
}
```

- `NEXT`: Auto-increments the build number
- Creates versions: 1.2.3-1, 1.2.3-2, 1.2.3-3, etc.

When ready for release:

```bash
# Create version
sf package version create --package CoreObjects

# Output: CoreObjects@1.2.3-5 created

# Promote to released
sf package version promote --package CoreObjects@1.2.3-5

# Update sfdx-project.json to 1.2.4.NEXT for next development cycle
```

### Version Ranges in Dependencies

```json
{
  "dependencies": [
    {
      "package": "CoreObjects",
      "versionNumber": "1.2.3.LATEST"  // Latest 1.2.3.x patch
    }
  ]
}
```

Options:
- `1.2.3.LATEST`: Latest patch version of 1.2.3
- `1.2.LATEST`: Latest minor version of 1.2
- `LATEST`: Latest version (not recommended - can break things)

**Best practice**: Pin to minor version range:

```json
{
  "dependencies": [
    {
      "package": "CoreObjects",
      "versionNumber": "1.2.LATEST"  // Get bug fixes, not breaking changes
    }
  ]
}
```

## Package Development Workflow

### Day-to-Day Development

**1. Create scratch org with packages installed:**

```bash
# config/project-scratch-def.json includes packages
{
  "orgName": "Package Dev Org",
  "edition": "Developer",
  "features": [],
  "settings": {}
}

# Create scratch org
sf org create scratch --definition-file config/project-scratch-def.json --alias pkg-dev

# Install latest packages
sf package install --package CoreObjects@1.0.0.LATEST --target-org pkg-dev
sf package install --package SalesAutomation@1.0.0.LATEST --target-org pkg-dev

# Deploy unpackaged changes (WIP)
sf project deploy start --source-dir force-app/sales --target-org pkg-dev
```

**2. Develop and test:**

```bash
# Make changes
# Deploy to scratch org
sf project deploy start --source-dir force-app/sales

# Run tests
sf apex run test --target-org pkg-dev --test-level RunLocalTests
```

**3. Create new package version:**

```bash
# When feature is complete
sf package version create \
  --package SalesAutomation \
  --installation-key-bypass \
  --code-coverage \
  --wait 10

# Output: SalesAutomation@1.0.0-7 created
```

**4. Test package version:**

```bash
# Create fresh scratch org
sf org create scratch --alias test-pkg --duration-days 1

# Install the new version
sf package install --package SalesAutomation@1.0.0-7 --target-org test-pkg

# Run integration tests
sf apex run test --target-org test-pkg --test-level RunAllTestsInOrg
```

**5. Promote when ready:**

```bash
sf package version promote --package SalesAutomation@1.0.0-7
```

## CI/CD for Package Development

### Pipeline for Package Version Creation

```yaml
# .gitlab-ci.yml
create_package_version:
  stage: build
  only:
    - main
  script:
    # Authenticate to Dev Hub
    - sf org login jwt
        --client-id $SF_CONSUMER_KEY
        --jwt-key-file server.key
        --username $DEVHUB_USERNAME
        --set-default-dev-hub

    # Create package version
    - |
      VERSION_JSON=$(sf package version create \
        --package SalesAutomation \
        --installation-key-bypass \
        --code-coverage \
        --wait 20 \
        --json)

      # Extract package version ID
      PACKAGE_VERSION_ID=$(echo $VERSION_JSON | jq -r '.result.SubscriberPackageVersionId')
      echo "Created version: $PACKAGE_VERSION_ID"
      echo "PACKAGE_VERSION_ID=$PACKAGE_VERSION_ID" > package-version.env

  artifacts:
    reports:
      dotenv: package-version.env

# Test the package version
test_package:
  stage: test
  needs: [create_package_version]
  script:
    # Create scratch org
    - sf org create scratch --alias test-scratch --duration-days 1

    # Install package
    - sf package install
        --package $PACKAGE_VERSION_ID
        --target-org test-scratch
        --wait 10

    # Run all tests
    - sf apex run test
        --target-org test-scratch
        --test-level RunAllTestsInOrg
        --result-format human

# Promote on success
promote_package:
  stage: release
  needs: [test_package]
  when: manual  # Require approval
  script:
    - sf package version promote --package $PACKAGE_VERSION_ID
    - echo "Package version $PACKAGE_VERSION_ID promoted to released"
```

### Auto-Increment and Tag

```yaml
version_and_tag:
  stage: release
  needs: [promote_package]
  script:
    # Get the promoted version number
    - |
      VERSION=$(sf package version list \
        --packages SalesAutomation \
        --json | jq -r '.result[0].Version')

    # Create git tag
    - git tag "sales-automation-v${VERSION}"
    - git push origin "sales-automation-v${VERSION}"

    # Update sfdx-project.json for next version
    - |
      jq '.packageDirectories[] |= if .package == "SalesAutomation" then .versionNumber = "1.1.0.NEXT" else . end' \
        sfdx-project.json > tmp.json && mv tmp.json sfdx-project.json

    - git add sfdx-project.json
    - git commit -m "Bump SalesAutomation to 1.1.0 for next release"
    - git push origin main
```

## Upgrading Packages in Target Orgs

### Manual Upgrade

```bash
# Check currently installed version
sf package installed list --target-org production

# Output:
# Package Name        Version    Subscriber Package Version Id
# CoreObjects         1.0.0-1    04t...
# SalesAutomation     1.0.0-7    04t...

# Install newer version
sf package install \
  --package SalesAutomation@1.1.0-1 \
  --target-org production \
  --upgrade-type Mixed \
  --wait 10
```

**Upgrade types:**
- `DeprecateOnly`: Mark old version deprecated, keep installed
- `Mixed`: Delete removed components, add new ones
- `Delete`: Delete all old metadata, install fresh (dangerous!)

### Automated Upgrade Pipeline

```yaml
upgrade_packages:
  stage: deploy
  when: manual
  script:
    # Get latest package versions
    - |
      CORE_VERSION=$(sf package version list \
        --packages CoreObjects \
        --released \
        --json | jq -r '.result[0].SubscriberPackageVersionId')

      SALES_VERSION=$(sf package version list \
        --packages SalesAutomation \
        --released \
        --json | jq -r '.result[0].SubscriberPackageVersionId')

    # Upgrade production
    - sf package install --package $CORE_VERSION --target-org production --wait 20
    - sf package install --package $SALES_VERSION --target-org production --wait 20

    # Verify
    - sf package installed list --target-org production
```

## Package Development Best Practices

### 1. Keep Packages Loosely Coupled

**Bad:**
```java
// In SalesAutomation package
public class OpportunityHandler {
    public void process(Opportunity opp) {
        // Directly calling class from CoreObjects
        CoreValidator.validate(opp);  // Tight coupling!
    }
}
```

**Good:**
```java
// Use interfaces or events for communication
public class OpportunityHandler {
    public void process(Opportunity opp) {
        // Publish platform event
        PackageEvent__e evt = new PackageEvent__e(
            Type__c = 'OpportunityValidation',
            RecordId__c = opp.Id
        );
        EventBus.publish(evt);
    }
}
```

### 2. Version Dependencies Carefully

```json
{
  "dependencies": [
    {
      "package": "CoreObjects",
      "versionNumber": "1.2.LATEST"  // ✅ Good: Get patches, not breaking changes
    }
  ]
}
```

Not:

```json
{
  "dependencies": [
    {
      "package": "CoreObjects",
      "versionNumber": "LATEST"  // ❌ Bad: Can break unexpectedly
    }
  ]
}
```

### 3. Test Packages in Isolation

```bash
# Test the package alone, not the whole org
sf package version create --package SalesAutomation --code-coverage

# Salesforce creates scratch org with just the package and its dependencies
```

### 4. Document Package Dependencies

Create `docs/package-architecture.md`:

```markdown
# Package Architecture

## Package Dependency Graph

```
CoreObjects (Base data model)
    ↓
    ├── SalesAutomation (Sales features)
    │       ↓
    │       └── SalesReporting (Sales reports)
    │
    └── ServiceExtension (Service features)
            ↓
            └── ServiceReporting (Service reports)
```

## Installing Packages

1. Install CoreObjects first
2. Then install SalesAutomation or ServiceExtension
3. Finally install reporting packages
```

### 5. Use Package Aliases

In `sfdx-project.json`:

```json
{
  "packageAliases": {
    "CoreObjects": "0HoXX...",
    "CoreObjects@1.0.0-1": "04tXX...",
    "CoreObjects@1.1.0-1": "04tYY...",
    "SalesAutomation": "0HoYY...",
    "SalesAutomation@1.0.0-7": "04tZZ..."
  }
}
```

Then use aliases in commands:

```bash
sf package install --package CoreObjects@1.1.0-1 --target-org production
```

## Debugging Package Issues

### Error: "Can't find package dependency"

```
ERROR: Package2VersionCreateRequestDuplicatePackageDependency: CoreObjects@1.0.0.LATEST not found
```

**Solution:**

```bash
# List available versions
sf package version list --packages CoreObjects

# Update dependency to existing version
# In sfdx-project.json:
"versionNumber": "1.0.0.1"  # Specific version, not LATEST
```

### Error: "Installation failed - missing dependency"

```
ERROR: This package depends on CoreObjects v1.2.0 or later, but v1.1.0 is installed
```

**Solution:**

```bash
# Upgrade dependency first
sf package install --package CoreObjects@1.2.0-1 --target-org prod
# Then install dependent package
sf package install --package SalesAutomation@2.0.0-1 --target-org prod
```

### Error: "Code coverage below 75%"

```
ERROR: Package version creation failed. Code coverage 68%. Required: 75%
```

**Solution:**

```bash
# Write more tests!
# Or identify untested classes:
sf package version create --package SalesAutomation --json | jq '.result.Error'

# Shows which classes need tests
```

## Hands-On Exercise: Build a Modular Application

**Objective**: Create a multi-package application with dependencies.

**Your Tasks**:

1. Create three packages:
   - `CoreObjects`: Base objects (Account, Contact extensions)
   - `SalesFeatures`: Sales-specific features depending on CoreObjects
   - `ServiceFeatures`: Service-specific features depending on CoreObjects

2. Implement metadata in each package:
   - CoreObjects: Custom fields on standard objects
   - SalesFeatures: Custom object + Apex class using CoreObjects
   - ServiceFeatures: Another custom object + Apex class

3. Create package versions for each

4. Create a CI/CD pipeline that:
   - Creates package versions on merge to main
   - Tests packages in scratch orgs
   - Promotes on manual approval

5. Install all packages in a scratch org and verify dependencies

**Deliverables**:

- [ ] Three packages defined in `sfdx-project.json`
- [ ] Metadata organized in package directories
- [ ] At least one package version created for each package
- [ ] CI/CD pipeline for package creation and testing
- [ ] Documentation showing dependency graph
- [ ] Successfully installed all packages in scratch org

**You'll know you succeeded when**:
- Dependencies are correctly declared and enforced
- You can upgrade one package without affecting others
- CI/CD automatically creates and tests package versions

## Package Development Checklist

Effective package development requires:

- [ ] Dev Hub enabled with 2GP support
- [ ] Clear package boundaries and responsibilities
- [ ] Explicit dependency declarations
- [ ] Semantic versioning strategy
- [ ] Test coverage >= 75% per package
- [ ] CI/CD pipeline for package creation
- [ ] Documentation of package architecture
- [ ] Testing in isolation (scratch orgs)
- [ ] Upgrade strategy for target orgs

## What We Learned

Packages transform monolithic Salesforce orgs into modular, maintainable applications:

1. **Modularity**: Break applications into logical units
2. **Versioning**: Track changes and enable rollback
3. **Dependencies**: Explicit declaration and management
4. **Independent deployment**: Deploy just what changed
5. **Isolation testing**: Test packages independently
6. **Source-driven**: Packages defined in version control

Packages are essential for enterprise-scale Salesforce development. They enable parallel development, reduce deployment risk, and make applications maintainable as they grow.

## What's Next

You now know how to build modular applications with packages. But how do you coordinate releases across multiple packages and teams?

Next: **Release Management and Coordination**.

You'll learn:
- Release planning and trains
- Coordinating multi-package releases
- Managing release branches
- Release notes automation
- Hotfix procedures
- Communication strategies

See you there!
