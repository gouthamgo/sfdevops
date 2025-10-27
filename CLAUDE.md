# Salesforce DevOps Learning Website - Project Guide

## Project Overview

This is an educational website built with Docusaurus focused on teaching Salesforce DevOps from complete beginner to job-ready professional. It serves dual purposes:

1. **Portfolio Piece**: Demonstrates expertise for a DevOps Lead role (specifically aligned with Australia Post requirements)
2. **Learning Resource**: Comprehensive, progressive curriculum for aspiring Salesforce DevOps professionals

## Target Audience

- **Primary**: Complete beginners with basic Salesforce knowledge wanting to transition into DevOps
- **Secondary**: Junior DevOps engineers looking to specialize in Salesforce
- **Outcome**: Job-ready professionals who can implement and manage enterprise Salesforce CI/CD pipelines

## Content Principles

### 1. Progressive Learning
Each topic must build explicitly on previous concepts. No sudden jumps in complexity. If introducing a new concept, reference where foundational knowledge was covered.

### 2. Real-World First
Start each section with a realistic scenario or problem. Show the pain point before introducing the solution. Theory follows practice.

Example:
> "You just deployed to production and broke the login flow for 5,000 users. How did this happen? More importantly, how do we prevent it?"

### 3. Hands-On Everything
Every section must include practical exercises. No passive reading. Students should be typing commands, creating files, seeing results.

### 4. Conversational Tone
- Write like you're pair programming with a colleague
- Short paragraphs (2-4 sentences max)
- Use "we" instead of "you"
- Ask rhetorical questions to maintain engagement
- Break up dense concepts with simple examples

### 5. Explicit Connections
Don't assume students will connect dots. Explicitly state:
- "This builds on what we learned about X in Day 3"
- "We'll use this concept later when we cover Y"
- "Remember when we talked about Z? Here's why it matters"

## Content Structure

### Section 1: Foundations (Days 1-7)
**Goal**: Build mental models and vocabulary

Topics:
- What is DevOps? (Using Salesforce-specific examples)
- Salesforce environments and metadata
- Version control fundamentals with Git
- Introduction to CI/CD concepts
- The anatomy of a deployment
- Why automated testing matters
- Setting up your development environment

**Key Deliverable**: Students can explain the full deployment lifecycle and why each step exists

### Section 2: Building Pipelines (Days 8-14)
**Goal**: Create working CI/CD pipelines from scratch

Topics:
- GitLab pipeline basics (YAML syntax, jobs, stages)
- Authenticating with Salesforce orgs
- Running Apex tests in pipelines
- Automated validation on pull requests
- Deployment to sandbox environments
- Rollback strategies
- Notifications and monitoring

**Key Deliverable**: Working GitLab pipeline that validates and deploys to sandbox on merge

### Section 3: Real-World Scenarios (Days 15-21)
**Goal**: Handle complexity and edge cases

Topics:
- Multi-team coordination (feature branches, release branches)
- Managing dependencies and deployment order
- Handling data alongside metadata
- Risk assessment and deployment windows
- Emergency hotfixes vs. planned releases
- Dealing with deployment failures
- Communication patterns for DevOps teams

**Key Deliverable**: Students can design deployment strategy for a real enterprise scenario

### Section 4: Advanced Topics (Days 22-30)
**Goal**: Enterprise-scale implementations

Topics:
- Custom GitLab runners and Docker
- Complex org strategies (packaging orgs, scratch orgs)
- Performance optimization for large deployments
- Security and compliance considerations
- Monitoring and observability
- Disaster recovery planning
- DevOps metrics and continuous improvement

**Key Deliverable**: Students can architect and defend enterprise DevOps solutions

### Section 5: Portfolio Projects
**Goal**: Demonstrate job-ready skills

Projects:
1. Complete CI/CD pipeline for sample Salesforce app
2. Multi-environment deployment strategy document
3. DevOps runbook for common scenarios
4. Case study: Designing DevOps for fictional enterprise
5. Blog posts explaining complex concepts simply

## Writing Guidelines

### Code Examples
- Always include complete, runnable examples
- Add comments explaining each step
- Show both the command and the expected output
- Include common errors and how to fix them

### Diagrams
- Use Mermaid diagrams for flows and architecture
- Keep diagrams simple (max 7 elements)
- Label everything clearly
- Include a text explanation after each diagram

### Exercises
- Start with clear objectives
- Provide step-by-step instructions
- Include validation steps ("You'll know it worked when...")
- Offer solutions but encourage trying first
- Add "Going Further" optional challenges

### Terminology
- Define technical terms when first introduced
- Maintain a glossary
- Use consistent terminology throughout
- Prefer Salesforce-specific terms when applicable

## Success Metrics

This content is successful when a student can:

1. **Explain** the complete DevOps lifecycle in Salesforce context
2. **Build** a production-ready CI/CD pipeline from scratch
3. **Troubleshoot** common deployment issues independently
4. **Design** multi-environment strategies for enterprise scenarios
5. **Communicate** DevOps concepts clearly to stakeholders
6. **Interview** confidently for DevOps Lead positions

## Australia Post DevOps Lead Alignment

This content specifically prepares students for roles requiring:

- Multi-team coordination and governance
- Enterprise CI/CD pipeline design and implementation
- Risk management and compliance
- Stakeholder communication
- Continuous improvement mindset
- Mentoring and knowledge sharing
- Tool evaluation and standardization

## Technical Stack

- **Platform**: Docusaurus (React-based static site generator)
- **Version Control**: Git (examples use GitLab)
- **Salesforce CLI**: SFDX commands throughout
- **CI/CD**: GitLab CI/CD (with principles applicable to other tools)
- **Containerization**: Docker (for advanced topics)

## Content Philosophy

> "The best way to learn DevOps is to feel the pain of doing it manually first, then celebrate the relief of automation."

Every concept should be motivated by a real problem. Students should understand not just "how" but "why" and "when".

## Contribution Guidelines

When adding or updating content:

1. Read the previous day's content to maintain continuity
2. Start with a hook (scenario, question, or surprising fact)
3. Include at least one hands-on exercise
4. Reference related concepts explicitly
5. End with a clear summary and preview of next topic
6. Test all code examples
7. Review for tone (conversational, encouraging, clear)

## Resources and References

- Salesforce Developer Guide
- GitLab CI/CD Documentation
- DevOps Research and Assessment (DORA) metrics
- Real-world case studies from enterprise implementations

---

**Remember**: This isn't just documentation. It's a learning journey. Every word should move the student closer to job-ready competence.
