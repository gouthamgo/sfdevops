// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  // Salesforce Learning Path
  salesforceSidebar: [
    'salesforce/index',
    {
      type: 'category',
      label: '📚 Platform Fundamentals',
      items: [
        'salesforce/fundamentals/platform-overview',
      ],
    },
    {
      type: 'category',
      label: '🗄️ Data Model & Objects',
      items: [
        'salesforce/data-model/objects-and-fields',
      ],
    },
    {
      type: 'category',
      label: '🔧 Declarative Development',
      items: [
        'salesforce/declarative/introduction',
        'salesforce/declarative/validation-rules',
        'salesforce/declarative/flow-builder',
      ],
    },
    {
      type: 'category',
      label: '💻 Apex Programming',
      items: [
        'salesforce/apex/introduction',
        'salesforce/apex/fundamentals',
      ],
    },
    {
      type: 'category',
      label: '⚡ Lightning Web Components',
      items: [
        'salesforce/lwc/introduction',
      ],
    },
    {
      type: 'category',
      label: '📦 Metadata & Deployment',
      items: [
        'salesforce/metadata/introduction',
      ],
    },
  ],

  // DevOps Learning Path
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: '1. Foundations (Days 1-7)',
      items: [
        'foundations/what-is-salesforce-devops',
        'foundations/understanding-environments',
        'foundations/version-control-git',
        'foundations/salesforce-metadata',
        'foundations/cicd-concepts',
        'foundations/automated-testing',
        'foundations/dev-environment-setup',
        'foundations/docker-containers',
        'foundations/kubernetes-basics',
        'foundations/infrastructure-as-code',
        'foundations/devops-tools-ecosystem',
      ],
    },
    {
      type: 'category',
      label: '2. Interview Prep & Git Workflows',
      items: [
        'interview-prep/index',
        'interview-prep/git-branching-strategies',
        'interview-prep/complete-git-workflow',
        'interview-prep/technical-interview-questions',
        'interview-prep/technical-scenarios',
        'interview-prep/system-design-prep',
        'interview-prep/take-home-assignments',
        'interview-prep/portfolio-strategy',
        'interview-prep/behavioral-interview-prep',
        'interview-prep/faang-devops-prep',
        'interview-prep/salary-negotiation',
        'interview-prep/career-progression',
      ],
    },
    {
      type: 'category',
      label: '3. DevOps Center & GitHub Integration',
      items: [
        'devops-center/index',
        'devops-center/overview',
        'devops-center/github-integration',
        'devops-center/setup-walkthrough',
        'devops-center/workflow-complete',
        'devops-center/advanced-scenarios',
        'devops-center/decision-framework',
      ],
    },
    {
      type: 'category',
      label: '4. Enterprise Sandbox Strategy',
      items: [
        'sandbox-strategy/index',
        'sandbox-strategy/sandbox-types-overview',
        'sandbox-strategy/architecture-design',
      ],
    },
    {
      type: 'category',
      label: '5. Building Pipelines (Days 8-14)',
      items: [
        'pipelines/github-actions-beginner',
        'pipelines/gitlab-basics',
        'pipelines/authenticating-orgs',
        'pipelines/running-tests',
        'pipelines/pr-validation',
        'pipelines/sandbox-deployment',
        'pipelines/rollback-strategies',
        'pipelines/notifications',
      ],
    },
    {
      type: 'category',
      label: '6. Real-World Scenarios (Days 15-21)',
      items: [
        'scenarios/multi-team-coordination',
        'scenarios/managing-dependencies',
        'scenarios/handling-data',
        'scenarios/risk-assessment',
        'scenarios/emergency-hotfixes',
        'scenarios/deployment-failures',
        'scenarios/communication-patterns',
      ],
    },
    {
      type: 'category',
      label: '7. Advanced Topics (Days 22-30)',
      items: [
        'advanced/custom-runners-docker',
        'advanced/complex-org-strategies',
        'advanced/performance-optimization',
        'advanced/security-compliance',
        'advanced/monitoring-improvement',
      ],
    },
    {
      type: 'category',
      label: '8. Hands-On Practice',
      items: [
        'hands-on/labs-exercises',
      ],
    },
    {
      type: 'category',
      label: '9. Quick Reference',
      items: [
        'reference/cheat-sheets',
      ],
    },
    {
      type: 'category',
      label: '10. Case Studies',
      items: [
        'case-studies/real-world-implementations',
      ],
    },
    {
      type: 'category',
      label: '11. Certifications',
      items: [
        'certifications/certification-guide',
      ],
    },
  ],
};

export default sidebars;
