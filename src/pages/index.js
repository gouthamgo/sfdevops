import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Start Learning - Free 🚀
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs/interview-prep/"
            style={{marginLeft: '1rem'}}>
            Interview Prep 💼
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Learn Salesforce DevOps - From Beginner to Production-Ready`}
      description="Master Salesforce DevOps, CI/CD pipelines, Git workflows, and automated testing. Complete learning path with hands-on examples, interview prep, and portfolio projects. Free comprehensive guide for DevOps engineers.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
