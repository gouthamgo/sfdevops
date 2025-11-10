# Disaster Recovery Planning

## The Call No One Wants to Receive

It's 2 AM. Your phone rings. It's the CTO.

"Production is down. The org is corrupted. We need to restore from backup. How long will it take?"

You freeze. When was the last backup? Where is it stored? Have we ever tested restore? Can we afford 24 hours of downtime?

If you can't answer these questions confidently right now, you don't have a disaster recovery plan. You have hope disguised as a plan.

Let's fix that.

## What Is Disaster Recovery?

Disaster recovery (DR) is your organization's ability to resume normal operations after a catastrophic event:

- **Data corruption**: Accidental mass delete, bad deployment, malicious activity
- **Metadata corruption**: Broken workflows, deleted fields, misconfigured security
- **Org deletion**: Accidental or malicious org deletion
- **Ransomware**: Data encrypted or held hostage
- **Compliance breach**: Need to restore to a specific point in time for audit

Good DR planning answers two critical questions:

**RTO (Recovery Time Objective)**: How long can you be down?
**RPO (Recovery Point Objective)**: How much data can you afford to lose?

For example:
- RTO = 4 hours: You need to be back online within 4 hours
- RPO = 1 hour: You can't lose more than the last hour of data

Your DR strategy must meet these objectives.

## The Three Pillars of Salesforce DR

### 1. Metadata Backup

Your customizations, code, configurations. This is stored in version control, right?

**Automated Daily Metadata Backup**:

```yaml
# .gitlab-ci.yml
metadata_backup:
  stage: backup
  only:
    - schedules  # Run on schedule (daily)
  script:
    # Retrieve all metadata from production
    - sf project retrieve start
        --target-org prod
        --manifest manifest/package.xml
        --wait 30

    # Commit to backup branch
    - git config user.email "devops@company.com"
    - git config user.name "DevOps Backup Bot"
    - git checkout -B backup/prod-$(date +%Y-%m-%d)
    - git add force-app/
    - git commit -m "Automated backup: $(date +%Y-%m-%d)"
    - git push origin backup/prod-$(date +%Y-%m-%d)

  artifacts:
    paths:
      - force-app/
    expire_in: 90 days
```

**Backup Script** (`scripts/backup-metadata.sh`):

```bash
#!/bin/bash
set -e

TARGET_ORG=${1:-prod}
BACKUP_DIR="backups/metadata/$(date +%Y-%m-%d-%H%M%S)"

echo "Backing up metadata from $TARGET_ORG..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Retrieve all metadata
sf project retrieve start \
  --target-org "$TARGET_ORG" \
  --manifest manifest/package.xml \
  --target-metadata-dir "$BACKUP_DIR" \
  --wait 30

# Create archive
tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"

# Upload to S3 (or your storage)
aws s3 cp "${BACKUP_DIR}.tar.gz" \
  "s3://company-sf-backups/metadata/$(basename ${BACKUP_DIR}.tar.gz)"

# Clean up local files (keep archive)
rm -rf "$BACKUP_DIR"

echo "✅ Metadata backup complete: ${BACKUP_DIR}.tar.gz"
```

### 2. Data Backup

Your business records. Contacts, Accounts, Opportunities, custom objects. This is what keeps the business running.

**Automated Daily Data Export**:

```yaml
data_backup:
  stage: backup
  only:
    - schedules
  script:
    # Export critical objects
    - ./scripts/backup-data.sh prod
  artifacts:
    paths:
      - backups/data/
    expire_in: 90 days
```

**Data Backup Script** (`scripts/backup-data.sh`):

```bash
#!/bin/bash
set -e

TARGET_ORG=$1
BACKUP_DIR="backups/data/$(date +%Y-%m-%d)"
OBJECTS=("Account" "Contact" "Opportunity" "CustomObject__c")

mkdir -p "$BACKUP_DIR"

echo "Backing up data from $TARGET_ORG..."

for OBJECT in "${OBJECTS[@]}"; do
  echo "Exporting $OBJECT..."

  # Export to CSV
  sf data export tree \
    --query "SELECT FIELDS(ALL) FROM $OBJECT LIMIT 200000" \
    --target-org "$TARGET_ORG" \
    --output-dir "$BACKUP_DIR" \
    --plan || echo "Warning: $OBJECT export may be incomplete"

  # Alternative: Use Data Loader CLI for large volumes
  # sf data bulk upsert \
  #   --sobject "$OBJECT" \
  #   --file "$BACKUP_DIR/$OBJECT.csv" \
  #   --external-id Id
done

# Create archive
tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"

# Upload to S3
aws s3 cp "${BACKUP_DIR}.tar.gz" \
  "s3://company-sf-backups/data/$(basename ${BACKUP_DIR}.tar.gz)"

# Keep last 30 days locally, everything in S3
find backups/data -name "*.tar.gz" -mtime +30 -delete

echo "✅ Data backup complete"
```

### 3. Configuration Backup

Org settings that aren't metadata: user records, permission sets assignments, sharing rules, etc.

**Configuration Export**:

```bash
#!/bin/bash
# scripts/backup-configuration.sh

TARGET_ORG=$1
BACKUP_FILE="backups/config/config-$(date +%Y-%m-%d).json"

mkdir -p "backups/config"

echo "Exporting configuration..."

# Export users
sf data query \
  --query "SELECT Id, Username, Email, ProfileId, IsActive FROM User" \
  --target-org "$TARGET_ORG" \
  --result-format json > "$BACKUP_FILE.users"

# Export profiles
sf data query \
  --query "SELECT Id, Name FROM Profile" \
  --target-org "$TARGET_ORG" \
  --result-format json > "$BACKUP_FILE.profiles"

# Export permission set assignments
sf data query \
  --query "SELECT AssigneeId, PermissionSetId FROM PermissionSetAssignment" \
  --target-org "$TARGET_ORG" \
  --result-format json > "$BACKUP_FILE.permsets"

# Combine into single JSON
jq -s '{users: .[0], profiles: .[1], permsets: .[2]}' \
  "$BACKUP_FILE.users" \
  "$BACKUP_FILE.profiles" \
  "$BACKUP_FILE.permsets" > "$BACKUP_FILE"

# Clean up temp files
rm "$BACKUP_FILE".{users,profiles,permsets}

# Upload to S3
aws s3 cp "$BACKUP_FILE" "s3://company-sf-backups/config/"

echo "✅ Configuration backup complete"
```

## Backup Schedules and Retention

**Recommended Schedule**:

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Metadata | Daily | 90 days |
| Critical Data | Daily | 90 days |
| Full Data | Weekly | 365 days |
| Configuration | Weekly | 180 days |
| Point-in-time snapshot | Before every production deploy | 30 days |

**GitLab Schedule Configuration**:

```yaml
# .gitlab-ci.yml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule" && $BACKUP_TYPE == "daily"
    - if: $CI_PIPELINE_SOURCE == "schedule" && $BACKUP_TYPE == "weekly"

daily_backup:
  rules:
    - if: $BACKUP_TYPE == "daily"
  script:
    - ./scripts/backup-metadata.sh prod
    - ./scripts/backup-data.sh prod --incremental

weekly_backup:
  rules:
    - if: $BACKUP_TYPE == "weekly"
  script:
    - ./scripts/backup-metadata.sh prod
    - ./scripts/backup-data.sh prod --full
    - ./scripts/backup-configuration.sh prod
```

In GitLab: CI/CD → Schedules → New Schedule:
- **Daily backup**: Cron `0 2 * * *` (2 AM daily), Variable: `BACKUP_TYPE=daily`
- **Weekly backup**: Cron `0 3 * * 0` (3 AM Sunday), Variable: `BACKUP_TYPE=weekly`

## Testing Your Backups

**The Golden Rule**: Untested backups are useless backups.

### Monthly Restore Test

Create a test sandbox and restore from backup:

```bash
#!/bin/bash
# scripts/test-restore.sh

echo "Testing disaster recovery restore..."

# 1. Create fresh sandbox
sf org create sandbox \
  --name DR_TEST_$(date +%Y%m%d) \
  --definition-file config/sandbox-def.json \
  --wait 30 \
  --set-default

# 2. Download latest backup
aws s3 cp s3://company-sf-backups/metadata/latest.tar.gz ./restore-test/
tar -xzf restore-test/latest.tar.gz -C restore-test/

# 3. Deploy metadata
sf project deploy start \
  --source-dir restore-test/force-app \
  --target-org DR_TEST_$(date +%Y%m%d) \
  --wait 60

# 4. Import data
aws s3 cp s3://company-sf-backups/data/latest.tar.gz ./restore-test-data/
tar -xzf restore-test-data/latest.tar.gz -C restore-test-data/

sf data import tree \
  --plan restore-test-data/plan.json \
  --target-org DR_TEST_$(date +%Y%m%d)

# 5. Verify
ACCOUNT_COUNT=$(sf data query \
  --query "SELECT COUNT() FROM Account" \
  --target-org DR_TEST_$(date +%Y%m%d) \
  --json | jq '.result.records[0].expr0')

echo "Restored $ACCOUNT_COUNT accounts"

if [ "$ACCOUNT_COUNT" -gt 100 ]; then
  echo "✅ Restore test passed"
else
  echo "❌ Restore test failed - insufficient data"
  exit 1
fi

# 6. Clean up
sf org delete sandbox --name DR_TEST_$(date +%Y%m%d) --no-prompt
```

**Automate monthly restore testing**:

```yaml
test_restore:
  stage: dr-test
  only:
    - schedules  # Run monthly
  script:
    - ./scripts/test-restore.sh
  when: manual  # Require approval (uses sandbox licenses)
```

## Disaster Recovery Procedures

When disaster strikes, follow this playbook:

### Procedure 1: Partial Data Corruption

**Scenario**: Accidentally deleted 500 Account records.

**Recovery Steps**:

```bash
# 1. Assess damage
sf data query \
  --query "SELECT COUNT() FROM Account WHERE IsDeleted = true ALL ROWS" \
  --target-org prod

# 2. Find backup from before incident
BACKUP_DATE="2024-01-15"  # Date before deletion
aws s3 cp "s3://company-sf-backups/data/${BACKUP_DATE}.tar.gz" ./recovery/

# 3. Extract deleted records from backup
tar -xzf recovery/${BACKUP_DATE}.tar.gz
cat recovery/Account.json | jq '.records[] | select(.Id | IN("001xxx", "001yyy"))' > recovery/deleted-accounts.json

# 4. Restore deleted records
sf data import tree \
  --plan recovery/restore-plan.json \
  --target-org prod

# 5. Verify
sf data query \
  --query "SELECT Id, Name FROM Account WHERE Id IN ('001xxx', '001yyy')" \
  --target-org prod
```

### Procedure 2: Bad Deployment

**Scenario**: Deployment broke production workflows.

**Recovery Steps**:

```bash
# 1. Immediate rollback
sf project deploy quick \
  --use-most-recent \
  --target-org prod

# 2. If rollback fails, restore from version control
git checkout backup/prod-$(date +%Y-%m-%d)

sf project deploy start \
  --source-dir force-app/main/workflows \
  --target-org prod \
  --wait 20

# 3. Verify critical flows are working
./scripts/smoke-tests.sh prod

# 4. Post-mortem
echo "Incident documented in incidents/$(date +%Y-%m-%d)-bad-deployment.md"
```

### Procedure 3: Complete Org Loss

**Scenario**: Org deleted or completely corrupted.

**Recovery Steps** (this is your nuclear option):

```bash
# 1. Create new production org (or restore from Salesforce backup if available)
# This requires Salesforce support

# 2. Restore metadata from backup
aws s3 cp s3://company-sf-backups/metadata/latest.tar.gz ./
tar -xzf latest.tar.gz

sf project deploy start \
  --source-dir force-app \
  --target-org new-prod \
  --test-level NoTestRun \
  --wait 120

# 3. Restore data in correct order (dependencies matter!)
OBJECTS=("User" "Profile" "Account" "Contact" "Opportunity" "CustomObject__c")

for OBJECT in "${OBJECTS[@]}"; do
  echo "Restoring $OBJECT..."
  sf data import tree \
    --plan "restore-data/${OBJECT}-plan.json" \
    --target-org new-prod
done

# 4. Restore configuration
./scripts/restore-configuration.sh new-prod

# 5. Extensive validation
./scripts/full-validation-suite.sh new-prod

# 6. Cut over to new org (update DNS, integrations, etc.)
./scripts/cutover-to-new-org.sh new-prod
```

**Estimated RTO for complete org recovery**: 8-24 hours (depending on data volume)
**Estimated RPO**: Last backup (typically 24 hours)

## Off-Site and Multi-Region Backups

Don't store backups in the same place as your production systems.

**Multi-Region S3 Backup**:

```bash
# Primary backup to US region
aws s3 cp backup.tar.gz s3://sf-backups-us-east-1/

# Replicate to secondary region
aws s3 cp backup.tar.gz s3://sf-backups-eu-west-1/

# Verify both copies
aws s3 ls s3://sf-backups-us-east-1/backup.tar.gz
aws s3 ls s3://sf-backups-eu-west-1/backup.tar.gz
```

**S3 Cross-Region Replication** (automatic):

```json
{
  "Role": "arn:aws:iam::123456789:role/s3-replication",
  "Rules": [{
    "Status": "Enabled",
    "Priority": 1,
    "Destination": {
      "Bucket": "arn:aws:s3:::sf-backups-eu-west-1",
      "StorageClass": "STANDARD_IA"
    },
    "Filter": {}
  }]
}
```

## Backup Encryption

Never store backups unencrypted.

**Encrypt before upload**:

```bash
#!/bin/bash
# scripts/encrypted-backup.sh

BACKUP_FILE="backup-$(date +%Y-%m-%d).tar.gz"
ENCRYPTION_KEY_ID="arn:aws:kms:us-east-1:123456789:key/abc-123"

# Create backup
tar -czf "$BACKUP_FILE" force-app/

# Encrypt with AWS KMS
aws s3 cp "$BACKUP_FILE" \
  "s3://company-sf-backups/encrypted/$BACKUP_FILE" \
  --sse aws:kms \
  --sse-kms-key-id "$ENCRYPTION_KEY_ID"

# Delete unencrypted local copy
rm "$BACKUP_FILE"

echo "✅ Encrypted backup uploaded"
```

**Restore encrypted backup**:

```bash
# Download (automatically decrypted if you have KMS permissions)
aws s3 cp "s3://company-sf-backups/encrypted/backup-2024-01-15.tar.gz" ./

# Extract and use
tar -xzf backup-2024-01-15.tar.gz
```

## Incident Response Plan

Your disaster recovery plan should include:

**1. Incident Classification**

| Severity | Impact | RTO | Example |
|----------|--------|-----|---------|
| P0 - Critical | Complete outage | 1 hour | Org deleted, complete data loss |
| P1 - High | Major functionality broken | 4 hours | Critical workflow broken, mass data corruption |
| P2 - Medium | Partial functionality impaired | 24 hours | Single object data loss, minor metadata corruption |
| P3 - Low | Minor issues | 1 week | Aesthetic issues, non-critical config |

**2. Escalation Path**

```
Incident Detected → On-Call DevOps Engineer
  ↓
Assess Severity (< 15 minutes)
  ↓
P0/P1: Notify DevOps Lead + Engineering Manager + CTO
P2/P3: Create ticket, regular hours response
  ↓
Assemble Response Team
  ↓
Execute Recovery Procedure
  ↓
Validate Recovery
  ↓
Post-Mortem (within 48 hours)
```

**3. Communication Templates**

**Initial Notification**:
```
INCIDENT: [P0] Production Org Corrupted
STATUS: Investigating
IMPACT: Complete production outage
ETA: Under investigation
RESPONSE TEAM: Alice (Lead), Bob (DevOps), Carol (Salesforce Admin)
NEXT UPDATE: In 30 minutes
```

**Resolution Notification**:
```
INCIDENT: [P0] Production Org Corrupted - RESOLVED
DURATION: 3 hours 27 minutes
IMPACT: Complete production outage from 10:15 AM - 1:42 PM EST
ROOT CAUSE: Accidental deletion of critical workflow
RESOLUTION: Restored from backup taken at 2:00 AM
DATA LOSS: 8 hours of data (transactions from 2 AM - 10 AM)
NEXT STEPS: Post-mortem meeting scheduled for tomorrow 2 PM
```

## Hands-On Exercise: Build Your DR Plan

**Objective**: Create a complete disaster recovery plan and test it.

**Your Tasks**:

1. Set up automated daily metadata backups
2. Set up automated weekly data backups
3. Configure backup retention (90 days for metadata, 365 for data)
4. Implement encrypted backup storage
5. Create disaster recovery procedures for:
   - Partial data loss
   - Bad deployment
   - Complete org corruption
6. Test your backup/restore process
7. Document RTO and RPO for your organization

**Deliverables**:

- [ ] Automated backup pipeline (metadata + data)
- [ ] Backup storage configuration (S3 or equivalent)
- [ ] DR procedures document (step-by-step playbooks)
- [ ] Test restore script
- [ ] Evidence of successful restore test
- [ ] Incident response plan with escalation paths

**You'll know you succeeded when**:
- Backups run automatically daily
- You can restore a full org from backup in under 8 hours
- You've successfully tested the restore process
- Your team knows what to do when disaster strikes

## Disaster Recovery Checklist

Your DR plan is complete when you have:

- [ ] Automated daily metadata backups
- [ ] Automated data backups (daily incremental, weekly full)
- [ ] Configuration backups
- [ ] Multi-region backup storage
- [ ] Encrypted backup storage
- [ ] Tested restore procedures (tested within last 90 days)
- [ ] Documented RTO and RPO
- [ ] Incident classification system
- [ ] Escalation paths and contact list
- [ ] Post-deployment point-in-time snapshots
- [ ] Runbooks for common disaster scenarios
- [ ] Communication templates
- [ ] Regular DR drills scheduled (quarterly)

## What We Learned

Disaster recovery isn't about avoiding disasters—they're inevitable. It's about being prepared:

1. **Backup everything**: Metadata, data, configuration
2. **Automate backups**: Daily metadata, weekly full data
3. **Store safely**: Encrypted, multi-region, off-site
4. **Test regularly**: Untested backups are useless
5. **Document procedures**: Clear playbooks for common scenarios
6. **Know your RTO/RPO**: How fast must you recover? How much data can you lose?
7. **Practice**: Run DR drills quarterly

The best time to prepare for a disaster is before it happens.

## What's Next

You now have disaster recovery covered. But before changes even reach production, they need to be reviewed. Badly reviewed code causes the incidents you just learned to recover from.

Next: **Code Review Best Practices**.

You'll learn:
- What to look for in Salesforce code reviews
- Common anti-patterns and security issues
- How to give effective feedback
- Automating code review with tools
- Creating a culture of quality

See you there!
