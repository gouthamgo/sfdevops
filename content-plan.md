# Salesforce DevOps Learning Hub - Content Plan

This document outlines the complete learning path structure with detailed page specifications.

---

## Section 1: Foundations (Days 1-7)

### Page 1.1: What is Salesforce DevOps (and why should you care?)
- **Learning Objective**: Understand what DevOps means in Salesforce context and why it matters
- **Key Concepts**: DevOps definition, traditional vs DevOps workflow, pain points it solves, cultural shift
- **Real Scenario**: A company with 50 developers making changes directly in production causing data loss, conflicts, and downtime. The chaos of manual deployments and "it worked on my machine" syndrome.
- **Hands-On**: Set up free Salesforce Developer org, explore the environment
- **Connects To**: Page 1.2 - Understanding how different Salesforce environments fit into DevOps workflow

### Page 1.2: Understanding Salesforce Environments
- **Learning Objective**: Know the difference between Production, Sandbox, Scratch orgs and when to use each
- **Key Concepts**: Environment types, environment hierarchy, refresh strategies, data considerations
- **Real Scenario**: A feature request flows from developer sandbox → integration sandbox → UAT → production. What happens at each stage and why?
- **Hands-On**: Create your first sandbox, inspect metadata differences between environments
- **Connects To**: Page 1.3 - How version control tracks changes across these environments

### Page 1.3: Version Control Fundamentals with Git
- **Learning Objective**: Master essential Git operations for Salesforce development
- **Key Concepts**: Git basics, branches, commits, pull requests, conflict resolution
- **Real Scenario**: Two developers modify the same Apex class. Without Git: production breaks. With Git: conflicts caught and resolved before deployment.
- **Hands-On**: Initialize Git repo, create branches, make commits, resolve a merge conflict
- **Connects To**: Page 1.4 - Understanding what Salesforce files we're actually version controlling

### Page 1.4: Salesforce Metadata Explained
- **Learning Objective**: Understand what Salesforce metadata is and how it's structured
- **Key Concepts**: Metadata API, metadata types, SFDX project structure, source format vs metadata format
- **Real Scenario**: You click "New Field" in Setup. Behind the scenes, what XML files changed? How does SFDX track this?
- **Hands-On**: Retrieve metadata from your org using SFDX CLI, explore the folder structure, make a change and see the diff
- **Connects To**: Page 1.5 - How CI/CD pipelines automate the movement of this metadata

### Page 1.5: Introduction to CI/CD Concepts
- **Learning Objective**: Grasp the core principles of Continuous Integration and Continuous Deployment
- **Key Concepts**: CI/CD pipeline stages, automation benefits, build triggers, deployment validation
- **Real Scenario**: Before CI/CD: manual deployment takes 4 hours, fails 30% of the time. After: automated deployment takes 15 minutes, fails 5% (and rolls back automatically).
- **Hands-On**: Diagram your ideal deployment workflow, identify what should be automated
- **Connects To**: Page 1.6 - Why testing is the foundation that makes automation trustworthy

### Page 1.6: Why Automated Testing Matters
- **Learning Objective**: Understand the critical role of testing in Salesforce DevOps
- **Key Concepts**: Unit tests, integration tests, test coverage, test-driven development
- **Real Scenario**: A "small change" to a validation rule breaks checkout flow for 10,000 daily users. Tests would have caught it in 30 seconds.
- **Hands-On**: Write a simple Apex test, run it locally, see it catch a bug
- **Connects To**: Page 1.7 - Setting up the development environment to support this workflow

### Page 1.7: Setting Up Your Development Environment
- **Learning Objective**: Configure local tools for professional Salesforce DevOps work
- **Key Concepts**: VS Code setup, SFDX CLI installation, Git configuration, IDE extensions
- **Real Scenario**: The difference between a junior dev taking 2 hours to troubleshoot vs. a senior dev with proper tooling finding issues in 5 minutes
- **Hands-On**: Install and configure VS Code, SFDX CLI, and essential extensions. Connect to your developer org. Pull metadata and make a change.
- **Connects To**: Section 2 - Now we'll use these tools to build actual CI/CD pipelines

---

## Section 2: Building Your First Pipeline (Days 8-14)

### Page 2.1: GitLab CI/CD Basics
- **Learning Objective**: Understand GitLab pipeline structure and YAML syntax
- **Key Concepts**: .gitlab-ci.yml structure, jobs, stages, runners, artifacts
- **Real Scenario**: Your first pipeline that just runs "echo Hello" - understanding the foundation before complexity
- **Hands-On**: Create a GitLab repo, write a basic .gitlab-ci.yml with 3 stages, watch it run
- **Connects To**: Page 2.2 - Connecting this pipeline to actual Salesforce orgs

### Page 2.2: Authenticating Salesforce Orgs in Pipelines
- **Learning Objective**: Securely connect CI/CD pipelines to Salesforce orgs
- **Key Concepts**: JWT bearer flow, connected apps, certificates, environment variables, secrets management
- **Real Scenario**: Hard-coded passwords in scripts → credential leak → entire org compromised. The right way to authenticate.
- **Hands-On**: Create connected app, generate certificate, store secrets in GitLab, authenticate in pipeline
- **Connects To**: Page 2.3 - Now that we can authenticate, let's run tests

### Page 2.3: Running Apex Tests in Pipelines
- **Learning Objective**: Automate test execution and interpret results
- **Key Concepts**: Test execution commands, test classes, code coverage requirements, parsing test results
- **Real Scenario**: Pull request gets merged with 0% test coverage. Pipeline catches it before it reaches sandbox.
- **Hands-On**: Create pipeline job that runs Apex tests, fails the pipeline if coverage < 75%
- **Connects To**: Page 2.4 - Using test results to validate changes before merging

### Page 2.4: Automated Validation on Pull Requests
- **Learning Objective**: Implement pre-merge validation to catch issues early
- **Key Concepts**: Validation deployment, check-only deployment, merge request triggers, status checks
- **Real Scenario**: Developer submits PR with broken Apex class. Automated validation catches it in 5 minutes instead of breaking integration environment.
- **Hands-On**: Configure pipeline to validate every PR against integration org, block merges if validation fails
- **Connects To**: Page 2.5 - After validation passes, actually deploying to sandbox

### Page 2.5: Deploying to Sandbox Environments
- **Learning Objective**: Automate sandbox deployments with safety checks
- **Key Concepts**: Deployment commands, delta deployments, destructive changes, deployment strategies
- **Real Scenario**: Manual deployment forgets to include dependent metadata. Automated deployment includes dependency checking.
- **Hands-On**: Create deployment job that runs on merge to main branch, deploys to integration sandbox
- **Connects To**: Page 2.6 - What happens when deployments fail?

### Page 2.6: Rollback Strategies
- **Learning Objective**: Plan for and execute deployment rollbacks
- **Key Concepts**: Git revert vs reset, rollback procedures, backup strategies, quick-rollback packages
- **Real Scenario**: Friday 4pm deployment fails in production. You need to rollback in 10 minutes, not 2 hours.
- **Hands-On**: Simulate failed deployment, execute rollback using Git revert, redeploy previous version
- **Connects To**: Page 2.7 - Monitoring so you know when rollbacks are needed

### Page 2.7: Pipeline Notifications and Monitoring
- **Learning Objective**: Set up alerts and monitoring for pipeline health
- **Key Concepts**: Slack/email notifications, pipeline status badges, failure alerts, deployment logs
- **Real Scenario**: Pipeline fails at 2am. Do you want to find out at 9am when users are already affected, or get alerted immediately?
- **Hands-On**: Configure Slack notifications for pipeline failures, create status badge for README, set up deployment log retention
- **Connects To**: Section 3 - Real-world scenarios with multiple teams and complex requirements

---

## Section 3: Real-World Scenarios (Days 15-21)

### Page 3.1: Multi-Team Coordination and Branching Strategies
- **Learning Objective**: Design branching strategies for teams of 10-100 developers
- **Key Concepts**: GitFlow, trunk-based development, feature branches, release branches, hotfix branches
- **Real Scenario**: 5 teams working on different features for the same release. How do you coordinate without chaos?
- **Hands-On**: Design branching strategy for fictional company, create branching diagram, implement protection rules
- **Connects To**: Page 3.2 - Managing dependencies between these teams

### Page 3.2: Managing Dependencies and Deployment Order
- **Learning Objective**: Handle inter-dependent metadata and coordinate deployment sequences
- **Key Concepts**: Dependency analysis, deployment order, package dependencies, circular dependencies
- **Real Scenario**: Custom object depends on custom field, which depends on record type. Deploy in wrong order = failure.
- **Hands-On**: Analyze dependency tree for sample metadata, create ordered deployment manifest
- **Connects To**: Page 3.3 - Adding data considerations to the mix

### Page 3.3: Handling Data Alongside Metadata
- **Learning Objective**: Incorporate data deployment into CI/CD pipelines
- **Key Concepts**: Master data, test data, data migration, SFDX data commands, anonymization
- **Real Scenario**: New custom object needs 10,000 records of reference data. Manually creating = 2 days. Automated = 2 minutes.
- **Hands-On**: Create data export/import plan, automate test data creation in pipeline
- **Connects To**: Page 3.4 - Assessing risk for data and metadata changes

### Page 3.4: Risk Assessment and Deployment Windows
- **Learning Objective**: Evaluate deployment risk and choose appropriate deployment timing
- **Key Concepts**: Change classification, risk matrices, deployment windows, change advisory boards
- **Real Scenario**: Should you deploy this change at 2pm on Monday or 11pm on Saturday? Learn to assess the risk.
- **Hands-On**: Create risk assessment rubric, classify 10 sample changes, determine deployment windows
- **Connects To**: Page 3.5 - Handling emergency hotfixes that can't wait

### Page 3.5: Emergency Hotfixes vs. Planned Releases
- **Learning Objective**: Execute emergency hotfixes without breaking DevOps discipline
- **Key Concepts**: Hotfix branches, expedited testing, post-hotfix reconciliation, emergency procedures
- **Real Scenario**: Critical production bug affecting revenue. You need to fix it in 1 hour, but still maintain audit trail and quality.
- **Hands-On**: Practice hotfix workflow - create hotfix branch, fast-track testing, deploy, merge back to main
- **Connects To**: Page 3.6 - Dealing with when deployments don't go as planned

### Page 3.6: Dealing with Deployment Failures
- **Learning Objective**: Troubleshoot common deployment failures and recover quickly
- **Key Concepts**: Common error patterns, debugging techniques, partial deployments, state reconciliation
- **Real Scenario**: "Row was retrieved via SOQL... then later updated by trigger" - the deployment error everyone dreads
- **Hands-On**: Debug 5 common deployment failures, create troubleshooting playbook
- **Connects To**: Page 3.7 - Communicating these issues effectively

### Page 3.7: Communication Patterns for DevOps Teams
- **Learning Objective**: Master stakeholder communication for DevOps initiatives
- **Key Concepts**: Deployment notifications, change logs, stakeholder updates, incident communication, status pages
- **Real Scenario**: How to tell executives "we need to delay the release" vs. telling developers "your PR is blocked"
- **Hands-On**: Write deployment communication templates, create change log format, draft incident post-mortem
- **Connects To**: Section 4 - Advanced topics for enterprise-scale DevOps

---

## Section 4: Advanced Topics (Days 22-30)

### Page 4.1: Custom GitLab Runners and Docker
- **Learning Objective**: Set up custom infrastructure for Salesforce CI/CD
- **Key Concepts**: GitLab runners, Docker containers, custom images, caching strategies, runner scaling
- **Real Scenario**: Shared runners are slow and inconsistent. Custom runners reduce pipeline time from 45min to 8min.
- **Hands-On**: Install GitLab runner, create custom Docker image with SFDX, configure caching, run pipeline on custom runner
- **Connects To**: Page 4.2 - Using these runners for complex org strategies

### Page 4.2: Complex Org Strategies (Packaging, Scratch Orgs)
- **Learning Objective**: Implement advanced Salesforce org management patterns
- **Key Concepts**: Scratch orgs, packaging orgs, 2GP vs. unlocked packages, namespace management
- **Real Scenario**: Instead of one giant org, breaking application into packages for modular development and deployment
- **Hands-On**: Create scratch org definition, build package, install package in target org via pipeline
- **Connects To**: Page 4.3 - Optimizing these deployments for speed

### Page 4.3: Performance Optimization for Large Deployments
- **Learning Objective**: Optimize CI/CD pipelines for large-scale Salesforce orgs
- **Key Concepts**: Parallel deployments, incremental builds, artifact caching, quick deploy
- **Real Scenario**: Org with 10,000+ metadata files. Full deployment takes 3 hours. Optimized deployment: 20 minutes.
- **Hands-On**: Profile slow pipeline, implement caching, use quick deploy, measure improvements
- **Connects To**: Page 4.4 - Adding security and compliance controls

### Page 4.4: Security, Compliance, and Audit Trails
- **Learning Objective**: Implement security controls and maintain compliance in DevOps workflows
- **Key Concepts**: Separation of duties, audit logging, compliance requirements (SOX, HIPAA), secrets management, deployment approvals
- **Real Scenario**: Auditor asks "Who deployed what to production on March 15th?" You have 5 minutes to answer.
- **Hands-On**: Implement approval gates, configure audit logging, create compliance report, document security controls
- **Connects To**: Page 4.5 - Monitoring the whole system

### Page 4.5: Monitoring, Observability, and Continuous Improvement
- **Learning Objective**: Measure and improve DevOps performance over time
- **Key Concepts**: DORA metrics (deployment frequency, lead time, MTTR, change failure rate), observability, dashboards, retrospectives
- **Real Scenario**: "Are we getting better at DevOps?" - Data-driven answer instead of gut feeling
- **Hands-On**: Set up metrics dashboard, calculate baseline DORA metrics, identify improvement opportunities, create action plan
- **Connects To**: Section 5 - Portfolio projects showcasing these skills

---

## Section 5: Portfolio Projects

### Project 1: Complete CI/CD Pipeline Implementation
**Problem**: Small ISV with 8 developers, no automation, manual deployments taking 6 hours per week

**Solution**:
- Implement GitLab CI/CD pipeline with automated testing
- Set up multi-environment deployment strategy
- Configure notifications and monitoring

**Architecture**:
- GitLab repository with protected branches
- 3-stage pipeline: validate → test → deploy
- Sandbox environments: dev, integration, UAT, production
- Automated test execution with coverage enforcement

**Results**:
- Deployment time reduced from 6 hours/week to 30 minutes/week
- Zero production incidents in first 3 months
- Developer satisfaction increased (focus on coding, not deployment)

**Lessons Learned**:
- Importance of getting authentication right first
- Test coverage requirements need team buy-in
- Documentation is critical for team adoption

**Deliverables**:
- Complete .gitlab-ci.yml file
- Architecture diagram
- Deployment runbook
- Metrics dashboard screenshots
- GitHub repository link

---

### Project 2: Multi-Team DevOps Governance
**Problem**: Enterprise with 50+ developers, 5 product teams, conflicting deployments, no coordination

**Solution**:
- Design branching strategy for multi-team coordination
- Implement deployment windows and change management
- Create risk assessment framework
- Set up automated conflict detection

**Architecture**:
- Feature branch workflow with release branches
- Automated validation on all PRs
- Deployment orchestration for multi-team releases
- Change advisory board integration

**Results**:
- Reduced deployment conflicts by 80%
- Improved deployment success rate from 60% to 95%
- Clear accountability and audit trail
- Faster time-to-production (fewer blockers)

**Lessons Learned**:
- Process matters as much as tooling
- Communication patterns need to be defined
- Risk assessment prevents more issues than testing alone

**Deliverables**:
- Branching strategy documentation
- Risk assessment matrix
- Deployment calendar
- Communication templates
- Process flow diagrams

---

### Project 3: DevOps Transformation Initiative
**Problem**: Traditional Salesforce shop doing everything manually, resistant to change

**Solution**:
- Phased DevOps adoption roadmap
- Training program for developers
- Pilot project with small team
- Metrics to prove value

**Architecture**:
- Phase 1: Version control only
- Phase 2: Add automated testing
- Phase 3: Add automated deployment to sandbox
- Phase 4: Full production deployment automation

**Results**:
- 100% team adoption within 6 months
- ROI positive after 3 months
- Quality improvements (fewer bugs in production)
- Team morale improvement

**Lessons Learned**:
- Change management is 80% people, 20% technology
- Start small, prove value, then scale
- Celebrate wins visibly
- Executive sponsorship essential

**Deliverables**:
- Transformation roadmap
- Training materials
- Before/after metrics comparison
- Team feedback and testimonials
- Blog post: "How we transformed DevOps culture"

---

## Content Creation Priorities

### Phase 1 (Week 1-2): Foundation
1. Complete all Section 1 pages (Days 1-7)
2. Set up example code repository
3. Create visual diagrams for key concepts

### Phase 2 (Week 3-4): Pipeline Building
1. Complete all Section 2 pages (Days 8-14)
2. Create working sample pipeline repository
3. Record screen demos of key workflows

### Phase 3 (Week 5-6): Real-World Application
1. Complete all Section 3 pages (Days 15-21)
2. Develop scenario-based exercises
3. Create troubleshooting guides

### Phase 4 (Week 7-8): Advanced Topics
1. Complete all Section 4 pages (Days 22-30)
2. Build advanced example implementations
3. Create performance benchmarks

### Phase 5 (Week 9-10): Portfolio
1. Build all three portfolio projects
2. Document implementations thoroughly
3. Create case studies and blog posts
4. Add visual assets and demos

---

## Success Metrics for Content

Each page must meet these criteria:
- ✅ Clear learning objective stated upfront
- ✅ Real-world scenario included
- ✅ At least one hands-on exercise
- ✅ Explicit connection to previous/next topics
- ✅ Code examples are complete and tested
- ✅ Conversational tone (Flesch reading score 60+)
- ✅ Aligned to Australia Post DevOps Lead requirements

---

## Additional Resources to Create

1. **Glossary**: Salesforce DevOps terminology with clear definitions
2. **Cheat Sheets**: Quick reference for common commands and workflows
3. **Troubleshooting Guide**: Common errors and solutions
4. **Tool Comparison**: GitLab vs GitHub Actions vs Jenkins for Salesforce
5. **Interview Prep**: Common DevOps Lead interview questions with answers
6. **Resource Library**: Links to official docs, community resources, tools

---

*This content plan will evolve based on feedback and real-world usage. The goal is always: help students become job-ready Salesforce DevOps professionals.*
