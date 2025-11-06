---
sidebar_position: 8
title: User Management
description: Master Salesforce user management - creating users, roles, profiles, permission sets, and org administration
---

# User Management: Administer Users

Master Salesforce user management and administration. Learn to create users, manage roles, assign profiles and permission sets, and maintain your org.

## 🎯 What You'll Master

- Creating and managing users
- User licenses and permissions
- Roles and role hierarchy
- Profiles and permission sets
- Password policies and login settings
- User deactivation and freezing
- Delegated administration
- Login history and monitoring
- Two-factor authentication
- Best practices

## 👥 User Management Overview

```
Salesforce User Components:

User Record:
├── Username (email format)
├── Email
├── Profile (required)
├── Role (optional)
├── License Type
└── Active status

User Permissions:
├── Profile (baseline)
├── Permission Sets (additions)
├── Permission Set Groups
└── Role (data access via hierarchy)

User Settings:
├── Password policies
├── Login hours
├── IP restrictions
└── Two-factor authentication
```

## 👤 Creating Users

### Standard User Creation

```
Setup → Users → New User

Required Fields:
─────────────────────────────────────────
Last Name: Smith
Alias: jsmith (auto-generated, 8 chars max)
Email: john.smith@company.com
Username: john.smith@company.com
  (Must be unique across ALL Salesforce orgs)

Nickname: JSmith (Community Cloud)

User License: Salesforce
Profile: Standard User
Role: Sales Representative (optional)

Optional Fields:
─────────────────────────────────────────
First Name: John
Title: Sales Representative
Company: Acme Corp
Department: Sales
Division: West Coast
Employee Number: EMP-1234
Manager: Jane Doe

Locale Settings:
─────────────────────────────────────────
Time Zone: (GMT-08:00) Pacific Time
Locale: English (United States)
Language: English

Email Settings:
─────────────────────────────────────────
☐ Generate new password and notify user
  (User receives welcome email with setup link)

Save
```

### User License Types

```
Salesforce Licenses:
├── Salesforce (Full CRM access)
├── Salesforce Platform (Custom apps only)
├── Sales Cloud
├── Service Cloud
└── Marketing Cloud

Limited Licenses:
├── Chatter Free (Chatter only)
├── Chatter External (External users)
├── Guest User (Public sites)
├── Partner Community
└── Customer Community

License Determines:
- Which objects accessible
- Which features available
- API calls allowed
- Storage space allocated
```

## 📋 Profiles

User's baseline permissions.

### Standard Profiles

```
System Administrator:
- Full access to everything
- Cannot be edited (clone to customize)
- View Setup and Configuration
- Modify All Data

Standard User:
- Basic CRM access
- Read/Create/Edit on standard objects
- No administrative permissions

Read Only:
- View-only access
- Cannot create or edit records

Sales User:
- Optimized for sales team
- Access to Accounts, Contacts, Opportunities

Service User:
- Optimized for support team
- Access to Cases, Solutions

Marketing User:
- Optimized for marketing
- Access to Campaigns, Leads
```

### Custom Profiles

```
Create Custom Profile:

Setup → Users → Profiles → New Profile

1. Clone Existing Profile
   Existing Profile: Standard User
   Profile Name: Sales Representative
   Description: Profile for sales reps

2. Object Permissions
   Account:
   ☑ Read   ☑ Create   ☑ Edit   ☐ Delete
   ☐ View All   ☐ Modify All

   Opportunity:
   ☑ Read   ☑ Create   ☑ Edit   ☑ Delete
   ☐ View All   ☐ Modify All

   Property__c:
   ☑ Read   ☑ Create   ☑ Edit   ☐ Delete

3. Field-Level Security
   Account.AnnualRevenue:
   ☑ Read Access   ☐ Edit Access

   Property__c.Commission__c:
   ☐ Read Access   ☐ Edit Access

4. Administrative Permissions
   ☑ API Enabled
   ☑ View Setup and Configuration
   ☐ Modify All Data
   ☐ View All Data

5. General User Permissions
   ☑ Edit Tasks
   ☑ Edit Events
   ☑ Send Email
   ☑ Export Reports

Save
```

### Profile Settings

```
Login Hours:
- Restrict login times
- Example: Monday-Friday 8 AM - 6 PM
- Block after-hours access

Login IP Ranges:
- Restrict by IP address
- Example: Office IPs only
- VPN required for remote

Desktop Client Access:
- Salesforce for Outlook
- Data Loader
- Other desktop tools

Mobile Settings:
- Salesforce Mobile App
- Mobile dashboards
```

## 🎯 Permission Sets

Grant additional permissions without changing profile.

### Creating Permission Set

```
Setup → Users → Permission Sets → New

Permission Set Information:
─────────────────────────────────────────
Label: Property Manager Access
API Name: Property_Manager_Access
Description: Additional permissions for property managers
License: Salesforce (or "None" for any license)

Object Settings:
─────────────────────────────────────────
Property__c:
☑ Read   ☑ Create   ☑ Edit   ☑ Delete
☑ View All   ☑ Modify All

Field Permissions:
─────────────────────────────────────────
Property__c.Commission__c:
☑ Read Access   ☑ Edit Access

Property__c.Internal_Notes__c:
☑ Read Access   ☑ Edit Access

System Permissions:
─────────────────────────────────────────
☑ View Setup and Configuration
☑ Run Reports
☑ Export Reports

Save
```

### Assigning Permission Sets

```
Individual Assignment:
User → Permission Set Assignments → Edit Assignments
Add: Property Manager Access

Bulk Assignment (Apex):
PermissionSet ps = [
    SELECT Id FROM PermissionSet
    WHERE Name = 'Property_Manager_Access'
];

List<PermissionSetAssignment> assignments = new List<PermissionSetAssignment>();

for (User u : [SELECT Id FROM User WHERE Profile.Name = 'Sales Manager']) {
    assignments.add(new PermissionSetAssignment(
        PermissionSetId = ps.Id,
        AssigneeId = u.Id
    ));
}

insert assignments;
```

### Permission Set Groups

Bundle multiple permission sets.

```
Setup → Permission Set Groups → New

Group Name: Complete Property Access
Description: Full access to property management

Included Permission Sets:
☑ Property Manager Access
☑ Property Reporting Access
☑ Property API Access

Assign to Users:
- Easier than assigning 3 separate permission sets
- Maintain in one place
```

## 🏢 Roles and Role Hierarchy

Control data visibility through management chain.

### Role Hierarchy

```
Setup → Users → Roles → Set Up Roles

Role Structure:
CEO
 ├── VP Sales
 │    ├── Sales Manager West
 │    │    ├── Sales Rep 1
 │    │    └── Sales Rep 2
 │    └── Sales Manager East
 │         ├── Sales Rep 3
 │         └── Sales Rep 4
 └── VP Operations
      └── Operations Manager
           └── Operations Analyst

Data Access Rules:
- Users see records they own
- Users see records owned by subordinates
- Users see records shared with them
- Does NOT grant edit/delete (just visibility)
```

### Creating Roles

```
Setup → Roles → New

Role Name: Sales Manager West
Reports To: VP Sales

This role inherits:
- All roles below see data owned by this role
- VP Sales sees data owned by this role

Optional Settings:
☑ Opportunity Access: View and Edit All
☐ Case Access: View All
```

### Role vs Profile vs Permission Set

```
Profile:
- What user can DO
- Object CRUD permissions
- Feature access
- One per user (required)

Permission Set:
- Additional permissions beyond profile
- Grant extra access
- Multiple per user (optional)

Role:
- What data user can SEE
- Through role hierarchy
- Manager sees subordinate data
- One per user (optional)

Example User:
Profile: Standard User
  - Can read/create Accounts
  - Can read/create Opportunities

Permission Set: Report Builder
  - Can create custom reports
  - Can schedule reports

Role: Sales Rep West
  - Sees own Accounts
  - Sees Accounts owned by team
  - Sales Manager West sees all of the above
```

## 🔐 Security Settings

### Password Policies

```
Setup → Password Policies

Password Requirements:
─────────────────────────────────────────
Minimum Length: 8 characters
Password Complexity:
☑ Require at least one letter
☑ Require at least one number
☑ Require special character
☐ Prohibit common passwords

Password Expiration:
Expire passwords in: 90 days
Enforce password history: 3 passwords
Minimum password lifetime: 1 day

Lockout Settings:
Maximum invalid login attempts: 10
Lockout duration: 15 minutes
☑ Lockout effective period: 15 minutes

Password Question:
☑ Require a password question
Cannot contain password
```

### Two-Factor Authentication (2FA)

```
Setup → Identity → Multi-Factor Authentication

Enable:
☑ Require multi-factor authentication

Methods:
- Salesforce Authenticator (mobile app)
- Security Key (U2F)
- Built-in Authenticator (mobile browser)

Enforcement:
- Required for all users (recommended)
- Required for admins only
- Optional

User Setup:
1. Login with username/password
2. Prompted to set up 2FA
3. Install Salesforce Authenticator
4. Scan QR code
5. Enter verification code
6. Login complete

Backup Codes:
- 10 single-use backup codes
- Use if device unavailable
- Store securely
```

### Login Hours and IP Restrictions

```
Profile-Level Restrictions:

Login Hours:
Setup → Profiles → [Profile] → Login Hours

Monday:    8:00 AM - 6:00 PM
Tuesday:   8:00 AM - 6:00 PM
Wednesday: 8:00 AM - 6:00 PM
Thursday:  8:00 AM - 6:00 PM
Friday:    8:00 AM - 6:00 PM
Saturday:  No access
Sunday:    No access

IP Ranges:
Setup → Profiles → [Profile] → Login IP Ranges

Add Trusted IP Range:
Start IP: 192.168.1.1
End IP: 192.168.1.255
Description: Office Network

Effect:
- Users outside IP range see additional verification
- Or blocked entirely
```

## 👨‍💼 User Administration

### Deactivating Users

```
Setup → Users → [User] → Edit

☐ Active

Effect:
- User cannot login
- License freed up
- Data owned by user remains
- Can reactivate later
- Cannot delete users with data

Best Practice:
Always deactivate instead of delete
```

### Freezing Users

```
Setup → Users → [User]

Click "Freeze"

Effect:
- Immediate - prevents login right now
- Temporary - while you deactivate
- Useful for security incidents

Unfreeze when ready
```

### Resetting Passwords

```
Option 1: Admin Reset
Setup → Users → [User] → Reset Password
Email sent with reset link

Option 2: User Self-Service
Login page → "Forgot Password"
Enter username
Email sent with reset link

Option 3: Password Never Expires
Setup → Users → [User] → Edit
☑ Password Never Expires
(Use for integration users only!)
```

### Delegated Administration

Allow non-admins to manage users.

```
Setup → Delegated Administration Groups → New

Group Name: Sales User Administrators
Members:
- Add: Sales Managers

Can Administer:
☑ Users (create, edit, deactivate)
☑ Roles (assign)
☑ Profiles (assign specific profiles)
☑ Permission Sets (assign specific sets)

Delegate Responsibilities:
☑ Assign Profiles: Sales User, Sales Manager
☑ Assign Roles: Sales roles only
☑ Manage in Public Groups: Sales groups

Benefits:
- Reduce admin workload
- Empower department managers
- Faster user management
```

## 📊 Monitoring and Reports

### Login History

```
Setup → Login History

View Last 6 Months:
- Username
- Login Time
- Source IP
- Client (Browser/Mobile/API)
- Status (Success/Failed)
- Application

Filter by:
- User
- Date range
- Login status

Use Cases:
- Security auditing
- Troubleshooting login issues
- Track after-hours access
```

### User Licenses Report

```
Setup → Company Information → User Licenses

View:
- Total Licenses purchased
- Used licenses
- Remaining licenses
- License type details

Example:
Salesforce Licenses: 50 purchased, 45 used, 5 remaining
Platform Licenses: 10 purchased, 8 used, 2 remaining
```

### Permission Set Assignments Report

```
Report Type: Administrative
Report: Permission Sets by User

Fields:
- User Name
- Profile
- Permission Sets
- Assigned Date

Use:
- Audit user permissions
- Identify over-privileged users
- Clean up unused assignments
```

## 🏆 Real-World Scenarios

### Scenario 1: Onboarding New Employee

```
1. Create User
   Name: Jane Doe
   Email: jane.doe@company.com
   Username: jane.doe@company.com
   Profile: Sales User
   Role: Sales Representative
   ☑ Generate password and notify

2. Assign Permission Sets
   ☑ Property Manager Access
   ☑ Report Builder

3. Add to Public Groups
   ☑ Sales Team
   ☑ West Coast Team

4. Grant Sharing Access
   - Share: Sales Training folder
   - Share: Team dashboards

5. User Receives Email
   - Welcome email with login link
   - Sets password
   - Completes 2FA setup
   - Starts working!
```

### Scenario 2: Employee Termination

```
1. Immediate: Freeze User
   Users → [User] → Freeze
   - Prevents login immediately

2. Reassign Records
   - Accounts → Change Owner → New Owner
   - Opportunities → Change Owner
   - Cases → Change Owner

3. Review Shared Files/Folders
   - Transfer ownership
   - Update sharing settings

4. Deactivate User
   Users → [User] → Edit
   ☐ Active
   - Frees license
   - Cannot login

5. Archive or Delete Data (if allowed)
   - Follow company retention policy
   - Some records may need to be kept

Timeline: Complete within 1 hour of termination
```

### Scenario 3: Promotion to Manager

```
User: John Smith
Change: Promoted from Sales Rep to Sales Manager

Updates:

1. Change Role
   Role: Sales Representative → Sales Manager West
   Effect: Now sees subordinate data

2. Update Profile
   Profile: Sales User → Sales Manager
   Or add Permission Set: Manager Access

3. Grant Additional Access
   Permission Set: Commission Viewer
   Permission Set: Advanced Reporting
   Permission Set: User Manager

4. Update Reporting
   Add to: Sales Management Reports
   Subscribe to: Weekly Performance Dashboard

5. Enable Delegation
   Add to: Delegated Admin Group
   Can now: Manage sales team users
```

## 💡 Best Practices

### ✅ DO:

1. **Use Email Format for Usernames**
   ```
   ✅ john.smith@company.com
   ✅ Unique across all Salesforce orgs
   ✅ Easy to remember
   ```

2. **Minimal Profile, Additive Permission Sets**
   ```
   Profile: Baseline permissions
   Permission Sets: Additional permissions

   Benefits:
   - Easier to manage
   - Flexible
   - Audit trail
   ```

3. **Require Two-Factor Authentication**
   ```
   ✅ Enable for all users
   ✅ Especially admins
   ✅ Reduces security risks
   ```

4. **Review User Access Regularly**
   ```
   Quarterly Review:
   - Inactive users → Deactivate
   - Excessive permissions → Remove
   - Role assignments → Verify correct
   ```

5. **Document User Roles and Responsibilities**
   ```
   ✅ Profile descriptions
   ✅ Permission set descriptions
   ✅ Role hierarchy diagram
   ✅ Onboarding/offboarding procedures
   ```

### ❌ DON'T:

1. **Don't Share Logins**
   ```
   ❌ Multiple people using one login
   ✅ Each person gets own user account

   Reasons:
   - Audit trail lost
   - Security risk
   - License violation
   ```

2. **Don't Make Everyone Admin**
   ```
   ❌ Giving System Admin to everyone
   ✅ Grant minimum required permissions

   Risks:
   - Security breach
   - Accidental data loss
   - Compliance violations
   ```

3. **Don't Skip 2FA**
   ```
   ❌ Allowing username/password only
   ✅ Require 2FA for all users

   Security:
   - Prevents account takeover
   - Required for compliance
   - Industry best practice
   ```

4. **Don't Keep Inactive Users Active**
   ```
   ❌ Leaving terminated employees active
   ✅ Deactivate immediately

   Risks:
   - Security breach
   - License waste
   - Audit findings
   ```

5. **Don't Use "Password Never Expires" for Humans**
   ```
   ❌ Setting for regular users
   ✅ Only for integration users

   Security:
   - Passwords should rotate
   - Reduces compromise risk
   ```

## 📚 Quick Reference

```
Create User:
Setup → Users → New User

Edit User:
Setup → Users → [User] → Edit

Reset Password:
Setup → Users → [User] → Reset Password

Freeze User:
Setup → Users → [User] → Freeze

Deactivate User:
Setup → Users → [User] → Edit → Uncheck Active

Create Profile:
Setup → Profiles → New → Clone

Create Permission Set:
Setup → Permission Sets → New

Assign Permission Set:
User → Permission Set Assignments → Edit

Create Role:
Setup → Roles → New

Login History:
Setup → Login History

User Licenses:
Setup → Company Information → User Licenses
```

## 🚀 Next Steps

**[→ Security & Permissions](/docs/salesforce/fundamentals/security-permissions)** - Deep dive into security

**[→ Security & Permissions](/docs/salesforce/fundamentals/security-permissions)** - Profile and permission details

**[→ Reports](/docs/salesforce/fundamentals/reports-dashboards)** - Create user reports

---

**You now master Salesforce user management!** Administer users like a pro. 👥
