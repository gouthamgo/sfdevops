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
            Master Salesforce & DevOps
          </Heading>
          <p className={styles.heroSubtitle}>
            Complete Journey: From Salesforce Basics to Production-Ready DevOps
          </p>
          <p className={styles.heroDescription}>
            Two comprehensive learning paths in one place. Start with Salesforce fundamentals or jump straight to DevOps.
            Master CI/CD pipelines, Apex, LWC, Git workflows, automated testing, and real-world interview prep.
          </p>
          <div className={styles.buttons}>
            <Link
              className={clsx('button button--lg', styles.primaryButton)}
              to="/docs/salesforce/">
              Learn Salesforce 📚
            </Link>
            <Link
              className={clsx('button button--lg', styles.primaryButton)}
              to="/docs/intro">
              Learn DevOps 🚀
            </Link>
            <Link
              className={clsx('button button--lg', styles.secondaryButton)}
              to="/docs/interview-prep/">
              Interview Prep 💼
            </Link>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>110K+</div>
              <div className={styles.statLabel}>Words of Content</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>2</div>
              <div className={styles.statLabel}>Learning Tracks</div>
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
            Complete skill-set: Salesforce development + DevOps engineering
          </p>
        </div>
        <div className="row">
          <div className="col col--6">
            <div className={styles.learnCard}>
              <div className={styles.learnIcon}>📚</div>
              <h3>Salesforce Platform</h3>
              <ul className={styles.learnList}>
                <li>✅ Platform fundamentals & architecture</li>
                <li>✅ Data modeling & objects</li>
                <li>✅ Apex programming & triggers</li>
                <li>✅ Lightning Web Components (LWC)</li>
                <li>✅ Declarative automation (Flows)</li>
              </ul>
            </div>
          </div>
          <div className="col col--6">
            <div className={styles.learnCard}>
              <div className={styles.learnIcon}>🛠️</div>
              <h3>DevOps & CI/CD</h3>
              <ul className={styles.learnList}>
                <li>✅ Git workflows & branching strategies</li>
                <li>✅ CI/CD pipelines (GitHub Actions, GitLab)</li>
                <li>✅ Automated testing & deployment</li>
                <li>✅ Infrastructure as Code</li>
                <li>✅ Docker & Kubernetes basics</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="row" style={{marginTop: '2rem'}}>
          <div className="col col--6">
            <div className={styles.learnCard}>
              <div className={styles.learnIcon}>⚡</div>
              <h3>Production Skills</h3>
              <ul className={styles.learnList}>
                <li>✅ Multi-team coordination</li>
                <li>✅ Metadata deployment strategies</li>
                <li>✅ Sandbox & org management</li>
                <li>✅ Production monitoring</li>
                <li>✅ Emergency hotfix procedures</li>
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
    { number: '01', title: 'Salesforce Basics', desc: 'Platform fundamentals, data model, and core concepts', duration: 'Weeks 1-4' },
    { number: '02', title: 'Development Skills', desc: 'Apex programming, LWC, and declarative automation', duration: 'Weeks 5-8' },
    { number: '03', title: 'DevOps Foundations', desc: 'Git, CI/CD, and deployment pipelines', duration: 'Weeks 9-12' },
    { number: '04', title: 'Production Ready', desc: 'Advanced scenarios, monitoring, and interview prep', duration: 'Weeks 13-16' },
  ];

  return (
    <section className={styles.pathSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2">Complete Learning Journey</Heading>
          <p className={styles.sectionSubtext}>
            From Salesforce beginner to production-ready DevOps engineer in 16 weeks
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
          <Heading as="h2">Ready to Start Your Learning Journey?</Heading>
          <p className={styles.ctaText}>
            Choose your path: Start with Salesforce fundamentals or jump straight to DevOps.
            Both comprehensive tracks are completely free, no signup required.
          </p>
          <div className={styles.ctaButtons}>
            <Link
              className={clsx('button button--lg', styles.primaryButton)}
              to="/docs/salesforce/">
              Start with Salesforce →
            </Link>
            <Link
              className={clsx('button button--lg', styles.primaryButton)}
              to="/docs/intro">
              Jump to DevOps →
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
      title={`Learn Salesforce & DevOps - Complete Learning Path`}
      description="Master Salesforce development and DevOps engineering. Learn Apex, LWC, CI/CD pipelines, Git workflows, and automated testing. Two comprehensive tracks with hands-on examples, interview prep, and portfolio projects. 100% free.">
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
