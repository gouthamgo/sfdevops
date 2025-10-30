# Security, Compliance, and Audit Trails

**Learning Objective**: Implement security controls, maintain compliance, and create comprehensive audit trails in Salesforce DevOps workflows.

## Overview

Security and compliance aren't optional in enterprise DevOps. This guide shows you how to secure your CI/CD pipelines, meet regulatory requirements, and maintain detailed audit trails for every deployment.

## Secrets Management

### GitHub Secrets

```yaml
# Never commit secrets to code
- name: Authenticate Securely
  run: |
    # Use GitHub Secrets
    echo "${{ secrets.SFDX_AUTH_URL }}" > auth.txt
    sf org login sfdx-url --sfdx-url-file auth.txt --alias target-org

    # Remove auth file immediately
    rm -f auth.txt
```

### HashiCorp Vault Integration

```yaml
- name: Get Secrets from Vault
  run: |
    # Authenticate to Vault
    export VAULT_TOKEN="${{ secrets.VAULT_TOKEN }}"

    # Retrieve secrets
    SFDX_AUTH_URL=$(vault kv get -field=auth_url secret/salesforce/production)
    API_KEY=$(vault kv get -field=api_key secret/salesforce/api)

    # Use secrets (never log them)
    echo "$SFDX_AUTH_URL" > auth.txt
```

### Secret Rotation

```yaml
- name: Rotate Salesforce Credentials
  if: github.event.schedule
  run: |
    # Generate new connected app credentials
    NEW_AUTH_URL=$(python scripts/rotate_credentials.py)

    # Update in Vault
    vault kv put secret/salesforce/production auth_url="$NEW_AUTH_URL"

    # Test new credentials
    echo "$NEW_AUTH_URL" > auth.txt
    sf org login sfdx-url --sfdx-url-file auth.txt --alias test
```

## Code Scanning

### Security Vulnerability Scanning

```yaml
- name: Security Scan
  run: |
    sf scanner run \
      --target "force-app" \
      --format json \
      --outfile security-scan.json \
      --severity-threshold=2  # Block on high/critical only

    # Check for critical issues
    CRITICAL_COUNT=$(jq '[.[] | select(.severity == "1")] | length' security-scan.json)

    if [ "$CRITICAL_COUNT" -gt 0 ]; then
      echo "❌ $CRITICAL_COUNT critical security issues found"
      jq '.[] | select(.severity == "1")' security-scan.json
      exit 1
    fi
```

### Dependency Scanning

```yaml
- name: Scan Dependencies
  run: |
    # Scan npm dependencies
    npm audit --json > npm-audit.json

    # Check for vulnerabilities
    HIGH_VULNS=$(jq '.metadata.vulnerabilities.high' npm-audit.json)

    if [ "$HIGH_VULNS" -gt 0 ]; then
      echo "⚠️ $HIGH_VULNS high-severity vulnerabilities found"
      npm audit
    fi
```

### SAST (Static Application Security Testing)

```yaml
- name: Run SAST
  run: |
    # Install and run Checkmarx or similar
    docker run --rm \
      -v $(pwd):/src \
      checkmarx/cxcli:latest scan \
      --project-name "Salesforce-App" \
      --severity High,Critical
```

## Access Control

### Branch Protection

```yaml
# .github/settings.yml
branches:
  - name: main
    protection:
      required_pull_request_reviews:
        required_approving_review_count: 2
        dismiss_stale_reviews: true
        require_code_owner_reviews: true
      required_status_checks:
        strict: true
        contexts:
          - security-scan
          - test-coverage
          - code-quality
      enforce_admins: true
      required_linear_history: true
```

### Environment Protection

```yaml
# Production environment requires approval
environments:
  production:
    protection_rules:
      - type: required_reviewers
        reviewers:
          - devops-team
          - security-team
      - type: wait_timer
        wait_timer: 300  # 5 minute wait
```

## Compliance Frameworks

### SOC 2 Compliance

```yaml
- name: SOC 2 Audit Trail
  run: |
    # Log deployment details
    cat > deployment-audit.json << EOF
    {
      "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
      "actor": "${{ github.actor }}",
      "action": "deployment",
      "target_org": "production",
      "commit_sha": "${{ github.sha }}",
      "workflow_id": "${{ github.run_id }}",
      "approved_by": "${{ github.event.review.user.login }}"
    }
    EOF

    # Store in compliance system
    curl -X POST https://compliance-api.company.com/audit-logs \
      -H "Authorization: Bearer ${{ secrets.COMPLIANCE_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d @deployment-audit.json
```

### GDPR Compliance

```yaml
- name: Data Privacy Check
  run: |
    # Scan for PII in code
    grep -r "SSN\|Social Security\|Credit Card" force-app/ && {
      echo "❌ Potential PII detected in code"
      exit 1
    }

    # Check for proper data classification
    python scripts/check_data_classification.py
```

### HIPAA Compliance

```yaml
- name: HIPAA Compliance Check
  run: |
    # Verify PHI handling
    python scripts/verify_phi_controls.py

    # Check encryption requirements
    if ! grep -q "Encrypted" force-app/**/*.object-meta.xml; then
      echo "⚠️ Check field encryption settings"
    fi
```

## Audit Trails

### Comprehensive Deployment Logging

```yaml
- name: Create Audit Trail
  if: always()
  run: |
    cat > audit-trail.json << EOF
    {
      "deployment_id": "${{ github.run_id }}",
      "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
      "initiator": "${{ github.actor }}",
      "trigger": "${{ github.event_name }}",
      "branch": "${{ github.ref_name }}",
      "commit": {
        "sha": "${{ github.sha }}",
        "message": "$(git log -1 --pretty=%B)",
        "author": "$(git log -1 --pretty=%an)"
      },
      "changes": {
        "files_changed": $(git diff --name-only HEAD~1 | wc -l),
        "insertions": $(git diff --numstat HEAD~1 | awk '{sum+=$1} END {print sum}'),
        "deletions": $(git diff --numstat HEAD~1 | awk '{sum+=$2} END {print sum}')
      },
      "approval": {
        "required": true,
        "approvers": ["${{ github.event.review.user.login }}"]
      },
      "tests": {
        "executed": true,
        "passed": $(jq '.result.summary.passing' test-results/test-result.json),
        "failed": $(jq '.result.summary.failing' test-results/test-result.json),
        "coverage": $(jq '.result.summary.orgWideCoverage' test-results/test-result.json)
      },
      "deployment": {
        "status": "${{ job.status }}",
        "duration_seconds": $SECONDS,
        "components_deployed": $(jq '.result.numberComponentsDeployed' deploy-result.json)
      }
    }
    EOF

    # Store permanently
    aws s3 cp audit-trail.json \
      s3://compliance-audit-logs/salesforce/$(date +%Y/%m/%d)/${{ github.run_id }}.json
```

### Change Tracking

```yaml
- name: Track All Changes
  run: |
    # Generate detailed change report
    cat > change-report.md << 'EOF'
    # Deployment Change Report

    **Date**: $(date)
    **Deployer**: ${{ github.actor }}
    **Approved By**: ${{ github.event.review.user.login }}

    ## Files Changed
    $(git diff --name-status HEAD~1 | while read status file; do
      echo "- [$status] $file"
    done)

    ## Metadata Types Affected
    $(git diff --name-only HEAD~1 | cut -d/ -f4 | sort | uniq | while read type; do
      echo "- $type"
    done)

    ## Risk Assessment
    **Risk Level**: $(python scripts/calculate_risk.py)

    ## Approval Chain
    $(gh pr view ${{ github.event.pull_request.number }} --json reviews --jq '.reviews[] | "- \(.author.login): \(.state)"')
    EOF

    # Archive report
    gh release create audit-${{ github.run_id }} \
      change-report.md \
      --notes "Deployment audit trail"
```

## Security Best Practices

### Least Privilege Access

```yaml
# Use service accounts with minimal permissions
permissions:
  contents: read
  deployments: write
  # No admin permissions
```

### Network Security

```yaml
- name: Deploy from Trusted Network
  runs-on: [self-hosted, private-network]
  # Only deploy from secured runners
```

### Signing and Verification

```yaml
- name: Sign Deployment
  run: |
    # Sign deployment package
    gpg --detach-sign --armor deployment-package.zip

    # Verify signature before deployment
    gpg --verify deployment-package.zip.asc deployment-package.zip
```

## Incident Response

### Security Incident Detection

```yaml
- name: Monitor for Anomalies
  run: |
    # Check for unusual deployment patterns
    RECENT_DEPLOYS=$(gh run list --workflow=deploy.yml --created ">$(date -d '1 hour ago' +%Y-%m-%d)" --json conclusion | jq 'length')

    if [ "$RECENT_DEPLOYS" -gt 10 ]; then
      echo "🚨 Unusual deployment activity detected"
      # Alert security team
      curl -X POST ${{ secrets.SECURITY_WEBHOOK }} \
        -d '{"alert": "Unusual deployment activity", "count": "'"$RECENT_DEPLOYS"'"}'
    fi
```

### Automatic Rollback on Security Issues

```yaml
- name: Security Validation
  id: security
  run: |
    # Run security checks
    ./scripts/security_validation.sh

- name: Rollback if Security Fails
  if: failure() && steps.security.outcome == 'failure'
  run: |
    echo "🚨 Security validation failed - initiating rollback"
    gh workflow run rollback.yml -f reason="security-failure"
```

## Compliance Reporting

### Generate Compliance Reports

```yaml
name: Monthly Compliance Report

on:
  schedule:
    - cron: '0 0 1 * *'  # First day of month

jobs:
  generate-report:
    runs-on: ubuntu-latest
    steps:
      - name: Collect Compliance Data
        run: |
          # Get all deployments this month
          START_DATE=$(date -d '1 month ago' +%Y-%m-%d)

          gh run list \
            --workflow=deploy.yml \
            --created ">$START_DATE" \
            --json conclusion,createdAt,actor \
            --limit 1000 > deployments.json

      - name: Generate Report
        run: |
          python << 'EOF'
          import json
          from datetime import datetime

          with open('deployments.json') as f:
              deployments = json.load(f)

          total = len(deployments)
          successful = len([d for d in deployments if d['conclusion'] == 'success'])
          failed = len([d for d in deployments if d['conclusion'] == 'failure'])

          report = f"""
          # Monthly Compliance Report - {datetime.now().strftime('%B %Y')}

          ## Deployment Statistics
          - Total Deployments: {total}
          - Successful: {successful} ({successful/total*100:.1f}%)
          - Failed: {failed} ({failed/total*100:.1f}%)

          ## Security Posture
          - All deployments reviewed: ✅
          - All tests passed: ✅
          - Security scans completed: ✅

          ## Audit Trail
          All deployment logs archived to S3 with 7-year retention.
          """

          print(report)
          EOF
```

## Interview Talking Points

1. **"We use HashiCorp Vault for centralized secrets management"**
   - Shows security awareness
   - Demonstrates enterprise practices

2. **"We implement automated security scanning in every pipeline"**
   - Shows proactive security approach
   - Demonstrates shift-left security

3. **"We maintain comprehensive audit trails for compliance"**
   - Shows regulatory awareness
   - Demonstrates accountability

4. **"We enforce branch protection and require security team approval for production"**
   - Shows access control understanding
   - Demonstrates governance maturity

5. **"We archive all deployment logs for 7 years for SOC 2 compliance"**
   - Shows compliance knowledge
   - Demonstrates enterprise experience

## Next Steps

- **Related**: [Custom Runners & Docker](./custom-runners-docker) - Secure runner infrastructure
- **Related**: [Monitoring & Improvement](./monitoring-improvement) - Security metrics tracking
- **Related**: [Communication Patterns](../scenarios/communication-patterns) - Security incident communication

---

**Key Takeaway**: Security and compliance are not obstacles to DevOps - they're essential features. Automate security checks, maintain detailed audit trails, and treat secrets with extreme care. A secure pipeline is a trustworthy pipeline.
