# Code Review Best Practices

## The $2 Million Pull Request

A senior developer pushed a seemingly innocent change: updating a validation rule on the Opportunity object. The PR had three approvals from other senior engineers. It sailed through code review.

It deployed to production Friday afternoon.

By Monday morning, the sales team couldn't create opportunities. 2,000 pending deals were stuck. Sales ops calculated the revenue impact: approximately $2 million in delayed closes.

The bug? A logic error in the validation rule that only occurred for a specific combination of fields—a combination that appeared in 40% of real opportunities but 0% of test data.

Three experienced engineers reviewed the code. None caught it.

This is why code reviews matter. And why doing them well is a critical DevOps skill.

## What Code Review Achieves

Good code reviews do four things:

**1. Catch bugs before production**
The obvious one. Fresh eyes spot issues the author missed.

**2. Spread knowledge**
Reviewers learn how the system works. Authors learn better patterns.

**3. Maintain standards**
Ensure consistency in code style, patterns, and architecture.

**4. Build team culture**
Reviews are conversations about quality. They shape how your team thinks about code.

Bad code reviews do none of these. They're a checkbox exercise that wastes time without adding value.

Let's build a code review practice that actually works.

## The Code Review Checklist

When reviewing Salesforce code, check these categories systematically:

### 1. Functionality

- [ ] Does the code do what the PR description says?
- [ ] Are there edge cases that aren't handled?
- [ ] Does it work for bulk operations (200 records at once)?
- [ ] What happens if data is missing or invalid?

### 2. Testing

- [ ] Do tests exist for new/modified code?
- [ ] Is code coverage >= 75% (ideally 90%+)?
- [ ] Do tests actually test logic or just achieve coverage?
- [ ] Are negative test cases included?
- [ ] Are bulk scenarios tested (201 records)?

### 3. Security

- [ ] Is user input sanitized (prevent XSS, injection)?
- [ ] Are CRUD/FLS permissions checked?
- [ ] Are SOQL queries parameterized (prevent injection)?
- [ ] Are sensitive fields protected?
- [ ] Does the code respect sharing rules?

### 4. Performance

- [ ] Are there SOQL queries in loops?
- [ ] Is the number of SOQL queries minimized?
- [ ] Are DML statements bulkified?
- [ ] Are collections used efficiently?
- [ ] Will this code hit governor limits with realistic data?

### 5. Maintainability

- [ ] Is the code readable and well-organized?
- [ ] Are variable/method names descriptive?
- [ ] Is complex logic commented?
- [ ] Does it follow existing patterns?
- [ ] Would a new team member understand this in 6 months?

### 6. Deployment Safety

- [ ] Will this break existing functionality?
- [ ] Is the change backward compatible?
- [ ] Does it require data migration?
- [ ] Are there dependencies that need to deploy first?

## Common Salesforce Code Issues

### Issue 1: SOQL in Loops

**Bad:**

```java
// DON'T DO THIS
for (Account acc : accountList) {
    List<Contact> contacts = [
        SELECT Id, Name
        FROM Contact
        WHERE AccountId = :acc.Id
    ];
    // Process contacts...
}
// This hits SOQL limit at 100 accounts!
```

**Good:**

```java
// Bulkified approach
Set<Id> accountIds = new Set<Id>();
for (Account acc : accountList) {
    accountIds.add(acc.Id);
}

// Single SOQL query
List<Contact> allContacts = [
    SELECT Id, Name, AccountId
    FROM Contact
    WHERE AccountId IN :accountIds
];

// Build a map
Map<Id, List<Contact>> contactsByAccount = new Map<Id, List<Contact>>();
for (Contact c : allContacts) {
    if (!contactsByAccount.containsKey(c.AccountId)) {
        contactsByAccount.put(c.AccountId, new List<Contact>());
    }
    contactsByAccount.get(c.AccountId).add(c);
}

// Now process
for (Account acc : accountList) {
    List<Contact> contacts = contactsByAccount.get(acc.Id);
    // Process contacts...
}
```

**Review Comment Template:**

```markdown
**⚠️ SOQL in loop detected (Line 42)**

This query will execute once per account, hitting governor limits at 100 records.

**Recommendation:**
Move the SOQL query outside the loop and use a Map to organize results by AccountId.

**Example:**
[Link to wiki page on bulkification patterns]
```

### Issue 2: Missing Null Checks

**Bad:**

```java
public String getAccountIndustry(Id accountId) {
    Account acc = [SELECT Industry FROM Account WHERE Id = :accountId];
    return acc.Industry.toLowerCase();  // NullPointerException if Industry is null!
}
```

**Good:**

```java
public String getAccountIndustry(Id accountId) {
    List<Account> accounts = [SELECT Industry FROM Account WHERE Id = :accountId LIMIT 1];

    if (accounts.isEmpty()) {
        return null;  // Account not found
    }

    Account acc = accounts[0];
    return acc.Industry != null ? acc.Industry.toLowerCase() : 'Unknown';
}
```

**Review Comment:**

```markdown
**🐛 Potential NullPointerException (Line 15)**

If `Industry` is null, calling `.toLowerCase()` will throw an exception.

**Recommendation:**
Add null check: `acc.Industry != null ? acc.Industry.toLowerCase() : 'Unknown'`
```

### Issue 3: Missing CRUD/FLS Checks

**Bad:**

```java
public void updateAccounts(List<Account> accounts) {
    update accounts;  // No permission check!
}
```

**Good:**

```java
public void updateAccounts(List<Account> accounts) {
    // Check object-level permission
    if (!Schema.sObjectType.Account.isUpdateable()) {
        throw new SecurityException('Insufficient permissions to update Accounts');
    }

    // Check field-level security for fields we're updating
    if (!Schema.sObjectType.Account.fields.Industry.isUpdateable()) {
        throw new SecurityException('Insufficient permissions to update Industry field');
    }

    update accounts;
}
```

**Review Comment:**

```markdown
**🔒 Security: Missing CRUD/FLS check (Line 23)**

This code doesn't verify that the current user has permission to update Account records.

**Recommendation:**
Add permission checks using `Schema.sObjectType.Account.isUpdateable()` before DML.

**Security Policy:**
All DML operations must include CRUD/FLS checks unless running in system context with explicit justification.
```

### Issue 4: Non-Bulkified DML

**Bad:**

```java
for (Account acc : accounts) {
    acc.Status__c = 'Updated';
    update acc;  // DML in loop!
}
```

**Good:**

```java
for (Account acc : accounts) {
    acc.Status__c = 'Updated';
}
update accounts;  // Single DML statement
```

### Issue 5: Testing Code Coverage vs. Logic

**Bad Test:**

```java
@IsTest
static void testAccountTrigger() {
    Account acc = new Account(Name = 'Test');
    insert acc;  // Just achieves coverage, doesn't verify behavior
}
```

**Good Test:**

```java
@IsTest
static void testAccountTrigger_SetsDefaultIndustry() {
    // Setup
    Account acc = new Account(Name = 'Test Corp');
    // Note: Industry not set

    // Execute
    Test.startTest();
    insert acc;
    Test.stopTest();

    // Verify
    Account inserted = [SELECT Industry FROM Account WHERE Id = :acc.Id];
    System.assertEquals('Technology', inserted.Industry,
        'Trigger should set default Industry to Technology');
}
```

**Review Comment:**

```markdown
**📝 Test quality (Line 87)**

This test inserts an Account but doesn't verify any behavior. It achieves code coverage without actually testing logic.

**Recommendation:**
Add assertions to verify:
- What fields were populated by the trigger?
- What related records were created?
- What business logic executed correctly?

**Example:**
```java
System.assertEquals('Expected Value', actual.Field__c, 'Description of what should happen');
```
```

## Giving Effective Feedback

### The Feedback Sandwich (Don't Use It)

You've probably heard of the "feedback sandwich": positive comment, negative comment, positive comment.

Don't use it for code reviews. It's patronizing and wastes time.

### Better: Direct, Specific, Actionable

**Bad feedback:**

```
This code doesn't look right.
```

What's wrong? How should it be fixed?

**Good feedback:**

```markdown
**Bulkification issue (Line 42)**

This SOQL query inside the loop will fail when processing more than 100 accounts.

**Recommendation:**
Move the query outside the loop:
```java
Map<Id, Contact> contacts = new Map<Id, Contact>([
    SELECT Id, AccountId FROM Contact WHERE AccountId IN :accountIds
]);
```

**Reference:** [Bulkification Patterns Guide]
```

### Use Labels

Categorize feedback to show priority:

- **🐛 Bug**: Will cause failures
- **⚠️ Warning**: Might cause issues
- **🔒 Security**: Security vulnerability
- **📝 Suggestion**: Nice-to-have improvement
- **💡 Question**: Asking for clarification
- **✨ Praise**: Something done well

**Example:**

```markdown
**🐛 Bug (Line 23):** NullPointerException if Industry is null
**⚠️ Warning (Line 45):** This might hit governor limits with large data volumes
**📝 Suggestion (Line 67):** Consider extracting this to a helper method for reusability
**💡 Question (Line 89):** Why are we querying Contact twice here?
**✨ Praise (Line 102):** Excellent use of bulkification pattern here!
```

### Ask Questions, Don't Demand

**Demanding:**

```
Change this to use a Map.
```

**Asking:**

```
Have you considered using a Map here? It would improve lookup performance from O(n) to O(1).
```

People are more receptive to suggestions than orders.

### Link to Resources

Don't just say "this is wrong." Show how to fix it:

```markdown
**Performance issue (Line 34)**

Consider using `List.sort()` instead of nested loops.

**Example:**
https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/langCon_apex_collections_lists_sorting.htm
```

## Receiving Feedback

You'll give reviews and receive them. How you respond matters:

### Don't Take It Personally

Code reviews are about code, not you. "This code has a bug" is not "you're a bad developer."

### Ask for Clarification

```markdown
> **Reviewer:** This could be more efficient.

**You:** Thanks for the feedback! Could you elaborate on what specific efficiency concern you see? Happy to optimize if there's a performance issue.
```

### Acknowledge and Adapt

```markdown
> **Reviewer:** Missing null check on line 42

**You:** Good catch! Fixed in commit abc123.
```

### Push Back When Necessary

If you disagree, explain why:

```markdown
> **Reviewer:** Extract this to a separate method.

**You:** I considered that, but this logic is only used once and the method would only be 3 lines. I think it's clearer inline. What do you think?
```

Healthy debate makes code better.

## Automating Code Reviews

Automate the tedious stuff so reviewers focus on logic:

### PMD for Static Analysis

**`.pmd/ruleset.xml`:**

```xml
<?xml version="1.0"?>
<ruleset name="Salesforce Ruleset">
    <description>Salesforce Apex rules</description>

    <!-- Detect SOQL in loops -->
    <rule ref="category/apex/performance.xml/AvoidSoqlInLoops"/>

    <!-- Detect DML in loops -->
    <rule ref="category/apex/performance.xml/AvoidDmlStatementsInLoops"/>

    <!-- Enforce naming conventions -->
    <rule ref="category/apex/codestyle.xml/ClassNamingConventions"/>
    <rule ref="category/apex/codestyle.xml/MethodNamingConventions"/>

    <!-- Security rules -->
    <rule ref="category/apex/security.xml/ApexCRUDViolation"/>
    <rule ref="category/apex/security.xml/ApexInsecureEndpoint"/>

    <!-- Code quality -->
    <rule ref="category/apex/design.xml/ExcessiveClassLength"/>
    <rule ref="category/apex/design.xml/ExcessiveParameterList"/>
    <rule ref="category/apex/design.xml/CyclomaticComplexity"/>
</ruleset>
```

**Pipeline Integration:**

```yaml
code_quality:
  stage: test
  script:
    - npm install -g pmd-bin
    - pmd -d force-app/main/default/classes -R .pmd/ruleset.xml -f text

  allow_failure: true
  artifacts:
    reports:
      codequality: pmd-report.json
```

### Salesforce Code Analyzer

```yaml
salesforce_scanner:
  stage: test
  script:
    - sf plugins install @salesforce/sfdx-scanner
    - sf scanner run --target "force-app/**/*.cls" --format table

  allow_failure: false  # Block PR if critical issues found
```

### ESLint for LWC

**`.eslintrc.json`:**

```json
{
  "extends": ["@salesforce/eslint-config-lwc/recommended"],
  "rules": {
    "no-console": "error",
    "@lwc/lwc/no-api-reassignments": "error"
  }
}
```

```yaml
lint_lwc:
  stage: test
  script:
    - npm install
    - npm run lint
```

### Automated Feedback on PR

```yaml
automated_review:
  stage: review
  script:
    - |
      # Run all checks
      ./scripts/run-code-analysis.sh > analysis-results.txt

      # Post results as PR comment
      gh pr comment $CI_MERGE_REQUEST_IID --body-file analysis-results.txt
```

## Code Review Workflow

### Step 1: Author Prepares PR

Before requesting review:

```markdown
## PR Checklist (Author)

- [ ] Code follows team style guide
- [ ] All tests pass locally
- [ ] Code coverage >= 75%
- [ ] No PMD violations
- [ ] Self-reviewed the code (read through your own diff)
- [ ] Added/updated documentation
- [ ] PR description explains what and why
```

### Step 2: Automated Checks Run

```yaml
pr_checks:
  stage: validate
  only:
    - merge_requests
  script:
    - npm run lint
    - sf apex run test --test-level RunLocalTests
    - pmd -d force-app -R .pmd/ruleset.xml
    - sf scanner run --target "force-app/**/*.cls"
```

### Step 3: Manual Review

**Reviewer Checklist:**

- [ ] Read the PR description (understand the context)
- [ ] Check automated test results (all green?)
- [ ] Review the code (functionality, security, performance)
- [ ] Check test quality (not just coverage)
- [ ] Leave feedback (specific, actionable)
- [ ] Approve or request changes

### Step 4: Author Responds

- Address all feedback
- Reply to comments (explaining changes or asking questions)
- Request re-review when ready

### Step 5: Approval and Merge

- At least 1 approval (2 for critical changes)
- All automated checks passing
- All reviewer comments resolved or acknowledged

## Review SLAs

Set expectations for review turnaround:

| PR Size | Expected Review Time |
|---------|---------------------|
| Small (< 50 lines) | 2 hours |
| Medium (50-200 lines) | 4 hours |
| Large (200-500 lines) | 1 day |
| Extra Large (> 500 lines) | Should be split into smaller PRs |

**Pro tip:** Smaller PRs get reviewed faster and more thoroughly.

## Building a Review Culture

### Make It Part of the Process

```yaml
deploy:
  stage: deploy
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  needs: [code_review]  # Can't deploy without review
```

### Recognize Good Reviewers

Track and celebrate:
- Most helpful feedback
- Fastest turnaround
- Best at catching bugs

### Learn from Issues

When bugs reach production:

```markdown
## Post-Mortem: Production Bug #1234

**What happened:** Validation rule logic error
**Impact:** 2,000 stuck opportunities
**Root cause:** Edge case not tested

**How did this pass code review?**
- No one thought to test the specific field combination
- Test coverage was 85% but didn't test this path
- Reviewers assumed tests were comprehensive

**Improvements:**
1. Add review checklist item: "Verify edge cases are tested"
2. Update test template with common edge case examples
3. Schedule team training on effective test design
```

## Hands-On Exercise: Review This Code

**Your Task:** Review the following code and provide feedback.

```java
public class OpportunityHandler {

    public void updateOpportunities(List<Id> oppIds) {
        for (Id oppId : oppIds) {
            Opportunity opp = [SELECT Id, Amount FROM Opportunity WHERE Id = :oppId];
            if (opp.Amount > 100000) {
                opp.Stage = 'Negotiation';
                update opp;
            }
        }
    }

    public Decimal calculateTotal(List<Opportunity> opps) {
        Decimal total = 0;
        for (Opportunity opp : opps) {
            total += opp.Amount;
        }
        return total;
    }
}
```

**Provide feedback on:**
1. Bulkification issues
2. Null safety
3. CRUD/FLS security
4. Error handling
5. Overall code quality

**Expected findings:**
- SOQL in loop
- DML in loop
- No null check on Amount
- No CRUD/FLS checks
- No error handling

**Deliverable:** Write code review comments as you would in a real PR.

## Code Review Checklist

Effective code reviews check:

- [ ] **Functionality**: Does it work? Edge cases handled?
- [ ] **Testing**: Adequate tests? Logic tested, not just coverage?
- [ ] **Security**: CRUD/FLS? Input sanitization? No injection vulnerabilities?
- [ ] **Performance**: Bulkified? No SOQL/DML in loops? Governor limits safe?
- [ ] **Maintainability**: Readable? Well-structured? Follows patterns?
- [ ] **Deployment**: Backward compatible? Dependencies documented?

## What We Learned

Code reviews are your last line of defense before production:

1. **Systematic approach**: Use checklists to catch common issues
2. **Specific feedback**: Direct, actionable, with examples
3. **Automate tedious checks**: PMD, Code Analyzer, ESLint
4. **Build culture**: Make reviews collaborative, not confrontational
5. **Continuous improvement**: Learn from bugs that slip through

Good code reviews prevent bugs, spread knowledge, and build better teams.

## What's Next

You've learned to catch issues through code review. But when issues do occur—or when you're troubleshooting—you need to know the common error patterns.

Next: **Common Errors and Solutions Reference**.

A comprehensive guide to:
- Frequently encountered Salesforce deployment errors
- Common Apex errors and fixes
- Pipeline failure patterns
- Quick troubleshooting decision trees

See you there!
