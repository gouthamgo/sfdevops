---
sidebar_position: 5
title: Approval Processes
description: Master Salesforce approval processes - configure multi-step approvals, email notifications, and automated workflows
---

# Approval Processes: Automate Approvals

Master Salesforce approval processes to automate approval workflows. Learn entry criteria, approval steps, actions, and real-world patterns.

## 🎯 What You'll Master

- Approval process basics
- Entry criteria
- Approval steps
- Approval actions
- Email templates
- Approval history
- Recall and reassignment
- Multi-level approvals
- Matrix approvals
- Best practices
- Real-world examples

## 🔄 Approval Process Overview

```
Approval Process Flow:

1. User submits record for approval
   ↓
2. Entry criteria evaluated
   ↓
3. Initial submission actions (optional)
   ↓
4. Approval step 1
   - Who approves?
   - Step criteria met?
   ↓
5. Approver receives notification
   ↓
6. Approver approves/rejects
   ↓
7. Final approval/rejection actions
   ↓
8. Record locked or unlocked
```

## 🛠️ Creating Approval Process

### Step-by-Step Setup

```
Setup → Process Automation → Approval Processes → Select Object

Step 1: Basic Information
Process Name: Property Price Approval
Unique Name: Property_Price_Approval
Description: Approve properties priced over $1M

Step 2: Entry Criteria
Criteria: Price__c greater than 1000000
Formula: Price__c > 1000000

Step 3: Submitter
Who can submit: Record Owner, Record Creator
Allow submitters to recall: Yes

Step 4: Approvers
Select approver: Let the submitter choose
Auto-assign: Manager, User, Queue, or Related User

Step 5: Email Template
Select template for approval request
```

### Entry Criteria

Determines which records can enter the approval process.

```
Option 1: Criteria
Field: Price__c
Operator: greater than
Value: 1000000

AND
Field: Status__c
Operator: equals
Value: Pending Approval

Option 2: Formula
Formula Criteria:
AND(
  Price__c > 1000000,
  ISPICKVAL(Status__c, "Pending Approval"),
  NOT(ISBLANK(Description__c))
)

Option 3: No Criteria
All records can enter (be careful!)
```

### Approval Steps

Define who approves and in what order.

**Step 1: Manager Approval**
```
Step Name: Manager Approval
Step Number: 1

Enter this step if:
- All records should enter this step

Approver:
- Automatically assign to: The approver's manager
- Or: Let submitter choose
- Or: Automatically assign using custom hierarchy field

When approver is unavailable:
- Automatically approve
- Or: Reject
- Or: Reassign to approver's manager
```

**Step 2: Executive Approval**
```
Step Name: Executive Approval
Step Number: 2

Enter this step if:
- Criteria: Price__c greater than 5000000
- Formula: Price__c > 5000000 AND Risk_Level__c = "High"

Approver:
- User: John Smith (VP Sales)
- Or: Queue: Executive Approval Queue
- Or: Related User: Property__r.Account__r.Owner

Approval Assignment Email Template:
- Executive Approval Request
```

## 📧 Email Templates

### Create Email Template

```
Setup → Email Templates → New Template

Template Type: Text or HTML
Folder: Sales Approval Templates

Subject: Approval Request: {!Property__c.Name}

Body:
Hello {!User.FirstName},

A property approval request requires your attention.

Property: {!Property__c.Name}
Price: {!Property__c.Price__c}
Agent: {!Property__c.Owner.Name}
Submitted by: {!User.Name}

Reason: {!ApprovalRequest.Comments}

To approve or reject, click here:
{!ApprovalRequest.External_Approval_Link}

Thank you,
Salesforce Approvals
```

### Merge Fields Available

```
Record Fields:
{!Property__c.Name}
{!Property__c.Price__c}
{!Property__c.Status__c}

User Fields:
{!User.Name}
{!User.Email}
{!User.Manager.Name}

Approval Fields:
{!ApprovalRequest.Comments}
{!ApprovalRequest.External_Approval_Link}
{!ApprovalRequest.Internal_Approval_Link}
```

## ⚡ Approval Actions

Actions that execute at different stages.

### Initial Submission Actions

Executed when record is submitted for approval.

```
Available Actions:
├── Field Update
│   └── Update Status__c to "Pending Approval"
├── Email Alert
│   └── Notify submitter of submission
├── Task
│   └── Create task for follow-up
├── Outbound Message
│   └── Send to external system
└── Apex
    └── Call custom Apex class

Example: Lock Record
Field Update:
- Field: Status__c
- New Value: "Pending Approval"
- Re-evaluate Workflow Rules: No
```

### Final Approval Actions

Executed when all approvals are complete.

```
Example Actions:

1. Field Update: Status = "Approved"
2. Field Update: Approved_Date__c = TODAY()
3. Field Update: Approved_By__c = $User.Id
4. Email Alert: Notify submitter of approval
5. Email Alert: Notify property owner
6. Task: Create task for next steps
7. Flow: Trigger post-approval flow
```

### Final Rejection Actions

Executed when approval is rejected.

```
Example Actions:

1. Field Update: Status = "Rejected"
2. Field Update: Rejection_Reason__c = {Comments}
3. Email Alert: Notify submitter of rejection
4. Task: Create task to revise and resubmit
```

### Recall Actions

Executed when submitter recalls approval.

```
Example Actions:

1. Field Update: Status = "Draft"
2. Email Alert: Notify approvers of recall
3. Task: Delete pending approval tasks
```

## 🔒 Record Locking

Control who can edit records during approval.

```
Record Lock Settings:

Lock record for editing:
✅ Yes (recommended)
   - Only admin can edit
   - Prevents changes during approval

❌ No
   - Record can be edited
   - Could affect approval criteria

Unlock record when:
✅ Final approval
✅ Final rejection
✅ Recall
```

### Override Record Lock

```
Administrators can edit locked records:
Setup → Object Manager → Property__c → Edit

Field: Locked by Approval Process
Allow editing by: Administrators, Assigned Approver

Custom Permission:
Create permission set to allow editing locked records
```

## 👥 Assigning Approvers

### Approver Assignment Methods

**1. Let Submitter Choose**
```
When: Submitter knows who should approve
Example: Agent selects their manager

Approver:
- Approver: Let the submitter choose the approver
- Default Approver: Manager (fallback)
```

**2. Automatically Assign to User**
```
When: Always same person
Example: VP Sales approves all deals over $5M

Approver:
- User: John Smith (VP Sales)
```

**3. Automatically Assign to Manager**
```
When: Manager should approve
Example: Employee expense approval

Approver:
- The approver's manager
- Based on: User.ManagerId field
```

**4. Automatically Assign to Queue**
```
When: Team-based approval
Example: Legal review queue

Approver:
- Queue: Legal Approval Queue
- Any member can approve
```

**5. Related User**
```
When: Approver is related to record
Example: Account owner approves opportunities

Approver:
- Related User Field: Property__r.Account__r.OwnerId
```

**6. Custom Hierarchy Field**
```
When: Custom approval hierarchy
Example: Territory manager approves

Approver:
- Custom Field: Territory_Manager__c
- Hierarchy: Territory Hierarchy
```

## 🎯 Real-World Examples

### Example 1: Property Discount Approval

**Scenario:** Properties with discounts > 10% require approval.

**Setup:**
```
Approval Process: Property Discount Approval

Entry Criteria:
Discount_Percent__c > 10

Initial Submission Actions:
1. Field Update: Status__c = "Pending Approval"
2. Email Alert: Notify agent of submission

Approval Steps:

Step 1: Manager Approval (all records)
- Approver: Submitter's Manager
- Email Template: Manager Approval Request

Step 2: Director Approval (discount > 20%)
- Entry Criteria: Discount_Percent__c > 20
- Approver: User "Sales Director"
- Email Template: Director Approval Request

Final Approval Actions:
1. Field Update: Status__c = "Approved"
2. Field Update: Approval_Date__c = TODAY()
3. Email Alert: Notify agent of approval
4. Task: Create listing activation task

Final Rejection Actions:
1. Field Update: Status__c = "Rejected"
2. Field Update: Discount_Percent__c = 0
3. Email Alert: Notify agent of rejection
4. Task: Create task to revise pricing
```

### Example 2: Opportunity Approval (Matrix)

**Scenario:** Different approval paths based on amount and region.

**Setup:**
```
Approval Process: Opportunity Matrix Approval

Entry Criteria:
Amount > 100000

Approval Steps:

Step 1: Regional Manager (Amount $100K-$500K)
- Entry Criteria:
  AND(Amount >= 100000, Amount < 500000)
- Approver: Property__r.Account__r.Regional_Manager__c
- Reject Behavior: Reject
- Approve Behavior: Go to Step 3 (skip Step 2)

Step 2: VP Sales (Amount $500K-$1M)
- Entry Criteria:
  AND(Amount >= 500000, Amount < 1000000)
- Approver: User "VP Sales"
- Reject Behavior: Reject
- Approve Behavior: Go to Step 3

Step 3: CFO (Amount >= $1M)
- Entry Criteria: Amount >= 1000000
- Approver: User "CFO"
- Reject Behavior: Reject
- Approve Behavior: Approve

Final Approval Actions:
1. Field Update: Stage = "Closed Won"
2. Field Update: Status__c = "Approved"
3. Email Alert: Notify sales team
4. Flow: Trigger order creation flow

Final Rejection Actions:
1. Field Update: Status__c = "Rejected"
2. Field Update: Rejection_Date__c = TODAY()
3. Email Alert: Notify account executive
```

### Example 3: Time-Off Request

**Scenario:** Employee time-off request approval.

**Setup:**
```
Approval Process: Time Off Request

Entry Criteria:
Status__c = "Submitted"

Initial Submission Actions:
1. Field Update: Status__c = "Pending Approval"
2. Email Alert: Confirmation to employee

Approval Steps:

Step 1: Manager Approval
- Approver: The submitter's manager
- Email Template: Time Off Approval Request
- Allow delegate: Yes

Step 2: HR Approval (> 5 days)
- Entry Criteria: Days_Requested__c > 5
- Approver: Queue "HR Approval Queue"
- Email Template: HR Approval Request

Final Approval Actions:
1. Field Update: Status__c = "Approved"
2. Field Update: Approval_Date__c = TODAY()
3. Email Alert: Notify employee of approval
4. Email Alert: Notify team of employee absence
5. Task: Add to team calendar

Final Rejection Actions:
1. Field Update: Status__c = "Rejected"
2. Email Alert: Notify employee with reason
3. Task: Schedule meeting to discuss
```

## 📱 User Experience

### Submitting for Approval

**Option 1: Standard Button**
```
Add "Submit for Approval" button to page layout
User clicks button → Enters comments → Submits
```

**Option 2: Custom Button**
```
Create custom button with pre-filled comments
JavaScript: Call Apex to submit with logic
```

**Option 3: Automatic Submission**
```
Use Process Builder or Flow to auto-submit
When: Record meets criteria
Action: Submit for Approval
```

**Option 4: Apex**
```apex
// Submit property for approval
Approval.ProcessSubmitRequest req = new Approval.ProcessSubmitRequest();
req.setObjectId(propertyId);
req.setSubmitterId(UserInfo.getUserId());
req.setComments('Requesting approval for high-value property');
req.setProcessDefinitionNameOrId('Property_Price_Approval');

Approval.ProcessResult result = Approval.process(req);

if (result.isSuccess()) {
    System.debug('Submitted for approval successfully');
} else {
    System.debug('Errors: ' + result.getErrors());
}
```

### Approving/Rejecting

**Option 1: Email**
```
Approver receives email
Clicks approve/reject link in email
Enters comments
Submits decision
```

**Option 2: Chatter**
```
Post appears in Chatter feed
Approver clicks Approve/Reject
Enters comments
Submits decision
```

**Option 3: Salesforce UI**
```
Home → Items to Approve
View record details
Click Approve or Reject
Enter comments
Submit
```

**Option 4: Mobile**
```
Salesforce Mobile App
Notifications → Approval Request
Swipe to Approve/Reject
```

### Recall Approval

**Recall by Submitter:**
```
Record Detail Page → Recall Approval Request
Enters reason for recall
Record returns to pre-submission state
Recall actions execute
```

**Reassign Approval:**
```
Approver can reassign to another user
Record → Reassign
Select new approver
Add comments
Submit
```

## 🔍 Approval History

View complete approval history on record.

```
Approval History Related List:

Shows:
├── Date/Time
├── Status (Submitted, Approved, Rejected)
├── Assigned To
├── Actual Approver
├── Comments
└── Overall Status

Enable on Page Layout:
Page Layout Editor → Related Lists → Approval History
```

### Query Approval History

```apex
// Get approval history for record
List<ProcessInstanceHistory> history = [
    SELECT Id, StepStatus, Comments, ActorId, CreatedDate
    FROM ProcessInstanceHistory
    WHERE TargetObjectId = :recordId
    ORDER BY CreatedDate DESC
];

for (ProcessInstanceHistory h : history) {
    System.debug('Status: ' + h.StepStatus);
    System.debug('Comments: ' + h.Comments);
    System.debug('Approved By: ' + h.ActorId);
}

// Get current approval status
List<ProcessInstance> current = [
    SELECT Status, TargetObjectId
    FROM ProcessInstance
    WHERE TargetObjectId = :recordId
    AND Status = 'Pending'
];
```

## 💡 Best Practices

### ✅ DO:

1. **Use Clear Naming**
   ```
   ✅ GOOD:
   - "Property Price Approval"
   - "Discount Approval - Manager"
   - "Time Off Request - HR"

   ❌ BAD:
   - "Approval Process 1"
   - "Process"
   - "Test Approval"
   ```

2. **Lock Records During Approval**
   ```
   ✅ Always lock records to prevent changes
   ✅ Only unlock after final decision
   ✅ Consider who can edit locked records
   ```

3. **Provide Clear Email Templates**
   ```
   Include:
   ✅ What needs approval
   ✅ Why it needs approval
   ✅ Key details (amount, date, requester)
   ✅ Direct link to approve/reject
   ✅ Deadline if applicable
   ```

4. **Use Entry Criteria Wisely**
   ```
   ✅ DO: Prevent invalid submissions
   Price__c > 1000000 AND Status__c = "Ready"

   ❌ DON'T: Too restrictive
   Price__c > 1000000 AND ISBLANK(Field1__c) AND...
   (Users can't submit anything!)
   ```

5. **Test All Scenarios**
   ```
   Test:
   ✅ Approval path
   ✅ Rejection path
   ✅ Recall path
   ✅ Multiple approval steps
   ✅ Matrix approvals
   ✅ Email notifications
   ✅ Record locking
   ```

### ❌ DON'T:

1. **Don't Skip Testing**
   ```
   ❌ Don't activate without testing
   ✅ Test in sandbox first
   ✅ Test with real users
   ✅ Test edge cases
   ```

2. **Don't Over-Complicate**
   ```
   ❌ BAD: 10 approval steps
   ✅ GOOD: 2-3 steps max

   ❌ BAD: Complex matrix with 20 paths
   ✅ GOOD: Simple, predictable paths
   ```

3. **Don't Forget Out-of-Office**
   ```
   ❌ Approvals stuck when approver is away
   ✅ Set up delegates
   ✅ Configure auto-approval after X days
   ✅ Use queues for team approvals
   ```

4. **Don't Mix Approval Process with Workflow**
   ```
   ❌ Both updating same fields
   ✅ Use approval process actions only
   ✅ Or use Flow, not both
   ```

5. **Don't Hardcode Users**
   ```
   ❌ BAD: Approver = "John Smith"
   What if John leaves?

   ✅ GOOD: Approver = Manager
   ✅ GOOD: Approver = Queue
   ✅ GOOD: Approver = Custom hierarchy field
   ```

## 🔧 Advanced Patterns

### Pattern 1: Parallel Approvals

Multiple approvers must approve simultaneously.

```
Not native in Salesforce

Workaround:
1. Create checkbox fields: Manager_Approved__c, Director_Approved__c
2. Use Flow to track approvals
3. When all checkboxes = TRUE, proceed to next step
```

### Pattern 2: Approval Matrix

Different paths based on multiple criteria.

```
Use Step Entry Criteria:

Step 1: Regional Manager
Criteria: Amount < 500000 AND Region = "West"

Step 2: VP Sales
Criteria: Amount >= 500000 OR Risk_Level = "High"

Step 3: CFO
Criteria: Amount >= 1000000
```

### Pattern 3: Approval with Expiration

Auto-approve if not responded within X days.

```
Use Time-Dependent Workflow (legacy) or Scheduled Flow:

1. Create scheduled Flow
2. Query pending approvals older than 3 days
3. Auto-approve using Apex
4. Send notification to original approver
```

### Pattern 4: Conditional Rejection

Reject only if specific condition met.

```
Use Apex in rejection action:

1. Rejection action triggers Flow
2. Flow calls Apex
3. Apex checks condition
4. If condition met, update Status = "Rejected"
5. Else, resubmit for approval
```

## 📚 Quick Reference

```apex
// Submit for approval
Approval.ProcessSubmitRequest req = new Approval.ProcessSubmitRequest();
req.setObjectId(recordId);
req.setComments('Comments here');
Approval.process(req);

// Approve
Approval.ProcessWorkitemRequest req = new Approval.ProcessWorkitemRequest();
req.setWorkitemId(workitemId);
req.setAction('Approve');
req.setComments('Approved');
Approval.process(req);

// Reject
req.setAction('Reject');

// Recall
Approval.ProcessWorkitemRequest req = new Approval.ProcessWorkitemRequest();
req.setWorkitemId(workitemId);
req.setAction('Removed');
Approval.process(req);

// Query pending approvals
List<ProcessInstanceWorkitem> workitems = [
    SELECT Id, ProcessInstance.TargetObjectId, ActorId
    FROM ProcessInstanceWorkitem
    WHERE ActorId = :UserInfo.getUserId()
];
```

## 🚀 Next Steps

**[→ Flow Builder](/docs/salesforce/declarative/flow-builder)** - Advanced automation

**[→ Validation Rules](/docs/salesforce/declarative/validation-rules)** - Data quality

**[→ Automation Comparison](/docs/salesforce/declarative/automation-comparison)** - Choose the right tool

---

**You now master approval processes!** Automate approvals with confidence. ✅
