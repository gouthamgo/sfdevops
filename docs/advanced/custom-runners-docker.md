# Custom GitLab Runners and Docker

**Learning Objective**: Set up custom infrastructure for Salesforce CI/CD with containerized runners and optimized build environments.

## Overview

While cloud-hosted runners (GitHub Actions, GitLab CI) work well, custom runners give you more control over resources, caching, and costs. This guide shows you how to build Docker-based CI/CD infrastructure specifically for Salesforce deployments.

## Why Custom Runners?

**Benefits**:
- **Cost Control**: Run on your own infrastructure
- **Performance**: Faster builds with persistent caching
- **Customization**: Install specific tools and versions
- **Security**: Keep sensitive data on-premises
- **Resource Control**: Allocate specific CPU/memory

**Trade-offs**:
- Maintenance overhead
- Infrastructure costs
- Security responsibility

## Docker Image for Salesforce CI/CD

### Optimized Dockerfile

```dockerfile
# Dockerfile
FROM ubuntu:22.04

#Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=18
ENV SF_CLI_VERSION=latest

# Install base dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    jq \
    xmllint \
    python3 \
    python3-pip \
    openjdk-11-jdk \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - && \
    apt-get install -y nodejs

# Install Salesforce CLI
RUN npm install -g @salesforce/cli@${SF_CLI_VERSION}

# Install additional tools
RUN npm install -g \
    eslint \
    prettier \
    @salesforce/eslint-plugin-aura \
    @salesforce/eslint-plugin-lightning \
    sfdx-git-delta

# Install Python dependencies
RUN pip3 install \
    pyyaml \
    requests \
    faker

# Install Salesforce Code Analyzer
RUN sf plugins install @salesforce/sfdx-scanner

# Create workspace directory
RUN mkdir -p /workspace
WORKDIR /workspace

# Verify installations
RUN sf --version && \
    node --version && \
    git --version && \
    java -version

# Set default command
CMD ["/bin/bash"]
```

### Build and Push Image

```bash
#!/bin/bash
# build-image.sh

IMAGE_NAME="salesforce-ci"
IMAGE_TAG="latest"
REGISTRY="your-registry.com"

# Build image
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

# Tag for registry
docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}

# Push to registry
docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}

echo "✅ Image pushed: ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
```

## GitHub Self-Hosted Runners

### Setup Self-Hosted Runner

```bash
#!/bin/bash
# setup-github-runner.sh

# Download runner
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure runner
./config.sh \
  --url https://github.com/your-org/your-repo \
  --token ${GITHUB_RUNNER_TOKEN} \
  --name salesforce-runner-1 \
  --labels salesforce,docker \
  --work _work

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
```

### Docker Compose for Multiple Runners

```yaml
# docker-compose.yml
version: '3.8'

services:
  runner-1:
    image: your-registry.com/salesforce-ci:latest
    container_name: github-runner-1
    environment:
      - RUNNER_NAME=salesforce-runner-1
      - RUNNER_TOKEN=${GITHUB_RUNNER_TOKEN}
      - RUNNER_LABELS=salesforce,docker,linux
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - runner-1-work:/workspace
    restart: unless-stopped

  runner-2:
    image: your-registry.com/salesforce-ci:latest
    container_name: github-runner-2
    environment:
      - RUNNER_NAME=salesforce-runner-2
      - RUNNER_TOKEN=${GITHUB_RUNNER_TOKEN}
      - RUNNER_LABELS=salesforce,docker,linux
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - runner-2-work:/workspace
    restart: unless-stopped

volumes:
  runner-1-work:
  runner-2-work:
```

### Use Self-Hosted Runner in Workflow

```yaml
name: Deploy with Self-Hosted Runner

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: [self-hosted, salesforce, docker]
    container:
      image: your-registry.com/salesforce-ci:latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Salesforce
        run: |
          echo "${{ secrets.SFDX_AUTH_URL }}" > auth.txt
          sf org login sfdx-url --sfdx-url-file auth.txt --alias target-org

          sf project deploy start \
            --target-org target-org \
            --manifest manifest/package.xml \
            --wait 30
```

## GitLab Custom Runners

### Docker Executor Configuration

```toml
# /etc/gitlab-runner/config.toml
concurrent = 4
check_interval = 0

[session_server]
  session_timeout = 1800

[[runners]]
  name = "salesforce-docker-runner"
  url = "https://gitlab.com/"
  token = "YOUR_RUNNER_TOKEN"
  executor = "docker"
  [runners.docker]
    tls_verify = false
    image = "your-registry.com/salesforce-ci:latest"
    privileged = false
    disable_cache = false
    volumes = ["/cache", "/var/run/docker.sock:/var/run/docker.sock"]
    shm_size = 0
  [runners.cache]
    Type = "s3"
    Shared = true
    [runners.cache.s3]
      ServerAddress = "s3.amazonaws.com"
      BucketName = "gitlab-runner-cache"
      BucketLocation = "us-east-1"
```

### Register GitLab Runner

```bash
#!/bin/bash
# register-gitlab-runner.sh

gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.com/" \
  --registration-token "${CI_REGISTRATION_TOKEN}" \
  --executor "docker" \
  --docker-image "your-registry.com/salesforce-ci:latest" \
  --description "salesforce-docker-runner" \
  --tag-list "salesforce,docker" \
  --run-untagged="false" \
  --locked="false"
```

### GitLab CI with Custom Runner

```yaml
# .gitlab-ci.yml
image: your-registry.com/salesforce-ci:latest

variables:
  GIT_DEPTH: 1

stages:
  - validate
  - test
  - deploy

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .sfdx/

validate:
  stage: validate
  tags:
    - salesforce
    - docker
  script:
    - sf plugins install @salesforce/sfdx-scanner
    - sf scanner run --target "force-app" --format json
  artifacts:
    reports:
      codequality: scanner-report.json

test:
  stage: test
  tags:
    - salesforce
    - docker
  script:
    - echo "$SFDX_AUTH_URL" > auth.txt
    - sf org login sfdx-url --sfdx-url-file auth.txt --alias ci-org
    - sf apex run test --target-org ci-org --code-coverage --result-format json
  artifacts:
    reports:
      junit: test-results/test-result.xml

deploy:
  stage: deploy
  tags:
    - salesforce
    - docker
  only:
    - main
  script:
    - echo "$PROD_SFDX_AUTH_URL" > auth.txt
    - sf org login sfdx-url --sfdx-url-file auth.txt --alias production
    - sf project deploy start --target-org production --manifest manifest/package.xml
```

## Optimizing Build Performance

### Layer Caching Strategy

```dockerfile
# Optimized Dockerfile with caching
FROM ubuntu:22.04 AS base

# Install system dependencies (rarely changes)
RUN apt-get update && apt-get install -y curl git jq

# Install Node.js (changes occasionally)
FROM base AS node
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Install SF CLI (changes occasionally)
FROM node AS sfcli
RUN npm install -g @salesforce/cli

# Install plugins (changes frequently)
FROM sfcli AS plugins
RUN sf plugins install @salesforce/sfdx-scanner
RUN npm install -g sfdx-git-delta

# Final image
FROM plugins
WORKDIR /workspace
```

### Persistent Caching

```yaml
# GitHub Actions with caching
- name: Cache Salesforce CLI
  uses: actions/cache@v3
  with:
    path: |
      ~/.local/share/sf
      ~/.sf
    key: ${{ runner.os }}-sf-${{ hashFiles('**/sfdx-project.json') }}

- name: Cache Node Modules
  uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
```

## Resource Management

### Resource Limits

```yaml
# docker-compose.yml with resource limits
services:
  runner:
    image: salesforce-ci:latest
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

### Kubernetes Deployment

```yaml
# k8s-runner-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: github-runner
spec:
  replicas: 3
  selector:
    matchLabels:
      app: github-runner
  template:
    metadata:
      labels:
        app: github-runner
    spec:
      containers:
      - name: runner
        image: your-registry.com/salesforce-ci:latest
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        env:
        - name: RUNNER_TOKEN
          valueFrom:
            secretKeyRef:
              name: github-runner-secret
              key: token
```

## Security Best Practices

### Secrets Management

```yaml
# Use Vault for secrets
- name: Get Secrets from Vault
  run: |
    # Install Vault CLI
    curl -o /tmp/vault.zip https://releases.hashicorp.com/vault/1.15.0/vault_1.15.0_linux_amd64.zip
    unzip /tmp/vault.zip -d /usr/local/bin/

    # Login to Vault
    vault login -method=token token=${{ secrets.VAULT_TOKEN }}

    # Get Salesforce auth URL
    SFDX_AUTH_URL=$(vault kv get -field=auth_url secret/salesforce/prod)
    echo "$SFDX_AUTH_URL" > auth.txt
```

### Network Isolation

```yaml
# docker-compose.yml with network isolation
version: '3.8'

networks:
  runner-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16

services:
  runner:
    networks:
      - runner-network
    # Only expose necessary ports
    ports:
      - "127.0.0.1:8080:8080"
```

## Monitoring and Logging

### Centralized Logging

```yaml
# docker-compose.yml with logging
services:
  runner:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        labels: "runner"
```

### Prometheus Metrics

```yaml
# Export runner metrics
- name: Export Metrics
  run: |
    cat > /metrics/deployment.txt << EOF
    deployment_duration_seconds{environment="production"} $(($SECONDS))
    deployment_success{environment="production"} 1
    EOF
```

## Maintenance

### Auto-Update Runners

```bash
#!/bin/bash
# update-runners.sh

# Pull latest image
docker pull your-registry.com/salesforce-ci:latest

# Restart containers with new image
docker-compose pull
docker-compose up -d

echo "✅ Runners updated"
```

### Health Checks

```dockerfile
# Add health check to Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD sf version || exit 1
```

## Interview Talking Points

1. **"We use custom Docker runners for cost optimization and performance"**
   - Shows infrastructure management skills
   - Demonstrates cost awareness

2. **"Our runner images are optimized with layer caching"**
   - Shows Docker expertise
   - Demonstrates performance optimization thinking

3. **"We use Kubernetes to auto-scale runners based on load"**
   - Shows cloud-native knowledge
   - Demonstrates scalability awareness

4. **"We implement network isolation and secrets management"**
   - Shows security consciousness
   - Demonstrates enterprise thinking

5. **"We maintain centralized logging and metrics for all runners"**
   - Shows observability focus
   - Demonstrates operational maturity

## Next Steps

- **Related**: [Performance Optimization](./performance-optimization) - Optimize pipeline speed
- **Related**: [Security & Compliance](./security-compliance) - Secure your pipelines
- **Related**: [Monitoring & Improvement](./monitoring-improvement) - Track runner performance

---

**Key Takeaway**: Custom runners give you control over your CI/CD infrastructure. Balance the benefits of customization against the overhead of maintenance. Start with cloud runners, move to custom runners when you have specific needs that justify the complexity.
