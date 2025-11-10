# Environment Variables and Secrets Management

## The 3 AM Wake-Up Call

Picture this: It's 3 AM and your phone won't stop ringing. Your production pipeline just exposed AWS credentials in the build logs. They're publicly visible. Someone already found them and spun up cryptocurrency miners in your account. The bill? $47,000 and climbing.

How did this happen? A developer hardcoded credentials to "just get it working" during a late-night fix. The code got merged. The pipeline ran. The logs displayed everything.

This isn't a hypothetical scenario. It happens regularly across the industry. Let's make sure it never happens to you.

## What Are We Protecting?

In Salesforce DevOps pipelines, we work with several types of sensitive information:

**Org Credentials**
- Username and password for authentication
- Security tokens
- OAuth client secrets
- Connected app keys
- JWT private keys

**Third-Party Integrations**
- AWS access keys
- Azure credentials
- Slack webhooks
- Jira API tokens
- Email service credentials

**Pipeline Secrets**
- Encryption keys
- Code signing certificates
- Package passwords
- Custom metadata protection keys

Every single one of these can cause significant damage if exposed. We need a systematic approach to managing them.

## The Golden Rules

Before we dive into implementation, let's establish non-negotiable principles:

**Rule 1: Never Commit Secrets to Version Control**
Not in the code. Not in comments. Not in `.env` files. Never. Even if the repository is private. Even if you plan to delete it later. Git history is permanent.

**Rule 2: Use Platform-Provided Secret Management**
GitLab CI/CD Variables, GitHub Secrets, Azure Key Vault - whatever your platform provides, use it. Don't roll your own encryption scheme.

**Rule 3: Minimum Access Principle**
Each pipeline should have access to exactly the secrets it needs. No more. Production credentials should never be accessible to feature branch pipelines.

**Rule 4: Rotate Regularly**
Secrets should have expiration dates. Plan for rotation. Automate it where possible.

**Rule 5: Audit Everything**
Know who accessed what and when. Treat secret access as a security event worth logging.

## GitLab CI/CD Variables

Let's implement proper secrets management in GitLab. We'll build from simple to sophisticated.

### Adding Your First Secret

Navigate to your GitLab project:
1. Settings → CI/CD → Variables → Expand
2. Click "Add Variable"
3. Set the key: `SF_PROD_USERNAME`
4. Set the value: your production username
5. **Important**: Check these boxes:
   - Protect variable (only available on protected branches)
   - Mask variable (hide in job logs)
6. Click "Add variable"

Repeat for `SF_PROD_PASSWORD` and `SF_PROD_SECURITY_TOKEN`.

### Using Variables in Your Pipeline

Here's how to reference these in your `.gitlab-ci.yml`:

```yaml
deploy_to_production:
  stage: deploy
  only:
    - main  # Protected branch only
  script:
    # Authenticate using environment variables
    - echo "$SF_PROD_PASSWORD" | sf org login user
        --username "$SF_PROD_USERNAME"
        --set-default-username production

    # Deploy
    - sf project deploy start --target-org production

  # Optional: Prevent accidental variable exposure
  variables:
    GIT_STRATEGY: clone  # Fresh clone, no cached credentials
```

Notice what we did:
- Used `$VARIABLE_NAME` syntax to reference secrets
- Limited job to protected branch (`main`)
- Variables are never echoed or printed directly

### The Masking Caveat

GitLab masks variables in logs, but it's not perfect. If your secret appears as part of a larger string, it might not be masked. For example:

```yaml
# Dangerous - might expose token in error messages
- sf org login user --username $SF_USERNAME --password $SF_PASSWORD$SF_TOKEN
```

Better approach:

```yaml
# Safer - concatenate first, then use
- export SF_FULL_AUTH="${SF_PASSWORD}${SF_TOKEN}"
- echo "$SF_FULL_AUTH" | sf org login user --username "$SF_USERNAME"
```

## JWT Bearer Flow (The Professional Approach)

Username/password authentication works but has limitations:
- Requires security tokens
- Affected by password policies
- Harder to rotate
- Less audit-friendly

JWT (JSON Web Token) bearer flow is the enterprise-grade solution. Let's implement it.

### One-Time Setup

**Step 1: Create a Connected App**

In your Salesforce org:
1. Setup → App Manager → New Connected App
2. Fill in basic info
3. Enable OAuth Settings:
   - Callback URL: `http://localhost:1717/OauthRedirect`
   - Enable "Use digital signatures"
   - Upload a certificate (generate one using OpenSSL - see below)
   - Select OAuth scopes: `api`, `refresh_token`, `web`
4. Save and note the Consumer Key

**Step 2: Generate Certificates**

```bash
# Generate private key
openssl genrsa -out server.key 2048

# Generate certificate signing request
openssl req -new -key server.key -out server.csr

# Generate self-signed certificate (valid 1 year)
openssl x509 -req -days 365 -in server.csr
  -signkey server.key -out server.crt
```

Upload `server.crt` to the Connected App. Keep `server.key` secret - we'll add it to GitLab.

**Step 3: Add to GitLab**

Add these CI/CD variables:
- `SF_CONSUMER_KEY`: Consumer Key from Connected App
- `SF_JWT_KEY`: Contents of `server.key` (mark as masked and protected)
- `SF_USERNAME`: Username of the integration user

### Pipeline Implementation

```yaml
.auth_with_jwt: &auth_with_jwt
  before_script:
    # Write JWT key to temporary file
    - echo "$SF_JWT_KEY" > /tmp/server.key
    - chmod 600 /tmp/server.key

    # Authenticate using JWT
    - sf org login jwt
        --client-id "$SF_CONSUMER_KEY"
        --jwt-key-file /tmp/server.key
        --username "$SF_USERNAME"
        --alias targetOrg

    # Clean up
    - rm /tmp/server.key

  after_script:
    # Logout to revoke session
    - sf org logout --target-org targetOrg --no-prompt || true

deploy_sandbox:
  <<: *auth_with_jwt
  stage: deploy
  script:
    - sf project deploy start --target-org targetOrg
```

### Why JWT Is Better

1. **No passwords in pipelines**: Certificate-based authentication
2. **Easy rotation**: Generate new cert, update Connected App, rotate secret
3. **Better audit trail**: Connected App shows all authentications
4. **Works with SSO**: Bypasses password policies and MFA requirements
5. **Shorter session**: Token expires quickly, reducing exposure window

## Environment-Specific Secrets

Real projects have multiple environments. Each needs different credentials. Let's organize them properly.

### Option 1: Environment Scoping

GitLab allows scoping variables to specific environments:

```yaml
# Add these as scoped variables in GitLab:
# SF_USERNAME (environment: production)
# SF_USERNAME (environment: staging)
# SF_USERNAME (environment: sandbox)

deploy:
  stage: deploy
  script:
    - sf org login jwt --client-id "$SF_CONSUMER_KEY"
        --jwt-key-file key.file --username "$SF_USERNAME"
    - sf project deploy start

  environment:
    name: $CI_COMMIT_REF_NAME  # Uses branch name as environment
```

When job runs for `staging` branch, it gets staging credentials automatically.

### Option 2: Prefixed Variables

For more complex scenarios:

```yaml
variables:
  # Set all these in GitLab CI/CD Variables
  PROD_USERNAME: ""
  PROD_CONSUMER_KEY: ""
  PROD_JWT_KEY: ""

  STG_USERNAME: ""
  STG_CONSUMER_KEY: ""
  STG_JWT_KEY: ""

.deploy_template: &deploy
  script:
    - |
      # Determine environment
      if [ "$CI_COMMIT_BRANCH" = "main" ]; then
        ENV_PREFIX="PROD"
      elif [ "$CI_COMMIT_BRANCH" = "staging" ]; then
        ENV_PREFIX="STG"
      else
        ENV_PREFIX="DEV"
      fi

      # Build variable names dynamically
      USERNAME_VAR="${ENV_PREFIX}_USERNAME"
      CONSUMER_KEY_VAR="${ENV_PREFIX}_CONSUMER_KEY"
      JWT_KEY_VAR="${ENV_PREFIX}_JWT_KEY"

      # Use indirect variable expansion
      SF_USERNAME="${!USERNAME_VAR}"
      SF_CONSUMER_KEY="${!CONSUMER_KEY_VAR}"
      SF_JWT_KEY="${!JWT_KEY_VAR}"

      # Now authenticate
      echo "$SF_JWT_KEY" > /tmp/key
      sf org login jwt --client-id "$SF_CONSUMER_KEY"
        --jwt-key-file /tmp/key --username "$SF_USERNAME"
```

This approach gives you fine-grained control and makes it explicit which environment you're targeting.

## GitHub Actions Secrets

GitHub has a similar but slightly different approach.

### Adding Secrets

1. Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add: `SF_PROD_USERNAME`, `SF_PROD_PASSWORD`, etc.

### Using in Workflows

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Salesforce CLI
        run: npm install -g @salesforce/cli

      - name: Authenticate
        env:
          SF_USERNAME: ${{ secrets.SF_PROD_USERNAME }}
          SF_PASSWORD: ${{ secrets.SF_PROD_PASSWORD }}
          SF_TOKEN: ${{ secrets.SF_PROD_SECURITY_TOKEN }}
        run: |
          echo "${SF_PASSWORD}${SF_TOKEN}" | sf org login user \
            --username "$SF_USERNAME" --set-default-username

      - name: Deploy
        run: sf project deploy start --target-org default
```

### Environment Secrets

GitHub supports environment-specific secrets:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # References GitHub Environment
    steps:
      - name: Deploy
        env:
          # These come from the "production" environment
          SF_USERNAME: ${{ secrets.SF_USERNAME }}
          SF_CONSUMER_KEY: ${{ secrets.SF_CONSUMER_KEY }}
        run: |
          # Deploy using environment-specific credentials
```

Create environments in Settings → Environments → New environment.

## Detecting Secrets in Code

Prevention is better than cure. Let's add automated secret detection.

### Git-Secrets

Install git-secrets to scan for patterns:

```bash
# Install (macOS)
brew install git-secrets

# Initialize in your repo
cd your-salesforce-project
git secrets --install
git secrets --register-aws  # Detects AWS keys

# Add Salesforce patterns
git secrets --add '00D[a-zA-Z0-9]{15}'  # Org ID
git secrets --add '[a-zA-Z0-9]{32}'  # Access tokens (loose pattern)
```

Now commits with secrets will be rejected:

```bash
$ git commit -m "Add org config"
[ERROR] Matched one or more prohibited patterns
Possible violation: OrgId = "00D5g000000abcd"
```

### Pre-Commit Hooks

Create `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: package.lock.json
```

Install and run:

```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files  # Initial scan
```

This scans every commit for high-entropy strings and known secret patterns.

### Pipeline Integration

Add secret scanning to your CI/CD:

```yaml
security_scan:
  stage: test
  script:
    - pip install detect-secrets
    - detect-secrets scan --all-files --force-use-all-plugins
  allow_failure: false  # Block pipeline if secrets found
```

## Handling Secrets in Local Development

Developers need credentials too. Here's the safe way:

### The .env File Pattern

Create `.env` file (add to `.gitignore`!):

```bash
# .env - NEVER COMMIT THIS
SF_DEV_USERNAME=developer@company.com.dev
SF_DEV_PASSWORD=YourPasswordHere
SF_DEV_SECURITY_TOKEN=YourTokenHere
```

Update `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Salesforce
.sfdx/
.sf/
.salesforce/
```

Create `.env.example` (safe to commit):

```bash
# .env.example - Template for local development
# Copy to .env and fill in your values

SF_DEV_USERNAME=your.email@company.com.dev
SF_DEV_PASSWORD=your-password
SF_DEV_SECURITY_TOKEN=your-security-token
```

### Loading Environment Variables

Create a helper script `scripts/auth.sh`:

```bash
#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "Error: .env file not found"
  echo "Copy .env.example to .env and fill in your credentials"
  exit 1
fi

# Authenticate
echo "Authenticating to Salesforce..."
echo "${SF_DEV_PASSWORD}${SF_DEV_SECURITY_TOKEN}" | \
  sf org login user \
    --username "$SF_DEV_USERNAME" \
    --alias mydev \
    --set-default

echo "✓ Authenticated successfully as $SF_DEV_USERNAME"
```

Now developers run:

```bash
chmod +x scripts/auth.sh
./scripts/auth.sh
```

Their credentials stay local. Never committed. Never shared.

## Common Mistakes and How to Avoid Them

### Mistake 1: Secrets in Error Messages

```yaml
# Bad - secret might appear in error
- sf org login user --password "$PASSWORD" --username "$USERNAME"
```

If authentication fails, the CLI might include the password in the error message.

```yaml
# Better - pipe password to avoid CLI args
- echo "$PASSWORD" | sf org login user --username "$USERNAME"
```

### Mistake 2: Secrets in Build Artifacts

```yaml
# Bad - creates config file with secrets
- echo "password=$PASSWORD" > config.properties
- sf project deploy start --property-file config.properties
```

If `config.properties` gets cached or saved as an artifact, secrets leak.

```yaml
# Better - use environment variables directly
- export SF_PASSWORD="$PASSWORD"
- sf project deploy start  # CLI reads from environment
```

### Mistake 3: Oversharing Secrets

Don't give every developer access to production secrets. Use role-based access:

**GitLab Protected Variables**: Only maintainers can view/edit
**GitHub Environment Protection**: Require approvals for production deployments
**Separate Service Accounts**: Different credentials for CI/CD vs. developers

### Mistake 4: No Rotation Plan

Secrets don't age well. Set calendar reminders:
- **Monthly**: Review who has access
- **Quarterly**: Rotate development/staging credentials
- **Yearly**: Rotate production credentials
- **Immediately**: Rotate if a team member leaves or secret might be compromised

## Hands-On Exercise: Secure Your Pipeline

**Objective**: Convert an insecure pipeline to use proper secrets management.

**Starting Point** (insecure):

```yaml
# .gitlab-ci.yml - INSECURE VERSION
deploy:
  script:
    - sf org login user --username admin@company.com
        --password MyP@ssw0rd123! --set-default-username prod
    - sf project deploy start --target-org prod
```

**Your Tasks**:

1. Set up JWT bearer flow authentication
2. Store secrets in GitLab CI/CD variables
3. Implement proper environment scoping
4. Add secret detection to prevent future leaks
5. Create local development setup with `.env` file

**You'll know it worked when**:
- No credentials visible in pipeline code
- Pipeline runs successfully with masked secrets
- Logs show `*****` instead of actual secrets
- Local development works without committing credentials

**Going Further**:
- Implement credential rotation process
- Add monitoring for failed authentication attempts
- Set up alerts for secret access
- Create runbook for emergency credential rotation

## Security Checklist

Before deploying any pipeline, verify:

- [ ] No hardcoded credentials in code or config files
- [ ] All secrets stored in platform secret manager
- [ ] Protected/masked variables enabled
- [ ] Environment scoping implemented for production
- [ ] Secret detection tool integrated (git-secrets or detect-secrets)
- [ ] `.env` files added to `.gitignore`
- [ ] `.env.example` template provided for developers
- [ ] JWT bearer flow used (not username/password)
- [ ] Credentials rotate on a schedule
- [ ] Audit logging enabled for secret access
- [ ] Minimum access principle applied (no oversharing)
- [ ] Secrets cleaned up in `after_script` when possible

## What We Learned

We covered the complete lifecycle of secrets management:

1. **Why it matters**: Real breaches cost real money (and jobs)
2. **Golden rules**: Never commit, use platform tools, minimum access, rotate, audit
3. **GitLab implementation**: CI/CD variables, masking, protection, environment scoping
4. **JWT bearer flow**: Professional authentication without passwords
5. **GitHub Actions**: Secrets and environment-specific handling
6. **Detection**: Pre-commit hooks and pipeline scanning
7. **Local development**: .env files done safely
8. **Common mistakes**: And how to avoid them

## What's Next

In the next section, we'll tackle **Pipeline Troubleshooting**. Because even perfectly secure pipelines fail. When they do, you need to debug fast without exposing secrets or losing your mind.

You'll learn systematic approaches to:
- Reading pipeline logs effectively
- Debugging authentication failures
- Handling timeout issues
- Working with encrypted error messages
- Creating reproducible test cases

See you there!
