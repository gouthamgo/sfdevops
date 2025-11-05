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
    <header className={styles.heroBanner}>
      <div className={styles.heroBackground}></div>
      <div className={clsx('container', styles.heroContainer)}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>🚀 Free & Open Source</span>
          <Heading as="h1" className={styles.heroTitle}>
            Master Salesforce DevOps
          </Heading>
          <p className={styles.heroSubtitle}>
            From Zero to Production-Ready in 30 Days
          </p>
          <p className={styles.heroDescription}>
            Complete learning path with CI/CD pipelines, Git workflows, automated testing,
            and real-world interview prep. Build production-ready skills used by top DevOps engineers.
          </p>
          <div className={styles.buttons}>
            <Link
              className={clsx('button button--lg', styles.primaryButton)}
              to="/docs/intro">
              Start Learning Free →
            </Link>
            <Link
              className={clsx('button button--lg', styles.secondaryButton)}
              to="/docs/interview-prep/">
              Interview Prep 💼
            </Link>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>50K+</div>
              <div className={styles.statLabel}>Words of Content</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>8</div>
              <div className={styles.statLabel}>Hands-On Labs</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>100%</div>
              <div className={styles.statLabel}>Free Forever</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function WhatYoullLearn() {
  return (
    <section className={styles.learnSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">What You'll Master</Heading>
          <p className={styles.sectionSubtext}>
            Everything you need to become a production-ready Salesforce DevOps engineer
          </p>
        </div>
        <div className="row">
          <div className="col col--6">
            <div className={styles.learnCard}>
              <div className={styles.learnIcon}>🛠️</div>
              <h3>Core DevOps Skills</h3>
              <ul className={styles.learnList}>
                <li>✅ Git branching strategies (GitFlow, Trunk-based)</li>
                <li>✅ CI/CD pipelines (GitHub Actions, GitLab)</li>
                <li>✅ Automated testing & deployment</li>
                <li>✅ Infrastructure as Code</li>
                <li>✅ Docker & Kubernetes basics</li>
              </ul>
            </div>
          </div>
          <div className="col col--6">
            <div className={styles.learnCard}>
              <div className={styles.learnIcon}>💼</div>
              <h3>Career Advancement</h3>
              <ul className={styles.learnList}>
                <li>✅ 100+ technical interview questions</li>
                <li>✅ System design for DevOps roles</li>
                <li>✅ Salary negotiation ($75K-$450K+ guide)</li>
                <li>✅ Take-home assignment examples</li>
                <li>✅ Portfolio projects that stand out</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LearningPath() {
  const steps = [
    { number: '01', title: 'Foundations', desc: 'Master Git, CI/CD, and Salesforce DX basics', duration: 'Days 1-7' },
    { number: '02', title: 'Pipelines', desc: 'Build automated deployment pipelines', duration: 'Days 8-14' },
    { number: '03', title: 'Advanced', desc: 'Multi-team coordination & complex scenarios', duration: 'Days 15-21' },
    { number: '04', title: 'Interview Ready', desc: 'Complete your portfolio & ace interviews', duration: 'Days 22-30' },
  ];

  return (
    <section className={styles.pathSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">Your 30-Day Learning Journey</Heading>
          <p className={styles.sectionSubtext}>
            Structured path from beginner to job-ready DevOps engineer
          </p>
        </div>
        <div className={styles.timeline}>
          {steps.map((step, index) => (
            <div key={index} className={styles.timelineItem}>
              <div className={styles.timelineNumber}>{step.number}</div>
              <div className={styles.timelineContent}>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                <span className={styles.timelineDuration}>{step.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className={styles.testimonialSection}>
      <div className="container">
        <div className={styles.testimonialCard}>
          <div className={styles.quoteIcon}>"</div>
          <p className={styles.testimonialText}>
            This guide covers everything I needed to land my DevOps role at a Fortune 500 company.
            The hands-on labs, interview prep, and salary negotiation guide were game-changers.
            The content quality rivals paid bootcamps.
          </p>
          <div className={styles.testimonialAuthor}>
            <div className={styles.authorName}>DevOps Engineer</div>
            <div className={styles.authorTitle}>Now at Enterprise Company • $140K → $180K</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.ctaSection}>
      <div className="container">
        <div className={styles.ctaContent}>
          <Heading as="h2">Ready to Start Your DevOps Journey?</Heading>
          <p className={styles.ctaText}>
            Join thousands of engineers learning Salesforce DevOps.
            Start with our comprehensive beginner's guide — completely free.
          </p>
          <div className={styles.ctaButtons}>
            <Link
              className={clsx('button button--lg', styles.primaryButton)}
              to="/docs/intro">
              Get Started Free →
            </Link>
            <Link
              className={clsx('button button--lg', styles.outlineButton)}
              to="/docs/hands-on/labs-exercises">
              View Labs & Exercises
            </Link>
          </div>
          <p className={styles.ctaNote}>
            No signup required • No credit card • No BS
          </p>
        </div>
      </div>
    </section>
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
        <WhatYoullLearn />
        <LearningPath />
        <Testimonial />
        <CTASection />
      </main>
    </Layout>
  );
}
