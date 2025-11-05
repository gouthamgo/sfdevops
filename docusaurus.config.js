// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Salesforce DevOps Learning Hub',
  tagline: 'From Beginner to Production-Ready DevOps Expert',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'ganguly', // Usually your GitHub org/user name.
  projectName: 'salesforce-devops-hub', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Remove edit URL for now
          // editUrl:
          //   'https://github.com/ganguly/salesforce-devops-hub/tree/main/',
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],

  markdown: {
    mermaid: true,
  },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'SF DevOps Hub',
        logo: {
          alt: 'Salesforce DevOps Hub Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'salesforceSidebar',
            position: 'left',
            label: 'Learn Salesforce',
          },
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Learn DevOps',
          },
          {
            type: 'search',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Salesforce',
            items: [
              {
                label: 'Platform Overview',
                to: '/docs/salesforce/',
              },
              {
                label: 'Apex Programming',
                to: '/docs/salesforce/apex/introduction',
              },
              {
                label: 'Lightning Web Components',
                to: '/docs/salesforce/lwc/introduction',
              },
            ],
          },
          {
            title: 'DevOps',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/intro',
              },
              {
                label: 'Foundations',
                to: '/docs/foundations/what-is-salesforce-devops',
              },
              {
                label: 'Building Pipelines',
                to: '/docs/pipelines/gitlab-basics',
              },
            ],
          },
          {
            title: 'Resources',
            items: [
              {
                label: 'Interview Prep',
                to: '/docs/interview-prep/',
              },
              {
                label: 'Case Studies',
                to: '/docs/case-studies/real-world-implementations',
              },
            ],
          },
          {
            title: 'Connect',
            items: [
              {
                label: 'Salesforce DevOps',
                href: 'https://trailhead.salesforce.com/content/learn/modules/salesforce-dx',
              },
              {
                label: 'GitLab CI/CD',
                href: 'https://docs.gitlab.com/ee/ci/',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Salesforce DevOps Learning Hub.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
      mermaid: {
        theme: {
          light: 'base',
          dark: 'dark',
        },
        options: {
          maxTextSize: 50000,
          themeVariables: {
            // Light mode colors - high contrast
            primaryColor: '#bbdefb',
            primaryTextColor: '#000000',
            primaryBorderColor: '#1976d2',
            lineColor: '#424242',
            secondaryColor: '#c8e6c9',
            tertiaryColor: '#ffe0b2',
            // Better text visibility
            fontSize: '16px',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system',
          },
          darkMode: true,
          themeCSS: `
            .node rect,
            .node circle,
            .node ellipse,
            .node polygon {
              stroke-width: 2px;
            }
            .node .label {
              color: #000000;
            }
            .edgeLabel {
              background-color: rgba(255, 255, 255, 0.9);
              padding: 4px;
              border-radius: 4px;
            }
          `,
        },
      },
    }),
};

export default config;
